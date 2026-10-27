import logging
from flask import Blueprint, request, jsonify
from pymongo.errors import PyMongoError
from app.services.token_service import TokenService
from app.validators.token_validator import validate_date_string

logger = logging.getLogger(__name__)
queue_bp = Blueprint("queue", __name__)

@queue_bp.get("/queue")
def get_queue():
    """
    Returns the waiting queue in deterministic token-number order,
    including calculated queue positions.
    """
    service = request.args.get("service")
    service_date = request.args.get("service_date")
    if service_date and not validate_date_string(service_date):
        return jsonify({"success": False, "error": "Invalid service_date format (must be YYYY-MM-DD)"}), 400

    try:
        data = TokenService.get_waiting_queue(service=service, service_date=service_date)
        return jsonify({
            "success": True,
            **data
        }), 200
    except PyMongoError:
        logger.exception("Database error fetching queue")
        return jsonify({"success": False, "error": "Failed to retrieve queue"}), 503

@queue_bp.post("/queue/call-next")
def call_next_token():
    """
    Atomically claims the next earliest waiting token for a service or all services.
    Safe against concurrent staff race conditions.
    """
    payload = request.get_json(silent=True) or {}
    service = payload.get("service") or request.args.get("service")
    service_date = payload.get("service_date") or request.args.get("service_date")

    if service_date and not validate_date_string(service_date):
        return jsonify({"success": False, "error": "Invalid service_date format"}), 400

    try:
        claimed = TokenService.call_next(service=service, service_date=service_date)
        if not claimed:
            msg = f"No waiting tokens available{' for ' + service if service else ''}"
            return jsonify({"success": False, "message": msg, "token": None}), 404

        return jsonify({
            "success": True,
            "message": f"Successfully called Token #{claimed['token_number']} ({claimed['service']}) for {claimed['visitor_name']}",
            "token": claimed
        }), 200
    except PyMongoError:
        logger.exception("Database error executing call-next")
        return jsonify({"success": False, "error": "Database error while claiming next token"}), 503
