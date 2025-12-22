import { tickets } from '@/data/mockData';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const statusColors = {
  open: 'bg-warning/10 text-warning border-warning/20',
  'in-progress': 'bg-accent/10 text-accent border-accent/20',
  resolved: 'bg-success/10 text-success border-success/20',
  closed: 'bg-muted text-muted-foreground border-muted',
};

const priorityColors = {
  low: 'bg-muted text-muted-foreground',
  medium: 'bg-accent/10 text-accent',
  high: 'bg-warning/10 text-warning',
  critical: 'bg-destructive/10 text-destructive',
};

export function RecentTickets() {
  return (
    <div className="rounded-xl border border-border bg-card">
      <div className="border-b border-border px-6 py-4">
        <h3 className="font-display font-semibold text-card-foreground">Recent Tickets</h3>
      </div>
      <div className="divide-y divide-border">
        {tickets.slice(0, 4).map((ticket) => (
          <div
            key={ticket.id}
            className="flex items-center justify-between px-6 py-4 transition-colors hover:bg-muted/50"
          >
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-muted-foreground">{ticket.id}</span>
                <Badge variant="outline" className={cn('text-xs', priorityColors[ticket.priority])}>
                  {ticket.priority}
                </Badge>
              </div>
              <p className="mt-1 font-medium text-card-foreground">{ticket.title}</p>
              <p className="mt-0.5 text-sm text-muted-foreground">
                by {ticket.createdBy.name}
              </p>
            </div>
            <Badge variant="outline" className={cn('ml-4', statusColors[ticket.status])}>
              {ticket.status}
            </Badge>
          </div>
        ))}
      </div>
    </div>
  );
}
