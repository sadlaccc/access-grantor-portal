-- Fix expenses: users should only see their own expenses (or admins can see all)
DROP POLICY IF EXISTS "Authenticated users can view expenses" ON public.expenses;

CREATE POLICY "Users can view own expenses" 
ON public.expenses 
FOR SELECT 
USING (created_by = auth.uid() OR has_role(auth.uid(), 'admin'::app_role));

-- Fix inventory_products: restrict to inventory/admin roles
DROP POLICY IF EXISTS "Authenticated users can view products" ON public.inventory_products;
DROP POLICY IF EXISTS "Authenticated users can manage products" ON public.inventory_products;

-- Only admins can manage products
CREATE POLICY "Admins can manage products" 
ON public.inventory_products 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Authenticated users can view products (but not cost_price - handled in application)
CREATE POLICY "Authenticated users can view products" 
ON public.inventory_products 
FOR SELECT 
USING (auth.uid() IS NOT NULL);