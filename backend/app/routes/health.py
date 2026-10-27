from flask import Blueprint, jsonify
from app.database import DatabaseManager
from app.config import Config

health_bp = Blueprint("health", __name__)

@health_bp.get("/health")
def health_check():
    """
    Checks Flask server status and live MongoDB database connectivity
    without leaking internal credentials or connection strings.
    """
    db_status = "disconnected"
    try:
        ping_res = DatabaseManager.ping()
        if ping_res and ping_res.get("ok") == 1.0:
            db_status = "connected"
    except Exception as e:
        db_status = f"error: {str(e)}"

    is_healthy = db_status == "connected"
    status_code = 200 if is_healthy else 503

    return jsonify({
        "status": "healthy" if is_healthy else "unhealthy",
        "service": "Digital Queue Token System API",
        "database": {
            "type": "MongoDB (NoSQL)",
            "name": Config.DATABASE_NAME,
            "status": db_status
        },
        "academic_metadata": {
            "course": "CSE494 - Intelligent NoSQL Databases",
            "student": "Bollineni Nanda Kishor",
            "registration_number": "12321100",
            "roll_number": "11"
        }
    }), status_code
