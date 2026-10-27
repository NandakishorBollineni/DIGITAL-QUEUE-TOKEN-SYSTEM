import os
import sys
import unittest
from concurrent.futures import ThreadPoolExecutor, as_completed
from pymongo import MongoClient

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
from app import create_app
from app.config import Config
from app.services.token_service import TokenService

class ConcurrencyTestCase(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.app = create_app(Config)
        cls.client = cls.app.test_client()

    def test_T16_concurrent_token_allocation(self):
        """
        Spawns 10 concurrent threads generating tokens simultaneously for 'Document Verification'.
        Verifies that:
        1. All 10 requests succeed.
        2. All 10 allocated token numbers are strictly unique (no duplicates).
        3. PyMongo find_one_and_update guarantees thread-safety.
        """
        service = "Document Verification"
        num_workers = 10
        allocated_numbers = []

        def worker(index):
            res = self.client.post("/api/tokens", json={
                "visitor_name": f"Concurrent Visitor {index}",
                "service": service
            })
            return res.get_json()

        with ThreadPoolExecutor(max_workers=num_workers) as executor:
            futures = [executor.submit(worker, i) for i in range(num_workers)]
            for future in as_completed(futures):
                data = future.result()
                self.assertTrue(data.get("success"), f"Failed response: {data}")
                num = data["token"]["token_number"]
                allocated_numbers.append(num)

        self.assertEqual(len(allocated_numbers), num_workers)
        # Check uniqueness: set length must equal list length
        unique_numbers = set(allocated_numbers)
        self.assertEqual(
            len(unique_numbers),
            num_workers,
            f"Duplicate token numbers detected in concurrency test: {allocated_numbers}"
        )

    def test_concurrent_call_next_safety(self):
        """
        Spawns 5 concurrent staff requests attempting to call-next on the same waiting queue.
        Verifies that no two threads receive the same token.
        """
        service = "Document Verification"
        claimed_ids = []

        def call_worker():
            res = self.client.post("/api/queue/call-next", json={"service": service})
            if res.status_code == 200:
                data = res.get_json()
                return data["token"]["_id"]
            return None

        with ThreadPoolExecutor(max_workers=5) as executor:
            futures = [executor.submit(call_worker) for _ in range(5)]
            for future in as_completed(futures):
                token_id = future.result()
                if token_id:
                    claimed_ids.append(token_id)

        # Ensure all claimed tokens in this batch are strictly distinct!
        self.assertEqual(len(claimed_ids), len(set(claimed_ids)))

if __name__ == "__main__":
    unittest.main()
