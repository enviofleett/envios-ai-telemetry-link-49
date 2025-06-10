
import React, { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Search, X, Filter, Calendar, MapPin, Star } from 'lucide-react';

interface SearchFilter {
  id: string;
  label: string;
  type: 'text' | 'select' | 'date' | 'rating' | 'location';
  options?: { value: string; label: string }[];
  value?: any;
}

interface EnhancedSearchProps {
  placeholder?: string;
  filters?: SearchFilter[];
  onSearch: (query: string, filters: Record<string, any>) => void;
  suggestions?: string[];
  showAdvancedFilters?: boolean;
  className?: string;
}

const EnhancedSearch: React.FC<EnhancedSearchProps> = ({
  placeholder = "Search...",
  filters = [],
  onSearch,
  suggestions = [],
  showAdvancedFilters = true,
  className = ""
}) => {
  const [query, setQuery] = useState('');
  const [activeFilters, setActiveFilters] = useState<Record<string, any>>({});
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filteredSuggestions, setFilteredSuggestions] = useState<string[]>([]);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (query && suggestions.length > 0) {
      const filtered = suggestions.filter(suggestion =>
        suggestion.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 5);
      setFilteredSuggestions(filtered);
      setShowSuggestions(filtered.length > 0);
    } else {
      setShowSuggestions(false);
    }
  }, [query, suggestions]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = () => {
    onSearch(query, activeFilters);
    setShowSuggestions(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion);
    setShowSuggestions(false);
    onSearch(suggestion, activeFilters);
  };

  const updateFilter = (filterId: string, value: any) => {
    const newFilters = { ...activeFilters };
    if (value === null || value === '' || value === undefined) {
      delete newFilters[filterId];
    } else {
      newFilters[filterId] = value;
    }
    setActiveFilters(newFilters);
  };

  const clearFilter = (filterId: string) => {
    const newFilters = { ...activeFilters };
    delete newFilters[filterId];
    setActiveFilters(newFilters);
  };

  const clearAllFilters = () => {
    setActiveFilters({});
    setQuery('');
  };

  const renderFilterInput = (filter: SearchFilter) => {
    const value = activeFilters[filter.id] || '';

    switch (filter.type) {
      case 'select':
        return (
          <select
            value={value}
            onChange={(e) => updateFilter(filter.id, e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">All {filter.label}</option>
            {filter.options?.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );

      case 'date':
        return (
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              type="date"
              value={value}
              onChange={(e) => updateFilter(filter.id, e.target.value)}
              className="pl-10 text-sm"
            />
          </div>
        );

      case 'rating':
        return (
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map(rating => (
              <button
                key={rating}
                onClick={() => updateFilter(filter.id, rating)}
                className={`p-1 rounded ${
                  value === rating ? 'bg-yellow-400' : 'bg-gray-200'
                }`}
              >
                <Star className={`h-4 w-4 ${
                  value === rating ? 'text-white' : 'text-gray-400'
                }`} />
              </button>
            ))}
          </div>
        );

      case 'location':
        return (
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              value={value}
              onChange={(e) => updateFilter(filter.id, e.target.value)}
              placeholder="Enter location..."
              className="pl-10 text-sm"
            />
          </div>
        );

      default:
        return (
          <Input
            value={value}
            onChange={(e) => updateFilter(filter.id, e.target.value)}
            placeholder={`Filter by ${filter.label.toLowerCase()}...`}
            className="text-sm"
          />
        );
    }
  };

  const getActiveFilterCount = () => {
    return Object.keys(activeFilters).filter(key => activeFilters[key] !== '').length;
  };

  return (
    <div ref={searchRef} className={`relative ${className}`}>
      {/* Main Search Bar */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={placeholder}
            className="pl-10 pr-4"
          />

          {/* Search Suggestions */}
          {showSuggestions && (
            <Card className="absolute top-full left-0 right-0 z-50 mt-1 max-h-60 overflow-y-auto">
              <CardContent className="p-0">
                {filteredSuggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="w-full text-left px-4 py-2 hover:bg-gray-50 border-b last:border-b-0"
                  >
                    <div className="flex items-center">
                      <Search className="h-4 w-4 text-gray-400 mr-3" />
                      {suggestion}
                    </div>
                  </button>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        <Button onClick={handleSearch} className="shrink-0">
          Search
        </Button>

        {showAdvancedFilters && filters.length > 0 && (
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="shrink-0"
          >
            <Filter className="h-4 w-4 mr-2" />
            Filters
            {getActiveFilterCount() > 0 && (
              <Badge variant="secondary" className="ml-2 h-5 min-w-5 p-0 flex items-center justify-center">
                {getActiveFilterCount()}
              </Badge>
            )}
          </Button>
        )}
      </div>

      {/* Active Filters */}
      {Object.keys(activeFilters).length > 0 && (
        <div className="flex flex-wrap gap-2 mt-3">
          {Object.entries(activeFilters).map(([filterId, value]) => {
            if (!value) return null;
            const filter = filters.find(f => f.id === filterId);
            if (!filter) return null;

            return (
              <Badge key={filterId} variant="secondary" className="flex items-center gap-1">
                {filter.label}: {value}
                <button
                  onClick={() => clearFilter(filterId)}
                  className="ml-1 hover:bg-gray-300 rounded-full p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            );
          })}
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAllFilters}
            className="h-6 px-2 text-xs"
          >
            Clear all
          </Button>
        </div>
      )}

      {/* Advanced Filters Panel */}
      {showFilters && (
        <Card className="mt-3">
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filters.map(filter => (
                <div key={filter.id}>
                  <label className="block text-sm font-medium mb-2">
                    {filter.label}
                  </label>
                  {renderFilterInput(filter)}
                </div>
              ))}
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => setShowFilters(false)}>
                Close
              </Button>
              <Button onClick={handleSearch}>
                Apply Filters
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default EnhancedSearch;
