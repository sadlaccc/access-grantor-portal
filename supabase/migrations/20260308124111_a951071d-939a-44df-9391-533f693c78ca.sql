
-- Chat channels table
CREATE TABLE public.chat_channels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type text NOT NULL DEFAULT 'public',
  created_by uuid NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.chat_channels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view channels" ON public.chat_channels FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can create channels" ON public.chat_channels FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Admins can delete channels" ON public.chat_channels FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));

-- Channel messages table
CREATE TABLE public.channel_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id uuid REFERENCES public.chat_channels(id) ON DELETE CASCADE NOT NULL,
  user_id uuid NOT NULL,
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.channel_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view channel messages" ON public.channel_messages FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can send channel messages" ON public.channel_messages FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can delete own messages" ON public.channel_messages FOR DELETE USING (user_id = auth.uid());
CREATE POLICY "Admins can delete any message" ON public.channel_messages FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));

-- Direct messages table
CREATE TABLE public.direct_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid NOT NULL,
  receiver_id uuid NOT NULL,
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.direct_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own DMs" ON public.direct_messages FOR SELECT USING (sender_id = auth.uid() OR receiver_id = auth.uid());
CREATE POLICY "Users can send DMs" ON public.direct_messages FOR INSERT WITH CHECK (sender_id = auth.uid());
CREATE POLICY "Users can delete own sent DMs" ON public.direct_messages FOR DELETE USING (sender_id = auth.uid());

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.channel_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.direct_messages;

-- Seed default channels
INSERT INTO public.chat_channels (name, type, created_by) VALUES
  ('general', 'public', '00000000-0000-0000-0000-000000000000'),
  ('engineering', 'public', '00000000-0000-0000-0000-000000000000'),
  ('random', 'public', '00000000-0000-0000-0000-000000000000');
