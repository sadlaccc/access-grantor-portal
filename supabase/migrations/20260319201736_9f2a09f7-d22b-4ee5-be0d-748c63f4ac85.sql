
-- 1. Create notifications table for in-app notifications
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  type text NOT NULL DEFAULT 'info',
  app text,
  entity_id text,
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications" ON public.notifications
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Authenticated users can create notifications" ON public.notifications
  FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update own notifications" ON public.notifications
  FOR UPDATE TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Users can delete own notifications" ON public.notifications
  FOR DELETE TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Admins can manage all notifications" ON public.notifications
  FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- Enable realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- 2. Create audit_log table for tracking deletions globally
CREATE TABLE public.audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  action text NOT NULL,
  table_name text NOT NULL,
  record_id text,
  record_summary text,
  details jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view audit log" ON public.audit_log
  FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Authenticated can insert audit log" ON public.audit_log
  FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);

-- 3. Add missing DELETE policies across all tables

-- Expenses: users can delete own, admins can delete any
CREATE POLICY "Users can delete own expenses" ON public.expenses
  FOR DELETE TO authenticated USING (created_by = auth.uid());
CREATE POLICY "Admins can delete any expense" ON public.expenses
  FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- Leave requests: users can delete own pending, admins can delete any
CREATE POLICY "Users can delete own leave requests" ON public.leave_requests
  FOR DELETE TO authenticated USING (user_id = auth.uid() AND status = 'pending');
CREATE POLICY "Admins can delete any leave request" ON public.leave_requests
  FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- CRM leads: creator can delete, admins can delete any
CREATE POLICY "Users can delete own leads" ON public.crm_leads
  FOR DELETE TO authenticated USING (created_by = auth.uid());
CREATE POLICY "Admins can delete any lead" ON public.crm_leads
  FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- CRM deals: creator can delete, admins can delete any
CREATE POLICY "Users can delete own deals" ON public.crm_deals
  FOR DELETE TO authenticated USING (created_by = auth.uid());
CREATE POLICY "Admins can delete any deal" ON public.crm_deals
  FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- CRM activities: creator can delete, admins can delete any
CREATE POLICY "Users can delete own activities" ON public.crm_activities
  FOR DELETE TO authenticated USING (created_by = auth.uid());
CREATE POLICY "Admins can delete any activity" ON public.crm_activities
  FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- Projects: creator can delete, admins can delete any
CREATE POLICY "Users can delete own projects" ON public.projects
  FOR DELETE TO authenticated USING (created_by = auth.uid());
CREATE POLICY "Admins can delete any project" ON public.projects
  FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- Trainings: admins already have ALL, add user delete for creators
CREATE POLICY "Users can delete own trainings" ON public.trainings
  FOR DELETE TO authenticated USING (created_by = auth.uid());

-- Invoices: creator can delete, admins can delete any
CREATE POLICY "Users can delete own invoices" ON public.invoices
  FOR DELETE TO authenticated USING (created_by = auth.uid());
CREATE POLICY "Admins can delete any invoice" ON public.invoices
  FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- Budgets: creator can delete, admins can delete any
CREATE POLICY "Users can delete own budgets" ON public.budgets
  FOR DELETE TO authenticated USING (created_by = auth.uid());
CREATE POLICY "Admins can delete any budget" ON public.budgets
  FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- Inventory orders: creator can delete, admins can delete any
CREATE POLICY "Users can delete own orders" ON public.inventory_orders
  FOR DELETE TO authenticated USING (created_by = auth.uid());
CREATE POLICY "Admins can delete any order" ON public.inventory_orders
  FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- Inventory products: admins already have ALL via existing policy

-- Knowledge articles: already has admin delete, add user delete for creators
CREATE POLICY "Users can delete own articles" ON public.knowledge_articles
  FOR DELETE TO authenticated USING (created_by = auth.uid());

-- IT Assets: admins already have ALL, add user delete for creators  
CREATE POLICY "Users can delete own assets" ON public.it_assets
  FOR DELETE TO authenticated USING (created_by = auth.uid());
