
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';

export interface CurrencyContextType {
  currencyCode: string;
  currencySymbol: string;
  currencyFormat: string;
  formatCurrency: (amount: number) => string;
  isLoading: boolean;
  refreshCurrency: () => Promise<void>;
}

const defaultCurrency: CurrencyContextType = {
  currencyCode: 'USD',
  currencySymbol: '$',
  currencyFormat: 'en-US',
  formatCurrency: (amount: number) => `$${amount.toFixed(2)}`,
  isLoading: false,
  refreshCurrency: async () => {},
};

const CurrencyContext = createContext<CurrencyContextType>(defaultCurrency);

export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
};

interface CurrencyProviderProps {
  children: ReactNode;
}

export const CurrencyProvider: React.FC<CurrencyProviderProps> = ({ children }) => {
  const [currency, setCurrency] = useState<CurrencyContextType>(defaultCurrency);
  const { user } = useAuth();

  const fetchCurrency = async () => {
    if (!user?.id) return;

    setCurrency(prev => ({ ...prev, isLoading: true }));

    try {
      const { data, error } = await supabase
        .from('company_settings')
        .select('currency_code, currency_symbol, currency_format')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error fetching currency:', error);
        setCurrency(prev => ({ ...prev, isLoading: false }));
        return;
      }

      const currencyCode = data?.currency_code || defaultCurrency.currencyCode;
      const currencySymbol = data?.currency_symbol || defaultCurrency.currencySymbol;
      const currencyFormat = data?.currency_format || defaultCurrency.currencyFormat;

      const formatCurrency = (amount: number) => {
        try {
          return new Intl.NumberFormat(currencyFormat, {
            style: 'currency',
            currency: currencyCode,
          }).format(amount);
        } catch (error) {
          return `${currencySymbol}${amount.toFixed(2)}`;
        }
      };

      setCurrency({
        currencyCode,
        currencySymbol,
        currencyFormat,
        formatCurrency,
        isLoading: false,
        refreshCurrency: fetchCurrency,
      });
    } catch (error) {
      console.error('Error in fetchCurrency:', error);
      setCurrency(prev => ({ ...prev, isLoading: false }));
    }
  };

  useEffect(() => {
    fetchCurrency();
  }, [user?.id]);

  return (
    <CurrencyContext.Provider value={currency}>
      {children}
    </CurrencyContext.Provider>
  );
};
