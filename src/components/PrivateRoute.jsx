import React, { useContext } from 'react';
import { AuthContext } from '../context/AuthContext.jsx';
import { Navigate } from 'react-router-dom';

export default function PrivateRoute({ children, roles }) {
  const { token, user } = useContext(AuthContext);
  if (!token) return <Navigate to="/login" replace />;
  if (roles && roles.length > 0) {
    if (!user || !roles.includes(user.role)) return <Navigate to="/" replace />;
  }
  return children;
}

