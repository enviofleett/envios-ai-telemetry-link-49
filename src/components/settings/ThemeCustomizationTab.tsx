
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useTheme } from '@/components/settings/branding/ThemeProvider';
import { themePresets } from '@/components/settings/branding/ThemePresets';
import type { ThemeConfig } from '@/components/settings/branding/ThemeProvider';
import { 
  Palette, 
  Type, 
  Layout, 
  Monitor,
  Smartphone,
  Save,
  RotateCcw,
  Download,
  Upload,
  Eye,
  Settings
} from 'lucide-react';

const ThemeCustomizationTab: React.FC = () => {
  const { toast } = useToast();
  const { currentTheme, setTheme, resetTheme, applyTheme, isLoading } = useTheme();
  const [workingTheme, setWorkingTheme] = useState<ThemeConfig>(currentTheme);
  const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('desktop');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  useEffect(() => {
    setWorkingTheme(currentTheme);
  }, [currentTheme]);

  useEffect(() => {
    const hasChanges = JSON.stringify(workingTheme) !== JSON.stringify(currentTheme);
    setHasUnsavedChanges(hasChanges);
  }, [workingTheme, currentTheme]);

  const handlePresetSelect = (presetId: string) => {
    const preset = themePresets.find(p => p.id === presetId);
    if (preset) {
      const newTheme = {
        ...preset,
        id: workingTheme.id,
        name: preset.name
      };
      setWorkingTheme(newTheme);
      applyTheme(newTheme); // Apply immediately for preview
    }
  };

  const handleColorChange = (colorKey: keyof ThemeConfig['colors'], value: string) => {
    const newTheme = {
      ...workingTheme,
      colors: {
        ...workingTheme.colors,
        [colorKey]: value
      }
    };
    setWorkingTheme(newTheme);
    applyTheme(newTheme); // Apply immediately for preview
  };

  const handleTypographyChange = (key: keyof ThemeConfig['typography'], value: string | number) => {
    const newTheme = {
      ...workingTheme,
      typography: {
        ...workingTheme.typography,
        [key]: value
      }
    };
    setWorkingTheme(newTheme);
    applyTheme(newTheme);
  };

  const handleLayoutChange = (key: keyof ThemeConfig['layout'], value: any) => {
    const newTheme = {
      ...workingTheme,
      layout: {
        ...workingTheme.layout,
        [key]: value
      }
    };
    setWorkingTheme(newTheme);
    applyTheme(newTheme);
  };

  const handleSaveTheme = async () => {
    try {
      await setTheme(workingTheme);
      toast({
        title: "Theme Saved",
        description: "Your theme settings have been saved successfully."
      });
    } catch (error) {
      toast({
        title: "Save Failed",
        description: "Failed to save theme settings. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleResetTheme = () => {
    resetTheme();
    setWorkingTheme(currentTheme);
    toast({
      title: "Theme Reset",
      description: "Theme has been reset to default settings."
    });
  };

  const exportTheme = () => {
    const dataStr = JSON.stringify(workingTheme, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${workingTheme.name.toLowerCase().replace(/\s+/g, '-')}-theme.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const fontFamilies = [
    { value: 'Inter', label: 'Inter (Modern)' },
    { value: 'Roboto', label: 'Roboto (Clean)' },
    { value: 'Poppins', label: 'Poppins (Rounded)' },
    { value: 'Open Sans', label: 'Open Sans (Friendly)' },
    { value: 'Montserrat', label: 'Montserrat (Elegant)' },
    { value: 'Source Sans Pro', label: 'Source Sans Pro' }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold mb-2">Theme & Design Customization</h3>
          <p className="text-sm text-muted-foreground">
            Customize the visual appearance and layout of your platform
          </p>
        </div>
        <div className="flex items-center gap-2">
          {hasUnsavedChanges && (
            <Badge variant="secondary">Unsaved Changes</Badge>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPreviewMode(previewMode === 'desktop' ? 'mobile' : 'desktop')}
            className="flex items-center gap-2"
          >
            {previewMode === 'desktop' ? <Monitor className="h-4 w-4" /> : <Smartphone className="h-4 w-4" />}
            {previewMode === 'desktop' ? 'Desktop' : 'Mobile'}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="presets" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="presets" className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            Presets
          </TabsTrigger>
          <TabsTrigger value="colors" className="flex items-center gap-2">
            <Palette className="h-4 w-4" />
            Colors
          </TabsTrigger>
          <TabsTrigger value="typography" className="flex items-center gap-2">
            <Type className="h-4 w-4" />
            Typography
          </TabsTrigger>
          <TabsTrigger value="layout" className="flex items-center gap-2">
            <Layout className="h-4 w-4" />
            Layout
          </TabsTrigger>
          <TabsTrigger value="preview" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Advanced
          </TabsTrigger>
        </TabsList>

        <TabsContent value="presets" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Theme Presets</CardTitle>
              <CardDescription>
                Choose from predefined themes or create your custom theme
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {themePresets.map((preset) => (
                  <div
                    key={preset.id}
                    className={`border rounded-lg p-4 cursor-pointer transition-colors hover:bg-muted/50 ${
                      workingTheme.name === preset.name ? 'border-primary bg-primary/5' : ''
                    }`}
                    onClick={() => handlePresetSelect(preset.id)}
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">{preset.name}</h4>
                      </div>
                      <div className="flex gap-1">
                        <div 
                          className="w-4 h-4 rounded border"
                          style={{ backgroundColor: preset.colors.primary }}
                        />
                        <div 
                          className="w-4 h-4 rounded border"
                          style={{ backgroundColor: preset.colors.secondary }}
                        />
                        <div 
                          className="w-4 h-4 rounded border"
                          style={{ backgroundColor: preset.colors.background }}
                        />
                        <div 
                          className="w-4 h-4 rounded border"
                          style={{ backgroundColor: preset.colors.text }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex items-center space-x-2 pt-4 border-t">
                <Switch
                  id="dark-mode"
                  checked={workingTheme.darkMode}
                  onCheckedChange={(checked) => {
                    const newTheme = { ...workingTheme, darkMode: checked };
                    setWorkingTheme(newTheme);
                    applyTheme(newTheme);
                  }}
                />
                <Label htmlFor="dark-mode">Enable Dark Mode Support</Label>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="colors" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Color Palette</CardTitle>
              <CardDescription>
                Customize the color scheme for your platform
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Object.entries(workingTheme.colors).map(([key, value]) => (
                  <div key={key} className="space-y-2">
                    <Label htmlFor={`color-${key}`} className="capitalize">
                      {key.replace(/([A-Z])/g, ' $1').trim()}
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        id={`color-${key}`}
                        type="color"
                        value={value}
                        onChange={(e) => handleColorChange(key as keyof ThemeConfig['colors'], e.target.value)}
                        className="w-12 h-10 p-1 border rounded"
                      />
                      <Input
                        value={value}
                        onChange={(e) => handleColorChange(key as keyof ThemeConfig['colors'], e.target.value)}
                        placeholder="#000000"
                        className="flex-1"
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-2">
                <Label>Preview</Label>
                <div 
                  className="border rounded-lg p-4 space-y-3"
                  style={{ 
                    backgroundColor: workingTheme.colors.background,
                    color: workingTheme.colors.text,
                    borderColor: workingTheme.colors.border
                  }}
                >
                  <h4 
                    className="font-semibold"
                    style={{ color: workingTheme.colors.text }}
                  >
                    Sample Interface
                  </h4>
                  <p className="text-sm">This is how your interface will look with the selected colors.</p>
                  <div className="flex gap-2">
                    <button 
                      className="px-3 py-1 rounded text-white text-sm"
                      style={{ backgroundColor: workingTheme.colors.primary }}
                    >
                      Primary Button
                    </button>
                    <button 
                      className="px-3 py-1 rounded text-white text-sm"
                      style={{ backgroundColor: workingTheme.colors.secondary }}
                    >
                      Secondary Button
                    </button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="typography" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Typography Settings</CardTitle>
              <CardDescription>
                Configure fonts and text styling
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="font-family">Font Family</Label>
                    <Select
                      value={workingTheme.typography.fontFamily}
                      onValueChange={(value) => handleTypographyChange('fontFamily', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {fontFamilies.map((font) => (
                          <SelectItem key={font.value} value={font.value}>
                            {font.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Base Font Size: {workingTheme.typography.baseFontSize}px</Label>
                    <Slider
                      value={[workingTheme.typography.baseFontSize]}
                      onValueChange={(value) => handleTypographyChange('baseFontSize', value[0])}
                      min={12}
                      max={20}
                      step={1}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Heading Size Multiplier: {workingTheme.typography.headingMultiplier}x</Label>
                    <Slider
                      value={[workingTheme.typography.headingMultiplier]}
                      onValueChange={(value) => handleTypographyChange('headingMultiplier', value[0])}
                      min={1.1}
                      max={2.0}
                      step={0.05}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Line Height: {workingTheme.typography.lineHeight}</Label>
                    <Slider
                      value={[workingTheme.typography.lineHeight]}
                      onValueChange={(value) => handleTypographyChange('lineHeight', value[0])}
                      min={1.2}
                      max={2.0}
                      step={0.1}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <Label>Typography Preview</Label>
                  <div 
                    className="border rounded-lg p-4 space-y-3"
                    style={{ 
                      fontFamily: workingTheme.typography.fontFamily,
                      fontSize: `${workingTheme.typography.baseFontSize}px`,
                      lineHeight: workingTheme.typography.lineHeight
                    }}
                  >
                    <h1 
                      className="font-bold"
                      style={{ 
                        fontSize: `${workingTheme.typography.baseFontSize * Math.pow(workingTheme.typography.headingMultiplier, 2)}px` 
                      }}
                    >
                      Heading 1 Example
                    </h1>
                    <h2 
                      className="font-semibold"
                      style={{ 
                        fontSize: `${workingTheme.typography.baseFontSize * workingTheme.typography.headingMultiplier}px` 
                      }}
                    >
                      Heading 2 Example
                    </h2>
                    <p>
                      This is sample body text that demonstrates how your content will appear with the selected typography settings. It shows readability and visual hierarchy.
                    </p>
                    <p className="text-sm opacity-75">
                      This is smaller text that might be used for captions or secondary information.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="layout" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Layout Preferences</CardTitle>
              <CardDescription>
                Configure layout and spacing preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Sidebar Position</Label>
                    <Select
                      value={workingTheme.layout.sidebarPosition}
                      onValueChange={(value: 'left' | 'right') => handleLayoutChange('sidebarPosition', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="left">Left</SelectItem>
                        <SelectItem value="right">Right</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Sidebar Style</Label>
                    <Select
                      value={workingTheme.layout.sidebarStyle}
                      onValueChange={(value: 'collapsed' | 'expanded' | 'floating') => handleLayoutChange('sidebarStyle', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="collapsed">Collapsed</SelectItem>
                        <SelectItem value="expanded">Expanded</SelectItem>
                        <SelectItem value="floating">Floating</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Card Border Radius: {workingTheme.layout.cardRadius}px</Label>
                    <Slider
                      value={[workingTheme.layout.cardRadius]}
                      onValueChange={(value) => handleLayoutChange('cardRadius', value[0])}
                      min={0}
                      max={20}
                      step={1}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Spacing Scale</Label>
                    <Select
                      value={workingTheme.layout.spacingScale}
                      onValueChange={(value: 'small' | 'medium' | 'large') => handleLayoutChange('spacingScale', value)}
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
                  <Label>Layout Preview</Label>
                  <div className="border rounded-lg p-4 space-y-3 bg-muted/20">
                    <div 
                      className="bg-background border p-3 shadow-sm"
                      style={{ borderRadius: `${workingTheme.layout.cardRadius}px` }}
                    >
                      <h4 className="font-medium mb-2">Sample Card</h4>
                      <p className="text-sm text-muted-foreground">
                        This card shows how the border radius setting affects the appearance of UI elements.
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <div 
                        className="bg-primary text-primary-foreground px-3 py-1 text-sm"
                        style={{ borderRadius: `${Math.max(4, workingTheme.layout.cardRadius - 2)}px` }}
                      >
                        Button
                      </div>
                      <div 
                        className="bg-secondary text-secondary-foreground px-3 py-1 text-sm"
                        style={{ borderRadius: `${Math.max(4, workingTheme.layout.cardRadius - 2)}px` }}
                      >
                        Button
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Advanced Settings</CardTitle>
              <CardDescription>
                Export, import, and manage theme configurations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="theme-name">Theme Name</Label>
                  <Input
                    id="theme-name"
                    value={workingTheme.name}
                    onChange={(e) => setWorkingTheme(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter theme name"
                  />
                </div>

                <div className="flex flex-wrap gap-3">
                  <Button
                    variant="outline"
                    onClick={exportTheme}
                    className="flex items-center gap-2"
                  >
                    <Download className="h-4 w-4" />
                    Export Theme
                  </Button>
                  
                  <Button
                    variant="outline"
                    className="flex items-center gap-2"
                    onClick={() => {
                      const input = document.createElement('input');
                      input.type = 'file';
                      input.accept = '.json';
                      input.onchange = (e) => {
                        const file = (e.target as HTMLInputElement).files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = (e) => {
                            try {
                              const importedTheme = JSON.parse(e.target?.result as string);
                              setWorkingTheme(importedTheme);
                              applyTheme(importedTheme);
                              toast({
                                title: "Theme Imported",
                                description: "Theme has been imported successfully."
                              });
                            } catch (error) {
                              toast({
                                title: "Import Failed",
                                description: "Invalid theme file format.",
                                variant: "destructive"
                              });
                            }
                          };
                          reader.readAsText(file);
                        }
                      };
                      input.click();
                    }}
                  >
                    <Upload className="h-4 w-4" />
                    Import Theme
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Action Buttons */}
      <div className="flex items-center justify-between pt-6 border-t">
        <Button
          variant="outline"
          onClick={handleResetTheme}
          className="flex items-center gap-2"
        >
          <RotateCcw className="h-4 w-4" />
          Reset to Default
        </Button>
        <div className="flex items-center gap-3">
          <Button
            onClick={handleSaveTheme}
            disabled={isLoading || !hasUnsavedChanges}
            className="flex items-center gap-2"
          >
            <Save className="h-4 w-4" />
            {isLoading ? 'Saving...' : 'Save Theme'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ThemeCustomizationTab;
