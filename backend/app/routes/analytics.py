import logging
from flask import Blueprint, request, jsonify
from pymongo.errors import PyMongoError
from app.services.analytics_service import AnalyticsService
from app.validators.token_validator import validate_date_string

logger = logging.getLogger(__name__)
analytics_bp = Blueprint("analytics", __name__)

@analytics_bp.get("/analytics/summary")
def get_analytics_summary():
    """
    Returns counts grouped by status and service using MongoDB aggregation pipelines.
    """
    service_date = request.args.get("service_date")
    if service_date and not validate_date_string(service_date):
        return jsonify({"success": False, "error": "Invalid service_date format (YYYY-MM-DD)"}), 400

    try:
        data = AnalyticsService.get_summary(service_date=service_date)
        return jsonify({
            "success": True,
            "data": data
        }), 200
    except PyMongoError:
        logger.exception("Database error running analytics summary aggregation")
        return jsonify({"success": False, "error": "Database aggregation failed"}), 503

@analytics_bp.get("/analytics/daily")
def get_daily_trends():
    """
    Returns daily token totals and status counts for trend analysis.
    """
    try:
        days = min(int(request.args.get("days", 7)), 30)
    except ValueError:
        days = 7

    try:
        trends = AnalyticsService.get_daily_trends(limit_days=days)
        return jsonify({
            "success": True,
            "data": trends
        }), 200
    except PyMongoError:
        logger.exception("Database error running daily analytics aggregation")
        return jsonify({"success": False, "error": "Database aggregation failed"}), 503
