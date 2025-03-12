// frontend/src/App.tsx
// Add these to your existing Material UI imports
// Update the imports at the top of frontend/src/App.tsx

import React, { useState, useEffect, useMemo } from 'react';
import { 
  BrowserRouter as Router, 
  Routes, 
  Route, 
  Link,
  Navigate,
  useParams, 
  useNavigate 
} from 'react-router-dom';
import {
  ThemeProvider,
  createTheme,
  CssBaseline, 
  Box, 
  Container, 
  AppBar,
  Toolbar,
  Typography,
  Button,
  TextField,
  Paper,
  Alert,
  CircularProgress,
  Chip,
  Divider,
  Grid,
  IconButton,
  Card,
  CardContent,
  CardActions,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import DescriptionIcon from '@mui/icons-material/Description';
import HistoryIcon from '@mui/icons-material/History';
import DeleteIcon from '@mui/icons-material/Delete';
import axios from 'axios';

// Utility function to check if a JWT token is valid
const isValidJWT = (token: string): boolean => {
  if (!token) return false;
  
  // A valid JWT token consists of three parts separated by dots
  const parts = token.split('.');
  if (parts.length !== 3) {
    console.error('Invalid token format: token does not have 3 parts');
    return false;
  }
  
  try {
    // Try to decode the middle part (payload)
    const payload = JSON.parse(atob(parts[1]));
    
    // Check if token has expired
    if (payload.exp && payload.exp * 1000 < Date.now()) {
      console.error('Token has expired');
      return false;
    }
    
    return true;
  } catch (e) {
    console.error('Error parsing token payload:', e);
    return false;
  }
};

// Define the Book interface
interface Book {
  id: number;
  title: string;
  author: string;
  description: string;
  fileType?: string;
  uploadDate?: string;
  fileSize?: string;
}

// SearchBar Component
interface SearchBarProps {
  onSearch: (query: string) => void;
  initialQuery?: string;
}

const SearchBar: React.FC<SearchBarProps> = ({ onSearch, initialQuery = '' }) => {
  const [query, setQuery] = useState(initialQuery);

  // If initialQuery changes, update the query state
  useEffect(() => {
    if (initialQuery) {
      setQuery(initialQuery);
    }
  }, [initialQuery]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query);
    }
  };

  return (
    <Paper
      component="form"
      onSubmit={handleSubmit}
      sx={{
        p: '2px 4px',
        display: 'flex',
        alignItems: 'center',
        width: '100%',
        maxWidth: 600,
        mx: 'auto',
        mt: 4,
      }}
    >
      <TextField
        sx={{ ml: 1, flex: 1 }}
        placeholder="Search for ebooks..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <IconButton type="submit" sx={{ p: '10px' }} aria-label="search">
        <SearchIcon />
      </IconButton>
    </Paper>
  );
};

// BookCard Component
interface BookCardProps {
  id: number;
  title: string;
  author: string;
  description: string;
  fileType?: string;
  relevance?: number;
}

const BookCard: React.FC<BookCardProps> = ({ id, title, author, description, fileType, relevance }) => {
  const navigate = useNavigate();

  const handleViewBook = () => {
    navigate(`/books/${id}`);
  };

  // Format relevance as percentage if provided
  const relevanceDisplay = relevance !== undefined ? 
    `Relevance: ${(relevance * 100).toFixed(0)}%` : '';

  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardContent sx={{ flexGrow: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <MenuBookIcon color="primary" sx={{ mr: 1 }} />
          <Typography variant="h6" component="h2" noWrap>
            {title}
          </Typography>
        </Box>
        <Typography color="textSecondary" gutterBottom>
          {author}
        </Typography>
        {relevance !== undefined && (
          <Typography variant="body2" color="textSecondary" gutterBottom>
            {relevanceDisplay}
          </Typography>
        )}
        <Typography variant="body2" color="text.secondary" sx={{ 
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          display: '-webkit-box',
          WebkitLineClamp: 3,
          WebkitBoxOrient: 'vertical',
          mb: 2
        }}>
          {description}
        </Typography>
        {fileType && (
          <Chip 
            icon={<DescriptionIcon />} 
            label={fileType.toUpperCase()} 
            size="small" 
            color="primary" 
            variant="outlined"
          />
        )}
      </CardContent>
      <CardActions>
        <Button size="small" color="primary" onClick={handleViewBook}>
          View Details
        </Button>
      </CardActions>
    </Card>
  );
};

// SearchResults Component
interface SearchResultsProps {
  results: Book[];
  loading: boolean;
  error: string | null;
}

const SearchResults: React.FC<SearchResultsProps> = ({ results, loading, error }) => {
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
            title={book.title}
            author={book.author}
            description={book.description}
            fileType={book.fileType}
          />
        </Grid>
      ))}
    </Grid>
  );
};

// Login Page Component
const LoginPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [debugInfo, setDebugInfo] = useState<string | null>(null);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    setDebugInfo(null);
    
    try {
      console.log('Attempting login with:', { username });
      
      const response = await axios.post('/api/auth/login', { 
        username, 
        password 
      });
      
      console.log('Login response:', response.data);
      
      // Check if we have an access_token in the response
      if (response.data && response.data.access_token) {
        // Store the token in localStorage
        const token = response.data.access_token;
        console.log('Storing token in localStorage:', token.substring(0, 20) + '...');
        localStorage.setItem('token', token);
        
        // Store the username in localStorage
        localStorage.setItem('username', username);
        
        // Set a success message
        setDebugInfo(`Login successful! Token: ${token.substring(0, 20)}...`);
        
        // Reload the page to update authentication state after a short delay
        setTimeout(() => {
          window.location.href = '/search';
        }, 1000);
      } else {
        // If we don't have a token, something went wrong
        setError('Login successful but no token received. Please try again.');
        setDebugInfo(`Response received but no token: ${JSON.stringify(response.data)}`);
      }
    } catch (err: any) {
      console.error('Login error:', err);
      
      // Save debug info
      setDebugInfo(
        `Status: ${err.response?.status || 'No status'}, ` +
        `Message: ${err.response?.data?.message || err.message || 'Unknown error'}`
      );
      
      // Handle specific error cases
      if (err.response) {
        if (err.response.status === 401) {
          setError('Invalid username or password. Please try again.');
        } else if (err.response.status === 404) {
          setError('User not found. Please check your username or register a new account.');
        } else if (err.response.data && err.response.data.message) {
          setError(err.response.data.message);
        } else {
          setError('Login failed. Please try again.');
        }
      } else {
        setError('Network error. Please check your connection and try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container component="main" maxWidth="xs">
      <Box sx={{ mt: 8, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Typography component="h1" variant="h5">Sign in</Typography>
        {error && (
          <Alert severity="error" sx={{ mt: 2, width: '100%' }}>
            {error}
          </Alert>
        )}
        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1, width: '100%' }}>
          <TextField
            margin="normal"
            required
            fullWidth
            id="username"
            label="Username"
            name="username"
            autoComplete="username"
            autoFocus
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            disabled={loading}
          />
          <TextField
            margin="normal"
            required
            fullWidth
            name="password"
            label="Password"
            type="password"
            id="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
          />
          <Button 
            type="submit" 
            fullWidth 
            variant="contained" 
            sx={{ mt: 3, mb: 2 }}
            disabled={loading}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </Button>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="body2">
              Don't have an account?{' '}
              <Link to="/register">Sign up</Link>
            </Typography>
          </Box>
        </Box>
      </Box>
      
      {/* Debug info */}
      {debugInfo && (
        <Box sx={{ mt: 3, p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
          <Typography variant="caption" component="pre" sx={{ whiteSpace: 'pre-wrap' }}>
            Debug Info: {debugInfo}
          </Typography>
        </Box>
      )}
    </Container>
  );
};

// Register Page Component
const RegisterPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [debugInfo, setDebugInfo] = useState<string | null>(null);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    setDebugInfo(null);
    
    try {
      console.log('Attempting registration with:', { username, email });
      
      const response = await axios.post('/api/auth/register', {
        username,
        email,
        password
      });
      
      console.log('Registration response:', response.data);
      
      // Check if we have an access_token in the response
      if (response.data && response.data.access_token) {
        // Store the token in localStorage
        const token = response.data.access_token;
        console.log('Storing token in localStorage:', token.substring(0, 20) + '...');
        localStorage.setItem('token', token);
        
        // Store the username in localStorage
        localStorage.setItem('username', username);
        
        // Set a success message
        setDebugInfo(`Registration successful! Token: ${token.substring(0, 20)}...`);
        
        // Redirect to search page after a short delay
        setTimeout(() => {
          window.location.href = '/search';
        }, 1000);
      } else {
        // If we don't have a token, something went wrong
        setError('Registration successful but no token received. Please try again or log in.');
        setDebugInfo(`Response received but no token: ${JSON.stringify(response.data)}`);
      }
    } catch (err: any) {
      console.error('Registration error:', err);
      
      // Save debug info
      setDebugInfo(
        `Status: ${err.response?.status || 'No status'}, ` +
        `Message: ${err.response?.data?.message || err.message || 'Unknown error'}`
      );
      
      // Handle specific error cases
      if (err.response) {
        if (err.response.status === 409) {
          // Check if the error message contains information about what's duplicate
          const errorMsg = err.response.data?.message || '';
          if (errorMsg.includes('username')) {
            setError('Username already exists. Please choose a different username.');
          } else if (errorMsg.includes('email')) {
            setError('Email already registered. Please use a different email address.');
          } else {
            setError('Username or email already registered. Please use different credentials.');
          }
        } else if (err.response.data && err.response.data.message) {
          setError(err.response.data.message);
        } else {
          setError('Registration failed. Please try again.');
        }
      } else {
        setError('Network error. Please check your connection and try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container component="main" maxWidth="xs">
      <Box sx={{ mt: 8, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Typography component="h1" variant="h5">Sign up</Typography>
        {error && (
          <Alert severity="error" sx={{ mt: 2, width: '100%' }}>
            {error}
          </Alert>
        )}
        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1, width: '100%' }}>
          <TextField
            margin="normal"
            required
            fullWidth
            id="username"
            label="Username"
            name="username"
            autoComplete="username"
            autoFocus
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            disabled={loading}
          />
          <TextField
            margin="normal"
            required
            fullWidth
            id="email"
            label="Email Address"
            name="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
          />
          <TextField
            margin="normal"
            required
            fullWidth
            name="password"
            label="Password"
            type="password"
            id="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
          />
          <Button 
            type="submit" 
            fullWidth 
            variant="contained" 
            sx={{ mt: 3, mb: 2 }}
            disabled={loading}
          >
            {loading ? 'Signing up...' : 'Sign Up'}
          </Button>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="body2">
              Already have an account?{' '}
              <Link to="/login">Sign in</Link>
            </Typography>
          </Box>
        </Box>
      </Box>
      
      {/* Debug info */}
      {debugInfo && (
        <Box sx={{ mt: 3, p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
          <Typography variant="caption" component="pre" sx={{ whiteSpace: 'pre-wrap' }}>
            Debug Info: {debugInfo}
          </Typography>
        </Box>
      )}
    </Container>
  );
};

// Search Page Component
const SearchPage: React.FC = () => {
  const [searchResults, setSearchResults] = useState<Book[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [debugInfo, setDebugInfo] = useState<string | null>(null);
  const [scanningLibrary, setScanningLibrary] = useState(false);
  const [scanMessage, setScanMessage] = useState<string | null>(null);

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
    setDebugInfo(null);
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found. Please log in again.');
      }

      // Check if token is valid
      if (!isValidJWT(token)) {
        // If token is invalid, clear it and ask user to log in again
        localStorage.removeItem('token');
        throw new Error('Invalid authentication token. Please log in again.');
      }

      console.log('Using token for scan:', token.substring(0, 20) + '...');

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
      const errorMessage = err.response?.data?.error || err.message;
      setScanMessage(`Error scanning library: ${errorMessage}`);
      setDebugInfo(`API scan failed: ${errorMessage}. Status: ${err.response?.status}. Check console for more details.`);
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
    setDebugInfo(null);
    setHasSearched(true);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found. Please log in again.');
      }

      // Check if token is valid
      if (!isValidJWT(token)) {
        // If token is invalid, clear it and ask user to log in again
        localStorage.removeItem('token');
        throw new Error('Invalid authentication token. Please log in again.');
      }

      console.log('Using token for search:', token.substring(0, 20) + '...');

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
      const errorMessage = err.response?.data?.error || err.message;
      setError(errorMessage);
      setDebugInfo(`API search failed: ${errorMessage}. Status: ${err.response?.status}`);
      setSearchResults([]);

      // If the API call fails, use mock data
      if (err.response?.status === 404 || err.response?.status === 422) {
        const filteredMockBooks = mockBooks.filter(book => 
          book.title.toLowerCase().includes(query.toLowerCase()) ||
          book.author.toLowerCase().includes(query.toLowerCase()) ||
          book.description.toLowerCase().includes(query.toLowerCase())
        );
        setSearchResults(filteredMockBooks);
        setDebugInfo(`API search failed: ${errorMessage}. Using mock data instead.`);
      }
    } finally {
      setLoading(false);
    }
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
          <SearchBar onSearch={handleSearch} />
          
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
          </Box>
          
          {scanMessage && (
            <Box sx={{ mt: 2, p: 2, bgcolor: '#e8f5e9', borderRadius: 1 }}>
              <Typography variant="body2" color="textSecondary">
                {scanMessage}
              </Typography>
            </Box>
          )}
          
          {debugInfo && (
            <Box sx={{ mt: 2, p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
              <Typography variant="body2" color="textSecondary">
                Debug Info: {debugInfo}
              </Typography>
            </Box>
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

// Book Details Page Component
const BookDetailsPage: React.FC = () => {
  const params = useParams();
  const [book, setBook] = useState<Book | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [debugInfo, setDebugInfo] = useState<string | null>(null);
  const navigate = useNavigate();
  
  // Use useMemo to prevent the mockBooks array from being recreated on every render
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
  
  useEffect(() => {
    const fetchBookDetails = async () => {
      if (!params.id) return;
      
      setLoading(true);
      setError('');
      setDebugInfo(null);
      
      try {
        console.log(`Fetching details for book ID: ${params.id}`);
        
        try {
          // Try to use the real API endpoint
          const token = localStorage.getItem('token');
          const response = await axios.get(`/api/books/${params.id}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          
          console.log('Book details response:', response.data);
          
          // Transform the book data to match our Book interface
          const apiBook = response.data.book;
          const formattedBook = {
            id: apiBook.id,
            title: apiBook.title,
            author: apiBook.author,
            description: apiBook.file_path, // Using file_path as description for now
            fileType: apiBook.file_format,
            uploadDate: apiBook.indexed_at,
            fileSize: apiBook.file_size ? `${Math.round(apiBook.file_size / 1024)} KB` : 'Unknown'
          };
          
          setBook(formattedBook);
        } catch (apiErr) {
          console.warn('API book details failed, using mock data:', apiErr);
          setDebugInfo(`API book details failed: ${apiErr.message}. Using mock data instead.`);
          
          // Find the book in mock data
          const bookId = params.id ? parseInt(params.id) : 0;
          const mockBook = mockBooks.find(b => b.id === bookId);
          
          if (mockBook) {
            setBook(mockBook);
          } else {
            setError('Book not found in mock data.');
          }
        }
      } catch (err: any) {
        console.error('Error fetching book details:', err);
        setError(err.message || 'Failed to load book details. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchBookDetails();
  }, [params.id, mockBooks]);
  
  const handleDownload = async () => {
    if (!book) return;
    
    try {
      setDebugInfo(null);
      
      const token = localStorage.getItem('token');
      
      // Use the book file endpoint to download the file
      const response = await axios.get(`/api/books/${book.id}/file`, {
        headers: { 
          Authorization: `Bearer ${token}` 
        },
        responseType: 'blob' // Important for file downloads
      });
      
      // Create a blob URL and trigger download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${book.title}.${book.fileType?.toLowerCase()}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
    } catch (err: any) {
      console.error('Error downloading book:', err);
      setDebugInfo(`Download failed: ${err.message}`);
    }
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
  
  if (error || !book) {
    return (
      <Container>
        <Box sx={{ my: 4 }}>
          <Alert severity="error" sx={{ mb: 3 }}>
            {error || 'Book not found'}
          </Alert>
          <Button 
            variant="contained" 
            onClick={() => navigate('/search')}
          >
            Back to Search
          </Button>
        </Box>
      </Container>
    );
  }
  
  return (
    <Container>
      <Box sx={{ my: 4 }}>
        <Button 
          variant="outlined" 
          onClick={() => navigate('/search')}
          sx={{ mb: 3 }}
        >
          Back to Search
        </Button>
        
        {debugInfo && (
          <Alert severity="info" sx={{ mb: 3 }}>
            {debugInfo}
          </Alert>
        )}
        
        <Paper sx={{ p: 3 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            {book.title}
          </Typography>
          
          <Typography variant="h6" color="textSecondary" gutterBottom>
            by {book.author}
          </Typography>
          
        {book.fileType && (
            <Chip 
            label={book.fileType.toUpperCase()} 
            color="primary" 
            size="small" 
            sx={{ mb: 2 }}
            />
        )}
  
  <Divider sx={{ my: 2 }} />
  
  <Typography variant="h6" gutterBottom>
    Description
  </Typography>
  <Typography variant="body1" paragraph>
    {book.description}
  </Typography>
  
  <Divider sx={{ my: 2 }} />
  
  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
    <Box>
      {book.uploadDate && (
        <Typography variant="body2" color="textSecondary">
          Uploaded: {new Date(book.uploadDate).toLocaleDateString()}
        </Typography>
      )}
      {book.fileSize && (
        <Typography variant="body2" color="textSecondary">
          Size: {book.fileSize}
        </Typography>
      )}
    </Box>
    
    <Button 
      variant="contained" 
      color="primary" 
      onClick={handleDownload}
    >
      Download
    </Button>
  </Box>
          </Paper>
        </Box>
      </Container>
    );
  };
  
  // SearchHistoryPage Component
  const SearchHistoryPage: React.FC = () => {
    const navigate = useNavigate();
    const [searchHistory, setSearchHistory] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
  
    useEffect(() => {
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
        } catch (err: any) {
          console.error('Error fetching search history:', err);
          const errorMessage = err.response?.data?.error || err.message;
          setError(errorMessage);
          setSearchHistory([]);
        } finally {
          setLoading(false);
        }
      };
      
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
      } catch (err: any) {
        console.error('Error deleting search:', err);
        const errorMessage = err.response?.data?.error || err.message;
        setError(`Failed to delete search: ${errorMessage}`);
      }
    };
  
    const handleRepeatSearch = (query: string) => {
      navigate('/search', { state: { query } });
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
            variant="outlined" 
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
                No search history found. Start searching to build your history.
              </Typography>
            ) : (
              <List>
                {searchHistory.map((item, index) => (
                  <React.Fragment key={item.id}>
                    {index > 0 && <Divider />}
                    <ListItem>
                      <ListItemText
                        primary={item.query}
                        secondary={
                          <React.Fragment>
                            <Typography component="span" variant="body2" color="textSecondary">
                              {new Date(item.timestamp).toLocaleString()}
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
                        <IconButton 
                          edge="end" 
                          aria-label="search again"
                          onClick={() => handleRepeatSearch(item.query)}
                          sx={{ mr: 1 }}
                        >
                          <SearchIcon />
                        </IconButton>
                        <IconButton 
                          edge="end" 
                          aria-label="delete" 
                          onClick={() => handleDeleteSearch(item.id)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                  </React.Fragment>
                ))}
              </List>
            )}
          </Paper>
        </Box>
      </Container>
    );
  };
  
  // Header Component
  const Header: React.FC<{ 
    isAuthenticated: boolean; 
    onLogout: () => void;
    username?: string;
  }> = ({ isAuthenticated, onLogout, username }) => {
    return (
      <AppBar position="static">
        <Toolbar>
          <MenuBookIcon sx={{ mr: 2 }} />
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            <Link to="/" style={{ color: 'white', textDecoration: 'none' }}>
              E-Book Search
            </Link>
          </Typography>
          {isAuthenticated ? (
            <>
              {username && (
                <Typography variant="body1" sx={{ mr: 2 }}>
                  {username}
                </Typography>
              )}
              <Button 
                color="inherit" 
                component={Link} 
                to="/search"
                startIcon={<SearchIcon />}
                sx={{ mr: 1 }}
              >
                Search
              </Button>
              <Button 
                color="inherit" 
                component={Link} 
                to="/history"
                startIcon={<HistoryIcon />}
                sx={{ mr: 1 }}
              >
                History
              </Button>
              <Button color="inherit" onClick={onLogout}>
                Logout
              </Button>
            </>
          ) : (
            <>
              <Button color="inherit" component={Link} to="/login">
                Login
              </Button>
              <Button color="inherit" component={Link} to="/register">
                Register
              </Button>
            </>
          )}
        </Toolbar>
      </AppBar>
    );
  };
  
  // Theme configuration
  const theme = createTheme({
    palette: {
      primary: {
        main: '#1976d2',
      },
      secondary: {
        main: '#dc004e',
      },
      background: {
        default: '#f5f5f5',
      },
    },
    typography: {
      fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
      h4: {
        fontWeight: 600,
      },
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: 'none',
          },
        },
      },
    },
  });
  
  // Main App Component
  const App: React.FC = () => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loading, setLoading] = useState(true);
    const [username, setUsername] = useState('');
  
    useEffect(() => {
      const checkAuth = async () => {
        const token = localStorage.getItem('token');
        console.log('Checking authentication...');
        
        if (!token) {
          console.log('No token found in localStorage');
          setIsAuthenticated(false);
          setLoading(false);
          return;
        }
        
        // Check if token is valid
        if (!isValidJWT(token)) {
          console.log('Invalid token found in localStorage, clearing it');
          localStorage.removeItem('token');
          localStorage.removeItem('username');
          setIsAuthenticated(false);
          setLoading(false);
          return;
        }
        
        // Since we don't have verification endpoints yet, we'll just assume the token is valid
        // In a production app, you would verify the token with the backend
        console.log('Token exists and is valid:', token.substring(0, 20) + '...');
        
        // Get username from localStorage if available
        const storedUsername = localStorage.getItem('username');
        if (storedUsername) {
          console.log('Username found in localStorage:', storedUsername);
          setUsername(storedUsername);
        } else {
          console.log('No username found in localStorage');
        }
        
        setIsAuthenticated(true);
        setLoading(false);
      };
      
      checkAuth();
    }, []);
  
    const handleLogout = () => {
      localStorage.removeItem('token');
      localStorage.removeItem('username');
      setUsername('');
      setIsAuthenticated(false);
      // Redirect to login page
      window.location.href = '/login';
    };
  
    if (loading) {
      return (
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
            <CircularProgress />
          </Box>
        </ThemeProvider>
      );
    }
  
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Router>
          <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
            <Header isAuthenticated={isAuthenticated} onLogout={handleLogout} username={username} />
            <Container component="main" sx={{ flexGrow: 1, py: 3 }}>
              <Routes>
                <Route
                  path="/"
                  element={
                    isAuthenticated ? (
                      <Navigate to="/search" replace />
                    ) : (
                      <Navigate to="/login" replace />
                    )
                  }
                />
                <Route
                  path="/login"
                  element={
                    isAuthenticated ? <Navigate to="/search" replace /> : <LoginPage />
                  }
                />
                <Route
                  path="/register"
                  element={
                    isAuthenticated ? (
                      <Navigate to="/search" replace />
                    ) : (
                      <RegisterPage />
                    )
                  }
                />
                <Route
                  path="/search"
                  element={
                    isAuthenticated ? <SearchPage /> : <Navigate to="/login" replace />
                  }
                />
                <Route
                  path="/books/:id"
                  element={
                    isAuthenticated ? <BookDetailsPage /> : <Navigate to="/login" replace />
                  }
                />
                <Route
                  path="/history"
                  element={
                    isAuthenticated ? <SearchHistoryPage /> : <Navigate to="/login" replace />
                  }
                />
              </Routes>
            </Container>
            <Box component="footer" sx={{ py: 3, px: 2, mt: 'auto', backgroundColor: (theme) => theme.palette.grey[200] }}>
              <Container maxWidth="sm">
                <Typography variant="body2" color="text.secondary" align="center">
                  PowerXYZ Ebook Search © {new Date().getFullYear()}
                </Typography>
              </Container>
            </Box>
          </Box>
        </Router>
      </ThemeProvider>
    );
  };
  
  export default App;