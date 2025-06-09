
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Store, User, Mail, Phone, Lock, Tag, Facebook, Instagram, Twitter, Eye, EyeOff } from 'lucide-react';

interface MerchantRegistrationData {
  fullName: string;
  brandName: string;
  phoneNumber: string;
  email: string;
  password: string;
  confirmPassword: string;
  socialMedia: {
    facebook: string;
    instagram: string;
    twitter: string;
  };
  categories: string[];
  tags: string[];
  acceptTerms: boolean;
}

interface MerchantOnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: MerchantRegistrationData) => void;
}

const predefinedCategories = [
  "Auto Parts & Accessories",
  "Security & Safety",
  "Smart Vehicle Gadgets",
  "Vehicle Ownership Support",
];

const suggestedTags = [
  "tyre repair",
  "car detailing",
  "vehicle tracker installation",
  "oil change",
  "brake service",
  "engine diagnostics",
  "car wash",
  "windshield repair",
  "battery replacement",
  "air conditioning",
  "transmission service",
  "suspension repair",
];

export const MerchantOnboardingModal: React.FC<MerchantOnboardingModalProps> = ({
  isOpen,
  onClose,
  onSubmit
}) => {
  const [formData, setFormData] = useState<MerchantRegistrationData>({
    fullName: "",
    brandName: "",
    phoneNumber: "",
    email: "",
    password: "",
    confirmPassword: "",
    socialMedia: {
      facebook: "",
      instagram: "",
      twitter: "",
    },
    categories: [],
    tags: [],
    acceptTerms: false,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [currentTag, setCurrentTag] = useState("");
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateStep1 = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = "Full name is required";
    }

    if (!formData.brandName.trim()) {
      newErrors.brandName = "Brand/Store name is required";
    }

    if (!formData.phoneNumber.trim()) {
      newErrors.phoneNumber = "Phone number is required";
    } else if (!/^\+?[\d\s\-()]{10,}$/.test(formData.phoneNumber)) {
      newErrors.phoneNumber = "Please enter a valid phone number";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email address is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters long";
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      newErrors.password = "Password must contain at least one uppercase letter, one lowercase letter, and one number";
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = () => {
    const newErrors: Record<string, string> = {};

    if (formData.categories.length === 0) {
      newErrors.categories = "Please select at least one category";
    }

    if (!formData.acceptTerms) {
      newErrors.acceptTerms = "You must accept the Terms & Conditions";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCategoryToggle = (category: string) => {
    setFormData((prev) => ({
      ...prev,
      categories: prev.categories.includes(category)
        ? prev.categories.filter((c) => c !== category)
        : [...prev.categories, category],
    }));
  };

  const handleAddTag = (tag: string) => {
    if (tag.trim() && !formData.tags.includes(tag.trim().toLowerCase())) {
      setFormData((prev) => ({
        ...prev,
        tags: [...prev.tags, tag.trim().toLowerCase()],
      }));
    }
    setCurrentTag("");
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((tag) => tag !== tagToRemove),
    }));
  };

  const handleSubmit = async () => {
    if (step === 1) {
      if (validateStep1()) {
        setStep(2);
      }
      return;
    }

    if (step === 2) {
      if (validateStep2()) {
        setIsSubmitting(true);
        try {
          await onSubmit(formData);
          onClose();
        } catch (error) {
          console.error("Registration failed:", error);
        } finally {
          setIsSubmitting(false);
        }
      }
    }
  };

  const handleBack = () => {
    if (step === 2) {
      setStep(1);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Store className="h-5 w-5" />
            Become a Merchant
          </DialogTitle>
          <DialogDescription>
            Join our marketplace and start selling your products and services to fleet owners
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Progress Indicator */}
          <div className="flex items-center justify-center space-x-4">
            <div className={`flex items-center ${step >= 1 ? "text-primary" : "text-muted-foreground"}`}>
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  step >= 1 ? "bg-primary text-primary-foreground" : "bg-muted"
                }`}
              >
                1
              </div>
              <span className="ml-2 text-sm font-medium">Account Details</span>
            </div>
            <div className={`w-8 h-0.5 ${step >= 2 ? "bg-primary" : "bg-muted"}`}></div>
            <div className={`flex items-center ${step >= 2 ? "text-primary" : "text-muted-foreground"}`}>
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  step >= 2 ? "bg-primary text-primary-foreground" : "bg-muted"
                }`}
              >
                2
              </div>
              <span className="ml-2 text-sm font-medium">Store Setup</span>
            </div>
          </div>

          {step === 1 && (
            <div className="space-y-6">
              {/* Basic Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Basic Information</CardTitle>
                  <CardDescription>Tell us about yourself and your business</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="fullName">
                        Full Name <span className="text-red-500">*</span>
                      </Label>
                      <div className="relative">
                        <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="fullName"
                          className="pl-10"
                          value={formData.fullName}
                          onChange={(e) => setFormData((prev) => ({ ...prev, fullName: e.target.value }))}
                          placeholder="Enter your full name"
                        />
                      </div>
                      {errors.fullName && <p className="text-sm text-red-500">{errors.fullName}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="brandName">
                        Brand/Store Name <span className="text-red-500">*</span>
                      </Label>
                      <div className="relative">
                        <Store className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="brandName"
                          className="pl-10"
                          value={formData.brandName}
                          onChange={(e) => setFormData((prev) => ({ ...prev, brandName: e.target.value }))}
                          placeholder="Enter your store name"
                        />
                      </div>
                      {errors.brandName && <p className="text-sm text-red-500">{errors.brandName}</p>}
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="phoneNumber">
                        Phone Number <span className="text-red-500">*</span>
                      </Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="phoneNumber"
                          className="pl-10"
                          value={formData.phoneNumber}
                          onChange={(e) => setFormData((prev) => ({ ...prev, phoneNumber: e.target.value }))}
                          placeholder="+1 (555) 123-4567"
                        />
                      </div>
                      {errors.phoneNumber && <p className="text-sm text-red-500">{errors.phoneNumber}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">
                        Email Address <span className="text-red-500">*</span>
                      </Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="email"
                          type="email"
                          className="pl-10"
                          value={formData.email}
                          onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                          placeholder="merchant@example.com"
                        />
                      </div>
                      {errors.email && <p className="text-sm text-red-500">{errors.email}</p>}
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="password">
                        Password <span className="text-red-500">*</span>
                      </Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          className="pl-10 pr-10"
                          value={formData.password}
                          onChange={(e) => setFormData((prev) => ({ ...prev, password: e.target.value }))}
                          placeholder="Enter password"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                      {errors.password && <p className="text-sm text-red-500">{errors.password}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">
                        Confirm Password <span className="text-red-500">*</span>
                      </Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="confirmPassword"
                          type={showConfirmPassword ? "text" : "password"}
                          className="pl-10 pr-10"
                          value={formData.confirmPassword}
                          onChange={(e) => setFormData((prev) => ({ ...prev, confirmPassword: e.target.value }))}
                          placeholder="Confirm password"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        >
                          {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                      {errors.confirmPassword && <p className="text-sm text-red-500">{errors.confirmPassword}</p>}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Social Media (Optional) */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Social Media (Optional)</CardTitle>
                  <CardDescription>Connect your social media accounts to build trust with customers</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="facebook">Facebook URL</Label>
                    <div className="relative">
                      <Facebook className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="facebook"
                        className="pl-10"
                        value={formData.socialMedia.facebook}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            socialMedia: { ...prev.socialMedia, facebook: e.target.value },
                          }))
                        }
                        placeholder="https://facebook.com/yourstore"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="instagram">Instagram URL</Label>
                    <div className="relative">
                      <Instagram className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="instagram"
                        className="pl-10"
                        value={formData.socialMedia.instagram}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            socialMedia: { ...prev.socialMedia, instagram: e.target.value },
                          }))
                        }
                        placeholder="https://instagram.com/yourstore"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="twitter">Twitter URL</Label>
                    <div className="relative">
                      <Twitter className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="twitter"
                        className="pl-10"
                        value={formData.socialMedia.twitter}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            socialMedia: { ...prev.socialMedia, twitter: e.target.value },
                          }))
                        }
                        placeholder="https://twitter.com/yourstore"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              {/* Category Selection */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">
                    Category Selection <span className="text-red-500">*</span>
                  </CardTitle>
                  <CardDescription>Select one or more categories that best describe your business</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-3 md:grid-cols-2">
                    {predefinedCategories.map((category) => (
                      <div key={category} className="flex items-center space-x-2 p-3 border rounded-lg">
                        <Checkbox
                          id={category}
                          checked={formData.categories.includes(category)}
                          onCheckedChange={() => handleCategoryToggle(category)}
                        />
                        <Label htmlFor={category} className="flex-1 cursor-pointer">
                          {category}
                        </Label>
                      </div>
                    ))}
                  </div>
                  {errors.categories && <p className="text-sm text-red-500">{errors.categories}</p>}
                </CardContent>
              </Card>

              {/* Tags */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Keywords & Tags</CardTitle>
                  <CardDescription>
                    Add keywords (tags) to help subscribers find your store, e.g., 'tyre repair,' 'car detailing,' 'vehicle tracker installation.'
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="tags">Add Tags</Label>
                    <div className="flex gap-2">
                      <Input
                        id="tags"
                        value={currentTag}
                        onChange={(e) => setCurrentTag(e.target.value)}
                        placeholder="Enter a tag and press Enter"
                        onKeyPress={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleAddTag(currentTag);
                          }
                        }}
                      />
                      <Button type="button" onClick={() => handleAddTag(currentTag)} disabled={!currentTag.trim()}>
                        Add
                      </Button>
                    </div>
                  </div>

                  {/* Suggested Tags */}
                  <div className="space-y-2">
                    <Label>Suggested Tags (click to add)</Label>
                    <div className="flex flex-wrap gap-2">
                      {suggestedTags
                        .filter((tag) => !formData.tags.includes(tag))
                        .map((tag) => (
                          <Button
                            key={tag}
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handleAddTag(tag)}
                            className="text-xs"
                          >
                            {tag}
                          </Button>
                        ))}
                    </div>
                  </div>

                  {/* Selected Tags */}
                  {formData.tags.length > 0 && (
                    <div className="space-y-2">
                      <Label>Selected Tags</Label>
                      <div className="flex flex-wrap gap-2">
                        {formData.tags.map((tag) => (
                          <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                            <Tag className="h-3 w-3" />
                            {tag}
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-4 w-4 p-0 hover:bg-transparent"
                              onClick={() => handleRemoveTag(tag)}
                            >
                              ×
                            </Button>
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Terms & Conditions */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Terms & Conditions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-start space-x-2">
                    <Checkbox
                      id="acceptTerms"
                      checked={formData.acceptTerms}
                      onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, acceptTerms: !!checked }))}
                    />
                    <Label htmlFor="acceptTerms" className="text-sm leading-relaxed cursor-pointer">
                      I accept the{" "}
                      <a href="/terms" target="_blank" className="text-primary hover:underline" rel="noreferrer">
                        Terms & Conditions
                      </a>{" "}
                      and{" "}
                      <a href="/privacy" target="_blank" className="text-primary hover:underline" rel="noreferrer">
                        Privacy Policy
                      </a>{" "}
                      of the marketplace. <span className="text-red-500">*</span>
                    </Label>
                  </div>
                  {errors.acceptTerms && <p className="text-sm text-red-500 mt-2">{errors.acceptTerms}</p>}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-between pt-4">
            <Button variant="outline" onClick={step === 1 ? onClose : handleBack}>
              {step === 1 ? "Cancel" : "Back"}
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Submitting...
                </>
              ) : step === 1 ? (
                "Continue"
              ) : (
                "Submit Registration"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
