import logging
from flask import Blueprint, request, jsonify
from pymongo.errors import PyMongoError
from app.services.token_service import TokenService
from app.validators.token_validator import validate_create_token_payload, validate_date_string

logger = logging.getLogger(__name__)
tokens_bp = Blueprint("tokens", __name__)

@tokens_bp.post("/tokens")
def create_token():
    payload = request.get_json(silent=True)
    is_valid, validated_or_error = validate_create_token_payload(payload)
    if not is_valid:
        return jsonify({"success": False, "error": validated_or_error}), 400

    try:
        token = TokenService.create_token(
            visitor_name=validated_or_error["visitor_name"],
            service=validated_or_error["service"]
        )
        return jsonify({
            "success": True,
            "message": f"Token #{token['token_number']} issued successfully for {token['service']}",
            "token": token
        }), 201
    except ValueError as ve:
        return jsonify({"success": False, "error": str(ve)}), 409
    except PyMongoError as pe:
        logger.exception("Database error while creating token")
        return jsonify({"success": False, "error": "Database error while processing token"}), 503
    except Exception as e:
        logger.exception("Unexpected error while creating token")
        return jsonify({"success": False, "error": "Internal server error"}), 500

@tokens_bp.get("/tokens")
def list_tokens():
    service = request.args.get("service")
    status = request.args.get("status")
    service_date = request.args.get("service_date")
    search = request.args.get("search")

    try:
        page = int(request.args.get("page", 1))
        limit = min(int(request.args.get("limit", 50)), 100)
        if page < 1:
            page = 1
        if limit < 1:
            limit = 50
    except ValueError:
        return jsonify({"success": False, "error": "Invalid pagination parameters"}), 400

    if service_date and not validate_date_string(service_date):
        return jsonify({"success": False, "error": "Invalid service_date format (must be YYYY-MM-DD)"}), 400

    try:
        result = TokenService.list_tokens(
            service=service,
            status=status,
            service_date=service_date,
            search=search,
            page=page,
            limit=limit
        )
        return jsonify({
            "success": True,
            **result
        }), 200
    except PyMongoError:
        logger.exception("Database error listing tokens")
        return jsonify({"success": False, "error": "Database query failed"}), 503

@tokens_bp.get("/tokens/<token_id>")
def get_token_by_id(token_id):
    try:
        token = TokenService.get_token_by_id(token_id)
        if not token:
            return jsonify({"success": False, "error": "Token not found or invalid ID"}), 404
        return jsonify({"success": True, "token": token}), 200
    except Exception:
        logger.exception("Error retrieving token by ID")
        return jsonify({"success": False, "error": "Internal server error"}), 500

@tokens_bp.get("/tokens/number/<token_number>")
def get_token_by_number(token_number):
    service = request.args.get("service")
    service_date = request.args.get("service_date") or TokenService.get_current_service_date()

    if not service:
        return jsonify({"success": False, "error": "Service query parameter is required to locate token number"}), 400
    if not token_number.isdigit():
        return jsonify({"success": False, "error": "Token number must be an integer"}), 400

    try:
        token = TokenService.get_token_by_number(service, service_date, int(token_number))
        if not token:
            return jsonify({"success": False, "error": f"Token #{token_number} not found for {service} on {service_date}"}), 404
        return jsonify({"success": True, "token": token}), 200
    except Exception:
        logger.exception("Error looking up token number")
        return jsonify({"success": False, "error": "Internal server error"}), 500

@tokens_bp.post("/tokens/<token_id>/call")
def call_token(token_id):
    """Staff action: Calls a specific waiting token."""
    token, err = TokenService.call_token_by_id(token_id)
    if err:
        status_code = 404 if "not found" in err else 409
        return jsonify({"success": False, "error": err}), status_code

    return jsonify({
        "success": True,
        "message": f"Token #{token['token_number']} is now being served",
        "token": token
    }), 200

@tokens_bp.post("/tokens/<token_id>/complete")
def complete_token(token_id):
    """Staff action: Marks a serving token as completed."""
    token, err = TokenService.complete_token_by_id(token_id)
    if err:
        status_code = 404 if "not found" in err else 409
        return jsonify({"success": False, "error": err}), status_code

    return jsonify({
        "success": True,
        "message": f"Token #{token['token_number']} marked completed",
        "token": token
    }), 200

@tokens_bp.post("/tokens/<token_id>/cancel")
def cancel_token(token_id):
    """Staff/Visitor action: Cancels a waiting token while preserving the record."""
    token, err = TokenService.cancel_token_by_id(token_id)
    if err:
        status_code = 404 if "not found" in err else 409
        return jsonify({"success": False, "error": err}), status_code

    return jsonify({
        "success": True,
        "message": f"Token #{token['token_number']} has been cancelled",
        "token": token
    }), 200
