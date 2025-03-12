// frontend/src/components/Auth/RegisterForm.tsx
import React, { useState } from 'react';
import { Box, Button, TextField, Typography, Container, Alert } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const RegisterForm: React.FC = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
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
        setError('Registration successful but no token received. Please try again or log in.');
      }
    } catch (err: any) {
      console.error('Registration error:', err);
      
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
      <Box sx={{
        marginTop: 8,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}>
        <Typography component="h1" variant="h5">
          Sign up
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
        </Box>
      </Box>
    </Container>
  );
};

export default RegisterForm;