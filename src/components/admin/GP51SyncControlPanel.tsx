
import React from 'react';
import ProductionGP51SyncControlPanel from './ProductionGP51SyncControlPanel';

// Legacy GP51SyncControlPanel now wraps the production-ready component
const GP51SyncControlPanel: React.FC = () => {
  return <ProductionGP51SyncControlPanel />;
};

export default GP51SyncControlPanel;
