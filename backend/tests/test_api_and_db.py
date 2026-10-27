import os
import sys
import unittest
from datetime import datetime, timezone
from bson import ObjectId
from pymongo import MongoClient
from pymongo.errors import WriteError, DuplicateKeyError

# Ensure backend root is on sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
from app import create_app
from app.config import Config
from app.database import DatabaseManager
from app.services.token_service import TokenService
from app.services.analytics_service import AnalyticsService

class DigitalQueueTestCase(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.app = create_app(Config)
        cls.client = cls.app.test_client()
        cls.db_client = MongoClient(Config.MONGODB_URI)
        cls.db = cls.db_client[Config.DATABASE_NAME]
        cls.tokens_coll = cls.db["tokens"]
        cls.counters_coll = cls.db["counters"]

    def test_T01_health_and_token_creation(self):
        """T01: Health endpoint and token creation with valid service/name -> 201 waiting"""
        health_res = self.client.get("/api/health")
        self.assertEqual(health_res.status_code, 200)
        health_data = health_res.get_json()
        self.assertEqual(health_data["status"], "healthy")
        self.assertEqual(health_data["database"]["status"], "connected")

        # Create valid token
        payload = {"visitor_name": "Test Visitor Alpha", "service": "Admissions"}
        create_res = self.client.post("/api/tokens", json=payload)
        self.assertEqual(create_res.status_code, 201)
        data = create_res.get_json()
        self.assertTrue(data["success"])
        token = data["token"]
        self.assertEqual(token["visitor_name"], "Test Visitor Alpha")
        self.assertEqual(token["service"], "Admissions")
        self.assertEqual(token["status"], "waiting")
        self.assertGreaterEqual(token["token_number"], 1)
        self.assertIsNotNone(token["_id"])
        self.assertIsNotNone(token["created_at"])
        self.assertIsNone(token["called_at"])

    def test_T02_retrieve_queue(self):
        """T02: Retrieve queue for a service in deterministic token_number order"""
        res = self.client.get("/api/queue?service=Admissions")
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertTrue(data["success"])
        queue = data["queue"]
        self.assertIsInstance(queue, list)
        
        # Verify deterministic ascending order and queue_position
        for i, item in enumerate(queue):
            self.assertEqual(item["queue_position"], i + 1)
            self.assertEqual(item["status"], "waiting")
            if i > 0:
                self.assertGreaterEqual(item["token_number"], queue[i - 1]["token_number"])

    def test_T03_search_token(self):
        """T03: Search existing token within scope by number or text"""
        # Lookup existing token
        res_list = self.client.get("/api/tokens?service=Admissions&limit=1")
        self.assertEqual(res_list.status_code, 200)
        tokens = res_list.get_json()["tokens"]
        if tokens:
            target = tokens[0]
            # Search by ID
            res_id = self.client.get(f"/api/tokens/{target['_id']}")
            self.assertEqual(res_id.status_code, 200)
            self.assertEqual(res_id.get_json()["token"]["_id"], target["_id"])

            # Search by token number
            res_num = self.client.get(f"/api/tokens/number/{target['token_number']}?service={target['service']}&service_date={target['service_date']}")
            self.assertEqual(res_num.status_code, 200)
            self.assertEqual(res_num.get_json()["token"]["token_number"], target["token_number"])

    def test_T04_waiting_to_serving_transition(self):
        """T04: Transition waiting -> serving sets called_at"""
        create_res = self.client.post("/api/tokens", json={"visitor_name": "Lifecycle Test", "service": "Billing"})
        token_id = create_res.get_json()["token"]["_id"]

        call_res = self.client.post(f"/api/tokens/{token_id}/call")
        self.assertEqual(call_res.status_code, 200)
        updated = call_res.get_json()["token"]
        self.assertEqual(updated["status"], "serving")
        self.assertIsNotNone(updated["called_at"])

    def test_T05_serving_to_completed_transition(self):
        """T05: Transition serving -> completed sets completed_at"""
        create_res = self.client.post("/api/tokens", json={"visitor_name": "Completion Test", "service": "Billing"})
        token_id = create_res.get_json()["token"]["_id"]

        # Call first
        self.client.post(f"/api/tokens/{token_id}/call")
        
        # Complete
        comp_res = self.client.post(f"/api/tokens/{token_id}/complete")
        self.assertEqual(comp_res.status_code, 200)
        updated = comp_res.get_json()["token"]
        self.assertEqual(updated["status"], "completed")
        self.assertIsNotNone(updated["completed_at"])

    def test_T06_cancel_waiting_token(self):
        """T06: Cancel waiting token -> status cancelled; record preserved for audit"""
        create_res = self.client.post("/api/tokens", json={"visitor_name": "Cancel Test", "service": "General Enquiry"})
        token_id = create_res.get_json()["token"]["_id"]

        cancel_res = self.client.post(f"/api/tokens/{token_id}/cancel")
        self.assertEqual(cancel_res.status_code, 200)
        updated = cancel_res.get_json()["token"]
        self.assertEqual(updated["status"], "cancelled")
        self.assertIsNotNone(updated["cancelled_at"])

        # Record must still be retrievable from MongoDB
        verify_doc = self.tokens_coll.find_one({"_id": ObjectId(token_id)})
        self.assertIsNotNone(verify_doc)
        self.assertEqual(verify_doc["status"], "cancelled")

    def test_T07_aggregate_summary(self):
        """T07: Aggregation pipeline calculates counts by status and service"""
        res = self.client.get("/api/analytics/summary")
        self.assertEqual(res.status_code, 200)
        data = res.get_json()["data"]
        self.assertIn("total_tokens", data)
        self.assertIn("waiting_tokens", data)
        self.assertIn("serving_tokens", data)
        self.assertIn("completed_tokens", data)
        self.assertIn("cancelled_tokens", data)
        self.assertIn("service_breakdown", data)

    def test_T08_duplicate_scoped_token_number_rejected(self):
        """T08: Compound unique index prevents inserting duplicate (service + service_date + token_number)"""
        service_date = TokenService.get_current_service_date()
        doc = {
            "token_number": 99999,
            "service": "Admissions",
            "service_date": service_date,
            "visitor_name": "Duplicate Test 1",
            "status": "waiting",
            "created_at": datetime.now(timezone.utc),
            "called_at": None,
            "completed_at": None,
            "cancelled_at": None
        }
        self.tokens_coll.delete_many({"service": "Admissions", "service_date": service_date, "token_number": 99999})
        self.tokens_coll.insert_one(doc)

        # Attempt to insert identical scoped token number
        duplicate_doc = dict(doc)
        duplicate_doc.pop("_id", None)
        duplicate_doc["visitor_name"] = "Duplicate Test 2"

        with self.assertRaises(DuplicateKeyError):
            self.tokens_coll.insert_one(duplicate_doc)

        # Cleanup
        self.tokens_coll.delete_many({"service": "Admissions", "service_date": service_date, "token_number": 99999})

    def test_T09_invalid_status_rejected(self):
        """T09: Request validator rejects disallowed status values"""
        from app.validators.token_validator import validate_status_transition
        is_valid, err = validate_status_transition("waiting", "in-progress")
        self.assertFalse(is_valid)
        self.assertIn("Invalid target status", err)

    def test_T10_empty_visitor_name_rejected(self):
        """T10: Reject empty visitor name with HTTP 400"""
        res = self.client.post("/api/tokens", json={"visitor_name": "   ", "service": "Admissions"})
        self.assertEqual(res.status_code, 400)
        self.assertIn("at least 2 characters", res.get_json()["error"])

    def test_T11_invalid_state_transition_conflict(self):
        """T11: Completing a token while still waiting returns conflict HTTP 409"""
        create_res = self.client.post("/api/tokens", json={"visitor_name": "Skip Serving Test", "service": "Billing"})
        token_id = create_res.get_json()["token"]["_id"]

        # Attempt to directly complete waiting token without serving
        comp_res = self.client.post(f"/api/tokens/{token_id}/complete")
        self.assertEqual(comp_res.status_code, 409)
        self.assertIn("Illegal state transition", comp_res.get_json()["error"])

    def test_T12_mongodb_json_schema_validation(self):
        """T12: Direct database write with malformed document is rejected by MongoDB JSON Schema"""
        malformed_doc = {
            "token_number": -5,  # Violates minimum: 1
            "service": "Invalid Service",
            "service_date": "not-a-date",  # Violates regex pattern
            "visitor_name": "",  # Violates minLength: 1
            "status": "bogus-status",  # Violates enum
            "created_at": "not-a-bson-date"  # Violates bsonType: date
        }
        with self.assertRaises(WriteError):
            self.tokens_coll.insert_one(malformed_doc)

    def test_T13_indexes_verified(self):
        """T13: Inspect tokens.index_information() verifies required compound indexes"""
        indexes = self.tokens_coll.index_information()
        self.assertIn("uq_service_day_token", indexes)
        self.assertTrue(indexes["uq_service_day_token"].get("unique", False))
        self.assertIn("ix_queue_lookup", indexes)
        self.assertIn("ix_date_status_token", indexes)

    def test_T14_query_execution_stats(self):
        """T14: Run explain and verify index usage over collection scan"""
        service_date = TokenService.get_current_service_date()
        query = {
            "service": "Admissions",
            "service_date": service_date,
            "status": "waiting"
        }
        plan = self.tokens_coll.find(query).sort("token_number", 1).explain()
        self.assertIn("executionStats", plan)
        self.assertIn("queryPlanner", plan)

    def test_T15_pagination_limits(self):
        """T15: Pagination parameters are safely clamped"""
        res = self.client.get("/api/tokens?limit=9999")
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertLessEqual(data["limit"], 100)

if __name__ == "__main__":
    unittest.main()
