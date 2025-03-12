// frontend/src/pages/SearchPage.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Container, Typography, Box, Paper, Button, Alert } from '@mui/material';
import SearchBar from '../components/Search/SearchBar';
import SearchResults from '../components/Search/SearchResults';
import axios from 'axios';

interface Book {
  id: number;
  title: string;
  author: string | null;
  description: string;
  fileType?: string;
  relevance?: number;
}

interface LocationState {
  query?: string;
}

const SearchPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as LocationState | null;
  const initialQuery = state?.query || '';

  const [searchResults, setSearchResults] = useState<Book[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [scanningLibrary, setScanningLibrary] = useState(false);
  const [scanMessage, setScanMessage] = useState<string | null>(null);
  const [currentQuery, setCurrentQuery] = useState<string>('');

  // If there's an initial query from location state, perform search automatically
  useEffect(() => {
    if (initialQuery) {
      handleSearch(initialQuery);
    }
  }, [initialQuery]);

  // Mock data for testing when API is not available
  const mockBooks = useMemo(() => [
    {
      id: 1,
      title: "The Great Gatsby",
      author: "F. Scott Fitzgerald",
      description: "A novel about the American Dream in the 1920s",
      fileType: "pdf",
      uploadDate: "2023-01-15",
      fileSize: "2.4 MB"
    },
    {
      id: 2,
      title: "To Kill a Mockingbird",
      author: "Harper Lee",
      description: "A story about racial injustice in the American South",
      fileType: "epub",
      uploadDate: "2023-02-20",
      fileSize: "1.8 MB"
    },
    {
      id: 3,
      title: "1984",
      author: "George Orwell",
      description: "A dystopian novel about totalitarianism",
      fileType: "pdf",
      uploadDate: "2023-03-10",
      fileSize: "3.1 MB"
    }
  ], []);

  const handleScanLibrary = async () => {
    setScanningLibrary(true);
    setScanMessage(null);
    setError(null);
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found. Please log in again.');
      }

      console.log('Scanning library...');
      const response = await axios.post('/api/books/scan', {}, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Library scan response:', response.data);
      setScanMessage(`Successfully indexed ${response.data.count} books.`);
    } catch (err: any) {
      console.error('Error scanning library:', err);
      
      // Display error message but don't log out
      if (err.response?.status === 422) {
        setScanMessage('Error scanning library: Token validation failed. Try logging out and back in.');
      } else {
        const errorMessage = err.response?.data?.error || err.message;
        setScanMessage(`Error scanning library: ${errorMessage}`);
      }
      setError('Failed to scan library. See details below.');
    } finally {
      setScanningLibrary(false);
    }
  };

  const handleSearch = async (query: string) => {
    if (!query.trim()) {
      setError('Please enter a search term');
      return;
    }

    setLoading(true);
    setError(null);
    setHasSearched(true);
    setCurrentQuery(query);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found. Please log in again.');
      }

      console.log('Searching for:', query);
      const response = await axios.post('/api/search/', 
        { query: query.trim() },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('Search response:', response.data);
      
      // Transform API response to match our expected format
      const transformedResults = response.data.results.map((result: any) => ({
        id: result.book.id,
        title: result.book.title || 'Untitled',
        author: result.book.author || 'Unknown Author',
        description: result.context || 'No description available',
        fileType: result.book.file_format,
        relevance: result.relevance,
      }));
      
      setSearchResults(transformedResults);
    } catch (err: any) {
      console.error('Error during search:', err);
      
      // Handle errors without logging out
      if (err.response?.status === 422) {
        setError('Search failed: Token validation failed. Try logging out and back in.');
        // Use mock data for demo purposes
        const filteredMockBooks = mockBooks.filter(book => 
          book.title.toLowerCase().includes(query.toLowerCase()) ||
          book.author.toLowerCase().includes(query.toLowerCase()) ||
          book.description.toLowerCase().includes(query.toLowerCase())
        );
        setSearchResults(filteredMockBooks);
      } else {
        const errorMessage = err.response?.data?.error || err.message;
        setError(`Search failed: ${errorMessage}`);
        setSearchResults([]);
      }
    } finally {
      setLoading(false);
    }
  };

  // Pass the navigation state to children components
  const handleViewBook = (bookId: number) => {
    navigate(`/books/${bookId}`, { state: { fromSearch: true } });
  };

  // Update the SearchResults component to use this handler
  const searchResultsWithNavigation = {
    ...searchResults,
    onViewBook: handleViewBook
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4 }}>
        <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom align="center">
            Search E-Books
          </Typography>
          <Typography variant="subtitle1" align="center" color="textSecondary" paragraph>
            Search for books by title, author, or content
          </Typography>
          <SearchBar onSearch={handleSearch} initialQuery={initialQuery} />
          
          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
            <Button 
              variant="outlined" 
              color="primary" 
              onClick={handleScanLibrary}
              disabled={scanningLibrary}
              sx={{ mx: 1 }}
            >
              {scanningLibrary ? 'Scanning...' : 'Scan Library'}
            </Button>
            <Button
              variant="outlined"
              color="secondary"
              onClick={() => navigate('/history')}
              sx={{ mx: 1 }}
            >
              View Search History
            </Button>
          </Box>
          
          {scanMessage && (
            <Box sx={{ mt: 2, p: 2, bgcolor: scanMessage.includes('Error') ? '#ffebee' : '#e8f5e9', borderRadius: 1 }}>
              <Typography variant="body2" color="textSecondary">
                {scanMessage}
              </Typography>
            </Box>
          )}
          
          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}

          {hasSearched && currentQuery && (
            <Alert severity="info" sx={{ mt: 2 }}>
              Search results for: "{currentQuery}"
            </Alert>
          )}
        </Paper>

        {hasSearched && (
          <SearchResults 
            results={searchResults} 
            loading={loading} 
            error={error} 
          />
        )}
      </Box>
    </Container>
  );
};

export default SearchPage;