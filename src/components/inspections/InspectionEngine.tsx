
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ClipboardCheck, 
  Camera,
  FileText,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Star,
  Save,
  Send
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ChecklistItem {
  id: string;
  category: string;
  item_name: string;
  item_description?: string;
  is_required: boolean;
  check_status: 'pending' | 'pass' | 'fail' | 'n/a';
  score?: number;
  inspector_notes?: string;
  severity_level?: 'low' | 'medium' | 'high' | 'critical';
  requires_repair: boolean;
  estimated_repair_cost?: number;
}

interface InspectionEngineProps {
  inspectionId: string;
  vehicleId: string;
  onComplete?: () => void;
}

const INSPECTION_CATEGORIES = [
  'Engine',
  'Transmission',
  'Brakes',
  'Suspension',
  'Electrical',
  'Body & Interior',
  'Tires & Wheels',
  'Safety Equipment',
  'Emissions',
  'Lights & Signals'
];

const DEFAULT_CHECKLIST_ITEMS = [
  { category: 'Engine', item: 'Oil Level & Condition', required: true },
  { category: 'Engine', item: 'Coolant Level & Condition', required: true },
  { category: 'Engine', item: 'Air Filter Condition', required: false },
  { category: 'Engine', item: 'Battery Condition', required: true },
  { category: 'Brakes', item: 'Brake Fluid Level', required: true },
  { category: 'Brakes', item: 'Brake Pad Thickness', required: true },
  { category: 'Brakes', item: 'Brake Disc Condition', required: true },
  { category: 'Tires & Wheels', item: 'Tire Tread Depth', required: true },
  { category: 'Tires & Wheels', item: 'Tire Pressure', required: true },
  { category: 'Tires & Wheels', item: 'Wheel Alignment', required: false },
  { category: 'Lights & Signals', item: 'Headlights', required: true },
  { category: 'Lights & Signals', item: 'Brake Lights', required: true },
  { category: 'Lights & Signals', item: 'Turn Signals', required: true },
  { category: 'Safety Equipment', item: 'Seat Belts', required: true },
  { category: 'Safety Equipment', item: 'Airbag Warning Lights', required: true }
];

const InspectionEngine: React.FC<InspectionEngineProps> = ({
  inspectionId,
  vehicleId,
  onComplete
}) => {
  const { toast } = useToast();
  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>([]);
  const [currentCategory, setCurrentCategory] = useState(INSPECTION_CATEGORIES[0]);
  const [overallNotes, setOverallNotes] = useState('');
  const [overallResult, setOverallResult] = useState<'pass' | 'fail' | 'conditional'>('pass');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadInspectionData();
  }, [inspectionId]);

  const loadInspectionData = async () => {
    try {
      // Check if checklist items already exist
      const { data: existingItems, error } = await supabase
        .from('inspection_checklist_items')
        .select('*')
        .eq('inspection_id', inspectionId);

      if (error) throw error;

      if (existingItems && existingItems.length > 0) {
        // Cast the database data to match our interface types
        const typedItems: ChecklistItem[] = existingItems.map(item => ({
          id: item.id,
          category: item.category,
          item_name: item.item_name,
          item_description: item.item_description,
          is_required: item.is_required,
          check_status: (item.check_status as 'pending' | 'pass' | 'fail' | 'n/a') || 'pending',
          score: (item as any).score || undefined,
          inspector_notes: item.inspector_notes,
          severity_level: (item.severity_level as 'low' | 'medium' | 'high' | 'critical') || undefined,
          requires_repair: item.requires_repair,
          estimated_repair_cost: (item as any).estimated_repair_cost
        }));
        setChecklistItems(typedItems);
      } else {
        // Create default checklist items
        const defaultItems: ChecklistItem[] = DEFAULT_CHECKLIST_ITEMS.map((item, index) => ({
          id: `temp-${index}`,
          category: item.category,
          item_name: item.item,
          item_description: '',
          is_required: item.required,
          check_status: 'pending',
          inspector_notes: '',
          requires_repair: false
        }));
        setChecklistItems(defaultItems);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load inspection data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const updateChecklistItem = (itemId: string, updates: Partial<ChecklistItem>) => {
    setChecklistItems(items =>
      items.map(item =>
        item.id === itemId ? { ...item, ...updates } : item
      )
    );
  };

  const saveInspectionProgress = async () => {
    setSaving(true);
    try {
      // Save or update checklist items
      for (const item of checklistItems) {
        if (item.id.startsWith('temp-')) {
          // Insert new item
          const { data, error } = await supabase
            .from('inspection_checklist_items')
            .insert({
              inspection_id: inspectionId,
              category: item.category,
              item_name: item.item_name,
              item_description: item.item_description,
              is_required: item.is_required,
              check_status: item.check_status,
              score: item.score,
              inspector_notes: item.inspector_notes,
              severity_level: item.severity_level,
              requires_repair: item.requires_repair,
              estimated_repair_cost: item.estimated_repair_cost,
              checked_at: item.check_status !== 'pending' ? new Date().toISOString() : null
            })
            .select()
            .single();

          if (error) throw error;
          
          // Update local state with real ID
          updateChecklistItem(item.id, { id: data.id });
        } else {
          // Update existing item
          const { error } = await supabase
            .from('inspection_checklist_items')
            .update({
              check_status: item.check_status,
              score: item.score,
              inspector_notes: item.inspector_notes,
              severity_level: item.severity_level,
              requires_repair: item.requires_repair,
              estimated_repair_cost: item.estimated_repair_cost,
              checked_at: item.check_status !== 'pending' ? new Date().toISOString() : null
            })
            .eq('id', item.id);

          if (error) throw error;
        }
      }

      toast({
        title: "Progress Saved",
        description: "Inspection progress has been saved"
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to save inspection progress",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const completeInspection = async () => {
    try {
      await saveInspectionProgress();

      // Calculate overall score
      const scoredItems = checklistItems.filter(item => item.score !== undefined);
      const averageScore = scoredItems.length > 0 
        ? scoredItems.reduce((sum, item) => sum + (item.score || 0), 0) / scoredItems.length
        : 0;

      // Update inspection with results
      const { error } = await supabase
        .from('vehicle_inspections')
        .update({
          inspection_status: 'completed',
          completed_at: new Date().toISOString(),
          overall_score: Math.round(averageScore),
          overall_result: overallResult,
          inspection_notes: overallNotes
        })
        .eq('id', inspectionId);

      if (error) throw error;

      toast({
        title: "Inspection Completed",
        description: "Vehicle inspection has been completed successfully"
      });

      onComplete?.();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to complete inspection",
        variant: "destructive"
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pass':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'fail':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'n/a':
        return <div className="h-4 w-4 rounded-full bg-gray-300" />;
      default:
        return <div className="h-4 w-4 rounded-full border-2 border-gray-300" />;
    }
  };

  const getProgressPercentage = () => {
    const completedItems = checklistItems.filter(item => item.check_status !== 'pending').length;
    return checklistItems.length > 0 ? (completedItems / checklistItems.length) * 100 : 0;
  };

  const categoryItems = checklistItems.filter(item => item.category === currentCategory);

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Vehicle Inspection</h2>
          <p className="text-muted-foreground">
            Vehicle ID: {vehicleId}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={saveInspectionProgress} disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Saving...' : 'Save Progress'}
          </Button>
          <Button onClick={completeInspection}>
            <Send className="h-4 w-4 mr-2" />
            Complete Inspection
          </Button>
        </div>
      </div>

      {/* Progress Overview */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Inspection Progress</h3>
            <Badge variant="outline">
              {Math.round(getProgressPercentage())}% Complete
            </Badge>
          </div>
          <Progress value={getProgressPercentage()} className="mb-2" />
          <p className="text-sm text-muted-foreground">
            {checklistItems.filter(item => item.check_status !== 'pending').length} of {checklistItems.length} items completed
          </p>
        </CardContent>
      </Card>

      <Tabs value={currentCategory} onValueChange={setCurrentCategory} className="space-y-6">
        <TabsList className="grid grid-cols-5 lg:grid-cols-10 w-full">
          {INSPECTION_CATEGORIES.map((category) => (
            <TabsTrigger key={category} value={category} className="text-xs">
              {category}
            </TabsTrigger>
          ))}
        </TabsList>

        {INSPECTION_CATEGORIES.map((category) => (
          <TabsContent key={category} value={category} className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ClipboardCheck className="h-5 w-5" />
                  {category} Inspection
                </CardTitle>
                <CardDescription>
                  Complete the inspection checklist for {category.toLowerCase()} components
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {categoryItems.map((item) => (
                  <Card key={item.id} className="p-4">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {getStatusIcon(item.check_status)}
                          <div>
                            <h4 className="font-medium">{item.item_name}</h4>
                            {item.is_required && (
                              <Badge variant="outline" className="text-xs">Required</Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant={item.check_status === 'pass' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => updateChecklistItem(item.id, { check_status: 'pass' })}
                          >
                            Pass
                          </Button>
                          <Button
                            variant={item.check_status === 'fail' ? 'destructive' : 'outline'}
                            size="sm"
                            onClick={() => updateChecklistItem(item.id, { check_status: 'fail' })}
                          >
                            Fail
                          </Button>
                          <Button
                            variant={item.check_status === 'n/a' ? 'secondary' : 'outline'}
                            size="sm"
                            onClick={() => updateChecklistItem(item.id, { check_status: 'n/a' })}
                          >
                            N/A
                          </Button>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor={`score-${item.id}`}>Score (0-100)</Label>
                          <Input
                            id={`score-${item.id}`}
                            type="number"
                            min="0"
                            max="100"
                            value={item.score || ''}
                            onChange={(e) => updateChecklistItem(item.id, { 
                              score: e.target.value ? parseInt(e.target.value) : undefined 
                            })}
                          />
                        </div>
                        <div>
                          <Label htmlFor={`severity-${item.id}`}>Severity Level</Label>
                          <Select
                            value={item.severity_level || ''}
                            onValueChange={(value) => updateChecklistItem(item.id, { 
                              severity_level: value as any 
                            })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select severity" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="low">Low</SelectItem>
                              <SelectItem value="medium">Medium</SelectItem>
                              <SelectItem value="high">High</SelectItem>
                              <SelectItem value="critical">Critical</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div>
                        <Label htmlFor={`notes-${item.id}`}>Inspector Notes</Label>
                        <Textarea
                          id={`notes-${item.id}`}
                          value={item.inspector_notes || ''}
                          onChange={(e) => updateChecklistItem(item.id, { 
                            inspector_notes: e.target.value 
                          })}
                          placeholder="Add any observations or notes..."
                        />
                      </div>

                      {item.check_status === 'fail' && (
                        <div className="border-l-4 border-red-500 pl-4 space-y-3">
                          <div className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id={`repair-${item.id}`}
                              checked={item.requires_repair}
                              onChange={(e) => updateChecklistItem(item.id, { 
                                requires_repair: e.target.checked 
                              })}
                            />
                            <Label htmlFor={`repair-${item.id}`}>Requires Repair</Label>
                          </div>
                          {item.requires_repair && (
                            <div>
                              <Label htmlFor={`cost-${item.id}`}>Estimated Repair Cost</Label>
                              <Input
                                id={`cost-${item.id}`}
                                type="number"
                                min="0"
                                step="0.01"
                                value={item.estimated_repair_cost || ''}
                                onChange={(e) => updateChecklistItem(item.id, { 
                                  estimated_repair_cost: e.target.value ? parseFloat(e.target.value) : undefined 
                                })}
                                placeholder="0.00"
                              />
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </Card>
                ))}
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>

      {/* Overall Results */}
      <Card>
        <CardHeader>
          <CardTitle>Overall Inspection Results</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="overall-result">Overall Result</Label>
            <Select value={overallResult} onValueChange={(value: any) => setOverallResult(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pass">Pass</SelectItem>
                <SelectItem value="fail">Fail</SelectItem>
                <SelectItem value="conditional">Conditional Pass</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="overall-notes">Overall Notes & Recommendations</Label>
            <Textarea
              id="overall-notes"
              value={overallNotes}
              onChange={(e) => setOverallNotes(e.target.value)}
              placeholder="Summary of inspection findings and recommendations..."
              rows={4}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default InspectionEngine;
