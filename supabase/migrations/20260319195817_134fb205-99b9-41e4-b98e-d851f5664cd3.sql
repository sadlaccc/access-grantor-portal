
-- Allow admins to update channels (rename, change type)
CREATE POLICY "Admins can update channels"
ON public.chat_channels
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Allow admins to delete any DM
CREATE POLICY "Admins can delete any DM"
ON public.direct_messages
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));
