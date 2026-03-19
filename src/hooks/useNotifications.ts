import { useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface AppNotification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: string;
  app: string | null;
  entity_id: string | null;
  read: boolean;
  created_at: string;
}

export function useNotifications() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['notifications', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data as AppNotification[];
    },
    enabled: !!user,
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const markAllAsRead = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', user?.id!)
        .eq('read', false);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const deleteNotification = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('notifications').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  return {
    notifications,
    unreadCount,
    isLoading,
    markAsRead: markAsRead.mutate,
    markAllAsRead: markAllAsRead.mutate,
    deleteNotification: deleteNotification.mutate,
  };
}

/**
 * Sends a notification to all users (fetches all profile IDs and inserts notifications).
 * Also logs the action to the audit_log table.
 */
export async function notifyAllUsers(params: {
  title: string;
  message: string;
  type: string;
  app: string;
  entity_id?: string;
  excludeUserId?: string;
}) {
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id');

  if (!profiles || profiles.length === 0) return;

  const notifications = profiles
    .filter(p => p.id !== params.excludeUserId)
    .map(p => ({
      user_id: p.id,
      title: params.title,
      message: params.message,
      type: params.type,
      app: params.app,
      entity_id: params.entity_id || null,
    }));

  if (notifications.length > 0) {
    await supabase.from('notifications').insert(notifications);
  }
}

/**
 * Sends a notification to a specific user.
 */
export async function notifyUser(params: {
  userId: string;
  title: string;
  message: string;
  type: string;
  app: string;
  entity_id?: string;
}) {
  await supabase.from('notifications').insert({
    user_id: params.userId,
    title: params.title,
    message: params.message,
    type: params.type,
    app: params.app,
    entity_id: params.entity_id || null,
  });
}

/**
 * Logs an action to the audit_log table.
 */
export async function logAuditAction(params: {
  userId: string;
  action: string;
  tableName: string;
  recordId?: string;
  recordSummary?: string;
  details?: Record<string, unknown>;
}) {
  await supabase.from('audit_log').insert({
    user_id: params.userId,
    action: params.action,
    table_name: params.tableName,
    record_id: params.recordId || null,
    record_summary: params.recordSummary || null,
    details: params.details || null,
  });
}
