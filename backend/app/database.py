import logging
from datetime import datetime
from bson import ObjectId
from pymongo import MongoClient
from app.config import Config

logger = logging.getLogger(__name__)

class DatabaseManager:
    _client = None
    _db = None

    @classmethod
    def get_client(cls):
        if cls._client is None:
            logger.info("Initializing MongoClient connection...")
            cls._client = MongoClient(Config.MONGODB_URI, serverSelectionTimeoutMS=5000)
        return cls._client

    @classmethod
    def get_db(cls):
        if cls._db is None:
            client = cls.get_client()
            cls._db = client[Config.DATABASE_NAME]
        return cls._db

    @classmethod
    def get_tokens_collection(cls):
        return cls.get_db()["tokens"]

    @classmethod
    def get_counters_collection(cls):
        return cls.get_db()["counters"]

    @classmethod
    def ping(cls):
        """Pings the database to verify live connectivity."""
        client = cls.get_client()
        return client.admin.command("ping")

    @classmethod
    def close(cls):
        if cls._client is not None:
            cls._client.close()
            cls._client = None
            cls._db = None

def serialize_token(doc):
    """Safely converts MongoDB BSON types (ObjectId, datetime) to JSON serializable fields."""
    if not doc:
        return None
    token = dict(doc)
    if "_id" in token:
        token["_id"] = str(token["_id"])
    for key in ["created_at", "called_at", "completed_at", "cancelled_at"]:
        if key in token and isinstance(token[key], datetime):
            token[key] = token[key].isoformat()
    return token
