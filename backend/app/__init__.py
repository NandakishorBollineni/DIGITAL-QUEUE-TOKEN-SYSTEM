import logging
from flask import Flask, jsonify
from flask_cors import CORS
from app.config import Config

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("digital_queue")

def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)

    # Configure CORS with specified origins
    CORS(
        app,
        resources={r"/api/*": {"origins": config_class.CORS_ORIGINS}},
        supports_credentials=True
    )

    # Register API blueprints
    from app.routes.health import health_bp
    from app.routes.tokens import tokens_bp
    from app.routes.queue import queue_bp
    from app.routes.analytics import analytics_bp

    app.register_blueprint(health_bp, url_prefix="/api")
    app.register_blueprint(tokens_bp, url_prefix="/api")
    app.register_blueprint(queue_bp, url_prefix="/api")
    app.register_blueprint(analytics_bp, url_prefix="/api")

    # Global standard JSON error handlers
    @app.errorhandler(404)
    def handle_not_found(e):
        return jsonify({"success": False, "error": "Endpoint not found"}), 404

    @app.errorhandler(405)
    def handle_method_not_allowed(e):
        return jsonify({"success": False, "error": "HTTP method not allowed on this endpoint"}), 405

    @app.errorhandler(500)
    def handle_internal_server_error(e):
        logger.exception("Internal Server Error")
        return jsonify({"success": False, "error": "Internal server error occurred"}), 500

    @app.get("/")
    def index():
        return jsonify({
            "name": "Digital Queue Token System REST API",
            "version": "1.0.0",
            "course": "CSE494 - Intelligent NoSQL Databases",
            "student": "Bollineni Nanda Kishor (12321100)",
            "documentation": "/api/health",
            "compass_connection": "mongodb://127.0.0.1:27017/digital_queue"
        })

    return app
