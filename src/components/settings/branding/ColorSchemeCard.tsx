
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Palette } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

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

interface ColorSchemeCardProps {
  brandingConfig: BrandingConfig;
  setBrandingConfig: React.Dispatch<React.SetStateAction<BrandingConfig>>;
}

const colorThemes = {
  envio: {
    name: 'Envio Default',
    primary_color: '#0066cc',
    accent_color: '#0052a3',
    background_color: '#ffffff',
    text_color: '#1f2937'
  },
  dark: {
    name: 'Dark Professional',
    primary_color: '#3b82f6',
    accent_color: '#2563eb',
    background_color: '#0f172a',
    text_color: '#f8fafc'
  },
  corporate: {
    name: 'Corporate Blue',
    primary_color: '#1e40af',
    accent_color: '#1d4ed8',
    background_color: '#f8fafc',
    text_color: '#0f172a'
  }
};

const ColorSchemeCard: React.FC<ColorSchemeCardProps> = ({
  brandingConfig,
  setBrandingConfig
}) => {
  const { toast } = useToast();

  const applyColorTheme = (themeKey: string) => {
    const theme = colorThemes[themeKey as keyof typeof colorThemes];
    if (theme) {
      setBrandingConfig(prev => ({
        ...prev,
        primary_color: theme.primary_color,
        accent_color: theme.accent_color,
        background_color: theme.background_color,
        text_color: theme.text_color
      }));
      toast({
        title: "Theme Applied",
        description: `${theme.name} theme has been applied`
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Palette className="h-5 w-5" />
          Color Scheme
        </CardTitle>
        <CardDescription>
          Customize your platform's color palette
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Theme Templates */}
        <div className="space-y-3">
          <Label>Quick Themes</Label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {Object.entries(colorThemes).map(([key, theme]) => (
              <Button
                key={key}
                variant="outline"
                className="h-auto p-4 flex flex-col items-start"
                onClick={() => applyColorTheme(key)}
              >
                <div className="flex items-center gap-2 mb-2">
                  <div 
                    className="w-4 h-4 rounded"
                    style={{ backgroundColor: theme.primary_color }}
                  />
                  <span className="font-medium">{theme.name}</span>
                </div>
                <div className="flex gap-1">
                  <div 
                    className="w-3 h-3 rounded"
                    style={{ backgroundColor: theme.primary_color }}
                  />
                  <div 
                    className="w-3 h-3 rounded"
                    style={{ backgroundColor: theme.accent_color }}
                  />
                  <div 
                    className="w-3 h-3 rounded border"
                    style={{ backgroundColor: theme.background_color }}
                  />
                </div>
              </Button>
            ))}
          </div>
        </div>

        {/* Custom Colors */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="space-y-2">
            <Label htmlFor="primary-color">Primary Color</Label>
            <div className="flex gap-2">
              <Input
                id="primary-color"
                type="color"
                value={brandingConfig.primary_color}
                onChange={(e) => setBrandingConfig(prev => ({
                  ...prev, 
                  primary_color: e.target.value
                }))}
                className="w-12 h-10 p-1 border rounded"
              />
              <Input
                value={brandingConfig.primary_color}
                onChange={(e) => setBrandingConfig(prev => ({
                  ...prev, 
                  primary_color: e.target.value
                }))}
                placeholder="#0066cc"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="accent-color">Accent Color</Label>
            <div className="flex gap-2">
              <Input
                id="accent-color"
                type="color"
                value={brandingConfig.accent_color}
                onChange={(e) => setBrandingConfig(prev => ({
                  ...prev, 
                  accent_color: e.target.value
                }))}
                className="w-12 h-10 p-1 border rounded"
              />
              <Input
                value={brandingConfig.accent_color}
                onChange={(e) => setBrandingConfig(prev => ({
                  ...prev, 
                  accent_color: e.target.value
                }))}
                placeholder="#0052a3"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="background-color">Background</Label>
            <div className="flex gap-2">
              <Input
                id="background-color"
                type="color"
                value={brandingConfig.background_color}
                onChange={(e) => setBrandingConfig(prev => ({
                  ...prev, 
                  background_color: e.target.value
                }))}
                className="w-12 h-10 p-1 border rounded"
              />
              <Input
                value={brandingConfig.background_color}
                onChange={(e) => setBrandingConfig(prev => ({
                  ...prev, 
                  background_color: e.target.value
                }))}
                placeholder="#ffffff"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="text-color">Text Color</Label>
            <div className="flex gap-2">
              <Input
                id="text-color"
                type="color"
                value={brandingConfig.text_color}
                onChange={(e) => setBrandingConfig(prev => ({
                  ...prev, 
                  text_color: e.target.value
                }))}
                className="w-12 h-10 p-1 border rounded"
              />
              <Input
                value={brandingConfig.text_color}
                onChange={(e) => setBrandingConfig(prev => ({
                  ...prev, 
                  text_color: e.target.value
                }))}
                placeholder="#1f2937"
              />
            </div>
          </div>
        </div>

        {/* Live Preview */}
        <div className="space-y-2">
          <Label>Color Preview</Label>
          <div 
            className="border rounded-lg p-4"
            style={{ 
              backgroundColor: brandingConfig.background_color,
              color: brandingConfig.text_color 
            }}
          >
            <h4 className="font-semibold mb-2">Sample Interface</h4>
            <p className="text-sm mb-3">This is how your text will appear with the selected colors.</p>
            <div className="flex gap-2">
              <button 
                className="px-3 py-1 rounded text-white text-sm"
                style={{ backgroundColor: brandingConfig.primary_color }}
              >
                Primary Button
              </button>
              <button 
                className="px-3 py-1 rounded text-white text-sm"
                style={{ backgroundColor: brandingConfig.accent_color }}
              >
                Accent Button
              </button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ColorSchemeCard;
