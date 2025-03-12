import os
import re
import logging
import time
from pathlib import Path
import PyPDF2
import ebooklib
from ebooklib import epub
from pdfminer.high_level import extract_text as pdfminer_extract_text
import threading
import signal
from functools import wraps

# Set pdfminer logging to WARNING level to reduce verbosity
logging.getLogger('pdfminer').setLevel(logging.WARNING)

logger = logging.getLogger(__name__)

# Define a timeout exception
class TimeoutError(Exception):
    pass

# Timeout decorator for functions that may take too long
def timeout(seconds=30):
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            result = [TimeoutError('Function timed out after {} seconds'.format(seconds))]
            
            def target():
                try:
                    result[0] = func(*args, **kwargs)
                except Exception as e:
                    result[0] = e
            
            thread = threading.Thread(target=target)
            thread.daemon = True
            thread.start()
            thread.join(seconds)
            
            if isinstance(result[0], Exception):
                raise result[0]
            return result[0]
        return wrapper
    return decorator

class EbookProcessor:
    """Utility class for processing ebooks."""
    
    MAX_PDF_PAGES = 50  # Limit for initial indexing to prevent extremely large PDFs from hanging
    
    @staticmethod
    def get_metadata_from_file(file_path):
        """Extract metadata from an ebook file."""
        file_ext = Path(file_path).suffix.lower().lstrip('.')
        file_size = os.path.getsize(file_path)
        
        metadata = {
            'file_path': file_path,
            'file_format': file_ext,
            'file_size': file_size,
            'title': Path(file_path).stem,  # Default to filename if no title found
            'author': None
        }
        
        try:
            if file_ext == 'pdf':
                pdf_metadata = EbookProcessor._extract_pdf_metadata(file_path)
                metadata.update(pdf_metadata)
            elif file_ext == 'epub':
                epub_metadata = EbookProcessor._extract_epub_metadata(file_path)
                metadata.update(epub_metadata)
            # Add support for azw3 if needed
        except Exception as e:
            logger.error(f"Error extracting metadata from {file_path}: {str(e)}")
        
        return metadata
    
    @staticmethod
    @timeout(60)  # Set a 60-second timeout for text extraction
    def extract_text_from_file(file_path):
        """Extract text content from an ebook file."""
        file_ext = Path(file_path).suffix.lower().lstrip('.')
        
        try:
            if file_ext == 'pdf':
                return EbookProcessor._extract_text_from_pdf(file_path)
            elif file_ext == 'epub':
                return EbookProcessor._extract_text_from_epub(file_path)
            # Add support for azw3 if needed
        except TimeoutError:
            logger.error(f"Timeout extracting text from {file_path}")
            return f"[Timeout extracting text from {os.path.basename(file_path)}]"
        except Exception as e:
            logger.error(f"Error extracting text from {file_path}: {str(e)}")
            return ""
    
    @staticmethod
    def _extract_pdf_metadata(file_path):
        """Extract metadata from a PDF file."""
        metadata = {}
        
        try:
            with open(file_path, 'rb') as file:
                reader = PyPDF2.PdfReader(file)
                info = reader.metadata
                
                if info:
                    if info.title:
                        metadata['title'] = info.title
                    if info.author:
                        metadata['author'] = info.author
        except Exception as e:
            logger.error(f"Error extracting PDF metadata from {file_path}: {str(e)}")
        
        return metadata
    
    @staticmethod
    def _extract_epub_metadata(file_path):
        """Extract metadata from an EPUB file."""
        metadata = {}
        
        try:
            book = epub.read_epub(file_path)
            
            # Get title
            title = book.get_metadata('DC', 'title')
            if title:
                metadata['title'] = title[0][0]
            
            # Get author
            creator = book.get_metadata('DC', 'creator')
            if creator:
                metadata['author'] = creator[0][0]
        except Exception as e:
            logger.error(f"Error extracting EPUB metadata from {file_path}: {str(e)}")
        
        return metadata
    
    @staticmethod
    def _extract_text_from_pdf(file_path):
        """Extract text content from a PDF file."""
        try:
            # First, get page count to check if it's too large
            with open(file_path, 'rb') as file:
                reader = PyPDF2.PdfReader(file)
                num_pages = len(reader.pages)
                
                # If the PDF has too many pages, only extract from a subset
                if num_pages > EbookProcessor.MAX_PDF_PAGES:
                    logger.warning(f"PDF {file_path} has {num_pages} pages, extracting only first {EbookProcessor.MAX_PDF_PAGES} pages")
                    text = ""
                    for page_num in range(min(EbookProcessor.MAX_PDF_PAGES, num_pages)):
                        try:
                            text += reader.pages[page_num].extract_text() + "\n"
                        except Exception as e:
                            logger.error(f"Error extracting text from page {page_num} of {file_path}: {str(e)}")
                    return text
                
                # For smaller PDFs, use pdfminer for better quality extraction
                if num_pages <= EbookProcessor.MAX_PDF_PAGES:
                    return pdfminer_extract_text(file_path)
        except Exception as e:
            logger.error(f"Error extracting text from PDF {file_path}: {str(e)}")
            
            # Fallback to PyPDF2 if pdfminer fails
            try:
                text = ""
                with open(file_path, 'rb') as file:
                    reader = PyPDF2.PdfReader(file)
                    # Limit to MAX_PDF_PAGES to prevent hanging
                    for page_num in range(min(EbookProcessor.MAX_PDF_PAGES, len(reader.pages))):
                        try:
                            text += reader.pages[page_num].extract_text() + "\n"
                        except:
                            pass  # Skip pages that cause errors
                return text
            except Exception as e2:
                logger.error(f"Fallback extraction failed for PDF {file_path}: {str(e2)}")
                return ""
    
    @staticmethod
    def _extract_text_from_epub(file_path):
        """Extract text content from an EPUB file."""
        try:
            book = epub.read_epub(file_path)
            text = ""
            
            for item in book.get_items():
                if item.get_type() == ebooklib.ITEM_DOCUMENT:
                    try:
                        content = item.get_content().decode('utf-8')
                        # Remove HTML tags
                        text += re.sub('<[^<]+?>', ' ', content) + "\n"
                    except:
                        pass  # Skip items that cause errors
            
            return text
        except Exception as e:
            logger.error(f"Error extracting text from EPUB {file_path}: {str(e)}")
            return ""