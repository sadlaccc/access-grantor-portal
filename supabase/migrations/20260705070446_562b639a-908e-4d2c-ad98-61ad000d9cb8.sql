
-- MEETINGS
CREATE TABLE public.meetings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  agenda TEXT,
  scheduled_at TIMESTAMPTZ NOT NULL,
  duration_minutes INT NOT NULL DEFAULT 30,
  location TEXT,
  meeting_link TEXT,
  status TEXT NOT NULL DEFAULT 'scheduled',
  organizer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.meetings TO authenticated;
GRANT ALL ON public.meetings TO service_role;
ALTER TABLE public.meetings ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.meeting_participants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  meeting_id UUID NOT NULL REFERENCES public.meetings(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  response TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (meeting_id, user_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.meeting_participants TO authenticated;
GRANT ALL ON public.meeting_participants TO service_role;
ALTER TABLE public.meeting_participants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View meetings organized or invited"
  ON public.meetings FOR SELECT TO authenticated
  USING (
    organizer_id = auth.uid()
    OR public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'hr')
    OR EXISTS (SELECT 1 FROM public.meeting_participants mp WHERE mp.meeting_id = meetings.id AND mp.user_id = auth.uid())
  );

CREATE POLICY "HR admin or organizer create meetings"
  ON public.meetings FOR INSERT TO authenticated
  WITH CHECK (
    organizer_id = auth.uid()
    AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'hr'))
  );

CREATE POLICY "HR admin or organizer update meetings"
  ON public.meetings FOR UPDATE TO authenticated
  USING (
    organizer_id = auth.uid()
    OR public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'hr')
  );

CREATE POLICY "HR admin or organizer delete meetings"
  ON public.meetings FOR DELETE TO authenticated
  USING (
    organizer_id = auth.uid()
    OR public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'hr')
  );

CREATE POLICY "View own participation or as organizer/HR"
  ON public.meeting_participants FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'hr')
    OR EXISTS (SELECT 1 FROM public.meetings m WHERE m.id = meeting_participants.meeting_id AND m.organizer_id = auth.uid())
  );

CREATE POLICY "HR admin or organizer add participants"
  ON public.meeting_participants FOR INSERT TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'hr')
    OR EXISTS (SELECT 1 FROM public.meetings m WHERE m.id = meeting_participants.meeting_id AND m.organizer_id = auth.uid())
  );

CREATE POLICY "Update own response or as organizer/HR"
  ON public.meeting_participants FOR UPDATE TO authenticated
  USING (
    user_id = auth.uid()
    OR public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'hr')
    OR EXISTS (SELECT 1 FROM public.meetings m WHERE m.id = meeting_participants.meeting_id AND m.organizer_id = auth.uid())
  );

CREATE POLICY "HR admin or organizer remove participants"
  ON public.meeting_participants FOR DELETE TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'hr')
    OR EXISTS (SELECT 1 FROM public.meetings m WHERE m.id = meeting_participants.meeting_id AND m.organizer_id = auth.uid())
  );

CREATE TRIGGER update_meetings_updated_at
  BEFORE UPDATE ON public.meetings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- PAYMENTS
CREATE TABLE public.payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  payment_number TEXT NOT NULL UNIQUE,
  payee_type TEXT NOT NULL CHECK (payee_type IN ('employee', 'supplier')),
  payee_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  payee_name TEXT NOT NULL,
  supplier_contact TEXT,
  amount NUMERIC(14,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'KES',
  method TEXT NOT NULL DEFAULT 'bank_transfer',
  reference TEXT,
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  category TEXT,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'completed',
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.payments TO authenticated;
GRANT ALL ON public.payments TO service_role;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Finance/admin view all; payee views own"
  ON public.payments FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin')
    OR payee_user_id = auth.uid()
    OR created_by = auth.uid()
  );

CREATE POLICY "Authenticated can insert payments"
  ON public.payments FOR INSERT TO authenticated
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Creator or admin can update payments"
  ON public.payments FOR UPDATE TO authenticated
  USING (created_by = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Creator or admin can delete payments"
  ON public.payments FOR DELETE TO authenticated
  USING (created_by = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_payments_updated_at
  BEFORE UPDATE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
