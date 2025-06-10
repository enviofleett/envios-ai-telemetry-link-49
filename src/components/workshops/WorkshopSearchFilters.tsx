
import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Search, MapPin, Building } from 'lucide-react';

interface WorkshopSearchFiltersProps {
  searchCity: string;
  searchCountry: string;
  isLoading: boolean;
  onCityChange: (city: string) => void;
  onCountryChange: (country: string) => void;
  onSearch: () => void;
}

const WorkshopSearchFilters: React.FC<WorkshopSearchFiltersProps> = ({
  searchCity,
  searchCountry,
  isLoading,
  onCityChange,
  onCountryChange,
  onSearch
}) => {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by city..."
              value={searchCity}
              onChange={(e) => onCityChange(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <div className="relative flex-1">
            <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by country..."
              value={searchCountry}
              onChange={(e) => onCountryChange(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Button 
            onClick={onSearch} 
            disabled={isLoading}
            className="md:w-auto w-full"
          >
            <Search className="h-4 w-4 mr-2" />
            {isLoading ? 'Searching...' : 'Search'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default WorkshopSearchFilters;
