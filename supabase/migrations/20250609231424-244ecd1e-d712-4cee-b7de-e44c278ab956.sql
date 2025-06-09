
-- Create workshops table
CREATE TABLE public.workshops (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  representative_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  city TEXT,
  country TEXT,
  address TEXT,
  service_types JSONB DEFAULT '[]'::jsonb,
  rating NUMERIC(3,2) DEFAULT 0,
  review_count INTEGER DEFAULT 0,
  activation_fee NUMERIC(10,2) DEFAULT 0,
  connection_fee NUMERIC(10,2) DEFAULT 0,
  operating_hours TEXT,
  verified BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES envio_users(id)
);

-- Create workshop connections table
CREATE TABLE public.workshop_connections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workshop_id UUID NOT NULL REFERENCES workshops(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES envio_users(id) ON DELETE CASCADE,
  connection_status TEXT NOT NULL DEFAULT 'pending',
  connected_at TIMESTAMP WITH TIME ZONE,
  connection_fee_paid NUMERIC(10,2) DEFAULT 0,
  payment_status TEXT DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(workshop_id, user_id)
);

-- Create workshop activations table
CREATE TABLE public.workshop_activations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workshop_id UUID NOT NULL REFERENCES workshops(id) ON DELETE CASCADE,
  vehicle_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
  activation_status TEXT NOT NULL DEFAULT 'pending',
  activated_at TIMESTAMP WITH TIME ZONE,
  activation_fee_paid NUMERIC(10,2) DEFAULT 0,
  payment_status TEXT DEFAULT 'pending',
  service_duration_months INTEGER DEFAULT 12,
  expires_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  activated_by UUID REFERENCES envio_users(id)
);

-- Create workshop services table
CREATE TABLE public.workshop_services (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workshop_id UUID NOT NULL REFERENCES workshops(id) ON DELETE CASCADE,
  service_name TEXT NOT NULL,
  service_description TEXT,
  price NUMERIC(10,2),
  duration_hours INTEGER,
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create workshop reviews table
CREATE TABLE public.workshop_reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workshop_id UUID NOT NULL REFERENCES workshops(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES envio_users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT,
  service_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(workshop_id, user_id, service_date)
);

-- Create workshop vehicle assignments table
CREATE TABLE public.workshop_vehicle_assignments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workshop_id UUID NOT NULL REFERENCES workshops(id) ON DELETE CASCADE,
  vehicle_id TEXT NOT NULL,
  assignment_status TEXT NOT NULL DEFAULT 'active',
  assigned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  assigned_by UUID REFERENCES envio_users(id),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(workshop_id, vehicle_id)
);

-- Add indexes for performance
CREATE INDEX idx_workshops_city ON workshops(city);
CREATE INDEX idx_workshops_verified ON workshops(verified);
CREATE INDEX idx_workshop_connections_user_id ON workshop_connections(user_id);
CREATE INDEX idx_workshop_connections_status ON workshop_connections(connection_status);
CREATE INDEX idx_workshop_activations_status ON workshop_activations(activation_status);
CREATE INDEX idx_workshop_vehicle_assignments_vehicle_id ON workshop_vehicle_assignments(vehicle_id);

-- Enable RLS on all workshop tables
ALTER TABLE public.workshops ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workshop_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workshop_activations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workshop_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workshop_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workshop_vehicle_assignments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for workshops
CREATE POLICY "Anyone can view active workshops"
  ON public.workshops FOR SELECT
  USING (is_active = true);

CREATE POLICY "Authenticated users can create workshops"
  ON public.workshops FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Workshop creators can update their workshops"
  ON public.workshops FOR UPDATE
  TO authenticated
  USING (auth.uid() = created_by);

-- Create RLS policies for workshop connections
CREATE POLICY "Users can view their own workshop connections"
  ON public.workshop_connections FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own workshop connections"
  ON public.workshop_connections FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own workshop connections"
  ON public.workshop_connections FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create RLS policies for workshop activations
CREATE POLICY "Users can view workshop activations for their connections"
  ON public.workshop_activations FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM workshop_connections wc
      WHERE wc.workshop_id = workshop_activations.workshop_id
      AND wc.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create workshop activations for their connections"
  ON public.workshop_activations FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM workshop_connections wc
      WHERE wc.workshop_id = workshop_activations.workshop_id
      AND wc.user_id = auth.uid()
      AND wc.connection_status = 'connected'
    )
  );

-- Create RLS policies for workshop services
CREATE POLICY "Anyone can view workshop services"
  ON public.workshop_services FOR SELECT
  USING (true);

CREATE POLICY "Workshop owners can manage their services"
  ON public.workshop_services FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM workshops w
      WHERE w.id = workshop_services.workshop_id
      AND w.created_by = auth.uid()
    )
  );

-- Create RLS policies for workshop reviews
CREATE POLICY "Anyone can view workshop reviews"
  ON public.workshop_reviews FOR SELECT
  USING (true);

CREATE POLICY "Users can create reviews for workshops they've used"
  ON public.workshop_reviews FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reviews"
  ON public.workshop_reviews FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create RLS policies for workshop vehicle assignments (corrected)
CREATE POLICY "Users can view vehicle assignments for their workshops"
  ON public.workshop_vehicle_assignments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM workshops w
      WHERE w.id = workshop_vehicle_assignments.workshop_id
      AND w.created_by = auth.uid()
    )
  );

CREATE POLICY "Workshop owners can manage vehicle assignments"
  ON public.workshop_vehicle_assignments FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM workshops w
      WHERE w.id = workshop_vehicle_assignments.workshop_id
      AND w.created_by = auth.uid()
    )
  );

-- Create function to update workshop rating when reviews are added/updated
CREATE OR REPLACE FUNCTION update_workshop_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE workshops
  SET 
    rating = (
      SELECT AVG(rating)
      FROM workshop_reviews
      WHERE workshop_id = COALESCE(NEW.workshop_id, OLD.workshop_id)
    ),
    review_count = (
      SELECT COUNT(*)
      FROM workshop_reviews
      WHERE workshop_id = COALESCE(NEW.workshop_id, OLD.workshop_id)
    ),
    updated_at = now()
  WHERE id = COALESCE(NEW.workshop_id, OLD.workshop_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create triggers to update workshop ratings
CREATE TRIGGER update_workshop_rating_on_review_insert
  AFTER INSERT ON workshop_reviews
  FOR EACH ROW EXECUTE FUNCTION update_workshop_rating();

CREATE TRIGGER update_workshop_rating_on_review_update
  AFTER UPDATE ON workshop_reviews
  FOR EACH ROW EXECUTE FUNCTION update_workshop_rating();

CREATE TRIGGER update_workshop_rating_on_review_delete
  AFTER DELETE ON workshop_reviews
  FOR EACH ROW EXECUTE FUNCTION update_workshop_rating();
