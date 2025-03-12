// frontend/src/components/Layout/Header.tsx
import React from 'react';
import { AppBar, Toolbar, Typography, Button, Box } from '@mui/material';
import { Link } from 'react-router-dom';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import SearchIcon from '@mui/icons-material/Search';
import HistoryIcon from '@mui/icons-material/History';

interface HeaderProps {
  isAuthenticated: boolean;
  onLogout: () => void;
  username?: string;
}

const Header: React.FC<HeaderProps> = ({ isAuthenticated, onLogout, username }) => {
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

export default Header;