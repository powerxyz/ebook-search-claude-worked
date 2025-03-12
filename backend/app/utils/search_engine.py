import re
import logging
import nltk
from nltk.tokenize import word_tokenize
from nltk.corpus import stopwords
import concurrent.futures
import os
from app.utils.ebook_processor import EbookProcessor, TimeoutError
from app.models.book import Book
from app.models.search import Search, SearchResult
from app import db

logger = logging.getLogger(__name__)

# Set nltk logging to WARNING level
logging.getLogger('nltk').setLevel(logging.WARNING)

# Download NLTK resources if not already downloaded
try:
    nltk.data.find('tokenizers/punkt')
except LookupError:
    nltk.download('punkt', quiet=True)

try:
    nltk.data.find('corpora/stopwords')
except LookupError:
    nltk.download('stopwords', quiet=True)

class SearchEngine:
    """Utility class for searching ebooks."""
    
    def __init__(self):
        self.stop_words = set(stopwords.words('english'))
        # Create a text cache to avoid re-extracting text from the same book
        self.text_cache = {}
        # Maximum number of books to search in parallel
        self.max_workers = min(os.cpu_count() or 4, 4)  # Limit to avoid resource exhaustion
    
    def search(self, query, user_id, max_results=50):
        """Search for books matching the query and save search history."""
        logger.info(f"Searching for '{query}' for user {user_id}")
        
        # Create search record
        search = Search(query=query, user_id=user_id)
        db.session.add(search)
        db.session.flush()  # Get search ID without committing
        
        # Get all books
        books = Book.query.all()
        logger.info(f"Found {len(books)} books to search in")
        
        results = []
        
        # Use ThreadPoolExecutor to search books in parallel
        with concurrent.futures.ThreadPoolExecutor(max_workers=self.max_workers) as executor:
            future_to_book = {
                executor.submit(self._search_book, book, query): book 
                for book in books
            }
            
            for future in concurrent.futures.as_completed(future_to_book):
                book = future_to_book[future]
                try:
                    result = future.result()
                    if result:
                        relevance, context = result
                        # Create search result
                        result = SearchResult(
                            search_id=search.id,
                            book_id=book.id,
                            relevance_score=relevance,
                            match_context=context
                        )
                        
                        db.session.add(result)
                        results.append((book, relevance, context))
                except Exception as e:
                    logger.error(f"Error searching book {book.title}: {str(e)}")
        
        # Sort results by relevance
        results.sort(key=lambda x: x[1], reverse=True)
        
        # Limit results
        results = results[:max_results]
        
        # Commit changes to database
        try:
            db.session.commit()
            logger.info(f"Found {len(results)} results for query '{query}'")
        except Exception as e:
            db.session.rollback()
            logger.error(f"Error saving search results: {str(e)}")
        
        return search, results
    
    def _search_book(self, book, query):
        """Search for a query in a book."""
        try:
            # Extract text from book if not already cached
            if book.id not in self.text_cache:
                try:
                    text = EbookProcessor.extract_text_from_file(book.file_path)
                    # If text is too long, truncate it to avoid memory issues
                    if len(text) > 1_000_000:  # ~1MB of text
                        logger.warning(f"Truncating text from {book.title} to avoid memory issues")
                        text = text[:1_000_000]
                    self.text_cache[book.id] = text
                except TimeoutError:
                    logger.error(f"Timeout extracting text from {book.file_path}")
                    return None
                except Exception as e:
                    logger.error(f"Error extracting text from {book.file_path}: {str(e)}")
                    return None
            else:
                text = self.text_cache[book.id]
            
            # If no text was extracted, skip this book
            if not text:
                return None
                
            # Simple search for query in text
            if self._search_text(query, text):
                # Calculate relevance score and context
                relevance, context = self._calculate_relevance(query, text)
                return relevance, context
            
            return None
        except Exception as e:
            logger.error(f"Error searching book {book.title}: {str(e)}")
            return None
    
    def get_search_history(self, user_id, limit=10):
        """Get search history for a user."""
        # Fixed query using proper SQLAlchemy model access
        try:
            searches = db.session.query(Search).filter(Search.user_id == user_id).order_by(Search.timestamp.desc()).limit(limit).all()
            return searches
        except Exception as e:
            logger.error(f"Error retrieving search history: {str(e)}")
            return []
    
    def get_search_results(self, search_id):
        """Get results for a specific search."""
        search = Search.query.get(search_id)
        if not search:
            return None, []
        
        results = []
        for result in search.results.order_by(SearchResult.relevance_score.desc()).all():
            book = Book.query.get(result.book_id)
            results.append((book, result.relevance_score, result.match_context))
        
        return search, results
    
    def _search_text(self, query, text):
        """Check if query exists in text."""
        if not text:
            return False
        
        # Simple case-insensitive search
        return query.lower() in text.lower()
    
    def _calculate_relevance(self, query, text, context_size=100):
        """Calculate relevance score and extract context."""
        if not text:
            return 0.0, ""
        
        # Convert to lowercase
        query_lower = query.lower()
        text_lower = text.lower()
        
        # Count occurrences
        count = text_lower.count(query_lower)
        
        # Extract context (text around the first match)
        match_index = text_lower.find(query_lower)
        if match_index >= 0:
            start = max(0, match_index - context_size // 2)
            end = min(len(text), match_index + len(query) + context_size // 2)
            context = text[start:end].strip()
            
            # Highlight the match
            match_start = max(0, match_index - start)
            match_end = match_start + len(query)
            context = context[:match_start] + "**" + context[match_start:match_end] + "**" + context[match_end:]
        else:
            context = ""
        
        # Calculate relevance score (simple version)
        # More sophisticated scoring could be implemented
        relevance = count / max(1, len(text.split()))
        
        return relevance, context