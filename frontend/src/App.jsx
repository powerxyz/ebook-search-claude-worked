import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme, CssBaseline, Box, Container } from '@mui/material';

// Create simple placeholder components for now
const LoginPage = () => (
  <div>
    <h1>Login Page</h1>
    <p>This is a placeholder for the login page.</p>
  </div>
);

const RegisterPage = () => (
  <div>
    <h1>Register Page</h1>
    <p>This is a placeholder for the register page.</p>
  </div>
);

const SearchPage = () => (
  <div>
    <h1>Search Page</h1>
    <p>This is a placeholder for the search page.</p>
  </div>
);

const BookDetailsPage = () => (
  <div>
    <h1>Book Details Page</h1>
    <p>This is a placeholder for the book details page.</p>
  </div>
);

// Simple Header component
const Header = ({ isAuthenticated, onLogout }) => (
  <div style={{ 
    backgroundColor: '#1976d2', 
    color: 'white', 
    padding: '1rem', 
    display: 'flex', 
    justifyContent: 'space-between' 
  }}>
    <h1 style={{ margin: 0 }}>E-Book Search</h1>
    {isAuthenticated ? (
      <button onClick={onLogout} style={{ cursor: 'pointer' }}>Logout</button>
    ) : (
      <div>
        <button style={{ marginRight: '1rem', cursor: 'pointer' }}>Login</button>
        <button style={{ cursor: 'pointer' }}>Register</button>
      </div>
    )}
  </div>
);

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
    background: {
      default: '#f5f5f5',
    }
  },
});

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    setIsAuthenticated(!!token);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsAuthenticated(false);
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
          <Header isAuthenticated={isAuthenticated} onLogout={handleLogout} />
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
            </Routes>
          </Container>
        </Box>
      </Router>
    </ThemeProvider>
  );
};

export default App; 