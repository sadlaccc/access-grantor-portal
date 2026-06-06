
-- BUDGETS
DROP POLICY IF EXISTS "Authenticated users can manage budgets" ON public.budgets;
CREATE POLICY "Users can create budgets" ON public.budgets
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Owners or admins can update budgets" ON public.budgets
  FOR UPDATE TO authenticated USING (created_by = auth.uid() OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (created_by = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- INVOICES
DROP POLICY IF EXISTS "Authenticated users can view invoices" ON public.invoices;
DROP POLICY IF EXISTS "Authenticated users can manage invoices" ON public.invoices;
CREATE POLICY "Finance/admin/owner view invoices" ON public.invoices
  FOR SELECT TO authenticated USING (
    created_by = auth.uid()
    OR public.has_role(auth.uid(), 'admin')
    OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.department = 'Finance')
  );
CREATE POLICY "Finance/admin can insert invoices" ON public.invoices
  FOR INSERT TO authenticated WITH CHECK (
    created_by = auth.uid() AND (
      public.has_role(auth.uid(), 'admin')
      OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.department = 'Finance')
    )
  );
CREATE POLICY "Finance/admin/owner update invoices" ON public.invoices
  FOR UPDATE TO authenticated USING (
    created_by = auth.uid()
    OR public.has_role(auth.uid(), 'admin')
    OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.department = 'Finance')
  );

-- INVENTORY ORDERS
DROP POLICY IF EXISTS "Authenticated users can manage orders" ON public.inventory_orders;
CREATE POLICY "Users can create inventory orders" ON public.inventory_orders
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Ops/admin/owner update inventory orders" ON public.inventory_orders
  FOR UPDATE TO authenticated USING (
    created_by = auth.uid()
    OR public.has_role(auth.uid(), 'admin')
    OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.department IN ('Operations','Inventory'))
  );

-- KNOWLEDGE ARTICLES
DROP POLICY IF EXISTS "Users can update articles" ON public.knowledge_articles;
CREATE POLICY "Authors or admins can update articles" ON public.knowledge_articles
  FOR UPDATE TO authenticated USING (created_by = auth.uid() OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (created_by = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- CRM LEADS
DROP POLICY IF EXISTS "Authenticated users can view leads" ON public.crm_leads;
DROP POLICY IF EXISTS "Users can update leads" ON public.crm_leads;
CREATE POLICY "Sales/admin/owner view leads" ON public.crm_leads
  FOR SELECT TO authenticated USING (
    created_by = auth.uid()
    OR public.has_role(auth.uid(), 'admin')
    OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.department = 'Sales')
  );
CREATE POLICY "Sales/admin/owner update leads" ON public.crm_leads
  FOR UPDATE TO authenticated USING (
    created_by = auth.uid()
    OR public.has_role(auth.uid(), 'admin')
    OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.department = 'Sales')
  );

-- PROJECT MEMBERS
DROP POLICY IF EXISTS "Authenticated users can manage project members" ON public.project_members;
CREATE POLICY "Owners or admins can add project members" ON public.project_members
  FOR INSERT TO authenticated WITH CHECK (
    public.has_role(auth.uid(), 'admin')
    OR EXISTS (SELECT 1 FROM public.projects pr WHERE pr.id = project_id AND pr.created_by = auth.uid())
  );
CREATE POLICY "Owners or admins can update project members" ON public.project_members
  FOR UPDATE TO authenticated USING (
    public.has_role(auth.uid(), 'admin')
    OR EXISTS (SELECT 1 FROM public.projects pr WHERE pr.id = project_id AND pr.created_by = auth.uid())
  );
CREATE POLICY "Owners or admins can remove project members" ON public.project_members
  FOR DELETE TO authenticated USING (
    public.has_role(auth.uid(), 'admin')
    OR EXISTS (SELECT 1 FROM public.projects pr WHERE pr.id = project_id AND pr.created_by = auth.uid())
  );

-- AUDIT LOG
DROP POLICY IF EXISTS "Authenticated can insert audit log" ON public.audit_log;
CREATE POLICY "Users can insert own audit log" ON public.audit_log
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

-- SECURITY DEFINER functions: revoke execute from public/anon
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_visible_profile_data(public.profiles, uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_updated_at() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.validate_review_rating() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_visible_profile_data(public.profiles, uuid) TO authenticated;

-- STORAGE: documents bucket
DROP POLICY IF EXISTS "Authenticated users can view documents" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload documents" ON storage.objects;
CREATE POLICY "Users view own documents or admin" ON storage.objects
  FOR SELECT TO authenticated USING (
    bucket_id = 'documents' AND (
      (owner)::text = (auth.uid())::text
      OR (storage.foldername(name))[1] = (auth.uid())::text
      OR public.has_role(auth.uid(), 'admin')
    )
  );
CREATE POLICY "Users upload to own folder" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (
    bucket_id = 'documents'
    AND (storage.foldername(name))[1] = (auth.uid())::text
  );

-- STORAGE: avatars
DROP POLICY IF EXISTS "Anyone can view avatars" ON storage.objects;
CREATE POLICY "Authenticated can view avatars" ON storage.objects
  FOR SELECT TO authenticated USING (bucket_id = 'avatars');
CREATE POLICY "Public can view individual avatars" ON storage.objects
  FOR SELECT TO anon USING (bucket_id = 'avatars');
