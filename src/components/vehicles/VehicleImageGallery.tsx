
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Camera, Upload, X, Plus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface VehicleImageGalleryProps {
  vehicleId: string;
  imageUrls: string[];
  onImagesUpdated: (urls: string[]) => void;
}

export const VehicleImageGallery: React.FC<VehicleImageGalleryProps> = ({
  vehicleId,
  imageUrls,
  onImagesUpdated
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Invalid file type',
        description: 'Please select an image file',
        variant: 'destructive'
      });
      return;
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'File too large',
        description: 'Please select an image smaller than 5MB',
        variant: 'destructive'
      });
      return;
    }

    setIsUploading(true);

    try {
      const fileName = `${vehicleId}/${Date.now()}-${file.name}`;
      
      const { data, error } = await supabase.storage
        .from('vehicle-images')
        .upload(fileName, file);

      if (error) {
        throw error;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('vehicle-images')
        .getPublicUrl(fileName);

      const updatedUrls = [...imageUrls, publicUrl];
      onImagesUpdated(updatedUrls);

      toast({
        title: 'Image uploaded successfully',
        description: 'The vehicle image has been added to the gallery'
      });
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: 'Upload failed',
        description: 'Failed to upload image. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsUploading(false);
      // Reset the input
      event.target.value = '';
    }
  };

  const handleImageRemove = async (urlToRemove: string) => {
    try {
      // Extract file path from URL
      const urlParts = urlToRemove.split('/');
      const fileName = urlParts[urlParts.length - 1];
      const filePath = `${vehicleId}/${fileName}`;

      // Remove from storage
      const { error } = await supabase.storage
        .from('vehicle-images')
        .remove([filePath]);

      if (error) {
        console.error('Storage deletion error:', error);
        // Continue with UI update even if storage deletion fails
      }

      // Update the image URLs
      const updatedUrls = imageUrls.filter(url => url !== urlToRemove);
      onImagesUpdated(updatedUrls);

      toast({
        title: 'Image removed',
        description: 'The image has been removed from the gallery'
      });
    } catch (error) {
      console.error('Remove error:', error);
      toast({
        title: 'Remove failed',
        description: 'Failed to remove image. Please try again.',
        variant: 'destructive'
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Camera className="h-5 w-5" />
          Vehicle Images
          <span className="text-sm text-gray-500">({imageUrls.length}/10)</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Upload Section */}
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
          <Input
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            disabled={isUploading || imageUrls.length >= 10}
            className="hidden"
            id="image-upload"
          />
          <label
            htmlFor="image-upload"
            className={`cursor-pointer inline-flex items-center gap-2 px-4 py-2 rounded-md ${
              isUploading || imageUrls.length >= 10
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-blue-500 text-white hover:bg-blue-600'
            }`}
          >
            {isUploading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Uploading...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4" />
                Add Image
              </>
            )}
          </label>
          <p className="text-sm text-gray-500 mt-2">
            Maximum 10 images, 5MB each. Supports JPEG, PNG, WebP.
          </p>
        </div>

        {/* Image Gallery */}
        {imageUrls.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {imageUrls.map((url, index) => (
              <div key={index} className="relative group">
                <img
                  src={url}
                  alt={`Vehicle image ${index + 1}`}
                  className="w-full h-32 object-cover rounded-lg border"
                />
                <Button
                  variant="destructive"
                  size="sm"
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0"
                  onClick={() => handleImageRemove(url)}
                >
                  <X className="h-3 w-3" />
                </Button>
                {index === 0 && (
                  <div className="absolute bottom-2 left-2 bg-blue-500 text-white text-xs px-2 py-1 rounded">
                    Primary
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <Camera className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>No images uploaded yet</p>
            <p className="text-sm">Add images to showcase this vehicle</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
