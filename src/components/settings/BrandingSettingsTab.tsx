
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Palette } from 'lucide-react';

const BrandingSettingsTab: React.FC = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Palette className="h-5 w-5" />
          Branding & Appearance
        </CardTitle>
        <CardDescription>
          Customize the look and feel of your fleet management platform
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="company-logo">Company Logo</Label>
            <Input
              id="company-logo"
              type="file"
              accept="image/*"
              className="cursor-pointer"
            />
            <p className="text-sm text-muted-foreground">
              Upload your company logo (recommended: 200x60px)
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="primary-color">Primary Brand Color</Label>
            <div className="flex gap-2">
              <Input
                id="primary-color"
                type="color"
                defaultValue="#2563eb"
                className="w-20 h-10"
              />
              <Input
                placeholder="#2563eb"
                className="flex-1"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="company-name">Display Name</Label>
            <Input
              id="company-name"
              placeholder="Your Company Name"
            />
          </div>
        </div>

        <Button>Save Branding Settings</Button>
      </CardContent>
    </Card>
  );
};

export default BrandingSettingsTab;
