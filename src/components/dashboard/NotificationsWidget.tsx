import { useEffect, useState } from 'react';
import { Bell, Ticket, CheckCircle, AlertCircle, Clock, X } from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { usePushNotifications } from '@/hooks/usePushNotifications';

interface Notification {
  id: string;
  type: 'ticket_created' | 'ticket_updated' | 'ticket_resolved';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  ticketId?: string;
}

const notificationIcons = {
  ticket_created: Ticket,
  ticket_updated: Clock,
  ticket_resolved: CheckCircle,
};

const notificationColors = {
  ticket_created: 'text-primary bg-primary/10',
  ticket_updated: 'text-warning bg-warning/10',
  ticket_resolved: 'text-success bg-success/10',
};

export function NotificationsWidget() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const { sendNotification, permission } = usePushNotifications();

  useEffect(() => {
    const fetchRecentTickets = async () => {
      const { data: tickets } = await supabase
        .from('tickets')
        .select('id, ticket_number, title, status, created_at, updated_at')
        .order('created_at', { ascending: false })
        .limit(10);

      if (tickets) {
        const initialNotifications: Notification[] = tickets.map((ticket) => ({
          id: `ticket-${ticket.id}`,
          type: ticket.status === 'resolved' ? 'ticket_resolved' : 'ticket_created',
          title: `Ticket #${ticket.ticket_number}`,
          message: ticket.title,
          timestamp: new Date(ticket.created_at),
          read: false,
          ticketId: ticket.id,
        }));
        setNotifications(initialNotifications);
        setUnreadCount(initialNotifications.length);
      }
    };

    fetchRecentTickets();

    const channel = supabase
      .channel('tickets-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'tickets' }, (payload) => {
        const ticket = payload.new as any;
        const n: Notification = {
          id: `ticket-new-${ticket.id}-${Date.now()}`,
          type: 'ticket_created',
          title: `New Ticket #${ticket.ticket_number}`,
          message: ticket.title,
          timestamp: new Date(),
          read: false,
          ticketId: ticket.id,
        };
        setNotifications((prev) => [n, ...prev.slice(0, 19)]);
        setUnreadCount((prev) => prev + 1);
        if (permission === 'granted') {
          sendNotification(`New Ticket #${ticket.ticket_number}`, { body: ticket.title, tag: `ticket-${ticket.id}` });
        }
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'tickets' }, (payload) => {
        const ticket = payload.new as any;
        const old = payload.old as any;
        if (ticket.status !== old.status) {
          const n: Notification = {
            id: `ticket-update-${ticket.id}-${Date.now()}`,
            type: ticket.status === 'resolved' ? 'ticket_resolved' : 'ticket_updated',
            title: `Ticket #${ticket.ticket_number} Updated`,
            message: `Status changed to ${ticket.status}`,
            timestamp: new Date(),
            read: false,
            ticketId: ticket.id,
          };
          setNotifications((prev) => [n, ...prev.slice(0, 19)]);
          setUnreadCount((prev) => prev + 1);
          if (permission === 'granted') {
            sendNotification(`Ticket #${ticket.ticket_number} Updated`, { body: `Status: ${ticket.status}`, tag: `ticket-update-${ticket.id}` });
          }
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const markAsRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    setUnreadCount((prev) => Math.max(0, prev - 1));
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  const dismiss = (id: string) => {
    const n = notifications.find((n) => n.id === id);
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    if (n && !n.read) setUnreadCount((prev) => Math.max(0, prev - 1));
  };

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
          <Button variant="ghost" size="sm" onClick={markAllAsRead} className="text-xs text-muted-foreground hover:text-foreground h-7">
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
              const Icon = notificationIcons[notification.type];
              return (
                <div
                  key={notification.id}
                  className={cn(
                    'group relative flex items-start gap-3 px-6 py-4 transition-colors hover:bg-muted/30 cursor-pointer',
                    !notification.read && 'bg-primary/[0.03]'
                  )}
                  onClick={() => markAsRead(notification.id)}
                >
                  <div className={cn('mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl', notificationColors[notification.type])}>
                    <Icon className="h-3.5 w-3.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-card-foreground">{notification.title}</p>
                      {!notification.read && <span className="h-1.5 w-1.5 rounded-full bg-primary" />}
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground line-clamp-1">{notification.message}</p>
                    <p className="mt-1 text-[10px] text-muted-foreground/60">
                      {formatDistanceToNow(notification.timestamp, { addSuffix: true })}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => { e.stopPropagation(); dismiss(notification.id); }}
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
