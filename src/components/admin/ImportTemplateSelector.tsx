
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { templateService, ImportTemplate } from '@/services/systemImport/templateService';
import { SystemImportOptions } from '@/types/system-import';
import { 
  Template, 
  Plus, 
  Copy, 
  Download, 
  Upload, 
  Star, 
  User, 
  AlertCircle,
  CheckCircle,
  Edit,
  Trash2
} from 'lucide-react';

interface ImportTemplateSelectorProps {
  onTemplateSelect: (options: SystemImportOptions) => void;
  selectedTemplate?: ImportTemplate | null;
}

const ImportTemplateSelector: React.FC<ImportTemplateSelectorProps> = ({
  onTemplateSelect,
  selectedTemplate
}) => {
  const [templates, setTemplates] = useState<ImportTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<ImportTemplate | null>(null);
  const [newTemplate, setNewTemplate] = useState({
    name: '',
    description: '',
    configuration: {} as SystemImportOptions
  });
  const [validationResult, setValidationResult] = useState<{
    isValid: boolean;
    errors: string[];
    warnings: string[];
  } | null>(null);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const templateList = await templateService.getTemplates();
      setTemplates(templateList);
    } catch (error) {
      console.error('Failed to load templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTemplateClick = (template: ImportTemplate) => {
    onTemplateSelect(template.configuration);
  };

  const handleCreateTemplate = async () => {
    try {
      const validation = templateService.validateTemplate(newTemplate.configuration);
      setValidationResult(validation);
      
      if (!validation.isValid) return;

      await templateService.createTemplate(newTemplate);
      setShowCreateDialog(false);
      setNewTemplate({ name: '', description: '', configuration: {} as SystemImportOptions });
      setValidationResult(null);
      await loadTemplates();
    } catch (error) {
      console.error('Failed to create template:', error);
    }
  };

  const handleEditTemplate = async () => {
    if (!editingTemplate) return;

    try {
      const validation = templateService.validateTemplate(newTemplate.configuration);
      setValidationResult(validation);
      
      if (!validation.isValid) return;

      await templateService.updateTemplate(editingTemplate.id, {
        name: newTemplate.name,
        description: newTemplate.description,
        configuration: newTemplate.configuration
      });
      
      setShowEditDialog(false);
      setEditingTemplate(null);
      setNewTemplate({ name: '', description: '', configuration: {} as SystemImportOptions });
      setValidationResult(null);
      await loadTemplates();
    } catch (error) {
      console.error('Failed to update template:', error);
    }
  };

  const handleDuplicateTemplate = async (template: ImportTemplate) => {
    try {
      const newName = `${template.name} (Copy)`;
      await templateService.duplicateTemplate(template.id, newName);
      await loadTemplates();
    } catch (error) {
      console.error('Failed to duplicate template:', error);
    }
  };

  const handleDeleteTemplate = async (template: ImportTemplate) => {
    if (template.isSystemTemplate) return;
    
    try {
      await templateService.deleteTemplate(template.id);
      await loadTemplates();
    } catch (error) {
      console.error('Failed to delete template:', error);
    }
  };

  const handleExportTemplate = async (template: ImportTemplate) => {
    try {
      const exportData = await templateService.exportTemplate(template.id);
      const blob = new Blob([exportData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${template.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_template.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export template:', error);
    }
  };

  const openEditDialog = (template: ImportTemplate) => {
    setEditingTemplate(template);
    setNewTemplate({
      name: template.name,
      description: template.description || '',
      configuration: template.configuration
    });
    setShowEditDialog(true);
  };

  const systemTemplates = templates.filter(t => t.isSystemTemplate);
  const customTemplates = templates.filter(t => !t.isSystemTemplate);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'users_only': return <User className="h-4 w-4" />;
      case 'vehicles_only': return <Template className="h-4 w-4" />;
      case 'complete_system': return <Star className="h-4 w-4" />;
      case 'selective': return <Copy className="h-4 w-4" />;
      default: return <Template className="h-4 w-4" />;
    }
  };

  const getTypeBadgeColor = (type: string) => {
    switch (type) {
      case 'users_only': return 'bg-blue-100 text-blue-800';
      case 'vehicles_only': return 'bg-green-100 text-green-800';
      case 'complete_system': return 'bg-purple-100 text-purple-800';
      case 'selective': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          Loading templates...
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Import Templates</h3>
        <Button onClick={() => setShowCreateDialog(true)} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Create Template
        </Button>
      </div>

      {/* System Templates */}
      <div>
        <h4 className="font-medium mb-3 flex items-center gap-2">
          <Star className="h-4 w-4" />
          System Templates
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {systemTemplates.map(template => (
            <Card 
              key={template.id} 
              className={`cursor-pointer transition-all hover:shadow-md ${
                selectedTemplate?.id === template.id ? 'ring-2 ring-blue-500' : ''
              }`}
              onClick={() => handleTemplateClick(template)}
            >
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    {getTypeIcon(template.configuration.importType)}
                    {template.name}
                  </span>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDuplicateTemplate(template);
                      }}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleExportTemplate(template);
                      }}
                    >
                      <Download className="h-3 w-3" />
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-xs text-gray-600 mb-2">{template.description}</p>
                <div className="flex flex-wrap gap-1">
                  <Badge className={`text-xs ${getTypeBadgeColor(template.configuration.importType)}`}>
                    {template.configuration.importType.replace('_', ' ')}
                  </Badge>
                  {template.configuration.performCleanup && (
                    <Badge variant="outline" className="text-xs">Cleanup</Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Custom Templates */}
      {customTemplates.length > 0 && (
        <div>
          <h4 className="font-medium mb-3 flex items-center gap-2">
            <User className="h-4 w-4" />
            Custom Templates
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {customTemplates.map(template => (
              <Card 
                key={template.id} 
                className={`cursor-pointer transition-all hover:shadow-md ${
                  selectedTemplate?.id === template.id ? 'ring-2 ring-blue-500' : ''
                }`}
                onClick={() => handleTemplateClick(template)}
              >
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      {getTypeIcon(template.configuration.importType)}
                      {template.name}
                    </span>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          openEditDialog(template);
                        }}
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDuplicateTemplate(template);
                        }}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleExportTemplate(template);
                        }}
                      >
                        <Download className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteTemplate(template);
                        }}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-xs text-gray-600 mb-2">{template.description}</p>
                  <div className="flex flex-wrap gap-1">
                    <Badge className={`text-xs ${getTypeBadgeColor(template.configuration.importType)}`}>
                      {template.configuration.importType.replace('_', ' ')}
                    </Badge>
                    {template.configuration.performCleanup && (
                      <Badge variant="outline" className="text-xs">Cleanup</Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Create Template Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create Import Template</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="template-name">Template Name</Label>
              <Input
                id="template-name"
                value={newTemplate.name}
                onChange={(e) => setNewTemplate({...newTemplate, name: e.target.value})}
                placeholder="Enter template name"
              />
            </div>
            
            <div>
              <Label htmlFor="template-description">Description</Label>
              <Textarea
                id="template-description"
                value={newTemplate.description}
                onChange={(e) => setNewTemplate({...newTemplate, description: e.target.value})}
                placeholder="Enter template description"
              />
            </div>

            <div>
              <Label htmlFor="import-type">Import Type</Label>
              <Select
                value={newTemplate.configuration.importType}
                onValueChange={(value) => setNewTemplate({
                  ...newTemplate,
                  configuration: { ...newTemplate.configuration, importType: value as any }
                })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select import type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="users_only">Users Only</SelectItem>
                  <SelectItem value="vehicles_only">Vehicles Only</SelectItem>
                  <SelectItem value="complete_system">Complete System</SelectItem>
                  <SelectItem value="selective">Selective Import</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {validationResult && (
              <Alert variant={validationResult.isValid ? "default" : "destructive"}>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {validationResult.isValid ? (
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      Template configuration is valid
                    </div>
                  ) : (
                    <div>
                      <div className="font-medium">Validation Errors:</div>
                      <ul className="mt-1 list-disc list-inside">
                        {validationResult.errors.map((error, index) => (
                          <li key={index}>{error}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {validationResult.warnings.length > 0 && (
                    <div className="mt-2">
                      <div className="font-medium">Warnings:</div>
                      <ul className="mt-1 list-disc list-inside">
                        {validationResult.warnings.map((warning, index) => (
                          <li key={index}>{warning}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </AlertDescription>
              </Alert>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowCreateDialog(false);
              setNewTemplate({ name: '', description: '', configuration: {} as SystemImportOptions });
              setValidationResult(null);
            }}>
              Cancel
            </Button>
            <Button onClick={handleCreateTemplate} disabled={!newTemplate.name || !newTemplate.configuration.importType}>
              Create Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Template Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Template</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-template-name">Template Name</Label>
              <Input
                id="edit-template-name"
                value={newTemplate.name}
                onChange={(e) => setNewTemplate({...newTemplate, name: e.target.value})}
                placeholder="Enter template name"
              />
            </div>
            
            <div>
              <Label htmlFor="edit-template-description">Description</Label>
              <Textarea
                id="edit-template-description"
                value={newTemplate.description}
                onChange={(e) => setNewTemplate({...newTemplate, description: e.target.value})}
                placeholder="Enter template description"
              />
            </div>

            {validationResult && (
              <Alert variant={validationResult.isValid ? "default" : "destructive"}>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {validationResult.isValid ? (
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      Template configuration is valid
                    </div>
                  ) : (
                    <div>
                      <div className="font-medium">Validation Errors:</div>
                      <ul className="mt-1 list-disc list-inside">
                        {validationResult.errors.map((error, index) => (
                          <li key={index}>{error}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {validationResult.warnings.length > 0 && (
                    <div className="mt-2">
                      <div className="font-medium">Warnings:</div>
                      <ul className="mt-1 list-disc list-inside">
                        {validationResult.warnings.map((warning, index) => (
                          <li key={index}>{warning}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </AlertDescription>
              </Alert>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowEditDialog(false);
              setEditingTemplate(null);
              setNewTemplate({ name: '', description: '', configuration: {} as SystemImportOptions });
              setValidationResult(null);
            }}>
              Cancel
            </Button>
            <Button onClick={handleEditTemplate} disabled={!newTemplate.name}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ImportTemplateSelector;
