import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = () => {
  const { isAuthenticated } = useAuth();

  // if no user -> redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // if there is a user -> show the content (Outlet)
  return <Outlet />;
};

export default ProtectedRoute;