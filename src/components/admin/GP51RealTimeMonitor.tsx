
import React from 'react';
import ProductionGP51RealTimeMonitor from './ProductionGP51RealTimeMonitor';

// Legacy GP51RealTimeMonitor now wraps the production-ready component
const GP51RealTimeMonitor: React.FC = () => {
  return <ProductionGP51RealTimeMonitor />;
};

export default GP51RealTimeMonitor;
