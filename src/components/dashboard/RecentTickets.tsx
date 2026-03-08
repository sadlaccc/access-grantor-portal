import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Loader2, Ticket } from 'lucide-react';
import { motion } from 'framer-motion';

const statusColors: Record<string, string> = {
  open: 'bg-warning/10 text-warning border-warning/20',
  'in-progress': 'bg-accent/10 text-accent border-accent/20',
  resolved: 'bg-success/10 text-success border-success/20',
  closed: 'bg-muted text-muted-foreground border-muted',
};

const priorityColors: Record<string, string> = {
  low: 'bg-muted text-muted-foreground',
  medium: 'bg-accent/10 text-accent',
  high: 'bg-warning/10 text-warning',
  critical: 'bg-destructive/10 text-destructive',
};

export function RecentTickets() {
  const { data: tickets = [], isLoading } = useQuery({
    queryKey: ['recent-tickets'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tickets')
        .select(`id, ticket_number, title, status, priority, created_by, profiles:created_by (full_name)`)
        .order('created_at', { ascending: false })
        .limit(4);
      if (error) throw error;
      return data || [];
    },
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, duration: 0.4 }}
      className="rounded-2xl border border-border bg-card card-elevated overflow-hidden"
    >
      <div className="flex items-center gap-2.5 border-b border-border px-6 py-4">
        <Ticket className="h-4 w-4 text-primary" />
        <h3 className="font-display text-sm font-semibold text-card-foreground">Recent Tickets</h3>
      </div>
      {isLoading ? (
        <div className="flex h-40 items-center justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : tickets.length === 0 ? (
        <div className="flex h-40 items-center justify-center">
          <p className="text-sm text-muted-foreground">No tickets yet</p>
        </div>
      ) : (
        <div className="divide-y divide-border">
          {tickets.map((ticket: any) => (
            <div
              key={ticket.id}
              className="flex items-center justify-between px-6 py-4 transition-colors hover:bg-muted/30"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-medium text-muted-foreground">
                    #{ticket.ticket_number}
                  </span>
                  <Badge variant="outline" className={cn('text-[10px] px-1.5 py-0', priorityColors[ticket.priority])}>
                    {ticket.priority}
                  </Badge>
                </div>
                <p className="mt-1 text-sm font-medium text-card-foreground">{ticket.title}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  by {ticket.profiles?.full_name || 'Unknown'}
                </p>
              </div>
              <Badge variant="outline" className={cn('ml-4 text-[10px]', statusColors[ticket.status])}>
                {ticket.status}
              </Badge>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
