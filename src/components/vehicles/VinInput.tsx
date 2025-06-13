
import React, { useState, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { VinApiService } from '@/services/vinApiService';
import { Loader2, Search, CheckCircle, XCircle } from 'lucide-react';

interface VinInputProps {
  value: string;
  onChange: (value: string) => void;
  onVinDecoded?: (data: {
    make: string;
    model: string;
    year: string;
    engine?: string;
    fuelType?: string;
    bodyStyle?: string;
  }) => void;
  disabled?: boolean;
  required?: boolean;
}

export default function VinInput({
  value,
  onChange,
  onVinDecoded,
  disabled = false,
  required = true
}: VinInputProps) {
  const { toast } = useToast();
  const [isDecoding, setIsDecoding] = useState(false);
  const [decodeStatus, setDecodeStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [lastDecodedVin, setLastDecodedVin] = useState<string>('');

  const validateVin = (vin: string): boolean => {
    // Basic VIN validation
    if (vin.length !== 17) return false;
    const vinRegex = /^[A-HJ-NPR-Z0-9]{17}$/;
    return vinRegex.test(vin.toUpperCase());
  };

  const decodeVin = useCallback(async (vin: string) => {
    if (!vin || vin === lastDecodedVin) return;

    if (!validateVin(vin)) {
      setDecodeStatus('error');
      toast({
        title: "Invalid VIN",
        description: "VIN must be exactly 17 characters and contain only valid characters",
        variant: "destructive"
      });
      return;
    }

    setIsDecoding(true);
    setDecodeStatus('idle');

    try {
      const result = await VinApiService.decodeVin(vin.toUpperCase());

      if (result.success && result.data) {
        setDecodeStatus('success');
        setLastDecodedVin(vin);
        
        toast({
          title: "VIN Decoded Successfully",
          description: `Found: ${result.data.year} ${result.data.make} ${result.data.model}`
        });

        onVinDecoded?.(result.data);
      } else {
        setDecodeStatus('error');
        toast({
          title: "VIN Decode Failed",
          description: result.error || "Unable to decode VIN",
          variant: "destructive"
        });
      }
    } catch (error) {
      setDecodeStatus('error');
      toast({
        title: "VIN Decode Error",
        description: "VIN decoding service is temporarily unavailable",
        variant: "destructive"
      });
    } finally {
      setIsDecoding(false);
    }
  }, [lastDecodedVin, onVinDecoded, toast]);

  const handleVinChange = (newValue: string) => {
    const upperValue = newValue.toUpperCase();
    onChange(upperValue);
    
    // Reset status when VIN changes
    if (upperValue !== lastDecodedVin) {
      setDecodeStatus('idle');
    }
  };

  const handleBlur = () => {
    if (value && value.length === 17 && value !== lastDecodedVin) {
      decodeVin(value);
    }
  };

  const handleManualDecode = () => {
    if (value) {
      decodeVin(value);
    }
  };

  const getStatusIcon = () => {
    switch (decodeStatus) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-2">
      <Label htmlFor="vin">
        VIN (Vehicle Identification Number) {required && '*'}
      </Label>
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Input
            id="vin"
            value={value}
            onChange={(e) => handleVinChange(e.target.value)}
            onBlur={handleBlur}
            placeholder="Enter 17-character VIN"
            maxLength={17}
            disabled={disabled}
            className={`pr-10 ${
              decodeStatus === 'success' ? 'border-green-500' : 
              decodeStatus === 'error' ? 'border-red-500' : ''
            }`}
          />
          {getStatusIcon() && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              {getStatusIcon()}
            </div>
          )}
        </div>
        
        <Button
          type="button"
          variant="outline"
          onClick={handleManualDecode}
          disabled={disabled || isDecoding || !value || value.length !== 17}
        >
          {isDecoding ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Search className="h-4 w-4" />
          )}
          Decode
        </Button>
      </div>
      
      <div className="text-xs text-muted-foreground">
        {value.length}/17 characters
        {decodeStatus === 'success' && lastDecodedVin === value && (
          <span className="text-green-600 ml-2">✓ VIN decoded successfully</span>
        )}
        {decodeStatus === 'error' && (
          <span className="text-red-600 ml-2">✗ VIN decode failed</span>
        )}
      </div>
    </div>
  );
}
