import logging
from app.database import DatabaseManager
from app.services.token_service import TokenService

logger = logging.getLogger(__name__)

class AnalyticsService:
    @classmethod
    def get_summary(cls, service_date=None):
        """
        Executes MongoDB aggregation pipelines to calculate:
        - Overall token status breakdown
        - Service-wise breakdown
        - Key operational metrics
        """
        if not service_date:
            service_date = TokenService.get_current_service_date()

        tokens_coll = DatabaseManager.get_tokens_collection()

        # Pipeline 1: Group by status for the selected date
        status_pipeline = [
            {"$match": {"service_date": service_date}},
            {"$group": {"_id": "$status", "count": {"$sum": 1}}},
            {"$sort": {"_id": 1}}
        ]
        status_results = list(tokens_coll.aggregate(status_pipeline))

        status_counts = {
            "waiting": 0,
            "serving": 0,
            "completed": 0,
            "cancelled": 0
        }
        total = 0
        for row in status_results:
            st = row["_id"]
            cnt = row["count"]
            if st in status_counts:
                status_counts[st] = cnt
            total += cnt

        # Pipeline 2: Group by service and status
        service_pipeline = [
            {"$match": {"service_date": service_date}},
            {
                "$group": {
                    "_id": {
                        "service": "$service",
                        "status": "$status"
                    },
                    "count": {"$sum": 1}
                }
            },
            {"$sort": {"_id.service": 1, "_id.status": 1}}
        ]
        service_results = list(tokens_coll.aggregate(service_pipeline))

        # Structure service breakdown
        services_map = {}
        for row in service_results:
            svc = row["_id"]["service"]
            st = row["_id"]["status"]
            cnt = row["count"]
            if svc not in services_map:
                services_map[svc] = {
                    "service": svc,
                    "total": 0,
                    "waiting": 0,
                    "serving": 0,
                    "completed": 0,
                    "cancelled": 0
                }
            services_map[svc]["total"] += cnt
            if st in services_map[svc]:
                services_map[svc][st] += cnt

        # Pipeline 3: Overall all-time totals for reference
        all_time_pipeline = [
            {"$group": {"_id": "$status", "count": {"$sum": 1}}}
        ]
        all_time_results = list(tokens_coll.aggregate(all_time_pipeline))
        all_time_counts = {
            "total": sum(r["count"] for r in all_time_results),
            "waiting": 0,
            "serving": 0,
            "completed": 0,
            "cancelled": 0
        }
        for r in all_time_results:
            if r["_id"] in all_time_counts:
                all_time_counts[r["_id"]] = r["count"]

        return {
            "service_date": service_date,
            "total_tokens": total,
            "waiting_tokens": status_counts["waiting"],
            "serving_tokens": status_counts["serving"],
            "completed_tokens": status_counts["completed"],
            "cancelled_tokens": status_counts["cancelled"],
            "status_breakdown": status_counts,
            "service_breakdown": list(services_map.values()),
            "all_time": all_time_counts
        }

    @classmethod
    def get_daily_trends(cls, limit_days=7):
        """
        Uses an aggregation pipeline to group tokens by service_date and status
        to provide trends across dates.
        """
        tokens_coll = DatabaseManager.get_tokens_collection()

        pipeline = [
            {
                "$group": {
                    "_id": {
                        "date": "$service_date",
                        "status": "$status"
                    },
                    "count": {"$sum": 1}
                }
            },
            {"$sort": {"_id.date": -1, "_id.status": 1}}
        ]
        results = list(tokens_coll.aggregate(pipeline))

        daily_map = {}
        for row in results:
            dt = row["_id"]["date"]
            st = row["_id"]["status"]
            cnt = row["count"]
            if dt not in daily_map:
                daily_map[dt] = {
                    "date": dt,
                    "total": 0,
                    "waiting": 0,
                    "serving": 0,
                    "completed": 0,
                    "cancelled": 0
                }
            daily_map[dt]["total"] += cnt
            if st in daily_map[dt]:
                daily_map[dt][st] += cnt

        # Sort dates descending and take limit
        sorted_days = sorted(daily_map.values(), key=lambda x: x["date"], reverse=True)[:limit_days]
        return sorted_days
