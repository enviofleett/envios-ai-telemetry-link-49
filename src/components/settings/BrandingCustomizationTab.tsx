import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useTheme } from './branding/ThemeProvider';
import { themePresets } from './branding/ThemePresets';
import { validateThemeConfig } from './branding/ThemeValidator';
import { FontLoader } from './branding/FontLoader';
import LogoUploadCard from './branding/LogoUploadCard';
import ColorSchemeCard from './branding/ColorSchemeCard';
import TypographyCard from './branding/TypographyCard';
import NavigationMenuCard from './branding/NavigationMenuCard';
import BrandingActions from './branding/BrandingActions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
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

interface BrandingConfig {
  logo_url?: string;
  favicon_url?: string;
  primary_color: string;
  accent_color: string;
  background_color: string;
  text_color: string;
  font_family_heading: string;
  font_family_body: string;
  font_size_scale: string;
  button_style: string;
}

interface MenuItemConfig {
  id: string;
  label: string;
  icon: string;
  visible: boolean;
  order: number;
  custom_name?: string;
}

const defaultMenuItems: MenuItemConfig[] = [
  { id: 'dashboard', label: 'Dashboard', icon: 'LayoutDashboard', visible: true, order: 1 },
  { id: 'tracking', label: 'Live Tracking', icon: 'MapPin', visible: true, order: 2 },
  { id: 'users', label: 'User Management', icon: 'Users', visible: true, order: 3 },
  { id: 'settings', label: 'Settings', icon: 'Settings', visible: true, order: 4 },
  { id: 'system-import', label: 'System Import', icon: 'Download', visible: true, order: 5 }
];

const BrandingCustomizationTab: React.FC = () => {
  const { toast } = useToast();
  const { currentTheme, setTheme, resetTheme, applyTheme, isLoading } = useTheme();
  
  // Legacy branding config for backward compatibility
  const [brandingConfig, setBrandingConfig] = useState<BrandingConfig>({
    primary_color: currentTheme.colors.primary,
    accent_color: currentTheme.colors.accent,
    background_color: currentTheme.colors.background,
    text_color: currentTheme.colors.text,
    font_family_heading: currentTheme.typography.fontFamily,
    font_family_body: currentTheme.typography.fontFamily,
    font_size_scale: currentTheme.layout.spacingScale,
    button_style: 'rounded'
  });

  const [menuItems, setMenuItems] = useState<MenuItemConfig[]>(defaultMenuItems);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [faviconPreview, setFaviconPreview] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('desktop');
  const [workingTheme, setWorkingTheme] = useState(currentTheme);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Sync working theme with current theme
  useEffect(() => {
    setWorkingTheme(currentTheme);
  }, [currentTheme]);

  // Check for unsaved changes
  useEffect(() => {
    const hasChanges = JSON.stringify(workingTheme) !== JSON.stringify(currentTheme);
    setHasUnsavedChanges(hasChanges);
  }, [workingTheme, currentTheme]);

  // Sync legacy config with theme
  useEffect(() => {
    setBrandingConfig({
      primary_color: currentTheme.colors.primary,
      accent_color: currentTheme.colors.accent,
      background_color: currentTheme.colors.background,
      text_color: currentTheme.colors.text,
      font_family_heading: currentTheme.typography.fontFamily,
      font_family_body: currentTheme.typography.fontFamily,
      font_size_scale: currentTheme.layout.spacingScale,
      button_style: 'rounded'
    });
  }, [currentTheme]);

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

  const handleFileUpload = (file: File, type: 'logo' | 'favicon') => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (type === 'logo') {
        setLogoPreview(result);
        setBrandingConfig(prev => ({ ...prev, logo_url: result }));
      } else {
        setFaviconPreview(result);
        setBrandingConfig(prev => ({ ...prev, favicon_url: result }));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent, type: 'logo' | 'favicon') => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileUpload(files[0], type);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const resetToDefaults = () => {
    resetTheme();
    setLogoPreview(null);
    setFaviconPreview(null);
    setMenuItems(defaultMenuItems);
  };

  const saveBrandingConfig = async () => {
    try {
      await setTheme(workingTheme);
    } catch (error) {
      toast({
        title: "Save Failed",
        description: "Failed to save branding configuration",
        variant: "destructive"
      });
    }
  };

  const updateMenuItem = (id: string, updates: Partial<MenuItemConfig>) => {
    setMenuItems(prev => prev.map(item => 
      item.id === id ? { ...item, ...updates } : item
    ));
  };

  const moveMenuItem = (id: string, direction: 'up' | 'down') => {
    setMenuItems(prev => {
      const currentIndex = prev.findIndex(item => item.id === id);
      if (currentIndex === -1) return prev;
      
      const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
      if (newIndex < 0 || newIndex >= prev.length) return prev;
      
      const newItems = [...prev];
      [newItems[currentIndex], newItems[newIndex]] = [newItems[newIndex], newItems[currentIndex]];
      
      return newItems.map((item, index) => ({ ...item, order: index + 1 }));
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

  const importTheme = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedTheme = JSON.parse(e.target?.result as string);
        const validatedTheme = validateThemeConfig(importedTheme);
        
        if (validatedTheme) {
          setWorkingTheme(validatedTheme);
          applyTheme(validatedTheme);
          toast({
            title: "Theme Imported",
            description: "Theme has been imported successfully."
          });
        } else {
          toast({
            title: "Import Failed",
            description: "Invalid theme file format.",
            variant: "destructive"
          });
        }
      } catch (error) {
        toast({
          title: "Import Failed",
          description: "Invalid theme file format.",
          variant: "destructive"
        });
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6">
      <FontLoader />
      
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold mb-2">Branding & UI Customization</h3>
          <p className="text-sm text-muted-foreground">
            Customize your Envio platform's visual identity and user interface
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
          <TabsTrigger value="logo" className="flex items-center gap-2">
            <Upload className="h-4 w-4" />
            Assets
          </TabsTrigger>
          <TabsTrigger value="colors" className="flex items-center gap-2">
            <Palette className="h-4 w-4" />
            Colors
          </TabsTrigger>
          <TabsTrigger value="typography" className="flex items-center gap-2">
            <Type className="h-4 w-4" />
            Typography
          </TabsTrigger>
          <TabsTrigger value="menu" className="flex items-center gap-2">
            <Layout className="h-4 w-4" />
            Menu
          </TabsTrigger>
        </TabsList>

        <TabsContent value="presets" className="space-y-4">
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
        </TabsContent>

        <TabsContent value="logo" className="space-y-4">
          <LogoUploadCard
            logoPreview={logoPreview}
            faviconPreview={faviconPreview}
            onLogoChange={(file) => handleFileUpload(file, 'logo')}
            onFaviconChange={(file) => handleFileUpload(file, 'favicon')}
            onLogoRemove={() => {
              setLogoPreview(null);
              setBrandingConfig(prev => ({ ...prev, logo_url: undefined }));
            }}
            onFaviconRemove={() => {
              setFaviconPreview(null);
              setBrandingConfig(prev => ({ ...prev, favicon_url: undefined }));
            }}
            isDragOver={isDragOver}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          />
        </TabsContent>

        <TabsContent value="colors" className="space-y-4">
          <ColorSchemeCard
            brandingConfig={brandingConfig}
            setBrandingConfig={setBrandingConfig}
          />
        </TabsContent>

        <TabsContent value="typography" className="space-y-4">
          <TypographyCard
            brandingConfig={brandingConfig}
            setBrandingConfig={setBrandingConfig}
          />
        </TabsContent>

        <TabsContent value="menu" className="space-y-4">
          <NavigationMenuCard
            menuItems={menuItems}
            updateMenuItem={updateMenuItem}
            moveMenuItem={moveMenuItem}
          />
        </TabsContent>
      </Tabs>

      <BrandingActions
        onReset={resetToDefaults}
        onSave={saveBrandingConfig}
      />
    </div>
  );
};

export default BrandingCustomizationTab;
