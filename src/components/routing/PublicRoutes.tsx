
import React from 'react';
import { Route } from 'react-router-dom';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import PublicRegistration from '@/pages/PublicRegistration';
import VerifyOTP from '@/pages/VerifyOTP';
import SetPassword from '@/pages/SetPassword';

const PublicRoutes: React.FC = () => {
  return (
    <>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/public-registration" element={<PublicRegistration />} />
      <Route path="/verify-otp" element={<VerifyOTP />} />
      <Route path="/set-password" element={<SetPassword />} />
    </>
  );
};

export default PublicRoutes;
