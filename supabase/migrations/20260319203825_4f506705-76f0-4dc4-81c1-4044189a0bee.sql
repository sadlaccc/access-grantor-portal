
-- Attendance tracking table
CREATE TABLE public.attendance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  date date NOT NULL DEFAULT CURRENT_DATE,
  check_in timestamp with time zone,
  check_out timestamp with time zone,
  status text NOT NULL DEFAULT 'present',
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id, date)
);
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own attendance" ON public.attendance FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "HR and admins can view all attendance" ON public.attendance FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'hr'::app_role));
CREATE POLICY "Users can insert own attendance" ON public.attendance FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "HR and admins can manage attendance" ON public.attendance FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'hr'::app_role));

-- Performance reviews table
CREATE TABLE public.performance_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL,
  reviewer_id uuid NOT NULL,
  review_period text NOT NULL,
  rating integer,
  strengths text,
  improvements text,
  goals text,
  comments text,
  status text NOT NULL DEFAULT 'draft',
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);
ALTER TABLE public.performance_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Employees can view own reviews" ON public.performance_reviews FOR SELECT TO authenticated USING (employee_id = auth.uid());
CREATE POLICY "HR and admins can manage reviews" ON public.performance_reviews FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'hr'::app_role));
CREATE POLICY "Reviewers can view their reviews" ON public.performance_reviews FOR SELECT TO authenticated USING (reviewer_id = auth.uid());

-- Onboarding tasks table
CREATE TABLE public.onboarding_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL,
  title text NOT NULL,
  description text,
  category text NOT NULL DEFAULT 'general',
  is_completed boolean DEFAULT false,
  due_date date,
  assigned_by uuid,
  completed_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now()
);
ALTER TABLE public.onboarding_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Employees can view own onboarding" ON public.onboarding_tasks FOR SELECT TO authenticated USING (employee_id = auth.uid());
CREATE POLICY "Employees can update own onboarding" ON public.onboarding_tasks FOR UPDATE TO authenticated USING (employee_id = auth.uid());
CREATE POLICY "HR and admins can manage onboarding" ON public.onboarding_tasks FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'hr'::app_role));

-- HR role policies for existing tables
CREATE POLICY "HR can view all leave requests" ON public.leave_requests FOR SELECT TO authenticated USING (has_role(auth.uid(), 'hr'::app_role));
CREATE POLICY "HR can update leave requests" ON public.leave_requests FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'hr'::app_role));
CREATE POLICY "HR can view all profiles" ON public.profiles FOR SELECT TO authenticated USING (has_role(auth.uid(), 'hr'::app_role));
CREATE POLICY "HR can manage trainings" ON public.trainings FOR ALL TO authenticated USING (has_role(auth.uid(), 'hr'::app_role));

-- Use validation trigger instead of CHECK for rating
CREATE OR REPLACE FUNCTION public.validate_review_rating()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.rating IS NOT NULL AND (NEW.rating < 1 OR NEW.rating > 5) THEN
    RAISE EXCEPTION 'Rating must be between 1 and 5';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER validate_review_rating_trigger
  BEFORE INSERT OR UPDATE ON public.performance_reviews
  FOR EACH ROW EXECUTE FUNCTION public.validate_review_rating();
