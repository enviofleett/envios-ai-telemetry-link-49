
import React, { useState } from 'react';
import LoginForm from '@/components/LoginForm';
import VehicleDashboard from '@/components/VehicleDashboard';

interface Vehicle {
  deviceid: string;
  devicename: string;
  status?: string;
  lastPosition?: {
    lat: number;
    lon: number;
    speed: number;
    course: number;
    updatetime: string;
    statusText: string;
  };
}

const Index = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);

  const handleLoginSuccess = (vehicleData: Vehicle[]) => {
    console.log('Login successful, received vehicles:', vehicleData);
    setVehicles(vehicleData);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    console.log('User logging out...');
    setIsAuthenticated(false);
    setVehicles([]);
  };

  if (!isAuthenticated) {
    return <LoginForm onLoginSuccess={handleLoginSuccess} />;
  }

  return <VehicleDashboard vehicles={vehicles} onLogout={handleLogout} />;
};

export default Index;
