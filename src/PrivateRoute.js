import React, { useContext } from 'react';
import { AuthContext } from './AuthContext';
import { Navigate } from 'react-router-dom';

const PrivateRoute = ({ children }) => {
  const { authTokens } = useContext(AuthContext);
  return authTokens.access ? children : <Navigate to="/login" />;
};

export default PrivateRoute;
