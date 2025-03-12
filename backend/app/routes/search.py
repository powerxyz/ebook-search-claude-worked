from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity

from app import db
from app.models.search import Search
from app.utils.search_engine import SearchEngine

search_bp = Blueprint('search', __name__)

@search_bp.route('/', methods=['POST'])
@jwt_required()
def search():
    """Search for books matching a query."""
    try:
        data = request.get_json()
        
        if not data or not data.get('query'):
            return jsonify({'error': 'Missing query parameter'}), 400
        
        # Get user identity from JWT (it will be a string)
        user_id = get_jwt_identity()
        print(f"User ID from token: {user_id}, type: {type(user_id)}")
        
        if not user_id:
            return jsonify({'error': 'Invalid authentication token'}), 401
            
        query = data['query']
        max_results = data.get('max_results', 50)
        
        search_engine = SearchEngine()
        search, results = search_engine.search(query, int(user_id), max_results)
        
        return jsonify({
            'search_id': search.id,
            'query': search.query,
            'timestamp': search.timestamp.isoformat(),
            'results': [
                {
                    'book': book.to_dict(),
                    'relevance': relevance,
                    'context': context
                }
                for book, relevance, context in results
            ],
            'count': len(results)
        }), 200
    except Exception as e:
        print(f"Error during search: {str(e)}")
        return jsonify({'error': str(e)}), 500


@search_bp.route('/history', methods=['GET'])
@jwt_required()
def get_search_history():
    """Get search history for the current user."""
    try:
        # Get user identity from JWT (it will be a string)
        user_id = get_jwt_identity()
        print(f"User ID from token for history: {user_id}, type: {type(user_id)}")
        
        if not user_id:
            return jsonify({'error': 'Invalid authentication token'}), 401
            
        limit = request.args.get('limit', 10, type=int)
        
        search_engine = SearchEngine()
        searches = search_engine.get_search_history(int(user_id), limit)
        
        return jsonify({
            'searches': [search.to_dict() for search in searches],
            'count': len(searches)
        }), 200
    except Exception as e:
        print(f"Error getting search history: {str(e)}")
        return jsonify({'error': str(e)}), 500


@search_bp.route('/history/<int:search_id>', methods=['GET'])
@jwt_required()
def get_search_results(search_id):
    """Get results for a specific search."""
    try:
        # Get user identity from JWT (it will be a string)
        user_id = get_jwt_identity()
        if not user_id:
            return jsonify({'error': 'Invalid authentication token'}), 401
        
        # Check if search belongs to user
        search = Search.query.get(search_id)
        if not search or search.user_id != int(user_id):
            return jsonify({'error': 'Search not found'}), 404
        
        search_engine = SearchEngine()
        search, results = search_engine.get_search_results(search_id)
        
        return jsonify({
            'search_id': search.id,
            'query': search.query,
            'timestamp': search.timestamp.isoformat(),
            'results': [
                {
                    'book': book.to_dict(),
                    'relevance': relevance,
                    'context': context
                }
                for book, relevance, context in results
            ],
            'count': len(results)
        }), 200
    except Exception as e:
        print(f"Error getting search results: {str(e)}")
        return jsonify({'error': str(e)}), 500


@search_bp.route('/history/<int:search_id>', methods=['DELETE'])
@jwt_required()
def delete_search(search_id):
    """Delete a specific search from history."""
    try:
        # Get user identity from JWT (it will be a string)
        user_id = get_jwt_identity()
        if not user_id:
            return jsonify({'error': 'Invalid authentication token'}), 401
        
        # Check if search belongs to user
        search = Search.query.get(search_id)
        if not search or search.user_id != int(user_id):
            return jsonify({'error': 'Search not found'}), 404
        
        # Delete search and its results
        db.session.delete(search)
        db.session.commit()
        
        return jsonify({'message': 'Search deleted successfully'}), 200
    except Exception as e:
        db.session.rollback()
        print(f"Error deleting search: {str(e)}")
        return jsonify({'error': str(e)}), 500