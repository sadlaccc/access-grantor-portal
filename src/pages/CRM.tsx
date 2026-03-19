import { useState } from 'react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { DatePicker } from '@/components/ui/date-picker';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Building2, DollarSign, TrendingUp, Search, Plus, Phone, Mail, Calendar, Target, Handshake, Loader2,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface Lead {
  id: string;
  company: string;
  contact_name: string;
  email: string | null;
  phone: string | null;
  estimated_value: number;
  stage: string;
  source: string | null;
  created_at: string;
}

interface Deal {
  id: string;
  name: string;
  company: string;
  value: number;
  stage: string;
  probability: number;
  close_date: string | null;
  created_at: string;
}

interface Activity {
  id: string;
  type: string;
  description: string;
  scheduled_at: string | null;
  completed: boolean;
  created_at: string;
}

const cardVariants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] } },
};

export default function CRM() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [isLeadDialogOpen, setIsLeadDialogOpen] = useState(false);
  const [isDealDialogOpen, setIsDealDialogOpen] = useState(false);
  const [leadCompany, setLeadCompany] = useState('');
  const [leadContact, setLeadContact] = useState('');
  const [leadEmail, setLeadEmail] = useState('');
  const [leadValue, setLeadValue] = useState('');
  const [leadSource, setLeadSource] = useState('');
  const [dealName, setDealName] = useState('');
  const [dealCompany, setDealCompany] = useState('');
  const [dealValue, setDealValue] = useState('');
  const [dealCloseDate, setDealCloseDate] = useState<Date | undefined>();

  const { data: leads = [], isLoading: leadsLoading } = useQuery({
    queryKey: ['crm-leads'],
    queryFn: async () => {
      const { data, error } = await supabase.from('crm_leads').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data as Lead[];
    },
  });

  const { data: deals = [], isLoading: dealsLoading } = useQuery({
    queryKey: ['crm-deals'],
    queryFn: async () => {
      const { data, error } = await supabase.from('crm_deals').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data as Deal[];
    },
  });

  const { data: activities = [] } = useQuery({
    queryKey: ['crm-activities'],
    queryFn: async () => {
      const { data, error } = await supabase.from('crm_activities').select('*').order('scheduled_at', { ascending: true });
      if (error) throw error;
      return data as Activity[];
    },
  });

  const createLeadMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('crm_leads').insert({
        company: leadCompany,
        contact_name: leadContact,
        email: leadEmail || null,
        estimated_value: parseFloat(leadValue) || 0,
        source: leadSource || null,
        created_by: user?.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crm-leads'] });
      toast.success('Lead added successfully');
      setIsLeadDialogOpen(false);
      setLeadCompany(''); setLeadContact(''); setLeadEmail(''); setLeadValue(''); setLeadSource('');
    },
    onError: (error: Error) => toast.error('Failed: ' + error.message),
  });

  const createDealMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('crm_deals').insert({
        name: dealName,
        company: dealCompany,
        value: parseFloat(dealValue) || 0,
        close_date: dealCloseDate ? format(dealCloseDate, 'yyyy-MM-dd') : null,
        created_by: user?.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crm-deals'] });
      toast.success('Deal created successfully');
      setIsDealDialogOpen(false);
      setDealName(''); setDealCompany(''); setDealValue(''); setDealCloseDate(undefined);
    },
    onError: (error: Error) => toast.error('Failed: ' + error.message),
  });

  const getStageBadge = (stage: string) => {
    const stages: Record<string, { label: string; className: string }> = {
      discovery: { label: 'Discovery', className: 'bg-muted text-muted-foreground' },
      qualification: { label: 'Qualification', className: 'bg-primary/15 text-primary border-primary/30' },
      proposal: { label: 'Proposal', className: 'bg-warning/15 text-warning border-warning/30' },
      negotiation: { label: 'Negotiation', className: 'bg-accent/15 text-accent border-accent/30' },
      'closed-won': { label: 'Closed Won', className: 'bg-success/15 text-success border-success/30' },
      'closed-lost': { label: 'Closed Lost', className: 'bg-destructive/15 text-destructive border-destructive/30' },
    };
    const s = stages[stage] || { label: stage, className: 'bg-muted text-muted-foreground' };
    return <Badge className={s.className}>{s.label}</Badge>;
  };

  const totalPipeline = deals.reduce((sum, d) => sum + d.value, 0);
  const closedWon = deals.filter(d => d.stage === 'closed-won').reduce((sum, d) => sum + d.value, 0);
  const isLoading = leadsLoading || dealsLoading;

  if (isLoading) {
    return <MainLayout><div className="flex h-[50vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div></MainLayout>;
  }

  return (
    <MainLayout>
      <div className="p-6 lg:p-8 space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="font-display text-3xl font-bold text-foreground">CRM</h1>
            <p className="text-muted-foreground">Manage leads, deals, and customer relationships</p>
          </div>
          <div className="flex gap-2">
            <Dialog open={isDealDialogOpen} onOpenChange={setIsDealDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="gap-2"><Handshake className="h-4 w-4" />New Deal</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Create New Deal</DialogTitle></DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2"><Label>Deal Name *</Label><Input value={dealName} onChange={(e) => setDealName(e.target.value)} placeholder="Enterprise License Deal" /></div>
                  <div className="space-y-2"><Label>Company *</Label><Input value={dealCompany} onChange={(e) => setDealCompany(e.target.value)} placeholder="Acme Corp" /></div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2"><Label>Value (KES)</Label><Input type="number" value={dealValue} onChange={(e) => setDealValue(e.target.value)} placeholder="50000" /></div>
                    <div className="space-y-2"><Label>Close Date</Label><DatePicker date={dealCloseDate} onDateChange={setDealCloseDate} placeholder="Select close date" /></div>
                  </div>
                  <Button className="w-full" onClick={() => createDealMutation.mutate()} disabled={!dealName || !dealCompany || createDealMutation.isPending}>
                    {createDealMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Create Deal
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
            <Dialog open={isLeadDialogOpen} onOpenChange={setIsLeadDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="gradient" className="gap-2"><Plus className="h-4 w-4" />New Lead</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Add New Lead</DialogTitle></DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2"><Label>Company Name *</Label><Input value={leadCompany} onChange={(e) => setLeadCompany(e.target.value)} placeholder="Company name" /></div>
                  <div className="space-y-2"><Label>Contact Person *</Label><Input value={leadContact} onChange={(e) => setLeadContact(e.target.value)} placeholder="Contact name" /></div>
                  <div className="space-y-2"><Label>Email</Label><Input type="email" value={leadEmail} onChange={(e) => setLeadEmail(e.target.value)} placeholder="contact@company.com" /></div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2"><Label>Estimated Value (KES)</Label><Input type="number" value={leadValue} onChange={(e) => setLeadValue(e.target.value)} placeholder="50000" /></div>
                    <div className="space-y-2"><Label>Source</Label><Input value={leadSource} onChange={(e) => setLeadSource(e.target.value)} placeholder="Website, Referral..." /></div>
                  </div>
                  <Button className="w-full" onClick={() => createLeadMutation.mutate()} disabled={!leadCompany || !leadContact || createLeadMutation.isPending}>
                    {createLeadMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Add Lead
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          {[
            { icon: Target, label: 'Active Leads', value: leads.length, color: 'bg-primary/10 text-primary' },
            { icon: Handshake, label: 'Open Deals', value: deals.length, color: 'bg-accent/10 text-accent' },
            { icon: DollarSign, label: 'Pipeline Value', value: `KES ${(totalPipeline / 1000).toFixed(0)}K`, color: 'bg-warning/10 text-warning' },
            { icon: TrendingUp, label: 'Closed Won', value: `KES ${(closedWon / 1000).toFixed(0)}K`, color: 'bg-success/10 text-success' },
          ].map((stat, idx) => (
            <motion.div key={stat.label} variants={cardVariants} initial="hidden" animate="show" transition={{ delay: idx * 0.05 }}>
              <Card className="card-interactive">
                <CardContent className="p-5">
                  <div className="flex items-center gap-4">
                    <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${stat.color}`}>
                      <stat.icon className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                      <p className="text-sm text-muted-foreground">{stat.label}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        <Tabs defaultValue="leads" className="space-y-4">
          <TabsList className="bg-muted/50 p-1 rounded-xl">
            <TabsTrigger value="leads" className="flex items-center gap-2 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm"><Target className="h-4 w-4" />Leads</TabsTrigger>
            <TabsTrigger value="deals" className="flex items-center gap-2 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm"><Handshake className="h-4 w-4" />Deals</TabsTrigger>
            <TabsTrigger value="activities" className="flex items-center gap-2 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm"><Calendar className="h-4 w-4" />Activities</TabsTrigger>
          </TabsList>

          <TabsContent value="leads">
            <Card className="rounded-2xl">
              <CardHeader className="pb-4 border-b border-border">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-semibold">Lead Pipeline</CardTitle>
                  <div className="relative w-64">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input placeholder="Search leads..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9 rounded-xl" />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-4">
                {leads.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Target className="h-10 w-10 mx-auto mb-3 opacity-50" />
                    No leads yet. Add your first lead above.
                  </div>
                ) : (
                  <Table>
                    <TableHeader><TableRow>
                      <TableHead>Company</TableHead><TableHead>Contact</TableHead><TableHead>Value</TableHead><TableHead>Stage</TableHead><TableHead>Source</TableHead>
                    </TableRow></TableHeader>
                    <TableBody>
                      {leads.filter(l => l.company.toLowerCase().includes(searchTerm.toLowerCase()) || l.contact_name.toLowerCase().includes(searchTerm.toLowerCase())).map((lead) => (
                        <TableRow key={lead.id} className="hover:bg-muted/50 transition-colors">
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                                <Building2 className="h-5 w-5 text-primary" />
                              </div>
                              <div>
                                <p className="font-medium">{lead.company}</p>
                                <p className="text-sm text-muted-foreground">{lead.email}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <p className="font-medium">{lead.contact_name}</p>
                            <p className="text-sm text-muted-foreground">{lead.phone}</p>
                          </TableCell>
                          <TableCell className="font-semibold text-success">KES {lead.estimated_value.toLocaleString()}</TableCell>
                          <TableCell>{getStageBadge(lead.stage)}</TableCell>
                          <TableCell><Badge variant="outline" className="bg-muted/50">{lead.source || '—'}</Badge></TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="deals">
            <Card className="rounded-2xl">
              <CardHeader className="border-b border-border"><CardTitle className="text-lg font-semibold">Deal Pipeline</CardTitle></CardHeader>
              <CardContent className="pt-4">
                {deals.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Handshake className="h-10 w-10 mx-auto mb-3 opacity-50" />
                    No deals yet. Create your first deal above.
                  </div>
                ) : (
                  <Table>
                    <TableHeader><TableRow>
                      <TableHead>Deal Name</TableHead><TableHead>Company</TableHead><TableHead>Value</TableHead><TableHead>Stage</TableHead><TableHead>Probability</TableHead><TableHead>Close Date</TableHead>
                    </TableRow></TableHeader>
                    <TableBody>
                      {deals.map((deal) => (
                        <TableRow key={deal.id} className="hover:bg-muted/50 transition-colors">
                          <TableCell className="font-medium">{deal.name}</TableCell>
                          <TableCell>{deal.company}</TableCell>
                          <TableCell className="font-semibold text-success">KES {deal.value.toLocaleString()}</TableCell>
                          <TableCell>{getStageBadge(deal.stage)}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                                <motion.div 
                                  initial={{ width: 0 }}
                                  animate={{ width: `${deal.probability}%` }}
                                  className="h-full bg-primary rounded-full" 
                                />
                              </div>
                              <span className="text-sm font-medium">{deal.probability}%</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm">{deal.close_date ? new Date(deal.close_date).toLocaleDateString() : '—'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="activities">
            <Card className="rounded-2xl">
              <CardHeader className="border-b border-border"><CardTitle className="text-lg font-semibold">Scheduled Activities</CardTitle></CardHeader>
              <CardContent className="pt-4">
                {activities.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Calendar className="h-10 w-10 mx-auto mb-3 opacity-50" />
                    No activities scheduled yet.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {activities.map((activity, idx) => (
                      <motion.div 
                        key={activity.id} 
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className="flex items-center gap-4 rounded-xl border border-border p-4 hover:border-primary/20 transition-colors"
                      >
                        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${activity.type === 'call' ? 'bg-primary/10' : activity.type === 'email' ? 'bg-accent/10' : 'bg-warning/10'}`}>
                          {activity.type === 'call' ? <Phone className="h-5 w-5 text-primary" /> : activity.type === 'email' ? <Mail className="h-5 w-5 text-accent" /> : <Calendar className="h-5 w-5 text-warning" />}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">{activity.description}</p>
                          {activity.scheduled_at && <p className="text-sm text-muted-foreground">{new Date(activity.scheduled_at).toLocaleString()}</p>}
                        </div>
                        <Badge variant={activity.completed ? 'default' : 'outline'} className={activity.completed ? 'bg-success text-success-foreground' : ''}>
                          {activity.completed ? 'Done' : 'Pending'}
                        </Badge>
                      </motion.div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}