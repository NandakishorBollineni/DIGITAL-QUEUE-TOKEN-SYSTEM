import os
import sys
from datetime import datetime, timezone, timedelta
from pymongo import MongoClient

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
from app.config import Config
from app.services.token_service import TokenService

DEMO_VISITORS = [
    # (service, visitor_name, status, offset_minutes)
    ("Admissions", "Aarav Sharma", "completed", -60),
    ("Admissions", "Ananya Rao", "serving", -30),
    ("Admissions", "Ravi Kumar", "waiting", -15),
    ("Admissions", "Kiran Das", "waiting", -10),
    ("Admissions", "Pooja Mehta", "cancelled", -50),

    ("Billing", "Sneha Patel", "completed", -75),
    ("Billing", "Vikram Malhotra", "completed", -45),
    ("Billing", "Rohit Verma", "serving", -20),
    ("Billing", "Neha Gupta", "waiting", -8),
    ("Billing", "Aditya Nair", "waiting", -3),

    ("Document Verification", "Meera Krishnan", "completed", -90),
    ("Document Verification", "Arjun Reddy", "serving", -25),
    ("Document Verification", "Divya Joshi", "waiting", -12),
    ("Document Verification", "Deepak Chawla", "cancelled", -40),

    ("General Enquiry", "Priya Sen", "completed", -80),
    ("General Enquiry", "Sanjay Singhania", "waiting", -14),
    ("General Enquiry", "Tanvi Bhatia", "waiting", -6),
]

def seed_demo_data():
    client = MongoClient(Config.MONGODB_URI)
    db = client[Config.DATABASE_NAME]
    tokens_coll = db["tokens"]
    counters_coll = db["counters"]

    service_date = TokenService.get_current_service_date()
    now_utc = datetime.now(timezone.utc)

    print(f"Seeding demo data for service_date: {service_date}...")

    # Group by service to assign consecutive token numbers starting at 1
    service_token_counters = {}

    for service, visitor, status, offset_min in DEMO_VISITORS:
        service_token_counters[service] = service_token_counters.get(service, 0) + 1
        num = service_token_counters[service]

        created_time = now_utc + timedelta(minutes=offset_min)
        called_time = None
        completed_time = None
        cancelled_time = None

        if status == "serving":
            called_time = created_time + timedelta(minutes=5)
        elif status == "completed":
            called_time = created_time + timedelta(minutes=5)
            completed_time = called_time + timedelta(minutes=10)
        elif status == "cancelled":
            cancelled_time = created_time + timedelta(minutes=4)

        token_doc = {
            "token_number": num,
            "service": service,
            "service_date": service_date,
            "visitor_name": visitor,
            "status": status,
            "created_at": created_time,
            "called_at": called_time,
            "completed_at": completed_time,
            "cancelled_at": cancelled_time
        }

        # Update or insert safely
        tokens_coll.update_one(
            {
                "service": service,
                "service_date": service_date,
                "token_number": num
            },
            {"$set": token_doc},
            upsert=True
        )

    # Sync counters collection so subsequent user requests get the next token number!
    for service, max_num in service_token_counters.items():
        counter_id = f"{service}:{service_date}"
        counters_coll.update_one(
            {"_id": counter_id},
            {
                "$set": {
                    "next_number": max_num,
                    "service": service,
                    "service_date": service_date,
                    "updated_at": now_utc
                }
            },
            upsert=True
        )

    total_tokens = tokens_coll.count_documents({"service_date": service_date})
    waiting_count = tokens_coll.count_documents({"service_date": service_date, "status": "waiting"})
    serving_count = tokens_coll.count_documents({"service_date": service_date, "status": "serving"})
    completed_count = tokens_coll.count_documents({"service_date": service_date, "status": "completed"})
    cancelled_count = tokens_coll.count_documents({"service_date": service_date, "status": "cancelled"})

    print("Demo data seeded successfully!")
    print(f"Summary for {service_date}:")
    print(f"  Total: {total_tokens} tokens")
    print(f"  Waiting: {waiting_count}")
    print(f"  Serving: {serving_count}")
    print(f"  Completed: {completed_count}")
    print(f"  Cancelled: {cancelled_count}")
    print(f"\nInspect in MongoDB Compass using: {Config.MONGODB_URI}{Config.DATABASE_NAME}")

if __name__ == "__main__":
    seed_demo_data()
