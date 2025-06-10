
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Trash2, Plus, GripVertical } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface FormField {
  id: string;
  type: 'text' | 'textarea' | 'select' | 'checkbox' | 'number' | 'rating';
  label: string;
  description?: string;
  required: boolean;
  options?: string[];
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
  };
}

interface InspectionFormBuilderProps {
  workshopId: string;
  existingTemplate?: any;
  onSave: (template: any) => void;
  onCancel: () => void;
}

const InspectionFormBuilder: React.FC<InspectionFormBuilderProps> = ({
  workshopId,
  existingTemplate,
  onSave,
  onCancel
}) => {
  const { toast } = useToast();
  const [templateName, setTemplateName] = useState(existingTemplate?.template_name || '');
  const [templateDescription, setTemplateDescription] = useState(existingTemplate?.template_description || '');
  const [vehicleCategory, setVehicleCategory] = useState(existingTemplate?.vehicle_category || '');
  const [isDefault, setIsDefault] = useState(existingTemplate?.is_default || false);
  const [formFields, setFormFields] = useState<FormField[]>(existingTemplate?.form_fields || []);

  const fieldTypes = [
    { value: 'text', label: 'Text Input' },
    { value: 'textarea', label: 'Long Text' },
    { value: 'select', label: 'Dropdown' },
    { value: 'checkbox', label: 'Checkbox' },
    { value: 'number', label: 'Number' },
    { value: 'rating', label: 'Rating (1-5)' }
  ];

  const addField = () => {
    const newField: FormField = {
      id: `field_${Date.now()}`,
      type: 'text',
      label: 'New Field',
      required: false
    };
    setFormFields([...formFields, newField]);
  };

  const updateField = (index: number, updatedField: Partial<FormField>) => {
    const updated = [...formFields];
    updated[index] = { ...updated[index], ...updatedField };
    setFormFields(updated);
  };

  const removeField = (index: number) => {
    setFormFields(formFields.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    if (!templateName.trim()) {
      toast({
        title: "Validation Error",
        description: "Template name is required",
        variant: "destructive"
      });
      return;
    }

    if (formFields.length === 0) {
      toast({
        title: "Validation Error", 
        description: "At least one form field is required",
        variant: "destructive"
      });
      return;
    }

    const template = {
      id: existingTemplate?.id,
      workshop_id: workshopId,
      template_name: templateName,
      template_description: templateDescription,
      vehicle_category: vehicleCategory,
      form_fields: formFields,
      is_default: isDefault,
      is_active: true
    };

    onSave(template);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>
            {existingTemplate ? 'Edit' : 'Create'} Inspection Form Template
          </CardTitle>
          <CardDescription>
            Build a custom inspection form for your workshop
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="template-name">Template Name *</Label>
              <Input
                id="template-name"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                placeholder="e.g., Standard Vehicle Inspection"
              />
            </div>
            <div>
              <Label htmlFor="vehicle-category">Vehicle Category</Label>
              <Select value={vehicleCategory} onValueChange={setVehicleCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="car">Car</SelectItem>
                  <SelectItem value="truck">Truck</SelectItem>
                  <SelectItem value="motorcycle">Motorcycle</SelectItem>
                  <SelectItem value="bus">Bus</SelectItem>
                  <SelectItem value="trailer">Trailer</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={templateDescription}
              onChange={(e) => setTemplateDescription(e.target.value)}
              placeholder="Describe what this inspection template covers"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Form Fields</CardTitle>
              <CardDescription>
                Add and configure inspection form fields
              </CardDescription>
            </div>
            <Button onClick={addField} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Field
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {formFields.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No fields added yet. Click "Add Field" to get started.
            </div>
          ) : (
            <div className="space-y-4">
              {formFields.map((field, index) => (
                <Card key={field.id} className="p-4">
                  <div className="flex items-start gap-4">
                    <GripVertical className="h-4 w-4 text-muted-foreground mt-2" />
                    <div className="flex-1 space-y-3">
                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <Label>Field Type</Label>
                          <Select
                            value={field.type}
                            onValueChange={(value) => updateField(index, { type: value as any })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {fieldTypes.map(type => (
                                <SelectItem key={type.value} value={type.value}>
                                  {type.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>Field Label</Label>
                          <Input
                            value={field.label}
                            onChange={(e) => updateField(index, { label: e.target.value })}
                            placeholder="Enter field label"
                          />
                        </div>
                        <div>
                          <Label>Description</Label>
                          <Input
                            value={field.description || ''}
                            onChange={(e) => updateField(index, { description: e.target.value })}
                            placeholder="Optional description"
                          />
                        </div>
                      </div>

                      {field.type === 'select' && (
                        <div>
                          <Label>Options (one per line)</Label>
                          <Textarea
                            value={field.options?.join('\n') || ''}
                            onChange={(e) => updateField(index, { 
                              options: e.target.value.split('\n').filter(o => o.trim()) 
                            })}
                            placeholder="Option 1&#10;Option 2&#10;Option 3"
                            rows={3}
                          />
                        </div>
                      )}

                      <div className="flex items-center gap-4">
                        <label className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={field.required}
                            onChange={(e) => updateField(index, { required: e.target.checked })}
                          />
                          <span className="text-sm">Required field</span>
                        </label>
                        {field.required && (
                          <Badge variant="outline">Required</Badge>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeField(index)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={handleSave}>
          {existingTemplate ? 'Update' : 'Create'} Template
        </Button>
      </div>
    </div>
  );
};

export default InspectionFormBuilder;
