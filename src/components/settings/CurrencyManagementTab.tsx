
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { useCurrencySettings } from '@/hooks/useCurrencySettings';
import { useCurrency } from '@/contexts/CurrencyContext';
import { DollarSign, Globe, TrendingUp } from 'lucide-react';

const currencies = [
  { code: 'USD', symbol: '$', name: 'US Dollar', format: 'en-US' },
  { code: 'EUR', symbol: '€', name: 'Euro', format: 'de-DE' },
  { code: 'GBP', symbol: '£', name: 'British Pound', format: 'en-GB' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen', format: 'ja-JP' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar', format: 'en-CA' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar', format: 'en-AU' },
  { code: 'CHF', symbol: 'Fr', name: 'Swiss Franc', format: 'de-CH' },
  { code: 'CNY', symbol: '¥', name: 'Chinese Yuan', format: 'zh-CN' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee', format: 'en-IN' },
  { code: 'BRL', symbol: 'R$', name: 'Brazilian Real', format: 'pt-BR' },
  { code: 'ZAR', symbol: 'R', name: 'South African Rand', format: 'en-ZA' },
  { code: 'NGN', symbol: '₦', name: 'Nigerian Naira', format: 'en-NG' },
];

const CurrencyManagementTab: React.FC = () => {
  const { settings, isLoading, isSaving, updateCurrencySettings } = useCurrencySettings();
  const { formatCurrency } = useCurrency();

  const handleCurrencyChange = (currencyCode: string) => {
    const selectedCurrency = currencies.find(c => c.code === currencyCode);
    if (selectedCurrency) {
      updateCurrencySettings({
        currency_code: selectedCurrency.code,
        currency_symbol: selectedCurrency.symbol,
        currency_format: selectedCurrency.format,
      });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-96" />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Currency Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Currency Configuration
          </CardTitle>
          <CardDescription>
            Set the currency used throughout your platform for pricing and billing
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="currency-select">Currency</Label>
              <Select 
                value={settings.currency_code}
                onValueChange={handleCurrencyChange}
                disabled={isSaving}
              >
                <SelectTrigger id="currency-select">
                  <SelectValue placeholder="Select currency" />
                </SelectTrigger>
                <SelectContent>
                  {currencies.map((currency) => (
                    <SelectItem key={currency.code} value={currency.code}>
                      <div className="flex items-center gap-2">
                        <span className="font-mono">{currency.symbol}</span>
                        <span>{currency.code}</span>
                        <span className="text-muted-foreground">- {currency.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="currency-symbol">Currency Symbol</Label>
              <Input
                id="currency-symbol"
                value={settings.currency_symbol}
                onChange={(e) => updateCurrencySettings({ currency_symbol: e.target.value })}
                disabled={isSaving}
                placeholder="$"
                className="font-mono"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="currency-format">Locale Format</Label>
            <Input
              id="currency-format"
              value={settings.currency_format}
              onChange={(e) => updateCurrencySettings({ currency_format: e.target.value })}
              disabled={isSaving}
              placeholder="en-US"
              className="font-mono"
            />
            <p className="text-xs text-muted-foreground">
              Locale format affects number formatting and currency display (e.g., en-US, de-DE, ja-JP)
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Currency Preview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Currency Preview
          </CardTitle>
          <CardDescription>
            Preview how currency values will be displayed across the platform
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { label: 'Service Fee', amount: 29.99 },
              { label: 'Monthly Subscription', amount: 149.00 },
              { label: 'Device Cost', amount: 299.99 },
              { label: 'Maintenance Fee', amount: 75.50 },
              { label: 'Total Invoice', amount: 1234.56 },
              { label: 'Discount', amount: -50.00 },
            ].map(({ label, amount }) => (
              <div key={label} className="p-4 border rounded-lg">
                <div className="text-sm text-muted-foreground">{label}</div>
                <div className="text-lg font-semibold font-mono">
                  {formatCurrency(amount)}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Regional Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Regional Settings
          </CardTitle>
          <CardDescription>
            Current currency and formatting information
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-muted/50 rounded-lg">
              <div className="text-sm font-medium">Currency Code</div>
              <div className="text-lg font-mono">{settings.currency_code}</div>
            </div>
            <div className="p-4 bg-muted/50 rounded-lg">
              <div className="text-sm font-medium">Symbol</div>
              <div className="text-lg font-mono">{settings.currency_symbol}</div>
            </div>
            <div className="p-4 bg-muted/50 rounded-lg">
              <div className="text-sm font-medium">Locale</div>
              <div className="text-lg font-mono">{settings.currency_format}</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CurrencyManagementTab;
