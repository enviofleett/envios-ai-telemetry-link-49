
import React, { useState } from 'react';
import { useWorkshops } from '@/hooks/useWorkshops';
import { WorkshopRegistration } from '@/components/admin/WorkshopRegistration';
import WorkshopMarketplaceHeader from './WorkshopMarketplaceHeader';
import WorkshopSearchFilters from './WorkshopSearchFilters';
import WorkshopGrid from './WorkshopGrid';

const WorkshopMarketplace: React.FC = () => {
  const [searchCity, setSearchCity] = useState('');
  const [searchCountry, setSearchCountry] = useState('');
  const [showRegistration, setShowRegistration] = useState(false);
  const { workshops, connectToWorkshop, searchWorkshops, isConnecting, isLoading } = useWorkshops();

  const handleSearch = () => {
    // Combine city and country into a single search query
    const searchQuery = [searchCity, searchCountry].filter(Boolean).join(', ');
    searchWorkshops(searchQuery);
  };

  return (
    <div className="space-y-6">
      <WorkshopMarketplaceHeader 
        onRegisterWorkshop={() => setShowRegistration(true)}
      />

      <WorkshopSearchFilters
        searchCity={searchCity}
        searchCountry={searchCountry}
        isLoading={isLoading}
        onCityChange={setSearchCity}
        onCountryChange={setSearchCountry}
        onSearch={handleSearch}
      />

      <WorkshopGrid
        workshops={workshops}
        isLoading={isLoading}
        isConnecting={isConnecting}
        onConnect={connectToWorkshop}
      />

      <WorkshopRegistration
        isOpen={showRegistration}
        onClose={() => setShowRegistration(false)}
        onSubmit={(data) => {
          console.log('Workshop registration data:', data);
          setShowRegistration(false);
        }}
        userRole="user"
      />
    </div>
  );
};

export default WorkshopMarketplace;
