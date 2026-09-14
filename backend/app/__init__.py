import os

from flask import Flask, jsonify, send_from_directory
from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager
from flask_cors import CORS
from flask_socketio import SocketIO

from app.config import Config


# =========================================================
# EXTENSIONS
# =========================================================

db = SQLAlchemy()
jwt = JWTManager()
cors = CORS()
socketio = SocketIO()


# =========================================================
# APPLICATION FACTORY
# =========================================================

def create_app(config_class=Config):
    flask_app = Flask(__name__)

    # -----------------------------------------------------
    # LOAD CONFIGURATION
    # -----------------------------------------------------

    flask_app.config.from_object(config_class)

    # -----------------------------------------------------
    # INITIALIZE EXTENSIONS
    # -----------------------------------------------------

    db.init_app(flask_app)
    jwt.init_app(flask_app)

    cors.init_app(
        flask_app,
        resources={
            r"/api/*": {
                "origins": flask_app.config["CORS_ORIGINS"] + [
                    "http://127.0.0.1:5173",
                    "http://127.0.0.1:5174",
                    "http://localhost:5173",
                    "http://localhost:5174",
                    "http://localhost:5199",
                    "http://localhost:5175",
                ],
                "supports_credentials": True,
            }
        },
        supports_credentials=True,
    )

    socketio.init_app(
        flask_app,
        cors_allowed_origins=flask_app.config["CORS_ORIGINS"] + [
            "http://127.0.0.1:5173",
            "http://127.0.0.1:5174",
            "http://localhost:5173",
            "http://localhost:5174",
        ],
        async_mode="threading"
    )

    # -----------------------------------------------------
    # CREATE REQUIRED DIRECTORIES
    # -----------------------------------------------------

    upload_folder = flask_app.config.get("UPLOAD_FOLDER", "uploads")
    if not os.path.isabs(upload_folder):
        upload_folder = os.path.join(os.path.dirname(os.path.dirname(__file__)), upload_folder)
    upload_folder = os.path.abspath(upload_folder)
    flask_app.config["UPLOAD_FOLDER"] = upload_folder

    os.makedirs(
        upload_folder,
        exist_ok=True
    )

    # =====================================================
    # BASIC ROUTES
    # =====================================================

    @flask_app.route("/", methods=["GET"])
    def home():
        return jsonify({
            "success": True,
            "message": "M2M Backend API is running",
            "status": "online",
            "version": "1.0.0"
        }), 200

    @flask_app.route("/health", methods=["GET"])
    def health_check():
        return jsonify({
            "success": True,
            "message": "Backend is healthy",
            "status": "ok"
        }), 200

    @flask_app.route("/uploads/<path:filename>", methods=["GET"])
    def uploaded_file(filename):
        return send_from_directory(flask_app.config["UPLOAD_FOLDER"], filename)

    # =====================================================
    # IMPORT BLUEPRINTS
    # =====================================================

    from app.routes.auth import auth_bp
    from app.routes.batches import batches_bp
    from app.routes.demands import demands_bp
    from app.routes.lots import lots_bp
    from app.routes.notifications import notifications_bp
    from app.routes.admin import admin_bp
    from app.routes.market import market_bp
    from app.routes.storage import storage_bp
    from app.routes.surplus import surplus_bp
    from app.routes.network import network_bp
    from app.routes.dashboard import dashboard_bp
    from app.routes.community import community_bp
    from app.routes.assistant import assistant_bp

    # =====================================================
    # REGISTER BLUEPRINTS
    # =====================================================

    flask_app.register_blueprint(
        auth_bp,
        url_prefix="/api/auth"
    )

    flask_app.register_blueprint(
        batches_bp,
        url_prefix="/api/batches"
    )

    flask_app.register_blueprint(
        demands_bp,
        url_prefix="/api/demands"
    )

    flask_app.register_blueprint(
        lots_bp,
        url_prefix="/api/procurement-lots"
    )

    flask_app.register_blueprint(
        notifications_bp,
        url_prefix="/api/notifications"
    )

    flask_app.register_blueprint(
        admin_bp,
        url_prefix="/api/admin"
    )

    flask_app.register_blueprint(
        market_bp,
        url_prefix="/api/market"
    )

    flask_app.register_blueprint(
        storage_bp,
        url_prefix="/api/storage"
    )

    flask_app.register_blueprint(
        surplus_bp,
        url_prefix="/api/surplus"
    )

    flask_app.register_blueprint(
        network_bp,
        url_prefix="/api/network"
    )

    flask_app.register_blueprint(
        dashboard_bp,
        url_prefix="/api/dashboard"
    )

    flask_app.register_blueprint(
        community_bp,
        url_prefix="/api/community"
    )

    flask_app.register_blueprint(
        assistant_bp,
        url_prefix="/api/assistant"
    )

    # =====================================================
    # IMPORT MODELS AND CREATE DATABASE TABLES
    # =====================================================

    with flask_app.app_context():
        import app.models
        db.create_all()
        # Keep existing development and production databases compatible with new fields.
        from sqlalchemy import inspect, text
        columns = {column['name'] for column in inspect(db.engine).get_columns('users')}
        if 'avatar_path' not in columns:
            db.session.execute(text("ALTER TABLE users ADD COLUMN avatar_path VARCHAR(500)"))
            db.session.commit()
        batch_columns = {column['name'] for column in inspect(db.engine).get_columns('produce_batches')}
        for column in ('asking_price_min', 'asking_price_max'):
            if column not in batch_columns:
                db.session.execute(text(f"ALTER TABLE produce_batches ADD COLUMN {column} FLOAT"))
        if 'listing_description' not in batch_columns:
            db.session.execute(text("ALTER TABLE produce_batches ADD COLUMN listing_description TEXT"))
        user_columns = {column['name'] for column in inspect(db.engine).get_columns('users')}
        if 'google_sub' not in user_columns:
            db.session.execute(text("ALTER TABLE users ADD COLUMN google_sub VARCHAR(255)"))
            db.session.execute(text("CREATE UNIQUE INDEX IF NOT EXISTS ix_users_google_sub ON users (google_sub)"))
        db.session.commit()

    # =====================================================
    # RETURN FLASK APP
    # =====================================================

    return flask_app