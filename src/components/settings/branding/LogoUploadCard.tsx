
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import LoadingSpinner from '@/components/LoadingSpinner';
import { Upload, X, Image } from 'lucide-react';

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
  isUploading?: boolean;
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
  onDrop,
  isUploading = false
}) => {
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'favicon') => {
    const file = e.target.files?.[0];
    if (file) {
      if (type === 'logo') {
        onLogoChange(file);
      } else {
        onFaviconChange(file);
      }
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Brand Assets</CardTitle>
        <CardDescription>
          Upload your company logo and favicon to customize your platform
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Logo Upload */}
        <div className="space-y-4">
          <Label htmlFor="logo-upload">Company Logo</Label>
          <div
            className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
              isDragOver ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'
            }`}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={(e) => onDrop(e, 'logo')}
          >
            {isUploading ? (
              <div className="flex flex-col items-center gap-2">
                <LoadingSpinner />
                <p className="text-sm text-muted-foreground">Uploading...</p>
              </div>
            ) : logoPreview ? (
              <div className="space-y-4">
                <img
                  src={logoPreview}
                  alt="Logo preview"
                  className="max-h-32 mx-auto object-contain"
                />
                <div className="flex gap-2 justify-center">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => document.getElementById('logo-upload')?.click()}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Change Logo
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onLogoRemove}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Remove
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="mx-auto w-12 h-12 bg-muted rounded-lg flex items-center justify-center">
                  <Image className="h-6 w-6 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm font-medium">Drop your logo here, or click to browse</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    PNG, JPG, SVG up to 5MB
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => document.getElementById('logo-upload')?.click()}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Choose File
                </Button>
              </div>
            )}
          </div>
          <input
            id="logo-upload"
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => handleFileSelect(e, 'logo')}
          />
        </div>

        {/* Favicon Upload */}
        <div className="space-y-4">
          <Label htmlFor="favicon-upload">Favicon</Label>
          <div
            className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
              isDragOver ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'
            }`}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={(e) => onDrop(e, 'favicon')}
          >
            {isUploading ? (
              <div className="flex flex-col items-center gap-2">
                <LoadingSpinner />
                <p className="text-sm text-muted-foreground">Uploading...</p>
              </div>
            ) : faviconPreview ? (
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
                    onClick={() => document.getElementById('favicon-upload')?.click()}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Change
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onFaviconRemove}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Remove
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="mx-auto w-8 h-8 bg-muted rounded flex items-center justify-center">
                  <Image className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm font-medium">Upload favicon</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    16x16 or 32x32 PNG recommended
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => document.getElementById('favicon-upload')?.click()}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Choose File
                </Button>
              </div>
            )}
          </div>
          <input
            id="favicon-upload"
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => handleFileSelect(e, 'favicon')}
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default LogoUploadCard;
