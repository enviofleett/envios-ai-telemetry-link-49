
```tsx
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Store, LogIn, UserPlus } from 'lucide-react';
import { Link } from 'react-router-dom';

interface MarketplaceBannerProps {
  onMerchantLogin: () => void;
}

export const MarketplaceBanner: React.FC<MarketplaceBannerProps> = ({
  onMerchantLogin,
}) => {
  return (
    <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-lg bg-green-100 flex items-center justify-center">
              <Store className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Join Our Marketplace</h3>
              <p className="text-muted-foreground">
                Start selling your products and services to thousands of fleet owners. 
                Easy setup, secure payments, and dedicated support.
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onMerchantLogin}>
              <LogIn className="h-4 w-4 mr-2" />
              Login
            </Button>
            <Button asChild className="bg-green-600 hover:bg-green-700">
              <Link to="/merchant-application">
                <UserPlus className="h-4 w-4 mr-2" />
                Register Your Store
              </Link>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
```
