
-- Assets table
CREATE TABLE public.it_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  serial_number TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'laptop',
  status TEXT NOT NULL DEFAULT 'available',
  assigned_to UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  purchase_date DATE,
  warranty_expiry DATE,
  notes TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.it_assets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view assets" ON public.it_assets FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage assets" ON public.it_assets FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can create assets" ON public.it_assets FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);

-- Projects table
CREATE TABLE public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'planning',
  priority TEXT DEFAULT 'medium',
  progress INTEGER DEFAULT 0,
  start_date DATE,
  end_date DATE,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view projects" ON public.projects FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can create projects" ON public.projects FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Users can update projects" ON public.projects FOR UPDATE TO authenticated USING (true);

-- Project members
CREATE TABLE public.project_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  user_id UUID NOT NULL,
  role TEXT DEFAULT 'member',
  joined_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.project_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view project members" ON public.project_members FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can manage project members" ON public.project_members FOR ALL TO authenticated USING (true);

-- Knowledge base articles
CREATE TABLE public.knowledge_articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  content TEXT,
  category TEXT NOT NULL DEFAULT 'general',
  type TEXT NOT NULL DEFAULT 'document',
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.knowledge_articles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view articles" ON public.knowledge_articles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can create articles" ON public.knowledge_articles FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Users can update articles" ON public.knowledge_articles FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Admins can delete articles" ON public.knowledge_articles FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'));

-- CRM Leads
CREATE TABLE public.crm_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company TEXT NOT NULL,
  contact_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  estimated_value NUMERIC DEFAULT 0,
  stage TEXT NOT NULL DEFAULT 'discovery',
  source TEXT,
  notes TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.crm_leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view leads" ON public.crm_leads FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can create leads" ON public.crm_leads FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Users can update leads" ON public.crm_leads FOR UPDATE TO authenticated USING (true);

-- CRM Deals
CREATE TABLE public.crm_deals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  company TEXT NOT NULL,
  value NUMERIC DEFAULT 0,
  stage TEXT NOT NULL DEFAULT 'discovery',
  probability INTEGER DEFAULT 0,
  close_date DATE,
  lead_id UUID REFERENCES public.crm_leads(id) ON DELETE SET NULL,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.crm_deals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view deals" ON public.crm_deals FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can create deals" ON public.crm_deals FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Users can update deals" ON public.crm_deals FOR UPDATE TO authenticated USING (true);

-- CRM Activities
CREATE TABLE public.crm_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL DEFAULT 'call',
  description TEXT NOT NULL,
  scheduled_at TIMESTAMPTZ,
  completed BOOLEAN DEFAULT false,
  lead_id UUID REFERENCES public.crm_leads(id) ON DELETE CASCADE,
  assigned_to UUID,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.crm_activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view activities" ON public.crm_activities FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can create activities" ON public.crm_activities FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Users can update activities" ON public.crm_activities FOR UPDATE TO authenticated USING (true);

-- Leave Requests
CREATE TABLE public.leave_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  leave_type TEXT NOT NULL DEFAULT 'annual',
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  days INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'pending',
  reason TEXT,
  approved_by UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.leave_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own leave requests" ON public.leave_requests FOR SELECT TO authenticated USING (user_id = auth.uid() OR has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can create own leave requests" ON public.leave_requests FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Admins can update leave requests" ON public.leave_requests FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin') OR user_id = auth.uid());

-- Trainings
CREATE TABLE public.trainings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  enrolled_count INTEGER DEFAULT 0,
  completed_count INTEGER DEFAULT 0,
  due_date DATE,
  status TEXT DEFAULT 'active',
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.trainings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view trainings" ON public.trainings FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage trainings" ON public.trainings FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Authenticated users can create trainings" ON public.trainings FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);

-- Update triggers
CREATE TRIGGER update_it_assets_updated_at BEFORE UPDATE ON public.it_assets FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON public.projects FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_knowledge_articles_updated_at BEFORE UPDATE ON public.knowledge_articles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_crm_leads_updated_at BEFORE UPDATE ON public.crm_leads FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_crm_deals_updated_at BEFORE UPDATE ON public.crm_deals FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_leave_requests_updated_at BEFORE UPDATE ON public.leave_requests FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_trainings_updated_at BEFORE UPDATE ON public.trainings FOR EACH ROW EXECUTE FUNCTION update_updated_at();
