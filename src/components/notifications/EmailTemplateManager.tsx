
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useEnhancedEmailTemplates } from '@/hooks/useEnhancedEmailTemplates';
import { 
  FileText, 
  Eye, 
  Edit, 
  Copy,
  Plus,
  Search,
  Filter,
  AlertTriangle,
  Car,
  Wrench,
  Shield,
  Database
} from 'lucide-react';

const getCategoryIcon = (category: string) => {
  switch (category) {
    case 'vehicle_management':
      return Car;
    case 'fleet_operations':
      return AlertTriangle;
    case 'maintenance':
      return Wrench;
    case 'system':
      return Shield;
    case 'gp51_integration':
      return Database;
    default:
      return FileText;
  }
};

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'critical':
      return 'destructive';
    case 'high':
      return 'destructive';
    case 'medium':
      return 'default';
    case 'low':
      return 'secondary';
    default:
      return 'default';
  }
};

export const EmailTemplateManager: React.FC = () => {
  const { templates, isLoadingTemplates } = useEnhancedEmailTemplates();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);

  const filteredTemplates = templates?.filter(template => {
    const matchesSearch = template.template_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         template.subject.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || template.template_category === selectedCategory;
    return matchesSearch && matchesCategory;
  }) || [];

  const categories = [...new Set(templates?.map(t => t.template_category) || [])];

  const selectedTemplateData = templates?.find(t => t.id === selectedTemplate);

  if (isLoadingTemplates) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Loading email templates...</CardTitle>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Email Templates</h3>
          <p className="text-sm text-muted-foreground">
            Manage and customize email templates for fleet communications
          </p>
        </div>
        <Button className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Create Template
        </Button>
      </div>

      {/* Search and Filter */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Label htmlFor="search">Search Templates</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search by name or subject..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="sm:w-48">
              <Label htmlFor="category">Filter by Category</Label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map(category => (
                    <SelectItem key={category} value={category}>
                      {category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Templates List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Templates ({filteredTemplates.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 max-h-96 overflow-y-auto">
            {filteredTemplates.map(template => {
              const CategoryIcon = getCategoryIcon(template.template_category);
              return (
                <div
                  key={template.id}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors hover:bg-muted/50 ${
                    selectedTemplate === template.id ? 'bg-muted border-primary' : ''
                  }`}
                  onClick={() => setSelectedTemplate(template.id)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <CategoryIcon className="h-4 w-4 text-muted-foreground" />
                      <h4 className="font-medium text-sm">{template.template_name}</h4>
                    </div>
                    <div className="flex items-center gap-1">
                      <Badge variant={getPriorityColor(template.priority_level)} className="text-xs">
                        {template.priority_level}
                      </Badge>
                      {template.is_system_template && (
                        <Badge variant="outline" className="text-xs">System</Badge>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                    {template.subject}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{template.template_category.replace(/_/g, ' ')}</span>
                    <span>•</span>
                    <span>v{template.version}</span>
                    <span>•</span>
                    <span>{template.placeholders.length} variables</span>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Template Preview/Editor */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Template Preview
            </CardTitle>
            {selectedTemplateData && (
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline">
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
                <Button size="sm" variant="outline">
                  <Copy className="h-4 w-4 mr-2" />
                  Duplicate
                </Button>
              </div>
            )}
          </CardHeader>
          <CardContent>
            {selectedTemplateData ? (
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium">Subject</Label>
                  <div className="p-3 bg-muted rounded-md text-sm">
                    {selectedTemplateData.subject}
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium">Variables ({selectedTemplateData.placeholders.length})</Label>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {selectedTemplateData.placeholders.map(placeholder => (
                      <Badge key={placeholder} variant="secondary" className="text-xs">
                        {`{{${placeholder}}}`}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium">HTML Content</Label>
                  <Textarea
                    value={selectedTemplateData.body_html || ''}
                    readOnly
                    className="h-32 text-xs font-mono"
                  />
                </div>

                <div>
                  <Label className="text-sm font-medium">Text Content</Label>
                  <Textarea
                    value={selectedTemplateData.body_text || ''}
                    readOnly
                    className="h-24 text-xs"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <Label className="text-sm font-medium">Category</Label>
                    <p className="text-muted-foreground">
                      {selectedTemplateData.template_category.replace(/_/g, ' ')}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Priority</Label>
                    <p className="text-muted-foreground">{selectedTemplateData.priority_level}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Language</Label>
                    <p className="text-muted-foreground">{selectedTemplateData.language_code}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Version</Label>
                    <p className="text-muted-foreground">v{selectedTemplateData.version}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Select a template to preview its content</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
