
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { CheckCircle } from 'lucide-react';

interface ProviderConfig {
  name: string;
  description: string;
  pricing: string;
}

interface ProviderCardProps {
  providerKey: string;
  provider: ProviderConfig;
  isSelected: boolean;
  onSelect: (key: string) => void;
}

const ProviderCard: React.FC<ProviderCardProps> = ({
  providerKey,
  provider,
  isSelected,
  onSelect
}) => {
  return (
    <div
      className={`border rounded-lg p-4 cursor-pointer transition-all ${
        isSelected 
          ? 'border-primary bg-primary/5' 
          : 'border-gray-200 hover:border-gray-300'
      }`}
      onClick={() => onSelect(providerKey)}
    >
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-medium">{provider.name}</h4>
        {isSelected && (
          <CheckCircle className="h-4 w-4 text-primary" />
        )}
      </div>
      <p className="text-xs text-gray-600 mb-2">{provider.description}</p>
      <Badge variant="outline" className="text-xs">
        {provider.pricing.split(',')[0]}
      </Badge>
    </div>
  );
};

export default ProviderCard;
