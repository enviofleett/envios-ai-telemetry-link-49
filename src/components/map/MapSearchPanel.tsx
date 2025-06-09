import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, MapPin, Navigation, Clock, Bookmark } from 'lucide-react';

interface SearchResult {
  id: string;
  name: string;
  address: string;
  lat: number;
  lon: number;
  type: 'address' | 'business' | 'landmark';
  distance?: number; // Distance from current location in km
}

interface RecentSearch {
  id: string;
  query: string;
  result: SearchResult;
  timestamp: string;
}

interface MapSearchPanelProps {
  onLocationSelect?: (result: SearchResult) => void;
  onNavigateToLocation?: (result: SearchResult) => void;
  currentLocation?: { lat: number; lon: number };
  className?: string;
}

const MapSearchPanel: React.FC<MapSearchPanelProps> = ({
  onLocationSelect,
  onNavigateToLocation,
  currentLocation,
  className = ""
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [recentSearches, setRecentSearches] = useState<RecentSearch[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedResult, setSelectedResult] = useState<SearchResult | null>(null);

  // Mock geocoding function - in real app, this would call a geocoding API
  const performSearch = async (query: string): Promise<SearchResult[]> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));

    // Mock search results with proper type literals
    const mockResults: SearchResult[] = [
      {
        id: '1',
        name: 'Main Street Office',
        address: '123 Main Street, Downtown',
        lat: -26.2041,
        lon: 28.0473,
        type: 'business' as const
      },
      {
        id: '2',
        name: 'Shopping Mall',
        address: '456 Commerce Ave, City Center',
        lat: -26.1950,
        lon: 28.0536,
        type: 'business' as const
      },
      {
        id: '3',
        name: 'Airport Terminal',
        address: 'International Airport, Terminal 1',
        lat: -26.1367,
        lon: 28.2411,
        type: 'landmark' as const
      }
    ].filter(result => 
      result.name.toLowerCase().includes(query.toLowerCase()) ||
      result.address.toLowerCase().includes(query.toLowerCase())
    );

    // Calculate distances if current location is available
    if (currentLocation) {
      mockResults.forEach(result => {
        const distance = calculateDistance(
          currentLocation.lat,
          currentLocation.lon,
          result.lat,
          result.lon
        );
        result.distance = Math.round(distance * 10) / 10; // Round to 1 decimal
      });
    }

    return mockResults;
  };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Radius of the Earth in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      const results = await performSearch(searchQuery);
      setSearchResults(results);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleResultSelect = (result: SearchResult) => {
    setSelectedResult(result);
    onLocationSelect?.(result);

    // Add to recent searches
    const newSearch: RecentSearch = {
      id: Date.now().toString(),
      query: searchQuery,
      result,
      timestamp: new Date().toISOString()
    };

    setRecentSearches(prev => {
      const filtered = prev.filter(search => search.result.id !== result.id);
      return [newSearch, ...filtered].slice(0, 5); // Keep only 5 recent searches
    });
  };

  const handleNavigate = (result: SearchResult) => {
    onNavigateToLocation?.(result);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'business': return '🏢';
      case 'landmark': return '🗺️';
      case 'address': return '🏠';
      default: return '📍';
    }
  };

  const getTypeBadgeColor = (type: string) => {
    switch (type) {
      case 'business': return 'bg-blue-100 text-blue-800';
      case 'landmark': return 'bg-green-100 text-green-800';
      case 'address': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Handle Enter key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Search className="h-5 w-5" />
          Location Search
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Search Input */}
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search for addresses, businesses, landmarks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              className="pl-10"
            />
          </div>
          <Button 
            onClick={handleSearch} 
            disabled={!searchQuery.trim() || isSearching}
          >
            {isSearching ? 'Searching...' : 'Search'}
          </Button>
        </div>

        {/* Selected Result */}
        {selectedResult && (
          <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-lg">{getTypeIcon(selectedResult.type)}</span>
                <div>
                  <div className="font-medium">{selectedResult.name}</div>
                  <div className="text-sm text-gray-600">{selectedResult.address}</div>
                </div>
              </div>
              <Badge className="bg-blue-100 text-blue-800">Selected</Badge>
            </div>
          </div>
        )}

        {/* Search Results */}
        {searchResults.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-700">Search Results</h4>
            {searchResults.map((result) => (
              <div 
                key={result.id}
                className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={() => handleResultSelect(result)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{getTypeIcon(result.type)}</span>
                    <div className="flex-1">
                      <div className="font-medium">{result.name}</div>
                      <div className="text-sm text-gray-600">{result.address}</div>
                      {result.distance && (
                        <div className="text-xs text-blue-600 mt-1">
                          {result.distance} km away
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Badge className={getTypeBadgeColor(result.type)}>
                      {result.type}
                    </Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleNavigate(result);
                      }}
                    >
                      <Navigation className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Recent Searches */}
        {recentSearches.length > 0 && searchResults.length === 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Recent Searches
            </h4>
            {recentSearches.map((search) => (
              <div 
                key={search.id}
                className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={() => handleResultSelect(search.result)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{getTypeIcon(search.result.type)}</span>
                    <div>
                      <div className="font-medium">{search.result.name}</div>
                      <div className="text-sm text-gray-600">{search.result.address}</div>
                      <div className="text-xs text-gray-400">
                        Searched: {new Date(search.timestamp).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleNavigate(search.result);
                    }}
                  >
                    <Navigation className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* No Results */}
        {searchResults.length === 0 && searchQuery && !isSearching && (
          <div className="text-center py-6">
            <MapPin className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-500">No locations found</p>
            <p className="text-sm text-gray-400">Try a different search term</p>
          </div>
        )}

        {/* Help Text */}
        {!searchQuery && searchResults.length === 0 && recentSearches.length === 0 && (
          <div className="text-center py-6">
            <Search className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-500">Search for any location</p>
            <p className="text-sm text-gray-400">
              Enter an address, business name, or landmark
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MapSearchPanel;
