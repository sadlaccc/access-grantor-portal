import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Building2,
  Users,
  DollarSign,
  TrendingUp,
  Search,
  Plus,
  Phone,
  Mail,
  Calendar,
  Target,
  Handshake,
} from 'lucide-react';
import { toast } from 'sonner';

const leads = [
  { id: 1, company: 'TechCorp Inc.', contact: 'John Williams', email: 'john@techcorp.com', phone: '+1 555-0101', value: '$50,000', stage: 'qualification', source: 'Website' },
  { id: 2, company: 'Global Solutions', contact: 'Sarah Miller', email: 'sarah@globalsolutions.com', phone: '+1 555-0102', value: '$120,000', stage: 'proposal', source: 'Referral' },
  { id: 3, company: 'StartupXYZ', contact: 'David Brown', email: 'david@startupxyz.com', phone: '+1 555-0103', value: '$25,000', stage: 'negotiation', source: 'LinkedIn' },
  { id: 4, company: 'Enterprise Ltd', contact: 'Emma Wilson', email: 'emma@enterprise.com', phone: '+1 555-0104', value: '$200,000', stage: 'closed-won', source: 'Conference' },
  { id: 5, company: 'InnovateCo', contact: 'Michael Lee', email: 'michael@innovateco.com', phone: '+1 555-0105', value: '$75,000', stage: 'discovery', source: 'Cold Call' },
];

const deals = [
  { id: 1, name: 'Enterprise License Deal', company: 'Enterprise Ltd', value: '$200,000', stage: 'closed-won', probability: 100, closeDate: '2024-01-15' },
  { id: 2, name: 'Annual SaaS Contract', company: 'Global Solutions', value: '$120,000', stage: 'proposal', probability: 60, closeDate: '2024-02-28' },
  { id: 3, name: 'Consulting Package', company: 'TechCorp Inc.', value: '$50,000', stage: 'qualification', probability: 30, closeDate: '2024-03-15' },
  { id: 4, name: 'Startup Bundle', company: 'StartupXYZ', value: '$25,000', stage: 'negotiation', probability: 80, closeDate: '2024-01-30' },
];

const activities = [
  { id: 1, type: 'call', description: 'Follow-up call with Enterprise Ltd', date: '2024-01-18 10:00', assignee: 'John Smith' },
  { id: 2, type: 'email', description: 'Send proposal to Global Solutions', date: '2024-01-18 14:00', assignee: 'Sarah Johnson' },
  { id: 3, type: 'meeting', description: 'Demo presentation for TechCorp', date: '2024-01-19 11:00', assignee: 'John Smith' },
  { id: 4, type: 'call', description: 'Contract negotiation with StartupXYZ', date: '2024-01-20 15:00', assignee: 'Mike Chen' },
];

export default function CRM() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isLeadDialogOpen, setIsLeadDialogOpen] = useState(false);
  const [isCompanyDialogOpen, setIsCompanyDialogOpen] = useState(false);
  const [isActivityDialogOpen, setIsActivityDialogOpen] = useState(false);
  const [leadCompany, setLeadCompany] = useState('');
  const [leadContact, setLeadContact] = useState('');
  const [leadEmail, setLeadEmail] = useState('');
  const [leadValue, setLeadValue] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [activityType, setActivityType] = useState('');
  const [activityDescription, setActivityDescription] = useState('');

  const handleAddLead = () => {
    if (!leadCompany || !leadContact) {
      toast.error('Please fill in required fields');
      return;
    }
    toast.success(`Lead "${leadCompany}" added successfully`);
    setIsLeadDialogOpen(false);
    setLeadCompany('');
    setLeadContact('');
    setLeadEmail('');
    setLeadValue('');
  };

  const handleAddCompany = () => {
    if (!companyName) {
      toast.error('Please enter company name');
      return;
    }
    toast.success(`Company "${companyName}" added successfully`);
    setIsCompanyDialogOpen(false);
    setCompanyName('');
  };

  const handleScheduleActivity = () => {
    if (!activityDescription) {
      toast.error('Please enter activity description');
      return;
    }
    toast.success('Activity scheduled successfully');
    setIsActivityDialogOpen(false);
    setActivityType('');
    setActivityDescription('');
  };

  const getStageBadge = (stage: string) => {
    const stages: Record<string, { label: string; className: string }> = {
      'discovery': { label: 'Discovery', className: 'bg-muted text-muted-foreground' },
      'qualification': { label: 'Qualification', className: 'bg-primary/20 text-primary border-primary/30' },
      'proposal': { label: 'Proposal', className: 'bg-warning/20 text-warning border-warning/30' },
      'negotiation': { label: 'Negotiation', className: 'bg-accent/20 text-accent border-accent/30' },
      'closed-won': { label: 'Closed Won', className: 'bg-success/20 text-success border-success/30' },
      'closed-lost': { label: 'Closed Lost', className: 'bg-destructive/20 text-destructive border-destructive/30' },
    };
    const stageInfo = stages[stage] || { label: stage, className: 'bg-muted text-muted-foreground' };
    return <Badge className={stageInfo.className}>{stageInfo.label}</Badge>;
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'call': return <Phone className="h-4 w-4" />;
      case 'email': return <Mail className="h-4 w-4" />;
      case 'meeting': return <Calendar className="h-4 w-4" />;
      default: return <Calendar className="h-4 w-4" />;
    }
  };

  const totalPipeline = deals.reduce((sum, deal) => sum + parseInt(deal.value.replace(/[$,]/g, '')), 0);
  const closedWon = deals.filter(d => d.stage === 'closed-won').reduce((sum, deal) => sum + parseInt(deal.value.replace(/[$,]/g, '')), 0);

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="font-display text-3xl font-bold text-foreground">CRM</h1>
            <p className="text-muted-foreground">Manage leads, deals, and customer relationships</p>
          </div>
          <div className="flex gap-2">
            <Dialog open={isCompanyDialogOpen} onOpenChange={setIsCompanyDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Building2 className="mr-2 h-4 w-4" />
                  Add Company
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Company</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Company Name *</Label>
                    <Input
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      placeholder="Enter company name"
                    />
                  </div>
                  <Button className="w-full" onClick={handleAddCompany}>
                    Add Company
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
            <Dialog open={isLeadDialogOpen} onOpenChange={setIsLeadDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gradient-primary text-primary-foreground">
                  <Plus className="mr-2 h-4 w-4" />
                  New Lead
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Lead</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Company Name *</Label>
                    <Input
                      value={leadCompany}
                      onChange={(e) => setLeadCompany(e.target.value)}
                      placeholder="Enter company name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Contact Person *</Label>
                    <Input
                      value={leadContact}
                      onChange={(e) => setLeadContact(e.target.value)}
                      placeholder="Enter contact name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input
                      type="email"
                      value={leadEmail}
                      onChange={(e) => setLeadEmail(e.target.value)}
                      placeholder="contact@company.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Estimated Value</Label>
                    <Input
                      value={leadValue}
                      onChange={(e) => setLeadValue(e.target.value)}
                      placeholder="$50,000"
                    />
                  </div>
                  <Button className="w-full" onClick={handleAddLead}>
                    Add Lead
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="card-elevated">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                  <Target className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{leads.length}</p>
                  <p className="text-sm text-muted-foreground">Active Leads</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="card-elevated">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10">
                  <Handshake className="h-6 w-6 text-accent" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{deals.length}</p>
                  <p className="text-sm text-muted-foreground">Open Deals</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="card-elevated">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-warning/10">
                  <DollarSign className="h-6 w-6 text-warning" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">${(totalPipeline / 1000).toFixed(0)}K</p>
                  <p className="text-sm text-muted-foreground">Pipeline Value</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="card-elevated">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-success/10">
                  <TrendingUp className="h-6 w-6 text-success" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">${(closedWon / 1000).toFixed(0)}K</p>
                  <p className="text-sm text-muted-foreground">Closed Won</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="leads" className="space-y-4">
          <TabsList className="bg-muted/50">
            <TabsTrigger value="leads" className="flex items-center gap-2">
              <Target className="h-4 w-4" />
              Leads
            </TabsTrigger>
            <TabsTrigger value="deals" className="flex items-center gap-2">
              <Handshake className="h-4 w-4" />
              Deals
            </TabsTrigger>
            <TabsTrigger value="activities" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Activities
            </TabsTrigger>
          </TabsList>

          <TabsContent value="leads">
            <Card className="card-elevated">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-semibold">Lead Pipeline</CardTitle>
                  <div className="relative w-64">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Search leads..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Company</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Value</TableHead>
                      <TableHead>Stage</TableHead>
                      <TableHead>Source</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {leads
                      .filter((lead) => 
                        lead.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        lead.contact.toLowerCase().includes(searchTerm.toLowerCase())
                      )
                      .map((lead) => (
                      <TableRow key={lead.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                              <Building2 className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <p className="font-medium">{lead.company}</p>
                              <p className="text-sm text-muted-foreground">{lead.email}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{lead.contact}</p>
                            <p className="text-sm text-muted-foreground">{lead.phone}</p>
                          </div>
                        </TableCell>
                        <TableCell className="font-semibold text-success">{lead.value}</TableCell>
                        <TableCell>{getStageBadge(lead.stage)}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="bg-muted/50">{lead.source}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <Phone className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <Mail className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="deals">
            <Card className="card-elevated">
              <CardHeader>
                <CardTitle className="text-lg font-semibold">Deal Pipeline</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Deal Name</TableHead>
                      <TableHead>Company</TableHead>
                      <TableHead>Value</TableHead>
                      <TableHead>Stage</TableHead>
                      <TableHead>Probability</TableHead>
                      <TableHead>Close Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {deals.map((deal) => (
                      <TableRow key={deal.id}>
                        <TableCell className="font-medium">{deal.name}</TableCell>
                        <TableCell>{deal.company}</TableCell>
                        <TableCell className="font-semibold text-success">{deal.value}</TableCell>
                        <TableCell>{getStageBadge(deal.stage)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-primary rounded-full"
                                style={{ width: `${deal.probability}%` }}
                              />
                            </div>
                            <span className="text-sm text-muted-foreground">{deal.probability}%</span>
                          </div>
                        </TableCell>
                        <TableCell>{deal.closeDate}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="activities">
            <Card className="card-elevated">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-semibold">Upcoming Activities</CardTitle>
                  <Dialog open={isActivityDialogOpen} onOpenChange={setIsActivityDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline">
                        <Plus className="mr-2 h-4 w-4" />
                        Schedule Activity
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Schedule Activity</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label>Activity Type</Label>
                          <Select value={activityType} onValueChange={setActivityType}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="call">Call</SelectItem>
                              <SelectItem value="email">Email</SelectItem>
                              <SelectItem value="meeting">Meeting</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Description *</Label>
                          <Input
                            value={activityDescription}
                            onChange={(e) => setActivityDescription(e.target.value)}
                            placeholder="Activity description"
                          />
                        </div>
                        <Button className="w-full" onClick={handleScheduleActivity}>
                          Schedule Activity
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {activities.map((activity) => (
                    <div key={activity.id} className="flex items-center justify-between rounded-lg border bg-card p-4">
                      <div className="flex items-center gap-4">
                        <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                          activity.type === 'call' ? 'bg-success/10 text-success' :
                          activity.type === 'email' ? 'bg-primary/10 text-primary' :
                          'bg-warning/10 text-warning'
                        }`}>
                          {getActivityIcon(activity.type)}
                        </div>
                        <div>
                          <p className="font-medium">{activity.description}</p>
                          <p className="text-sm text-muted-foreground">{activity.date}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <Badge variant="outline">{activity.assignee}</Badge>
                        <Button variant="outline" size="sm">Complete</Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
