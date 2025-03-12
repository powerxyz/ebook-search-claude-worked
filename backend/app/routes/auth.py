from datetime import datetime
from flask import Blueprint, request, jsonify
from flask_login import login_user, logout_user, login_required, current_user
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity

from app import db
from app.models.user import User

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/register', methods=['POST'])
def register():
    """Register a new user."""
    data = request.get_json()
    
    # Validate input
    if not data or not data.get('username') or not data.get('email') or not data.get('password'):
        return jsonify({'error': 'Missing required fields'}), 400
    
    # Check if username or email already exists
    if User.query.filter_by(username=data['username']).first():
        return jsonify({'error': 'Username already exists'}), 409
    
    if User.query.filter_by(email=data['email']).first():
        return jsonify({'error': 'Email already exists'}), 409
    
    try:
        # Create new user
        user = User(
            username=data['username'],
            email=data['email']
        )
        user.password = data['password']  # This will hash the password
        
        # Add user to database
        db.session.add(user)
        db.session.commit()
        
        # Generate access token with user ID as a string
        access_token = create_access_token(identity=str(user.id))
        
        print(f"User registered successfully: {user.username}, ID: {user.id}")
        
        return jsonify({
            'message': 'User registered successfully',
            'user': user.to_dict(),
            'access_token': access_token
        }), 201
    except Exception as e:
        db.session.rollback()
        print(f"Error during registration: {str(e)}")
        return jsonify({'error': str(e)}), 500


@auth_bp.route('/login', methods=['POST'])
def login():
    """Log in a user."""
    data = request.get_json()
    
    # Validate input
    if not data or not data.get('username') or not data.get('password'):
        return jsonify({'error': 'Missing username or password'}), 400
    
    try:
        # Find user by username
        user = User.query.filter_by(username=data['username']).first()
        
        # Check if user exists and password is correct
        if not user or not user.verify_password(data['password']):
            return jsonify({'error': 'Invalid username or password'}), 401
        
        # Update last login time
        user.last_login = datetime.utcnow()
        db.session.commit()
        
        # Log in user
        login_user(user)
        
        # Generate access token with user ID as a string
        access_token = create_access_token(identity=str(user.id))
        
        print(f"User logged in successfully: {user.username}, ID: {user.id}")
        
        return jsonify({
            'message': 'Login successful',
            'user': user.to_dict(),
            'access_token': access_token
        }), 200
    except Exception as e:
        print(f"Error during login: {str(e)}")
        return jsonify({'error': str(e)}), 500


@auth_bp.route('/logout', methods=['POST'])
@login_required
def logout():
    """Log out a user."""
    logout_user()
    return jsonify({'message': 'Logout successful'}), 200


@auth_bp.route('/profile', methods=['GET'])
@jwt_required()
def profile():
    """Get user profile."""
    try:
        # JWT identity is a string, convert to int
        user_id = get_jwt_identity()
        if not user_id:
            return jsonify({'error': 'Invalid authentication token'}), 401
            
        user = User.query.get(int(user_id))
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        return jsonify({'user': user.to_dict()}), 200
    except Exception as e:
        print(f"Error getting profile: {str(e)}")
        return jsonify({'error': str(e)}), 500


@auth_bp.route('/profile', methods=['PUT'])
@jwt_required()
def update_profile():
    """Update user profile."""
    try:
        # JWT identity is a string, convert to int
        user_id = get_jwt_identity()
        if not user_id:
            return jsonify({'error': 'Invalid authentication token'}), 401
            
        user = User.query.get(int(user_id))
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        data = request.get_json()
        
        # Update email if provided
        if data.get('email'):
            # Check if email already exists
            existing_user = User.query.filter_by(email=data['email']).first()
            if existing_user and existing_user.id != user.id:
                return jsonify({'error': 'Email already exists'}), 409
            
            user.email = data['email']
        
        # Update password if provided
        if data.get('password'):
            user.password = data['password']
        
        db.session.commit()
        
        return jsonify({
            'message': 'Profile updated successfully',
            'user': user.to_dict()
        }), 200
    except Exception as e:
        db.session.rollback()
        print(f"Error updating profile: {str(e)}")
        return jsonify({'error': str(e)}), 500