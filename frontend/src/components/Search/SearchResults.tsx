// frontend/src/components/Search/SearchResults.tsx
import React from 'react';
import { Grid, Typography, Box, CircularProgress } from '@mui/material';
import BookCard from '../Books/BookCard';
import { useNavigate } from 'react-router-dom';

interface Book {
  id: number;
  title: string;
  author: string | null;
  description: string;
  fileType?: string;
  relevance?: number;
}

interface SearchResultsProps {
  results: Book[];
  loading: boolean;
  error: string | null;
}

const SearchResults: React.FC<SearchResultsProps> = ({ results, loading, error }) => {
  const navigate = useNavigate();

  const handleViewBook = (bookId: number) => {
    // Navigate to book details with a state indicating we came from search results
    navigate(`/books/${bookId}`, { state: { fromSearch: true } });
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ mt: 4 }}>
        <Typography color="error" align="center">
          {error}
        </Typography>
      </Box>
    );
  }

  if (results.length === 0) {
    return (
      <Box sx={{ mt: 4 }}>
        <Typography align="center" color="textSecondary">
          No books found. Try a different search term.
        </Typography>
      </Box>
    );
  }

  return (
    <Grid container spacing={3} sx={{ mt: 2 }}>
      {results.map((book) => (
        <Grid item xs={12} sm={6} md={4} key={book.id}>
          <BookCard
            id={book.id}
            title={book.title || 'Untitled'}
            author={book.author || 'Unknown Author'}
            description={book.description || 'No description available'}
            fileType={book.fileType}
            relevance={book.relevance}
          />
        </Grid>
      ))}
    </Grid>
  );
};

export default SearchResults;