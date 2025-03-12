import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { Link, Typography, Box } from '@mui/material';
import LoginForm from '../components/Auth/LoginForm';

const LoginPage: React.FC = () => {
  return (
    <Box>
      <LoginForm />
      <Box sx={{ mt: 2, textAlign: 'center' }}>
        <Typography variant="body2">
          Don't have an account?{' '}
          <Link component={RouterLink} to="/register">
            Sign up
          </Link>
        </Typography>
      </Box>
    </Box>
  );
};

export default LoginPage; 