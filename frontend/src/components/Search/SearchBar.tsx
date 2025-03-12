// frontend/src/components/Search/SearchBar.tsx
import React, { useState, useEffect } from 'react';
import { Box, TextField, IconButton, Paper } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';

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
        inputProps={{
          'aria-label': 'search ebooks'
        }}
      />
      <IconButton type="submit" sx={{ p: '10px' }} aria-label="search">
        <SearchIcon />
      </IconButton>
    </Paper>
  );
};

export default SearchBar;