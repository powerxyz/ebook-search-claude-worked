import os
from datetime import datetime
from flask import Blueprint, jsonify, request, send_file, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity

from app import db
from app.models.book import Book
from app.utils.library_scanner import LibraryScanner

books_bp = Blueprint('books', __name__)

@books_bp.route('/scan', methods=['POST'])
@jwt_required()
def scan_library():
    """Scan the library directory and index all ebooks."""
    try:
        # Get user identity from JWT (it will be a string)
        user_id = get_jwt_identity()
        print(f"User ID from token: {user_id}, type: {type(user_id)}")
        
        if not user_id:
            return jsonify({'error': 'Invalid authentication token'}), 401
            
        library_path = current_app.config['LIBRARY_PATH']
        supported_formats = current_app.config['SUPPORTED_FORMATS']
        
        # Make sure the library directory exists
        if not os.path.exists(library_path):
            os.makedirs(library_path, exist_ok=True)
            print(f"Created library directory: {library_path}")
        
        scanner = LibraryScanner(library_path, supported_formats)
        books = scanner.scan_library()
        
        return jsonify({
            'message': f'Indexed {len(books)} books',
            'count': len(books)
        }), 200
    except Exception as e:
        print(f"Error scanning library: {str(e)}")
        return jsonify({'error': str(e)}), 500


@books_bp.route('/', methods=['GET'])
@jwt_required()
def get_books():
    """Get all books or filter by format."""
    try:
        format_filter = request.args.get('format')
        
        if format_filter:
            books = Book.query.filter_by(file_format=format_filter).all()
        else:
            books = Book.query.all()
        
        return jsonify({
            'books': [book.to_dict() for book in books],
            'count': len(books)
        }), 200
    except Exception as e:
        print(f"Error getting books: {str(e)}")
        return jsonify({'error': str(e)}), 500


@books_bp.route('/<int:book_id>', methods=['GET'])
@jwt_required()
def get_book(book_id):
    """Get a specific book by ID."""
    try:
        book = Book.query.get(book_id)
        
        if not book:
            return jsonify({'error': 'Book not found'}), 404
        
        return jsonify({'book': book.to_dict()}), 200
    except Exception as e:
        print(f"Error getting book: {str(e)}")
        return jsonify({'error': str(e)}), 500


@books_bp.route('/<int:book_id>/file', methods=['GET'])
@jwt_required()
def get_book_file(book_id):
    """Get the file for a specific book."""
    try:
        book = Book.query.get(book_id)
        
        if not book:
            return jsonify({'error': 'Book not found'}), 404
        
        if not os.path.exists(book.file_path):
            return jsonify({'error': 'Book file not found'}), 404
        
        # Update last accessed time
        book.last_accessed = datetime.utcnow()
        db.session.commit()
        
        # Determine MIME type based on file format
        mime_types = {
            'pdf': 'application/pdf',
            'epub': 'application/epub+zip',
            'azw3': 'application/x-mobi8-ebook'
        }
        
        mime_type = mime_types.get(book.file_format, 'application/octet-stream')
        
        return send_file(
            book.file_path,
            mimetype=mime_type,
            as_attachment=False,
            download_name=os.path.basename(book.file_path)
        )
    except Exception as e:
        print(f"Error getting book file: {str(e)}")
        return jsonify({'error': str(e)}), 500


@books_bp.route('/formats', methods=['GET'])
@jwt_required()
def get_formats():
    """Get all available book formats."""
    try:
        formats = db.session.query(Book.file_format).distinct().all()
        formats = [format[0] for format in formats]
        
        return jsonify({
            'formats': formats,
            'count': len(formats)
        }), 200
    except Exception as e:
        print(f"Error getting formats: {str(e)}")
        return jsonify({'error': str(e)}), 500