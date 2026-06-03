import { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Loader2, Ticket, AlertCircle, Pencil, Zap, Clock } from 'lucide-react';
import { useDepartment } from '@/hooks/useDepartment';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface TicketType {
  id: string;
  ticket_number: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  created_by: string | null;
  assignee_id: string | null;
  department: string | null;
  created_at: string;
  updated_at: string;
}

interface Profile {
  id: string;
  full_name: string | null;
  email: string;
}

const statusColors: Record<string, string> = {
  open: 'bg-warning/15 text-warning border-warning/30',
  'in-progress': 'bg-primary/15 text-primary border-primary/30',
  resolved: 'bg-success/15 text-success border-success/30',
  closed: 'bg-muted text-muted-foreground border-muted',
};

const priorityColors: Record<string, string> = {
  low: 'bg-muted text-muted-foreground',
  medium: 'bg-primary/15 text-primary',
  high: 'bg-warning/15 text-warning',
  critical: 'bg-destructive/15 text-destructive',
};

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.04 } },
};

const rowVariants = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: 0.25 } },
};

export default function Helpdesk() {
  const { user } = useAuth();
  const { isIT, isAdmin } = useDepartment();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingTicket, setEditingTicket] = useState<TicketType | null>(null);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('medium');
  const [assigneeId, setAssigneeId] = useState<string | null>(null);

  const { data: tickets = [], isLoading: ticketsLoading } = useQuery({
    queryKey: ['tickets'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tickets')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as TicketType[];
    },
  });

  const { data: profiles = [] } = useQuery({
    queryKey: ['profiles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email');
      if (error) throw error;
      return data as Profile[];
    },
  });

  const profileMap = profiles.reduce((acc, p) => {
    acc[p.id] = p.full_name || p.email;
    return acc;
  }, {} as Record<string, string>);

  const profileEmailMap = profiles.reduce((acc, p) => {
    acc[p.id] = p.email;
    return acc;
  }, {} as Record<string, string>);

  const sendNotification = async (payload: {
    type: 'created' | 'status_changed';
    ticketNumber: string;
    ticketTitle: string;
    ticketDescription?: string;
    priority?: string;
    oldStatus?: string;
    newStatus?: string;
    creatorEmail?: string;
    assigneeEmail?: string;
  }) => {
    try {
      await supabase.functions.invoke('send-ticket-notification', { body: payload });
    } catch (error) {
      console.error('Failed to send notification:', error);
    }
  };

  const createTicketMutation = useMutation({
    mutationFn: async () => {
      const ticketNumber = `TKT-${Date.now().toString(36).toUpperCase()}`;
      const { data, error } = await supabase.from('tickets').insert({
        ticket_number: ticketNumber,
        title,
        description: description || null,
        priority,
        status: 'open',
        created_by: user?.id,
        assignee_id: assigneeId,
        department: null,
      }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      toast.success('Ticket created successfully');
      setIsCreateDialogOpen(false);
      
      const creatorEmail = user?.id ? profileEmailMap[user.id] : undefined;
      const assigneeEmail = assigneeId ? profileEmailMap[assigneeId] : undefined;
      sendNotification({
        type: 'created',
        ticketNumber: data.ticket_number,
        ticketTitle: title,
        ticketDescription: description || undefined,
        priority,
        creatorEmail,
        assigneeEmail,
      });
      
      resetForm();
    },
    onError: (error: Error) => {
      toast.error('Failed to create ticket: ' + error.message);
    },
  });

  const editTicketMutation = useMutation({
    mutationFn: async () => {
      if (!editingTicket) return;
      const { error } = await supabase.from('tickets').update({
        title, description: description || null, priority, assignee_id: assigneeId,
      }).eq('id', editingTicket.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      toast.success('Ticket updated');
      setIsEditDialogOpen(false);
      setEditingTicket(null);
      resetForm();
    },
    onError: (error: Error) => toast.error('Failed to update ticket: ' + error.message),
  });

  const updateTicketStatusMutation = useMutation({
    mutationFn: async ({ ticketId, status, oldStatus }: { ticketId: string; status: string; oldStatus: string }) => {
      const { data, error } = await supabase
        .from('tickets')
        .update({ status })
        .eq('id', ticketId)
        .select()
        .single();
      if (error) throw error;
      return { ...data, oldStatus };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      toast.success('Ticket updated');
      
      const creatorEmail = data.created_by ? profileEmailMap[data.created_by] : undefined;
      const assigneeEmail = data.assignee_id ? profileEmailMap[data.assignee_id] : undefined;
      sendNotification({
        type: 'status_changed',
        ticketNumber: data.ticket_number,
        ticketTitle: data.title,
        oldStatus: data.oldStatus,
        newStatus: data.status,
        creatorEmail,
        assigneeEmail,
      });
    },
    onError: (error: Error) => {
      toast.error('Failed to update ticket: ' + error.message);
    },
  });

  const escalateTicketMutation = useMutation({
    mutationFn: async (ticket: TicketType) => {
      const next = ticket.priority === 'low' ? 'medium' : ticket.priority === 'medium' ? 'high' : 'critical';
      const { error } = await supabase.from('tickets').update({ priority: next }).eq('id', ticket.id);
      if (error) throw error;
      return { ...ticket, next };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      toast.success(`Escalated to ${data.next}`);
    },
    onError: (e: Error) => toast.error('Escalate failed: ' + e.message),
  });

  const slaHours: Record<string, number> = { critical: 4, high: 8, medium: 24, low: 72 };
  const getSla = (ticket: TicketType) => {
    if (ticket.status === 'resolved' || ticket.status === 'closed') return null;
    const target = slaHours[ticket.priority] ?? 24;
    const elapsedH = (Date.now() - new Date(ticket.created_at).getTime()) / 3_600_000;
    const remaining = target - elapsedH;
    return { remaining, breached: remaining < 0 };
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setPriority('medium');
    setAssigneeId(null);
  };

  const openEditDialog = (ticket: TicketType) => {
    setEditingTicket(ticket);
    setTitle(ticket.title);
    setDescription(ticket.description || '');
    setPriority(ticket.priority);
    setAssigneeId(ticket.assignee_id);
    setIsEditDialogOpen(true);
  };

  const filteredTickets = tickets.filter((ticket) => {
    const matchesSearch =
      ticket.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.ticket_number.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter ? ticket.status === statusFilter : true;
    return matchesSearch && matchesStatus;
  });

  const statusCounts = tickets.reduce((acc, t) => {
    acc[t.status] = (acc[t.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  if (ticketsLoading) {
    return (
      <MainLayout>
        <div className="flex h-[50vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  const ticketFormContent = (isEdit: boolean) => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Title *</Label>
        <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Brief description of the issue" />
      </div>
      <div className="space-y-2">
        <Label>Description</Label>
        <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Detailed description..." rows={4} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Priority</Label>
          <Select value={priority} onValueChange={setPriority}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Assign To</Label>
          <Select value={assigneeId || ''} onValueChange={(v) => setAssigneeId(v || null)}>
            <SelectTrigger><SelectValue placeholder="Select assignee" /></SelectTrigger>
            <SelectContent>
              {profiles.map((profile) => (
                <SelectItem key={profile.id} value={profile.id}>{profile.full_name || profile.email}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <Button className="w-full" onClick={() => isEdit ? editTicketMutation.mutate() : createTicketMutation.mutate()} disabled={!title || (isEdit ? editTicketMutation.isPending : createTicketMutation.isPending)}>
        {(isEdit ? editTicketMutation.isPending : createTicketMutation.isPending) && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
        {isEdit ? 'Save Changes' : 'Create Ticket'}
      </Button>
    </div>
  );

  return (
    <MainLayout>
      <div className="p-6 lg:p-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-display text-3xl font-bold text-foreground">Helpdesk</h1>
            <p className="mt-1 text-muted-foreground">Manage support tickets and requests</p>
          </div>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="gradient" className="gap-2">
                <Plus className="h-4 w-4" />
                New Ticket
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Ticket</DialogTitle>
              </DialogHeader>
              {ticketFormContent(false)}
            </DialogContent>
          </Dialog>
        </div>

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={(open) => { setIsEditDialogOpen(open); if (!open) { setEditingTicket(null); resetForm(); } }}>
          <DialogContent>
            <DialogHeader><DialogTitle>Edit Ticket</DialogTitle></DialogHeader>
            {ticketFormContent(true)}
          </DialogContent>
        </Dialog>

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { key: 'open', label: 'Open', color: 'bg-warning/10 text-warning' },
            { key: 'in-progress', label: 'In Progress', color: 'bg-primary/10 text-primary' },
            { key: 'resolved', label: 'Resolved', color: 'bg-success/10 text-success' },
            { key: 'closed', label: 'Closed', color: 'bg-muted text-muted-foreground' },
          ].map(({ key, label, color }, idx) => (
            <motion.div
              key={key}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              onClick={() => setStatusFilter(statusFilter === key ? null : key)}
              className={cn(
                'rounded-2xl border border-border p-5 text-center cursor-pointer transition-all hover:border-primary/30',
                color,
                statusFilter === key && 'ring-2 ring-primary ring-offset-2 ring-offset-background'
              )}
            >
              <span className="text-3xl font-bold">{statusCounts[key] || 0}</span>
              <p className="mt-1 text-sm opacity-80">{label}</p>
            </motion.div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search tickets..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10 rounded-xl" />
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button variant={statusFilter === null ? 'default' : 'outline'} size="sm" className="rounded-lg" onClick={() => setStatusFilter(null)}>All</Button>
            {['open', 'in-progress', 'resolved', 'closed'].map((status) => (
              <Button key={status} variant={statusFilter === status ? 'default' : 'outline'} size="sm" className="rounded-lg capitalize" onClick={() => setStatusFilter(status)}>
                {status.replace('-', ' ')}
              </Button>
            ))}
          </div>
        </div>

        {/* Tickets Table */}
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="rounded-2xl border border-border bg-card overflow-hidden"
        >
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Ticket</th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Priority</th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Status</th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Created By</th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Assignee</th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredTickets.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center text-muted-foreground">
                      <Ticket className="h-10 w-10 mb-3 opacity-50" />
                      {tickets.length === 0 ? 'No tickets yet. Create your first ticket above.' : 'No tickets match your filters.'}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredTickets.map((ticket) => (
                  <motion.tr key={ticket.id} variants={rowVariants} className="transition-colors hover:bg-muted/30">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                          <Ticket className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <span className="text-xs font-mono text-muted-foreground">{ticket.ticket_number}</span>
                          <p className="font-medium text-card-foreground leading-tight">{ticket.title}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant="outline" className={cn('capitalize text-xs', priorityColors[ticket.priority])}>
                        {ticket.priority === 'critical' && <AlertCircle className="h-3 w-3 mr-1" />}
                        {ticket.priority}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <Badge variant="outline" className={cn('capitalize text-xs w-fit', statusColors[ticket.status])}>
                          {ticket.status.replace('-', ' ')}
                        </Badge>
                        {(() => {
                          const sla = getSla(ticket);
                          if (!sla) return null;
                          return (
                            <span className={cn('text-xs flex items-center gap-1', sla.breached ? 'text-destructive' : 'text-muted-foreground')}>
                              <Clock className="h-3 w-3" />
                              {sla.breached ? `SLA breached ${Math.abs(sla.remaining).toFixed(1)}h ago` : `${sla.remaining.toFixed(1)}h left`}
                            </span>
                          );
                        })()}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-card-foreground">{ticket.created_by ? profileMap[ticket.created_by] || 'Unknown' : '—'}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-card-foreground">{ticket.assignee_id ? profileMap[ticket.assignee_id] || 'Unknown' : '—'}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openEditDialog(ticket)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Select
                          value={ticket.status}
                          onValueChange={(newStatus) => updateTicketStatusMutation.mutate({ ticketId: ticket.id, status: newStatus, oldStatus: ticket.status })}
                        >
                          <SelectTrigger className="w-[130px] rounded-lg">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="open">Open</SelectItem>
                            <SelectItem value="in-progress">In Progress</SelectItem>
                            <SelectItem value="resolved">Resolved</SelectItem>
                            <SelectItem value="closed">Closed</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </motion.div>
      </div>
    </MainLayout>
  );
}
