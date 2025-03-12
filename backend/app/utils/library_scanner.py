import os
import logging
from pathlib import Path
from app.utils.ebook_processor import EbookProcessor
from app.models.book import Book
from app import db

logger = logging.getLogger(__name__)

class LibraryScanner:
    """Utility class for scanning the library directory and indexing ebooks."""
    
    def __init__(self, library_path, supported_formats=None):
        self.library_path = library_path
        self.supported_formats = supported_formats or ['pdf', 'epub', 'azw3']
    
    def scan_library(self):
        """Scan the library directory and index all ebooks."""
        logger.info(f"Starting library scan at {self.library_path}")
        
        if not os.path.exists(self.library_path):
            logger.error(f"Library path does not exist: {self.library_path}")
            return []
        
        indexed_books = []
        
        for root, _, files in os.walk(self.library_path):
            for file in files:
                file_path = os.path.join(root, file)
                file_ext = Path(file_path).suffix.lower().lstrip('.')
                
                if file_ext in self.supported_formats:
                    try:
                        # Check if book already exists in database
                        existing_book = Book.query.filter_by(file_path=file_path).first()
                        
                        if existing_book:
                            logger.debug(f"Book already indexed: {file_path}")
                            indexed_books.append(existing_book)
                            continue
                        
                        # Extract metadata
                        metadata = EbookProcessor.get_metadata_from_file(file_path)
                        
                        # Create new book record
                        book = Book(
                            title=metadata.get('title', Path(file_path).stem),
                            author=metadata.get('author'),
                            file_path=file_path,
                            file_format=file_ext,
                            file_size=metadata.get('file_size')
                        )
                        
                        db.session.add(book)
                        indexed_books.append(book)
                        logger.info(f"Indexed book: {book.title}")
                    except Exception as e:
                        logger.error(f"Error indexing book {file_path}: {str(e)}")
        
        # Commit all changes to database
        try:
            db.session.commit()
            logger.info(f"Indexed {len(indexed_books)} books")
        except Exception as e:
            db.session.rollback()
            logger.error(f"Error committing indexed books to database: {str(e)}")
        
        return indexed_books
    
    def get_book_by_path(self, file_path):
        """Get a book by its file path."""
        return Book.query.filter_by(file_path=file_path).first()
    
    def get_books_by_format(self, file_format):
        """Get all books of a specific format."""
        return Book.query.filter_by(file_format=file_format).all()
    
    def get_all_books(self):
        """Get all indexed books."""
        return Book.query.all() 