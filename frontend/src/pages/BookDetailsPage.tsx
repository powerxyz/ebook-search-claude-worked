// frontend/src/pages/BookDetailsPage.tsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
// Make sure these imports are at the top of the file:
import { 
  Container, 
  Typography, 
  Box, 
  Paper, 
  Button, 
  Chip,
  Divider,
  CircularProgress,
  Alert,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  DialogActions,
  Breadcrumbs,
  Link as MuiLink
} from '@mui/material';

import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DownloadIcon from '@mui/icons-material/Download';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import VisibilityIcon from '@mui/icons-material/Visibility';
import CloseIcon from '@mui/icons-material/Close';
import SearchIcon from '@mui/icons-material/Search';
import HomeIcon from '@mui/icons-material/Home';
import axios from 'axios';

interface Book {
  id: number;
  title: string;
  author: string | null;
  file_path: string;
  file_format: string;
  file_size: number | null;
  indexed_at: string | null;
  last_accessed: string | null;
}

const BookDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [book, setBook] = useState<Book | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showViewer, setShowViewer] = useState(false);
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [viewerLoading, setViewerLoading] = useState(false);
  
  // Check if we came from search
  const cameFromSearch = location.state && location.state.fromSearch;

  useEffect(() => {
    const fetchBookDetails = async () => {
      if (!id) return;
      
      setLoading(true);
      setError(null);
      
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('Authentication token not found. Please log in again.');
        }
        
        const response = await axios.get(`/api/books/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        console.log('Book details response:', response.data);
        setBook(response.data.book);
      } catch (err: any) {
        console.error('Error fetching book details:', err);
        setError(err.response?.data?.message || err.message || 'Failed to load book details');
        setBook(null);
      } finally {
        setLoading(false);
      }
    };

    fetchBookDetails();
  }, [id]);

  const handleGoBack = () => {
    if (cameFromSearch) {
      // Go back to search results
      navigate(-1);
    } else {
      // Go to search page
      navigate('/search');
    }
  };

  const handleDownload = async () => {
    if (!book) return;
    
    try {
      setError(null);
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
      link.setAttribute('download', `${book.title}.${book.file_format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
    } catch (err: any) {
      console.error('Error downloading book:', err);
      setError('Failed to download the book. Please try again.');
    }
  };

  const handleViewOnline = async () => {
    if (!book) return;
    
    try {
      setError(null);
      setViewerLoading(true);
      const token = localStorage.getItem('token');
      
      // Get the file for viewing in browser
      const response = await axios.get(`/api/books/${book.id}/file`, {
        headers: { 
          Authorization: `Bearer ${token}` 
        },
        responseType: 'blob'
      });
      
      // Create a blob URL for the viewer
      const url = window.URL.createObjectURL(new Blob([response.data]));
      setFileUrl(url);
      setShowViewer(true);
    } catch (err: any) {
      console.error('Error viewing book:', err);
      setError('Failed to open the book. Please try again.');
    } finally {
      setViewerLoading(false);
    }
  };

  const handleCloseViewer = () => {
    setShowViewer(false);
    // Revoke the object URL to free up memory
    if (fileUrl) {
      URL.revokeObjectURL(fileUrl);
      setFileUrl(null);
    }
  };

  // Determine if we need to show plugin recommendation
  const needsPlugin = (format: string): boolean => {
    // PDF is generally supported natively in browsers
    if (format.toLowerCase() === 'pdf') return false;
    // EPUB and AZW3 typically need plugins
    return true;
  };

  // Get plugin recommendation message
  const getPluginMessage = (format: string): string => {
    switch (format.toLowerCase()) {
      case 'epub':
        return 'This EPUB file may require a browser extension to view. We recommend using the "EPUBReader" extension for Chrome or Firefox.';
      case 'azw3':
        return 'AZW3 files are Amazon Kindle format and require specific readers. Consider downloading the file and using Calibre or Kindle app.';
      default:
        return `This ${format.toUpperCase()} file may require additional software to view properly.`;
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
          <Alert severity="error">
            {error || 'Book not found'}
          </Alert>
          <Button 
            variant="contained" 
            onClick={() => navigate('/search')}
            sx={{ mt: 2 }}
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
        {/* Navigation breadcrumbs */}
        <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 3 }}>
          <MuiLink
            component="button"
            variant="body1"
            onClick={() => navigate('/')}
            sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}
          >
            <HomeIcon sx={{ mr: 0.5 }} fontSize="inherit" />
            Home
          </MuiLink>
          <MuiLink
            component="button"
            variant="body1"
            onClick={() => navigate('/search')}
            sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}
          >
            <SearchIcon sx={{ mr: 0.5 }} fontSize="inherit" />
            Search
          </MuiLink>
          <Typography color="text.primary" sx={{ wordBreak: 'break-word' }}>
            {book.title}
          </Typography>
        </Breadcrumbs>
        
        <Button 
          startIcon={<ArrowBackIcon />} 
          onClick={handleGoBack}
          sx={{ mb: 3 }}
        >
          {cameFromSearch ? 'Back to Search Results' : 'Back to Search'}
        </Button>
        
        <Paper sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
            <MenuBookIcon color="primary" sx={{ fontSize: 40, mr: 2, mt: 1 }} />
            <Typography variant="h4" component="h1" sx={{ 
              wordBreak: 'break-word',
              lineHeight: 1.2,
              width: '100%'
            }}>
              {book.title}
            </Typography>
          </Box>
          
          <Typography variant="h6" color="text.secondary" gutterBottom>
            by {book.author || 'Unknown Author'}
          </Typography>
          
          {book.file_format && (
            <Chip 
              label={book.file_format.toUpperCase()} 
              color="primary" 
              size="small" 
              sx={{ mb: 2 }}
            />
          )}
          
          <Divider sx={{ my: 2 }} />
          
          <Typography variant="h6" gutterBottom>
            File Details
          </Typography>
          <Typography variant="body1" paragraph sx={{ wordBreak: 'break-word' }}>
            {book.file_path}
          </Typography>
          
          <Divider sx={{ my: 2 }} />
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
              {book.indexed_at && (
                <Typography variant="body2" color="text.secondary">
                  Indexed: {new Date(book.indexed_at).toLocaleDateString()}
                </Typography>
              )}
              {book.file_size && (
                <Typography variant="body2" color="text.secondary">
                  Size: {Math.round(book.file_size / 1024)} KB
                </Typography>
              )}
            </Box>
            
            <Box>
              <Button 
                variant="contained" 
                startIcon={<DownloadIcon />} 
                onClick={handleDownload}
                sx={{ mr: 1 }}
              >
                Download
              </Button>
              <Button 
                variant="outlined" 
                startIcon={<VisibilityIcon />} 
                onClick={handleViewOnline}
                disabled={viewerLoading}
              >
                {viewerLoading ? 'Loading...' : 'Read Online'}
              </Button>
            </Box>
          </Box>
        </Paper>
      </Box>

      {/* Book Viewer Dialog */}
      <Dialog
        open={showViewer}
        onClose={handleCloseViewer}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: { height: '90vh' }
        }}
      >
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6" sx={{ wordBreak: 'break-word' }}>{book.title}</Typography>
            <IconButton onClick={handleCloseViewer} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent dividers sx={{ padding: 0, overflow: 'hidden' }}>
          {needsPlugin(book.file_format) ? (
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <Alert severity="info" sx={{ mb: 2 }}>
                {getPluginMessage(book.file_format)}
              </Alert>
              
              <Typography variant="body1" paragraph>
                This file format ({book.file_format.toUpperCase()}) cannot be displayed directly in the browser.
              </Typography>
              
              <Button variant="contained" onClick={handleDownload}>
                Download to view
              </Button>
            </Box>
          ) : (
            fileUrl && (
              <iframe 
                src={fileUrl}
                title={book.title}
                width="100%" 
                height="100%" 
                style={{ border: 'none' }}
              />
            )
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseViewer}>Close</Button>
          <Button variant="contained" onClick={handleDownload} startIcon={<DownloadIcon />}>
            Download
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default BookDetailsPage;