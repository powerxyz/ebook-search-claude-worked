// frontend/src/components/Auth/LoginForm.tsx
import React, { useState } from 'react';
import { Box, Button, TextField, Typography, Container, Alert } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const LoginForm: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      console.log('Attempting login with:', { username });
      
      const response = await axios.post('/api/auth/login', { 
        username, 
        password 
      });
      
      console.log('Login response:', response.data);
      
      // Check if we have an access_token in the response
      if (response.data && response.data.access_token) {
        // Store the token in localStorage - using consistent key 'token'
        const token = response.data.access_token;
        console.log('Storing token in localStorage:', token.substring(0, 20) + '...');
        localStorage.setItem('token', token);
        
        // Store the username in localStorage
        localStorage.setItem('username', username);
        
        // Navigate to search page
        navigate('/search');
      } else {
        // If we don't have a token, something went wrong
        setError('Login successful but no token received. Please try again.');
      }
    } catch (err: any) {
      console.error('Login error:', err);
      
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
      <Box sx={{
        marginTop: 8,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}>
        <Typography component="h1" variant="h5">
          Sign in
        </Typography>
        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1, width: '100%' }}>
          {error && (
            <Alert severity="error" sx={{ mt: 2, width: '100%' }}>
              {error}
            </Alert>
          )}
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
        </Box>
      </Box>
    </Container>
  );
};

export default LoginForm;