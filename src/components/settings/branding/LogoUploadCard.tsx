
import React, { useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, ImageIcon, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface LogoUploadCardProps {
  logoPreview: string | null;
  faviconPreview: string | null;
  onLogoChange: (file: File) => void;
  onFaviconChange: (file: File) => void;
  onLogoRemove: () => void;
  onFaviconRemove: () => void;
  isDragOver: boolean;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent, type: 'logo' | 'favicon') => void;
}

const LogoUploadCard: React.FC<LogoUploadCardProps> = ({
  logoPreview,
  faviconPreview,
  onLogoChange,
  onFaviconChange,
  onLogoRemove,
  onFaviconRemove,
  isDragOver,
  onDragOver,
  onDragLeave,
  onDrop
}) => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const faviconInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (file: File, type: 'logo' | 'favicon') => {
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid File Type",
        description: "Please upload an image file (PNG, JPG, SVG)",
        variant: "destructive"
      });
      return;
    }

    const maxSize = type === 'favicon' ? 1 * 1024 * 1024 : 5 * 1024 * 1024;
    if (file.size > maxSize) {
      toast({
        title: "File Too Large",
        description: `File size must be less than ${type === 'favicon' ? '1MB' : '5MB'}`,
        variant: "destructive"
      });
      return;
    }

    if (type === 'logo') {
      onLogoChange(file);
    } else {
      onFaviconChange(file);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Logo Upload */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5" />
            Application Logo
          </CardTitle>
          <CardDescription>
            Upload your company logo (PNG, JPG, SVG - Max 5MB)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div
            className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
              isDragOver ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'
            }`}
            onDrop={(e) => onDrop(e, 'logo')}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
          >
            {logoPreview ? (
              <div className="space-y-4">
                <img 
                  src={logoPreview} 
                  alt="Logo preview" 
                  className="max-h-24 mx-auto object-contain"
                />
                <div className="flex gap-2 justify-center">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    Change Logo
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onLogoRemove}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <Upload className="h-12 w-12 mx-auto text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Drop your logo here</p>
                  <p className="text-xs text-muted-foreground">or click to browse</p>
                </div>
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                >
                  Choose File
                </Button>
              </div>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFileUpload(file, 'logo');
            }}
          />
        </CardContent>
      </Card>

      {/* Favicon Upload */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5" />
            Favicon
          </CardTitle>
          <CardDescription>
            Upload favicon for browser tabs (PNG, ICO - Max 1MB)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="border-2 border-dashed rounded-lg p-6 text-center">
            {faviconPreview ? (
              <div className="space-y-4">
                <img 
                  src={faviconPreview} 
                  alt="Favicon preview" 
                  className="w-8 h-8 mx-auto object-contain"
                />
                <div className="flex gap-2 justify-center">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => faviconInputRef.current?.click()}
                  >
                    Change
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onFaviconRemove}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <ImageIcon className="h-8 w-8 mx-auto text-muted-foreground" />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => faviconInputRef.current?.click()}
                >
                  Upload Favicon
                </Button>
              </div>
            )}
          </div>
          <input
            ref={faviconInputRef}
            type="file"
            accept="image/*,.ico"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFileUpload(file, 'favicon');
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default LogoUploadCard;
