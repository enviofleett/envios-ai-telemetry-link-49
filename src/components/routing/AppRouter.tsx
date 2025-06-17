
import React from 'react';
import { BrowserRouter as Router, Routes } from 'react-router-dom';
import PublicRoutes from './PublicRoutes';
import ProtectedRoutes from './ProtectedRoutes';

const AppRouter: React.FC = () => {
  return (
    <Router>
      <Routes>
        <PublicRoutes />
        <ProtectedRoutes />
      </Routes>
    </Router>
  );
};

export default AppRouter;
