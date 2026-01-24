import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

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
        .select(`
          id,
          ticket_number,
          title,
          status,
          priority,
          created_by,
          profiles:created_by (full_name)
        `)
        .order('created_at', { ascending: false })
        .limit(4);

      if (error) throw error;
      return data || [];
    },
  });

  return (
    <div className="rounded-xl border border-border bg-card">
      <div className="border-b border-border px-6 py-4">
        <h3 className="font-display font-semibold text-card-foreground">Recent Tickets</h3>
      </div>
      {isLoading ? (
        <div className="flex h-40 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
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
              className="flex items-center justify-between px-6 py-4 transition-colors hover:bg-muted/50"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-muted-foreground">
                    #{ticket.ticket_number}
                  </span>
                  <Badge variant="outline" className={cn('text-xs', priorityColors[ticket.priority])}>
                    {ticket.priority}
                  </Badge>
                </div>
                <p className="mt-1 font-medium text-card-foreground">{ticket.title}</p>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  by {ticket.profiles?.full_name || 'Unknown'}
                </p>
              </div>
              <Badge variant="outline" className={cn('ml-4', statusColors[ticket.status])}>
                {ticket.status}
              </Badge>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
