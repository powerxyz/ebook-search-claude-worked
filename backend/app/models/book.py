from datetime import datetime
from app import db

class Book(db.Model):
    """Book model for storing ebook metadata."""
    __tablename__ = 'books'
    
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(500), nullable=False, index=True)  # Increased from 255 to 500
    author = db.Column(db.String(255), nullable=True, index=True)
    file_path = db.Column(db.String(512), nullable=False, unique=True)
    file_format = db.Column(db.String(10), nullable=False, index=True)
    file_size = db.Column(db.Integer, nullable=True)  # Size in bytes
    indexed_at = db.Column(db.DateTime, default=datetime.utcnow)
    last_accessed = db.Column(db.DateTime, nullable=True)
    
    # Relationships
    search_results = db.relationship('SearchResult', backref='book', lazy='dynamic', cascade='all, delete-orphan')
    
    def to_dict(self):
        """Convert book to dictionary."""
        return {
            'id': self.id,
            'title': self.title,
            'author': self.author,
            'file_path': self.file_path,
            'file_format': self.file_format,
            'file_size': self.file_size,
            'indexed_at': self.indexed_at.isoformat() if self.indexed_at else None,
            'last_accessed': self.last_accessed.isoformat() if self.last_accessed else None
        }
    
    def __repr__(self):
        return f'<Book {self.title}>'