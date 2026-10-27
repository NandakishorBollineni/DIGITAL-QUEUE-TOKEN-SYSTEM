import os
import sys
import unittest
import time

backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

def run_all_tests():
    print("=" * 80)
    print("DIGITAL QUEUE TOKEN SYSTEM - AUTOMATED VERIFICATION REPORT")
    print("Course: CSE494 Intelligent NoSQL Databases | Academic Year: 2026-2027")
    print("Student: Bollineni Nanda Kishor (Reg No: 12321100, Roll No: 11)")
    print("=" * 80)

    loader = unittest.TestLoader()
    suite = unittest.TestSuite()

    from tests.test_api_and_db import DigitalQueueTestCase
    from tests.test_concurrency import ConcurrencyTestCase

    suite.addTests(loader.loadTestsFromTestCase(DigitalQueueTestCase))
    suite.addTests(loader.loadTestsFromTestCase(ConcurrencyTestCase))

    start_time = time.time()
    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(suite)
    elapsed = time.time() - start_time

    total_implemented = 17
    total_executed = result.testsRun
    total_passed = total_executed - len(result.failures) - len(result.errors)
    total_failed = len(result.failures) + len(result.errors)
    total_not_run = max(0, total_implemented - total_executed)

    print("\n" + "=" * 80)
    print("FINAL TEST EXECUTION METRICS:")
    print(f"  • Tests Implemented : {total_implemented}")
    print(f"  • Tests Executed    : {total_executed}")
    print(f"  • Tests Passed      : {total_passed}")
    print(f"  • Tests Failed      : {total_failed}")
    print(f"  • Tests Not Run     : {total_not_run}")
    print(f"  • Total Time        : {elapsed:.2f} seconds")
    print("=" * 80)

    if not result.wasSuccessful():
        sys.exit(1)

if __name__ == "__main__":
    run_all_tests()
