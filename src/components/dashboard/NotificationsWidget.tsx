import { useEffect, useState } from 'react';
import { Bell, Ticket, CheckCircle, AlertCircle, Clock, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

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
  ticket_created: 'text-primary',
  ticket_updated: 'text-warning',
  ticket_resolved: 'text-success',
};

export function NotificationsWidget() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    // Fetch initial recent tickets as notifications
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

    // Subscribe to real-time ticket changes
    const channel = supabase
      .channel('tickets-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'tickets',
        },
        (payload) => {
          const ticket = payload.new as any;
          const newNotification: Notification = {
            id: `ticket-new-${ticket.id}-${Date.now()}`,
            type: 'ticket_created',
            title: `New Ticket #${ticket.ticket_number}`,
            message: ticket.title,
            timestamp: new Date(),
            read: false,
            ticketId: ticket.id,
          };
          setNotifications((prev) => [newNotification, ...prev.slice(0, 19)]);
          setUnreadCount((prev) => prev + 1);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'tickets',
        },
        (payload) => {
          const ticket = payload.new as any;
          const oldTicket = payload.old as any;
          
          if (ticket.status !== oldTicket.status) {
            const newNotification: Notification = {
              id: `ticket-update-${ticket.id}-${Date.now()}`,
              type: ticket.status === 'resolved' ? 'ticket_resolved' : 'ticket_updated',
              title: `Ticket #${ticket.ticket_number} Updated`,
              message: `Status changed to ${ticket.status}`,
              timestamp: new Date(),
              read: false,
              ticketId: ticket.id,
            };
            setNotifications((prev) => [newNotification, ...prev.slice(0, 19)]);
            setUnreadCount((prev) => prev + 1);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  const dismissNotification = (id: string) => {
    const notification = notifications.find((n) => n.id === id);
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    if (notification && !notification.read) {
      setUnreadCount((prev) => Math.max(0, prev - 1));
    }
  };

  return (
    <div className="rounded-xl border border-border bg-card">
      <div className="flex items-center justify-between border-b border-border px-6 py-4">
        <div className="flex items-center gap-2">
          <Bell className="h-5 w-5 text-primary" />
          <h3 className="font-display font-semibold text-card-foreground">
            Notifications
          </h3>
          {unreadCount > 0 && (
            <Badge variant="destructive" className="h-5 min-w-5 rounded-full px-1.5 text-xs">
              {unreadCount}
            </Badge>
          )}
        </div>
        {unreadCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={markAllAsRead}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            Mark all read
          </Button>
        )}
      </div>

      <ScrollArea className="h-[280px]">
        {notifications.length === 0 ? (
          <div className="flex h-full items-center justify-center p-6">
            <div className="text-center">
              <AlertCircle className="mx-auto h-8 w-8 text-muted-foreground/50" />
              <p className="mt-2 text-sm text-muted-foreground">No notifications yet</p>
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
                    'group relative flex items-start gap-3 px-6 py-4 transition-colors hover:bg-muted/50',
                    !notification.read && 'bg-primary/5'
                  )}
                  onClick={() => markAsRead(notification.id)}
                >
                  <div
                    className={cn(
                      'mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted',
                      notificationColors[notification.type]
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-card-foreground">
                        {notification.title}
                      </p>
                      {!notification.read && (
                        <span className="h-2 w-2 rounded-full bg-primary" />
                      )}
                    </div>
                    <p className="mt-0.5 text-sm text-muted-foreground line-clamp-1">
                      {notification.message}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground/70">
                      {formatDistanceToNow(notification.timestamp, { addSuffix: true })}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
                    onClick={(e) => {
                      e.stopPropagation();
                      dismissNotification(notification.id);
                    }}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
