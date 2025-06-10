
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

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
      <CardHeader>
        <CardTitle className="text-lg">Search Workshops</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex gap-4">
          <div className="flex-1">
            <Input
              placeholder="Search by city..."
              value={searchCity}
              onChange={(e) => onCityChange(e.target.value)}
            />
          </div>
          <div className="flex-1">
            <Input
              placeholder="Search by country..."
              value={searchCountry}
              onChange={(e) => onCountryChange(e.target.value)}
            />
          </div>
          <Button onClick={onSearch} disabled={isLoading}>
            <Search className="h-4 w-4 mr-2" />
            Search
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default WorkshopSearchFilters;
