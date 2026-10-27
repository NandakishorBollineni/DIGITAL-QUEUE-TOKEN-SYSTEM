import os
import sys
from pymongo import MongoClient, ASCENDING
from pymongo.errors import PyMongoError

# Ensure parent directory is in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
from app.config import Config

SCHEMA_VALIDATOR = {
    "$jsonSchema": {
        "bsonType": "object",
        "required": [
            "token_number",
            "service",
            "service_date",
            "visitor_name",
            "status",
            "created_at"
        ],
        "properties": {
            "token_number": {
                "bsonType": ["int", "long"],
                "minimum": 1,
                "description": "Unique queue token sequence number within service and date"
            },
            "service": {
                "bsonType": "string",
                "minLength": 1,
                "maxLength": 80,
                "description": "Service category (e.g. Admissions, Billing)"
            },
            "service_date": {
                "bsonType": "string",
                "pattern": "^[0-9]{4}-[0-9]{2}-[0-9]{2}$",
                "description": "Service day in YYYY-MM-DD format"
            },
            "visitor_name": {
                "bsonType": "string",
                "minLength": 1,
                "maxLength": 100,
                "description": "Visitor full name"
            },
            "status": {
                "bsonType": "string",
                "enum": ["waiting", "serving", "completed", "cancelled"],
                "description": "Current lifecycle status of the queue token"
            },
            "created_at": {
                "bsonType": "date",
                "description": "UTC arrival and token creation timestamp"
            },
            "called_at": {
                "bsonType": ["date", "null"],
                "description": "UTC timestamp when token was called to counter"
            },
            "completed_at": {
                "bsonType": ["date", "null"],
                "description": "UTC timestamp when service was finished"
            },
            "cancelled_at": {
                "bsonType": ["date", "null"],
                "description": "UTC timestamp when token was cancelled"
            }
        }
    }
}

def init_database():
    print(f"Connecting to MongoDB at: {Config.MONGODB_URI}")
    client = MongoClient(Config.MONGODB_URI, serverSelectionTimeoutMS=5000)
    
    # Test connection
    client.admin.command("ping")
    print("MongoDB connection successful!")

    db = client[Config.DATABASE_NAME]
    existing_collections = db.list_collection_names()
    print(f"Existing collections in '{Config.DATABASE_NAME}': {existing_collections}")

    # 1. Setup tokens collection with schema validation
    if "tokens" not in existing_collections:
        print("Creating 'tokens' collection with JSON Schema validation...")
        db.create_collection(
            "tokens",
            validator=SCHEMA_VALIDATOR,
            validationLevel="strict",
            validationAction="error"
        )
    else:
        print("Applying JSON Schema validator to existing 'tokens' collection via collMod...")
        db.command({
            "collMod": "tokens",
            "validator": SCHEMA_VALIDATOR,
            "validationLevel": "strict",
            "validationAction": "error"
        })

    # 2. Setup counters collection
    if "counters" not in existing_collections:
        print("Creating 'counters' collection for atomic token number allocation...")
        db.create_collection("counters")

    tokens_coll = db["tokens"]

    # 3. Create required compound indexes
    print("Creating compound unique index: uq_service_day_token...")
    tokens_coll.create_index(
        [
            ("service", ASCENDING),
            ("service_date", ASCENDING),
            ("token_number", ASCENDING)
        ],
        unique=True,
        name="uq_service_day_token"
    )

    print("Creating compound queue lookup index: ix_queue_lookup...")
    tokens_coll.create_index(
        [
            ("service", ASCENDING),
            ("service_date", ASCENDING),
            ("status", ASCENDING),
            ("token_number", ASCENDING)
        ],
        name="ix_queue_lookup"
    )

    print("Creating date status lookup index: ix_date_status_token...")
    tokens_coll.create_index(
        [
            ("service_date", ASCENDING),
            ("status", ASCENDING),
            ("token_number", ASCENDING)
        ],
        name="ix_date_status_token"
    )

    print("\n--- Current Indexes on 'tokens' collection ---")
    for name, info in tokens_coll.index_information().items():
        print(f"Index [{name}]: key={info['key']}, unique={info.get('unique', False)}")

    print("\nDatabase initialization complete!")
    print(f"MongoDB Compass Connection Link: {Config.MONGODB_URI}{Config.DATABASE_NAME}")

if __name__ == "__main__":
    try:
        init_database()
    except PyMongoError as pe:
        print(f"Database error during initialization: {pe}")
        sys.exit(1)
    except Exception as ex:
        print(f"Initialization error: {ex}")
        sys.exit(1)
