import { useEffect } from 'react';
import { Bell, CheckCircle, AlertCircle, Clock, X, Trash2, FileText, Users, Package, FolderKanban, BookOpen, Laptop } from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { useNotifications } from '@/hooks/useNotifications';
import { useAuth } from '@/contexts/AuthContext';

const typeIcons: Record<string, React.ElementType> = {
  create: CheckCircle,
  update: Clock,
  delete: Trash2,
  info: Bell,
  finance: FileText,
  hrm: Users,
  inventory: Package,
  project: FolderKanban,
  knowledge: BookOpen,
  asset: Laptop,
};

const typeColors: Record<string, string> = {
  create: 'text-success bg-success/10',
  update: 'text-warning bg-warning/10',
  delete: 'text-destructive bg-destructive/10',
  info: 'text-primary bg-primary/10',
};

export function NotificationsWidget() {
  const { user } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead, deleteNotification } = useNotifications();

  // Subscribe to realtime notifications
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel('notifications-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` }, () => {
        // The useNotifications hook will auto-refetch via react-query
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4, duration: 0.4 }}
      className="rounded-2xl border border-border bg-card card-elevated overflow-hidden"
    >
      <div className="flex items-center justify-between border-b border-border px-6 py-4">
        <div className="flex items-center gap-2.5">
          <Bell className="h-4 w-4 text-primary" />
          <h3 className="font-display text-sm font-semibold text-card-foreground">Notifications</h3>
          {unreadCount > 0 && (
            <Badge variant="destructive" className="h-5 min-w-5 rounded-full px-1.5 text-[10px]">
              {unreadCount}
            </Badge>
          )}
        </div>
        {unreadCount > 0 && (
          <Button variant="ghost" size="sm" onClick={() => markAllAsRead()} className="text-xs text-muted-foreground hover:text-foreground h-7">
            Mark all read
          </Button>
        )}
      </div>

      <ScrollArea className="h-[300px]">
        {notifications.length === 0 ? (
          <div className="flex h-full items-center justify-center p-6">
            <div className="text-center">
              <AlertCircle className="mx-auto h-8 w-8 text-muted-foreground/30" />
              <p className="mt-2 text-sm text-muted-foreground">No notifications</p>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {notifications.map((notification) => {
              const Icon = typeIcons[notification.type] || typeIcons[notification.app || 'info'] || Bell;
              const colorClass = typeColors[notification.type] || typeColors.info;
              return (
                <div
                  key={notification.id}
                  className={cn(
                    'group relative flex items-start gap-3 px-6 py-4 transition-colors hover:bg-muted/30 cursor-pointer',
                    !notification.read && 'bg-primary/[0.03]'
                  )}
                  onClick={() => !notification.read && markAsRead(notification.id)}
                >
                  <div className={cn('mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl', colorClass)}>
                    <Icon className="h-3.5 w-3.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-card-foreground">{notification.title}</p>
                      {!notification.read && <span className="h-1.5 w-1.5 rounded-full bg-primary" />}
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground line-clamp-1">{notification.message}</p>
                    <p className="mt-1 text-[10px] text-muted-foreground/60">
                      {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => { e.stopPropagation(); deleteNotification(notification.id); }}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </ScrollArea>
    </motion.div>
  );
}
