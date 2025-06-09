
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { MapPin } from 'lucide-react';

interface SimpleMapPlaceholderProps {
  vehicles?: any[];
  height?: string;
  title?: string;
}

const SimpleMapPlaceholder: React.FC<SimpleMapPlaceholderProps> = ({
  vehicles = [],
  height = '400px',
  title = 'Map Integration'
}) => {
  return (
    <Card>
      <CardContent className="p-0">
        <div 
          className="flex items-center justify-center bg-gray-50 rounded-lg"
          style={{ height }}
        >
          <div className="text-center">
            <MapPin className="h-16 w-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">{title}</h3>
            <p className="text-gray-500 mb-2">Ready for implementation</p>
            {vehicles.length > 0 && (
              <p className="text-sm text-gray-400">
                {vehicles.length} vehicles ready for mapping
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SimpleMapPlaceholder;
