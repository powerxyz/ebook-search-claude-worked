from datetime import datetime
from app import db

class Search(db.Model):
    """Search model for tracking user search history."""
    __tablename__ = 'searches'
    
    id = db.Column(db.Integer, primary_key=True)
    query = db.Column(db.String(255), nullable=False, index=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    results = db.relationship('SearchResult', backref='search', lazy='dynamic', cascade='all, delete-orphan')
    
    def to_dict(self):
        """Convert search to dictionary."""
        return {
            'id': self.id,
            'query': self.query,
            'user_id': self.user_id,
            'timestamp': self.timestamp.isoformat() if self.timestamp else None,
            'result_count': self.results.count()
        }
    
    def __repr__(self):
        return f'<Search {self.query}>'


class SearchResult(db.Model):
    """SearchResult model for storing search results."""
    __tablename__ = 'search_results'
    
    id = db.Column(db.Integer, primary_key=True)
    search_id = db.Column(db.Integer, db.ForeignKey('searches.id'), nullable=False)
    book_id = db.Column(db.Integer, db.ForeignKey('books.id'), nullable=False)
    relevance_score = db.Column(db.Float, nullable=True)
    match_context = db.Column(db.Text, nullable=True)  # Snippet of text where match was found
    
    def to_dict(self):
        """Convert search result to dictionary."""
        return {
            'id': self.id,
            'search_id': self.search_id,
            'book_id': self.book_id,
            'relevance_score': self.relevance_score,
            'match_context': self.match_context
        }
    
    def __repr__(self):
        return f'<SearchResult {self.id}>' 