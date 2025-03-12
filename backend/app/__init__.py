from flask import Flask, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager
from flask_cors import CORS
from flask_jwt_extended import JWTManager
import os

from config import config

# Initialize extensions
db = SQLAlchemy()
login_manager = LoginManager()
jwt = JWTManager()

def create_app(config_name='default'):
    """Create and configure the Flask application."""
    app = Flask(__name__, instance_relative_config=True)
    app.config.from_object(config[config_name])
    
    # Ensure instance folder exists
    os.makedirs(app.instance_path, exist_ok=True)
    
    # Initialize extensions with app
    db.init_app(app)
    login_manager.init_app(app)
    jwt.init_app(app)
    
    # Register JWT error handlers
    @jwt.expired_token_loader
    def expired_token_callback(jwt_header, jwt_payload):
        return jsonify({"error": "Token has expired", "message": "Please log in again"}), 401

    @jwt.invalid_token_loader
    def invalid_token_callback(error_message):
        return jsonify({"error": "Invalid token", "message": error_message}), 401

    @jwt.unauthorized_loader
    def unauthorized_callback(error_message):
        return jsonify({"error": "Missing token", "message": error_message}), 401
    
    # Configure CORS to allow requests from frontend
    CORS(app, resources={r"/api/*": {"origins": "*", "supports_credentials": True}})
    
    # Import and register blueprints
    from app.routes.auth import auth_bp
    from app.routes.books import books_bp
    from app.routes.search import search_bp
    
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(books_bp, url_prefix='/api/books')
    app.register_blueprint(search_bp, url_prefix='/api/search')
    
    # Create database tables
    with app.app_context():
        db.create_all()
        print("Database tables created at:", app.instance_path)
    
    return app