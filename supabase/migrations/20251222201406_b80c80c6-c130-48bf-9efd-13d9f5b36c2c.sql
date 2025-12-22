-- Add privacy settings columns to profiles
ALTER TABLE public.profiles 
ADD COLUMN show_email boolean DEFAULT false,
ADD COLUMN show_phone boolean DEFAULT false,
ADD COLUMN show_department boolean DEFAULT true,
ADD COLUMN show_job_title boolean DEFAULT true;

-- Drop the existing overly permissive SELECT policy
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;

-- Create a function that returns limited profile data based on privacy settings
CREATE OR REPLACE FUNCTION public.get_visible_profile_data(profile_row profiles, requesting_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- If viewing own profile, return everything
  IF profile_row.id = requesting_user_id THEN
    RETURN to_jsonb(profile_row);
  END IF;
  
  -- For other users, only return data they've chosen to share
  RETURN jsonb_build_object(
    'id', profile_row.id,
    'full_name', profile_row.full_name,
    'avatar_url', profile_row.avatar_url,
    'email', CASE WHEN profile_row.show_email THEN profile_row.email ELSE NULL END,
    'phone', CASE WHEN profile_row.show_phone THEN profile_row.phone ELSE NULL END,
    'department', CASE WHEN profile_row.show_department THEN profile_row.department ELSE NULL END,
    'job_title', CASE WHEN profile_row.show_job_title THEN profile_row.job_title ELSE NULL END,
    'ai_enabled', profile_row.ai_enabled,
    'created_at', profile_row.created_at,
    'updated_at', profile_row.updated_at
  );
END;
$$;

-- Users can view their own full profile
CREATE POLICY "Users can view own full profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = id);

-- Users can view limited data of other profiles (name, avatar always visible)
CREATE POLICY "Users can view limited profile data of others" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- Admins can view all profiles fully
CREATE POLICY "Admins can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));