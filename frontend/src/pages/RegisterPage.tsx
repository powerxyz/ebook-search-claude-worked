import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { Link, Typography, Box } from '@mui/material';
import RegisterForm from '../components/Auth/RegisterForm';

const RegisterPage: React.FC = () => {
  return (
    <Box>
      <RegisterForm />
      <Box sx={{ mt: 2, textAlign: 'center' }}>
        <Typography variant="body2">
          Already have an account?{' '}
          <Link component={RouterLink} to="/login">
            Sign in
          </Link>
        </Typography>
      </Box>
    </Box>
  );
};

export default RegisterPage; 