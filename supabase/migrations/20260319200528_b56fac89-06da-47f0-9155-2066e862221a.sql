
-- HRM announcements table for notifying employees
CREATE TABLE public.hrm_announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content text NOT NULL,
  category text NOT NULL DEFAULT 'general',
  created_by uuid NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.hrm_announcements ENABLE ROW LEVEL SECURITY;

-- All authenticated users can view announcements
CREATE POLICY "Authenticated users can view announcements"
ON public.hrm_announcements FOR SELECT TO authenticated
USING (true);

-- Admins can manage announcements
CREATE POLICY "Admins can manage announcements"
ON public.hrm_announcements FOR ALL TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- HRM users (authenticated) can create announcements
CREATE POLICY "Authenticated users can create announcements"
ON public.hrm_announcements FOR INSERT TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);

-- Users can update own announcements
CREATE POLICY "Users can update own announcements"
ON public.hrm_announcements FOR UPDATE TO authenticated
USING (created_by = auth.uid());

-- Users can delete own announcements  
CREATE POLICY "Users can delete own announcements"
ON public.hrm_announcements FOR DELETE TO authenticated
USING (created_by = auth.uid() OR has_role(auth.uid(), 'admin'::app_role));

-- Enable realtime for announcements
ALTER PUBLICATION supabase_realtime ADD TABLE public.hrm_announcements;
