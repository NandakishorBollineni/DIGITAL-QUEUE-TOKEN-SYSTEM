import logging
from datetime import datetime, timezone
try:
    from zoneinfo import ZoneInfo
except ImportError:
    ZoneInfo = None

from bson import ObjectId
from pymongo import ReturnDocument, ASCENDING
from pymongo.errors import DuplicateKeyError, PyMongoError

from app.config import Config
from app.database import DatabaseManager, serialize_token
from app.validators.token_validator import validate_status_transition

logger = logging.getLogger(__name__)

class TokenService:
    @staticmethod
    def get_current_service_date():
        """Returns the current date string (YYYY-MM-DD) in the configured service timezone."""
        now_utc = datetime.now(timezone.utc)
        if ZoneInfo:
            try:
                local_now = now_utc.astimezone(ZoneInfo(Config.SERVICE_TIMEZONE))
                return local_now.strftime("%Y-%m-%d")
            except Exception as e:
                logger.warning("Failed to use timezone %s: %s. Using UTC date.", Config.SERVICE_TIMEZONE, e)
        return now_utc.strftime("%Y-%m-%d")

    @classmethod
    def create_token(cls, visitor_name, service):
        """
        Atomically allocates a service-day token number and creates a token document.
        Returns the created token dictionary or raises an exception.
        """
        service_date = cls.get_current_service_date()
        counters_coll = DatabaseManager.get_counters_collection()
        tokens_coll = DatabaseManager.get_tokens_collection()
        now_utc = datetime.now(timezone.utc)

        # 1. Atomic counter increment
        counter_id = f"{service}:{service_date}"
        counter_doc = counters_coll.find_one_and_update(
            {"_id": counter_id},
            {
                "$inc": {"next_number": 1},
                "$setOnInsert": {
                    "service": service,
                    "service_date": service_date,
                    "created_at": now_utc
                }
            },
            upsert=True,
            return_document=ReturnDocument.AFTER
        )
        allocated_number = counter_doc["next_number"]

        # 2. Insert token document with allocated number
        token_doc = {
            "token_number": int(allocated_number),
            "service": service,
            "service_date": service_date,
            "visitor_name": visitor_name,
            "status": "waiting",
            "created_at": now_utc,
            "called_at": None,
            "completed_at": None,
            "cancelled_at": None
        }

        try:
            result = tokens_coll.insert_one(token_doc)
            token_doc["_id"] = result.inserted_id
            logger.info("Successfully created token #%d for '%s' in service '%s'", allocated_number, visitor_name, service)
            return serialize_token(token_doc)
        except DuplicateKeyError as e:
            logger.error("Duplicate key error creating token: %s", e)
            raise ValueError(f"Token number {allocated_number} already exists for {service} on {service_date}")
        except PyMongoError as e:
            logger.error("Database error inserting token: %s", e)
            raise

    @classmethod
    def get_token_by_id(cls, token_id_str):
        if not ObjectId.is_valid(token_id_str):
            return None
        tokens_coll = DatabaseManager.get_tokens_collection()
        doc = tokens_coll.find_one({"_id": ObjectId(token_id_str)})
        return serialize_token(doc)

    @classmethod
    def get_token_by_number(cls, service, service_date, token_number):
        tokens_coll = DatabaseManager.get_tokens_collection()
        doc = tokens_coll.find_one({
            "service": service,
            "service_date": service_date,
            "token_number": int(token_number)
        })
        return serialize_token(doc)

    @classmethod
    def list_tokens(cls, service=None, status=None, service_date=None, search=None, page=1, limit=50):
        tokens_coll = DatabaseManager.get_tokens_collection()
        query = {}
        
        if service:
            query["service"] = service
        if status:
            query["status"] = status
        if service_date:
            query["service_date"] = service_date
        if search:
            # Match visitor name (case-insensitive) or exact token number
            search_str = search.strip()
            if search_str.isdigit():
                query["$or"] = [
                    {"token_number": int(search_str)},
                    {"visitor_name": {"$regex": re_escape(search_str), "$options": "i"}}
                ]
            else:
                query["visitor_name"] = {"$regex": re_escape(search_str), "$options": "i"}

        skip = max(0, (page - 1) * limit)
        total_count = tokens_coll.count_documents(query)
        cursor = tokens_coll.find(query).sort([("created_at", -1), ("_id", -1)]).skip(skip).limit(limit)

        tokens = [serialize_token(doc) for doc in cursor]
        return {
            "tokens": tokens,
            "total": total_count,
            "page": page,
            "limit": limit,
            "total_pages": (total_count + limit - 1) // limit if limit > 0 else 1
        }

    @classmethod
    def get_waiting_queue(cls, service=None, service_date=None):
        """
        Retrieves the deterministic waiting queue ordered by token_number ASC.
        Computes the queue_position for each waiting visitor.
        """
        tokens_coll = DatabaseManager.get_tokens_collection()
        if not service_date:
            service_date = cls.get_current_service_date()

        query = {
            "service_date": service_date,
            "status": "waiting"
        }
        if service:
            query["service"] = service

        cursor = tokens_coll.find(query).sort([("token_number", ASCENDING), ("created_at", ASCENDING)])
        tokens = []
        position = 1
        for doc in cursor:
            serialized = serialize_token(doc)
            serialized["queue_position"] = position
            tokens.append(serialized)
            position += 1

        return {
            "service_date": service_date,
            "service": service,
            "count": len(tokens),
            "queue": tokens
        }

    @classmethod
    def call_next(cls, service=None, service_date=None):
        """
        Atomically claims the earliest waiting token.
        Concurrency-safe: find_one_and_update guarantees that only one caller claims a waiting token.
        """
        tokens_coll = DatabaseManager.get_tokens_collection()
        if not service_date:
            service_date = cls.get_current_service_date()

        query = {
            "service_date": service_date,
            "status": "waiting"
        }
        if service:
            query["service"] = service

        now_utc = datetime.now(timezone.utc)
        claimed = tokens_coll.find_one_and_update(
            filter=query,
            update={
                "$set": {
                    "status": "serving",
                    "called_at": now_utc
                }
            },
            sort=[("token_number", ASCENDING), ("created_at", ASCENDING)],
            return_document=ReturnDocument.AFTER
        )

        return serialize_token(claimed)

    @classmethod
    def call_token_by_id(cls, token_id_str):
        """Calls a specific waiting token by id."""
        if not ObjectId.is_valid(token_id_str):
            return None, "Invalid token ID format"
            
        tokens_coll = DatabaseManager.get_tokens_collection()
        oid = ObjectId(token_id_str)
        existing = tokens_coll.find_one({"_id": oid})
        if not existing:
            return None, "Token not found"

        is_valid, err = validate_status_transition(existing.get("status"), "serving")
        if not is_valid:
            return None, err

        now_utc = datetime.now(timezone.utc)
        updated = tokens_coll.find_one_and_update(
            {"_id": oid, "status": "waiting"},
            {
                "$set": {
                    "status": "serving",
                    "called_at": now_utc
                }
            },
            return_document=ReturnDocument.AFTER
        )
        if not updated:
            return None, "Token could not be called (it may have been claimed or changed status concurrently)"
        return serialize_token(updated), None

    @classmethod
    def complete_token_by_id(cls, token_id_str):
        """Marks a serving token as completed."""
        if not ObjectId.is_valid(token_id_str):
            return None, "Invalid token ID format"

        tokens_coll = DatabaseManager.get_tokens_collection()
        oid = ObjectId(token_id_str)
        existing = tokens_coll.find_one({"_id": oid})
        if not existing:
            return None, "Token not found"

        is_valid, err = validate_status_transition(existing.get("status"), "completed")
        if not is_valid:
            return None, err

        now_utc = datetime.now(timezone.utc)
        updated = tokens_coll.find_one_and_update(
            {"_id": oid, "status": "serving"},
            {
                "$set": {
                    "status": "completed",
                    "completed_at": now_utc
                }
            },
            return_document=ReturnDocument.AFTER
        )
        if not updated:
            return None, "Token could not be completed (it is not currently in 'serving' status)"
        return serialize_token(updated), None

    @classmethod
    def cancel_token_by_id(cls, token_id_str):
        """Cancels a waiting token while safely preserving the historical document."""
        if not ObjectId.is_valid(token_id_str):
            return None, "Invalid token ID format"

        tokens_coll = DatabaseManager.get_tokens_collection()
        oid = ObjectId(token_id_str)
        existing = tokens_coll.find_one({"_id": oid})
        if not existing:
            return None, "Token not found"

        is_valid, err = validate_status_transition(existing.get("status"), "cancelled")
        if not is_valid:
            return None, err

        now_utc = datetime.now(timezone.utc)
        updated = tokens_coll.find_one_and_update(
            {"_id": oid, "status": "waiting"},
            {
                "$set": {
                    "status": "cancelled",
                    "cancelled_at": now_utc
                }
            },
            return_document=ReturnDocument.AFTER
        )
        if not updated:
            return None, "Only tokens in 'waiting' status can be cancelled"
        return serialize_token(updated), None

def re_escape(s):
    import re
    return re.escape(s)
