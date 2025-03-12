// frontend/src/pages/SearchHistoryPage.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Divider,
  Button,
  CircularProgress,
  Alert,
  Chip,
  Grid,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Tooltip
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import DeleteIcon from '@mui/icons-material/Delete';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import axios from 'axios';
import BookCard from '../components/Books/BookCard';

interface SearchHistoryItem {
  id: number;
  query: string;
  timestamp: string;
  result_count: number;
}

interface SearchResult {
  book: {
    id: number;
    title: string;
    author: string | null;
    file_path: string;
    file_format: string;
    file_size: number | null;
    indexed_at: string | null;
    last_accessed: string | null;
  };
  relevance: number;
  context: string;
}

interface SearchDetail {
  search_id: number;
  query: string;
  timestamp: string;
  results: SearchResult[];
  count: number;
}

const SearchHistoryPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchHistory, setSearchHistory] = useState<SearchHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Use a list instead of a single expandedSearch to allow multiple expansions
  const [expandedSearches, setExpandedSearches] = useState<number[]>([]);
  const [searchDetails, setSearchDetails] = useState<{[key: number]: SearchDetail}>({});
  const [loadingDetails, setLoadingDetails] = useState<{[key: number]: boolean}>({});

  const fetchSearchHistory = async () => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found. Please log in again.');
      }

      const response = await axios.get('/api/search/history', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      console.log('Search history response:', response.data);
      setSearchHistory(response.data.searches || []);
      
      // Auto-load the first search results if any exist
      if (response.data.searches && response.data.searches.length > 0) {
        const firstSearchId = response.data.searches[0].id;
        setExpandedSearches([firstSearchId]);
        fetchSearchDetails(firstSearchId);
      }
    } catch (err: any) {
      console.error('Error fetching search history:', err);
      
      if (err.response?.status === 422) {
        setError('Failed to load search history: Token validation failed. Try logging out and back in.');
      } else {
        const errorMessage = err.response?.data?.error || err.message;
        setError(`Failed to load search history: ${errorMessage}`);
      }
      
      setSearchHistory([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSearchHistory();
  }, []);

  const handleDeleteSearch = async (id: number) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found. Please log in again.');
      }

      await axios.delete(`/api/search/history/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      // Remove the deleted search from the list
      setSearchHistory(prevHistory => 
        prevHistory.filter(item => item.id !== id)
      );
      
      // Also remove from details if loaded
      setSearchDetails(prev => {
        const newDetails = {...prev};
        delete newDetails[id];
        return newDetails;
      });
      
      // Remove from expanded searches
      setExpandedSearches(prev => 
        prev.filter(searchId => searchId !== id)
      );
    } catch (err: any) {
      console.error('Error deleting search:', err);
      
      if (err.response?.status === 422) {
        setError('Failed to delete search: Token validation failed. Try logging out and back in.');
      } else {
        const errorMessage = err.response?.data?.error || err.message;
        setError(`Failed to delete search: ${errorMessage}`);
      }
    }
  };

  const handleRepeatSearch = (query: string) => {
    // Navigate to search page with the query
    navigate('/search', { state: { query } });
  };

  const handleAccordionChange = (searchId: number) => async (_: React.SyntheticEvent, isExpanded: boolean) => {
    if (isExpanded) {
      // Add to expanded searches if not already there
      if (!expandedSearches.includes(searchId)) {
        setExpandedSearches(prev => [...prev, searchId]);
      }
      
      // Load search results if not already loaded
      if (!searchDetails[searchId] && !loadingDetails[searchId]) {
        await fetchSearchDetails(searchId);
      }
    } else {
      // Remove from expanded searches
      setExpandedSearches(prev => 
        prev.filter(id => id !== searchId)
      );
    }
  };

  const fetchSearchDetails = async (searchId: number) => {
    setLoadingDetails(prev => ({...prev, [searchId]: true}));
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found. Please log in again.');
      }

      console.log(`Fetching details for search ${searchId}...`);
      const response = await axios.get(`/api/search/history/${searchId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      console.log('Search details response:', response.data);
      setSearchDetails(prev => ({
        ...prev,
        [searchId]: response.data
      }));
    } catch (err: any) {
      console.error('Error fetching search details:', err);
      const errorMessage = err.response?.data?.error || err.message;
      setError(`Failed to load search results: ${errorMessage}`);
    } finally {
      setLoadingDetails(prev => ({...prev, [searchId]: false}));
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const viewBook = (bookId: number) => {
    navigate(`/books/${bookId}`, { state: { fromSearch: true } });
  };

  // Check if a search is expanded
  const isExpanded = (searchId: number) => {
    return expandedSearches.includes(searchId);
  };

  if (loading) {
    return (
      <Container>
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 8 }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container>
      <Box sx={{ my: 4 }}>
        <Button 
          startIcon={<ArrowBackIcon />} 
          onClick={() => navigate('/search')}
          sx={{ mb: 3 }}
        >
          Back to Search
        </Button>

        <Paper sx={{ p: 3 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Search History
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          {searchHistory.length === 0 ? (
            <Typography variant="body1" color="textSecondary" align="center" sx={{ py: 4 }}>
              {error ? "Couldn't load search history." : "No search history found. Start searching to build your history."}
            </Typography>
          ) : (
            <List>
              {searchHistory.map((item, index) => (
                <React.Fragment key={item.id}>
                  {index > 0 && <Divider />}
                  <Accordion
                    expanded={isExpanded(item.id)}
                    onChange={handleAccordionChange(item.id)}
                  >
                    <AccordionSummary
                      expandIcon={<ExpandMoreIcon />}
                      aria-controls={`search-${item.id}-content`}
                      id={`search-${item.id}-header`}
                    >
                      <ListItem sx={{ p: 0 }}>
                        <ListItemText
                          primary={
                            <Typography variant="h6">
                              Query: "{item.query}"
                            </Typography>
                          }
                          secondary={
                            <React.Fragment>
                              <Typography component="span" variant="body2" color="textSecondary">
                                {formatDate(item.timestamp)}
                              </Typography>
                              <Chip 
                                label={`${item.result_count} results`}
                                size="small"
                                color="primary"
                                variant="outlined"
                                sx={{ ml: 1 }}
                              />
                            </React.Fragment>
                          }
                        />
                        <ListItemSecondaryAction>
                          <Tooltip title="Search Again">
                            <IconButton 
                              edge="end" 
                              aria-label="search again"
                              onClick={() => handleRepeatSearch(item.query)}
                              sx={{ mr: 1 }}
                            >
                              <SearchIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete Search">
                            <IconButton 
                              edge="end" 
                              aria-label="delete" 
                              onClick={() => handleDeleteSearch(item.id)}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Tooltip>
                        </ListItemSecondaryAction>
                      </ListItem>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Box sx={{ mt: 2 }}>
                        {loadingDetails[item.id] ? (
                          <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
                            <CircularProgress size={24} />
                          </Box>
                        ) : searchDetails[item.id] ? (
                          <>
                            <Typography variant="h6" gutterBottom>
                              Search Results
                            </Typography>
                            <Grid container spacing={3}>
                              {searchDetails[item.id].results.map((result) => (
                                <Grid item xs={12} sm={6} md={4} key={result.book.id}>
                                  <BookCard
                                    id={result.book.id}
                                    title={result.book.title}
                                    author={result.book.author || 'Unknown Author'}
                                    description={result.context || 'No description available'}
                                    fileType={result.book.file_format}
                                    relevance={result.relevance}
                                  />
                                </Grid>
                              ))}
                            </Grid>
                          </>
                        ) : (
                          <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
                            <Button 
                              variant="outlined" 
                              onClick={() => fetchSearchDetails(item.id)}
                            >
                              Load Results
                            </Button>
                          </Box>
                        )}
                      </Box>
                    </AccordionDetails>
                  </Accordion>
                </React.Fragment>
              ))}
            </List>
          )}
        </Paper>
      </Box>
    </Container>
  );
};

export default SearchHistoryPage;