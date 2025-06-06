
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Type } from 'lucide-react';

interface BrandingConfig {
  primary_color: string;
  accent_color: string;
  background_color: string;
  text_color: string;
  font_family_heading: string;
  font_family_body: string;
  font_size_scale: string;
  button_style: string;
}

interface TypographyCardProps {
  brandingConfig: BrandingConfig;
  setBrandingConfig: React.Dispatch<React.SetStateAction<BrandingConfig>>;
}

const fontOptions = {
  heading: [
    { value: 'Inter', label: 'Inter (Modern)' },
    { value: 'Roboto', label: 'Roboto (Clean)' },
    { value: 'Open Sans', label: 'Open Sans (Friendly)' },
    { value: 'Poppins', label: 'Poppins (Rounded)' }
  ],
  body: [
    { value: 'Inter', label: 'Inter' },
    { value: 'Roboto', label: 'Roboto' },
    { value: 'Open Sans', label: 'Open Sans' },
    { value: 'Source Sans Pro', label: 'Source Sans Pro' }
  ]
};

const TypographyCard: React.FC<TypographyCardProps> = ({
  brandingConfig,
  setBrandingConfig
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Type className="h-5 w-5" />
          Typography Settings
        </CardTitle>
        <CardDescription>
          Configure fonts and text styling for your platform
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="heading-font">Heading Font</Label>
              <Select
                value={brandingConfig.font_family_heading}
                onValueChange={(value) => setBrandingConfig(prev => ({
                  ...prev, 
                  font_family_heading: value
                }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {fontOptions.heading.map((font) => (
                    <SelectItem key={font.value} value={font.value}>
                      {font.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="body-font">Body Font</Label>
              <Select
                value={brandingConfig.font_family_body}
                onValueChange={(value) => setBrandingConfig(prev => ({
                  ...prev, 
                  font_family_body: value
                }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {fontOptions.body.map((font) => (
                    <SelectItem key={font.value} value={font.value}>
                      {font.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="font-size">Font Size Scale</Label>
              <Select
                value={brandingConfig.font_size_scale}
                onValueChange={(value) => setBrandingConfig(prev => ({
                  ...prev, 
                  font_size_scale: value
                }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="small">Small</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="large">Large</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-4">
            <Label>Typography Preview</Label>
            <div className="border rounded-lg p-4 space-y-3">
              <h1 
                className="text-2xl font-bold"
                style={{ fontFamily: brandingConfig.font_family_heading }}
              >
                Heading Example
              </h1>
              <h2 
                className="text-lg font-semibold"
                style={{ fontFamily: brandingConfig.font_family_heading }}
              >
                Subheading Example
              </h2>
              <p 
                className="text-sm"
                style={{ fontFamily: brandingConfig.font_family_body }}
              >
                This is sample body text that shows how your content will appear with the selected typography settings. It demonstrates readability and visual hierarchy.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TypographyCard;
