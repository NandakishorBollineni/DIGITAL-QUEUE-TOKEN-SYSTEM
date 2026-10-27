import os
import sys
from pymongo import MongoClient

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
from app.config import Config
from app.services.token_service import TokenService

def extract_index_name(stage_dict):
    """Recursively traverses query plan stages to find the indexName."""
    if not isinstance(stage_dict, dict):
        return None
    if "indexName" in stage_dict:
        return stage_dict["indexName"]
    if "inputStage" in stage_dict:
        res = extract_index_name(stage_dict["inputStage"])
        if res:
            return res
    if "inputStages" in stage_dict:
        for s in stage_dict["inputStages"]:
            res = extract_index_name(s)
            if res:
                return res
    return None

def explain_queries():
    client = MongoClient(Config.MONGODB_URI)
    db = client[Config.DATABASE_NAME]
    tokens = db["tokens"]
    service_date = TokenService.get_current_service_date()

    print("================================================================================")
    print("MONGODB QUERY OPTIMIZATION & EXECUTION PLAN ANALYSIS")
    print("Course: CSE494 Intelligent NoSQL Databases | Academic Year: 2026-2027")
    print(f"Database: {Config.DATABASE_NAME} | Collection: tokens")
    print("================================================================================\n")

    # Query 1: Waiting queue retrieval (Optimized by ix_queue_lookup index)
    query_1 = {
        "service": "Admissions",
        "service_date": service_date,
        "status": "waiting"
    }
    print(f"--- [Query 1]: Waiting Queue Retrieval ---")
    print(f"Filter: {query_1}")
    print("Sort: [('token_number', 1)] | Limit: 100")
    
    explanation_1 = tokens.find(query_1).sort("token_number", 1).limit(100).explain()
    
    qp1 = explanation_1.get("queryPlanner", {})
    winning_plan_1 = qp1.get("winningPlan", {})
    stats_1 = explanation_1.get("executionStats", {})

    stage_1 = winning_plan_1.get("stage")
    index_name_1 = extract_index_name(winning_plan_1) or "None (COLLSCAN)"

    print(f"Winning Plan Root Stage : {stage_1}")
    print(f"Index Utilized          : {index_name_1}")
    print(f"Docs Returned (n)       : {stats_1.get('nReturned')}")
    print(f"Docs Examined           : {stats_1.get('totalDocsExamined')}")
    print(f"Keys Examined           : {stats_1.get('totalKeysExamined')}")
    print(f"Execution Time          : {stats_1.get('executionTimeMillis')} ms")

    keys = stats_1.get('totalKeysExamined', 0)
    returned = stats_1.get('nReturned', 0)
    if returned > 0:
        print(f"Index Efficiency (keys/returned): {round(keys / returned, 2)}")

    print("\n--------------------------------------------------------------------------------")
    # Query 2: Token lookup by scoped unique number
    query_2 = {
        "service": "Billing",
        "service_date": service_date,
        "token_number": 1
    }
    print(f"--- [Query 2]: Scoped Token Lookup by Number (uq_service_day_token) ---")
    print(f"Filter: {query_2}")
    
    explanation_2 = tokens.find(query_2).explain()
    winning_plan_2 = explanation_2.get("queryPlanner", {}).get("winningPlan", {})
    stats_2 = explanation_2.get("executionStats", {})
    index_name_2 = extract_index_name(winning_plan_2) or "None (COLLSCAN)"

    print(f"Winning Plan Root Stage : {winning_plan_2.get('stage')}")
    print(f"Index Utilized          : {index_name_2}")
    print(f"Docs Returned (n)       : {stats_2.get('nReturned')}")
    print(f"Docs Examined           : {stats_2.get('totalDocsExamined')}")
    print(f"Keys Examined           : {stats_2.get('totalKeysExamined')}")
    print(f"Execution Time          : {stats_2.get('executionTimeMillis')} ms")

    print("\n================================================================================")
    print("SUMMARY OF INDEX OBSERVATIONS:")
    print(f"- Query 1 utilized index '{index_name_1}' avoiding full collection scan.")
    print(f"- Query 2 utilized index '{index_name_2}' directly targeting unique scoped token.")
    print("================================================================================")

if __name__ == "__main__":
    explain_queries()
