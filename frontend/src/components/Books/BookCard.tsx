// frontend/src/components/Books/BookCard.tsx
import React from 'react';
import { Card, CardContent, CardActions, Typography, Button, Box, Chip, Tooltip } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import DescriptionIcon from '@mui/icons-material/Description';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';

interface BookProps {
  id: number;
  title: string;
  author: string;
  description: string;
  fileType?: string;
  relevance?: number;
}

const BookCard: React.FC<BookProps> = ({ id, title, author, description, fileType, relevance }) => {
  const navigate = useNavigate();

  const handleViewBook = () => {
    navigate(`/books/${id}`, { state: { fromSearch: true } });
  };

  const handleViewBookNewTab = (e: React.MouseEvent) => {
    // Don't use preventDefault() as it stops the link from opening
    const url = `${window.location.origin}/books/${id}`;
    window.open(url, '_blank');
  };

  // Format relevance as percentage if provided
  const relevanceDisplay = relevance !== undefined ? 
    `Relevance: ${(relevance * 100).toFixed(0)}%` : '';

  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardContent sx={{ flexGrow: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 1 }}>
          <MenuBookIcon color="primary" sx={{ mr: 1, mt: 0.5 }} />
          <Typography variant="h6" component="h2" sx={{ 
            // Show full title, allow wrapping
            whiteSpace: 'normal',
            wordBreak: 'break-word',
            width: '100%',
            lineHeight: 1.3
          }}>
            {title}
          </Typography>
        </Box>
        <Typography color="textSecondary" gutterBottom>
          {author || 'Unknown Author'}
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
        <Button 
          size="small" 
          color="primary" 
          variant="contained" 
          onClick={handleViewBook}
          sx={{ mr: 1 }}
        >
          View Details
        </Button>
        <Button
          size="small"
          color="secondary"
          variant="outlined"
          onClick={handleViewBookNewTab}
          startIcon={<OpenInNewIcon />}
        >
          Open in New Tab
        </Button>
      </CardActions>
    </Card>
  );
};

export default BookCard;