
-- Create vehicle inspections table
CREATE TABLE public.vehicle_inspections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vehicle_id TEXT NOT NULL,
  workshop_id UUID REFERENCES public.workshops(id) ON DELETE CASCADE NOT NULL,
  inspector_id UUID REFERENCES public.workshop_users(id) ON DELETE SET NULL,
  inspection_type TEXT NOT NULL CHECK (inspection_type IN ('routine', 'annual', 'pre_purchase', 'diagnostic', 'safety')),
  inspection_status TEXT NOT NULL DEFAULT 'scheduled' CHECK (inspection_status IN ('scheduled', 'in_progress', 'completed', 'cancelled', 'failed')),
  scheduled_date TIMESTAMP WITH TIME ZONE NOT NULL,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  inspection_notes TEXT,
  overall_result TEXT CHECK (overall_result IN ('pass', 'fail', 'conditional')),
  estimated_duration_hours INTEGER DEFAULT 2,
  actual_duration_minutes INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES public.workshop_users(id) ON DELETE SET NULL
);

-- Create inspection checklist items table
CREATE TABLE public.inspection_checklist_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  inspection_id UUID REFERENCES public.vehicle_inspections(id) ON DELETE CASCADE NOT NULL,
  category TEXT NOT NULL,
  item_name TEXT NOT NULL,
  item_description TEXT,
  is_required BOOLEAN NOT NULL DEFAULT true,
  check_status TEXT NOT NULL DEFAULT 'pending' CHECK (check_status IN ('pending', 'pass', 'fail', 'n/a')),
  inspector_notes TEXT,
  severity_level TEXT CHECK (severity_level IN ('low', 'medium', 'high', 'critical')),
  requires_repair BOOLEAN DEFAULT false,
  estimated_repair_cost DECIMAL(10,2),
  checked_at TIMESTAMP WITH TIME ZONE,
  checked_by UUID REFERENCES public.workshop_users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create inspection photos table
CREATE TABLE public.inspection_photos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  inspection_id UUID REFERENCES public.vehicle_inspections(id) ON DELETE CASCADE NOT NULL,
  checklist_item_id UUID REFERENCES public.inspection_checklist_items(id) ON DELETE CASCADE,
  photo_url TEXT NOT NULL,
  photo_description TEXT,
  photo_type TEXT CHECK (photo_type IN ('before', 'after', 'damage', 'repair', 'general')),
  uploaded_by UUID REFERENCES public.workshop_users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create inspection templates table for predefined checklists
CREATE TABLE public.inspection_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  template_name TEXT NOT NULL,
  inspection_type TEXT NOT NULL,
  vehicle_category TEXT, -- car, truck, motorcycle, etc.
  checklist_items JSONB NOT NULL DEFAULT '[]',
  estimated_duration_hours INTEGER DEFAULT 2,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES public.workshop_users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add RLS policies
ALTER TABLE public.vehicle_inspections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inspection_checklist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inspection_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inspection_templates ENABLE ROW LEVEL SECURITY;

-- RLS policies for vehicle_inspections
CREATE POLICY "Workshop users can view their workshop inspections"
  ON public.vehicle_inspections
  FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.workshop_users wu 
    WHERE wu.workshop_id = vehicle_inspections.workshop_id 
    AND wu.id = auth.uid()
  ));

CREATE POLICY "Workshop users can create inspections"
  ON public.vehicle_inspections
  FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.workshop_users wu 
    WHERE wu.workshop_id = vehicle_inspections.workshop_id 
    AND wu.id = auth.uid()
  ));

CREATE POLICY "Workshop users can update their workshop inspections"
  ON public.vehicle_inspections
  FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.workshop_users wu 
    WHERE wu.workshop_id = vehicle_inspections.workshop_id 
    AND wu.id = auth.uid()
  ));

-- RLS policies for inspection_checklist_items
CREATE POLICY "Workshop users can view checklist items"
  ON public.inspection_checklist_items
  FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.vehicle_inspections vi
    JOIN public.workshop_users wu ON wu.workshop_id = vi.workshop_id
    WHERE vi.id = inspection_checklist_items.inspection_id 
    AND wu.id = auth.uid()
  ));

CREATE POLICY "Workshop users can manage checklist items"
  ON public.inspection_checklist_items
  FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.vehicle_inspections vi
    JOIN public.workshop_users wu ON wu.workshop_id = vi.workshop_id
    WHERE vi.id = inspection_checklist_items.inspection_id 
    AND wu.id = auth.uid()
  ));

-- RLS policies for inspection_photos
CREATE POLICY "Workshop users can view inspection photos"
  ON public.inspection_photos
  FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.vehicle_inspections vi
    JOIN public.workshop_users wu ON wu.workshop_id = vi.workshop_id
    WHERE vi.id = inspection_photos.inspection_id 
    AND wu.id = auth.uid()
  ));

CREATE POLICY "Workshop users can manage inspection photos"
  ON public.inspection_photos
  FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.vehicle_inspections vi
    JOIN public.workshop_users wu ON wu.workshop_id = vi.workshop_id
    WHERE vi.id = inspection_photos.inspection_id 
    AND wu.id = auth.uid()
  ));

-- RLS policies for inspection_templates
CREATE POLICY "Workshop users can view templates"
  ON public.inspection_templates
  FOR SELECT
  USING (true); -- Templates can be viewed by any authenticated workshop user

CREATE POLICY "Workshop users can create templates"
  ON public.inspection_templates
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Create indexes for better performance
CREATE INDEX idx_vehicle_inspections_workshop_id ON public.vehicle_inspections(workshop_id);
CREATE INDEX idx_vehicle_inspections_vehicle_id ON public.vehicle_inspections(vehicle_id);
CREATE INDEX idx_vehicle_inspections_status ON public.vehicle_inspections(inspection_status);
CREATE INDEX idx_vehicle_inspections_scheduled_date ON public.vehicle_inspections(scheduled_date);
CREATE INDEX idx_inspection_checklist_items_inspection_id ON public.inspection_checklist_items(inspection_id);
CREATE INDEX idx_inspection_photos_inspection_id ON public.inspection_photos(inspection_id);
