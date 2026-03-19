import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Users, Calendar, Clock, Award, Search, Plus, GraduationCap, Loader2,
  Briefcase, Pencil, Megaphone, Trash2, Bell, Send,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { format } from 'date-fns';

interface Profile {
  id: string;
  full_name: string | null;
  email: string;
  department: string | null;
  job_title: string | null;
  phone: string | null;
}

interface LeaveRequest {
  id: string;
  user_id: string;
  leave_type: string;
  start_date: string;
  end_date: string;
  days: number;
  status: string;
  reason: string | null;
}

interface Training {
  id: string;
  name: string;
  description: string | null;
  enrolled_count: number;
  completed_count: number;
  due_date: string | null;
  status: string | null;
}

interface Announcement {
  id: string;
  title: string;
  content: string;
  category: string;
  created_by: string;
  created_at: string;
}

export default function HRM() {
  const { user, isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [isLeaveDialogOpen, setIsLeaveDialogOpen] = useState(false);
  const [isTrainingDialogOpen, setIsTrainingDialogOpen] = useState(false);
  const [isAddEmployeeOpen, setIsAddEmployeeOpen] = useState(false);
  const [isEditEmployeeOpen, setIsEditEmployeeOpen] = useState(false);
  const [isAnnouncementOpen, setIsAnnouncementOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Profile | null>(null);

  // Leave form
  const [leaveType, setLeaveType] = useState('annual');
  const [leaveStart, setLeaveStart] = useState('');
  const [leaveEnd, setLeaveEnd] = useState('');
  const [leaveReason, setLeaveReason] = useState('');

  // Training form
  const [trainingName, setTrainingName] = useState('');
  const [trainingDesc, setTrainingDesc] = useState('');
  const [trainingDueDate, setTrainingDueDate] = useState('');

  // Add employee form
  const [empEmail, setEmpEmail] = useState('');
  const [empPassword, setEmpPassword] = useState('');
  const [empName, setEmpName] = useState('');
  const [empDept, setEmpDept] = useState('');
  const [empTitle, setEmpTitle] = useState('');

  // Edit employee form
  const [editName, setEditName] = useState('');
  const [editDept, setEditDept] = useState('');
  const [editTitle, setEditTitle] = useState('');
  const [editPhone, setEditPhone] = useState('');

  // Announcement form
  const [annTitle, setAnnTitle] = useState('');
  const [annContent, setAnnContent] = useState('');
  const [annCategory, setAnnCategory] = useState('general');

  const { data: profiles = [], isLoading: profilesLoading } = useQuery({
    queryKey: ['hrm-profiles'],
    queryFn: async () => {
      const { data, error } = await supabase.from('profiles').select('id, full_name, email, department, job_title, phone').order('full_name');
      if (error) throw error;
      return data as Profile[];
    },
  });

  const { data: leaveRequests = [] } = useQuery({
    queryKey: ['leave-requests'],
    queryFn: async () => {
      const query = isAdmin
        ? supabase.from('leave_requests').select('*').order('created_at', { ascending: false })
        : supabase.from('leave_requests').select('*').eq('user_id', user?.id!).order('created_at', { ascending: false });
      const { data, error } = await query;
      if (error) throw error;
      return data as LeaveRequest[];
    },
    enabled: !!user,
  });

  const { data: trainings = [] } = useQuery({
    queryKey: ['trainings'],
    queryFn: async () => {
      const { data, error } = await supabase.from('trainings').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data as Training[];
    },
  });

  const { data: announcements = [] } = useQuery({
    queryKey: ['hrm-announcements'],
    queryFn: async () => {
      const { data, error } = await supabase.from('hrm_announcements').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data as Announcement[];
    },
  });

  const profileMap = profiles.reduce((acc, p) => { acc[p.id] = p.full_name || p.email; return acc; }, {} as Record<string, string>);

  // Mutations
  const createLeaveMutation = useMutation({
    mutationFn: async () => {
      const start = new Date(leaveStart);
      const end = new Date(leaveEnd);
      const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      const { error } = await supabase.from('leave_requests').insert({
        user_id: user?.id!, leave_type: leaveType, start_date: leaveStart, end_date: leaveEnd, days, reason: leaveReason || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leave-requests'] });
      toast.success('Leave request submitted');
      setIsLeaveDialogOpen(false);
      setLeaveType('annual'); setLeaveStart(''); setLeaveEnd(''); setLeaveReason('');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const updateLeaveMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from('leave_requests').update({ status, approved_by: user?.id }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leave-requests'] });
      toast.success('Leave request updated');
    },
  });

  const createTrainingMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('trainings').insert({
        name: trainingName, description: trainingDesc || null, due_date: trainingDueDate || null, created_by: user?.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trainings'] });
      toast.success('Training created');
      setIsTrainingDialogOpen(false);
      setTrainingName(''); setTrainingDesc(''); setTrainingDueDate('');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const addEmployeeMutation = useMutation({
    mutationFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await supabase.functions.invoke('admin-create-user', {
        body: { email: empEmail, password: empPassword, full_name: empName, department: empDept, job_title: empTitle },
      });
      if (res.error) throw new Error(res.error.message);
      if (res.data?.error) throw new Error(res.data.error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hrm-profiles'] });
      toast.success('Employee added successfully');
      setIsAddEmployeeOpen(false);
      setEmpEmail(''); setEmpPassword(''); setEmpName(''); setEmpDept(''); setEmpTitle('');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const editEmployeeMutation = useMutation({
    mutationFn: async () => {
      if (!editingEmployee) return;
      const { error } = await supabase.from('profiles').update({
        full_name: editName || null, department: editDept || null, job_title: editTitle || null, phone: editPhone || null,
      }).eq('id', editingEmployee.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hrm-profiles'] });
      toast.success('Employee updated');
      setIsEditEmployeeOpen(false);
      setEditingEmployee(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const createAnnouncementMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('hrm_announcements').insert({
        title: annTitle, content: annContent, category: annCategory, created_by: user?.id!,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hrm-announcements'] });
      toast.success('Announcement sent to all employees');
      setIsAnnouncementOpen(false);
      setAnnTitle(''); setAnnContent(''); setAnnCategory('general');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteAnnouncementMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('hrm_announcements').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hrm-announcements'] });
      toast.success('Announcement deleted');
    },
  });

  const openEditEmployee = (p: Profile) => {
    setEditingEmployee(p);
    setEditName(p.full_name || '');
    setEditDept(p.department || '');
    setEditTitle(p.job_title || '');
    setEditPhone(p.phone || '');
    setIsEditEmployeeOpen(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved': return <Badge className="bg-success/20 text-success border-success/30">Approved</Badge>;
      case 'pending': return <Badge className="bg-warning/20 text-warning border-warning/30">Pending</Badge>;
      case 'rejected': return <Badge className="bg-destructive/20 text-destructive border-destructive/30">Rejected</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getCategoryBadge = (cat: string) => {
    const colors: Record<string, string> = {
      general: 'bg-primary/20 text-primary border-primary/30',
      leave: 'bg-warning/20 text-warning border-warning/30',
      training: 'bg-success/20 text-success border-success/30',
      policy: 'bg-accent/20 text-accent border-accent/30',
      urgent: 'bg-destructive/20 text-destructive border-destructive/30',
    };
    return <Badge className={colors[cat] || colors.general}>{cat}</Badge>;
  };

  if (profilesLoading) {
    return <MainLayout><div className="flex h-[50vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div></MainLayout>;
  }

  const filteredProfiles = profiles.filter(p =>
    (p.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false) ||
    p.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.department?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false)
  );

  // Users can edit themselves; admins can edit anyone
  const canEditEmployee = (empId: string) => isAdmin || empId === user?.id;

  return (
    <MainLayout>
      <div className="p-4 sm:p-6 lg:p-8 space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-foreground">Human Resources</h1>
            <p className="text-muted-foreground text-sm">Manage employees, attendance, and HR operations</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Dialog open={isAnnouncementOpen} onOpenChange={setIsAnnouncementOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="gap-2"><Megaphone className="h-4 w-4" />Announce</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle className="flex items-center gap-2"><Bell className="h-5 w-5 text-primary" />Send Announcement</DialogTitle></DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2"><Label>Title *</Label><Input value={annTitle} onChange={(e) => setAnnTitle(e.target.value)} placeholder="e.g. Company Town Hall Meeting" /></div>
                  <div className="space-y-2"><Label>Category</Label>
                    <Select value={annCategory} onValueChange={setAnnCategory}><SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="general">General</SelectItem>
                        <SelectItem value="leave">Leave</SelectItem>
                        <SelectItem value="training">Training</SelectItem>
                        <SelectItem value="policy">Policy</SelectItem>
                        <SelectItem value="urgent">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2"><Label>Message *</Label><Textarea value={annContent} onChange={(e) => setAnnContent(e.target.value)} placeholder="Write your announcement..." rows={4} /></div>
                  <Button className="w-full gap-2" onClick={() => createAnnouncementMutation.mutate()} disabled={!annTitle || !annContent || createAnnouncementMutation.isPending}>
                    {createAnnouncementMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}Send to All Employees
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            {isAdmin && (
              <Dialog open={isAddEmployeeOpen} onOpenChange={setIsAddEmployeeOpen}>
                <DialogTrigger asChild>
                  <Button className="gradient-primary text-primary-foreground gap-2"><Plus className="h-4 w-4" />Add Employee</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Add New Employee</DialogTitle></DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2"><Label>Full Name *</Label><Input value={empName} onChange={(e) => setEmpName(e.target.value)} placeholder="John Doe" /></div>
                    <div className="space-y-2"><Label>Email *</Label><Input type="email" value={empEmail} onChange={(e) => setEmpEmail(e.target.value)} placeholder="john@company.com" /></div>
                    <div className="space-y-2"><Label>Password *</Label><Input type="password" value={empPassword} onChange={(e) => setEmpPassword(e.target.value)} placeholder="Min 6 characters" /></div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2"><Label>Department</Label><Input value={empDept} onChange={(e) => setEmpDept(e.target.value)} placeholder="Engineering" /></div>
                      <div className="space-y-2"><Label>Job Title</Label><Input value={empTitle} onChange={(e) => setEmpTitle(e.target.value)} placeholder="Developer" /></div>
                    </div>
                    <Button className="w-full" onClick={() => addEmployeeMutation.mutate()} disabled={!empEmail || !empPassword || !empName || addEmployeeMutation.isPending}>
                      {addEmployeeMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Create Employee
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            )}

            <Dialog open={isLeaveDialogOpen} onOpenChange={setIsLeaveDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="gap-2"><Calendar className="h-4 w-4" />Request Leave</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Request Leave</DialogTitle></DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2"><Label>Leave Type</Label>
                    <Select value={leaveType} onValueChange={setLeaveType}><SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="annual">Annual Leave</SelectItem>
                        <SelectItem value="sick">Sick Leave</SelectItem>
                        <SelectItem value="wfh">Work From Home</SelectItem>
                        <SelectItem value="personal">Personal Leave</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2"><Label>Start Date *</Label><Input type="date" value={leaveStart} onChange={(e) => setLeaveStart(e.target.value)} /></div>
                    <div className="space-y-2"><Label>End Date *</Label><Input type="date" value={leaveEnd} onChange={(e) => setLeaveEnd(e.target.value)} /></div>
                  </div>
                  <div className="space-y-2"><Label>Reason</Label><Input value={leaveReason} onChange={(e) => setLeaveReason(e.target.value)} placeholder="Optional reason" /></div>
                  <Button className="w-full" onClick={() => createLeaveMutation.mutate()} disabled={!leaveStart || !leaveEnd || createLeaveMutation.isPending}>
                    {createLeaveMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Submit Request
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Stats */}
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          <Card className="card-elevated"><CardContent className="p-4 sm:p-6"><div className="flex items-center gap-3 sm:gap-4"><div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-xl bg-primary/10 shrink-0"><Users className="h-5 w-5 sm:h-6 sm:w-6 text-primary" /></div><div><p className="text-xl sm:text-2xl font-bold text-foreground">{profiles.length}</p><p className="text-xs sm:text-sm text-muted-foreground">Employees</p></div></div></CardContent></Card>
          <Card className="card-elevated"><CardContent className="p-4 sm:p-6"><div className="flex items-center gap-3 sm:gap-4"><div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-xl bg-success/10 shrink-0"><Clock className="h-5 w-5 sm:h-6 sm:w-6 text-success" /></div><div><p className="text-xl sm:text-2xl font-bold text-foreground">98%</p><p className="text-xs sm:text-sm text-muted-foreground">Attendance</p></div></div></CardContent></Card>
          <Card className="card-elevated"><CardContent className="p-4 sm:p-6"><div className="flex items-center gap-3 sm:gap-4"><div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-xl bg-warning/10 shrink-0"><Calendar className="h-5 w-5 sm:h-6 sm:w-6 text-warning" /></div><div><p className="text-xl sm:text-2xl font-bold text-foreground">{leaveRequests.filter(l => l.status === 'pending').length}</p><p className="text-xs sm:text-sm text-muted-foreground">Pending Leaves</p></div></div></CardContent></Card>
          <Card className="card-elevated"><CardContent className="p-4 sm:p-6"><div className="flex items-center gap-3 sm:gap-4"><div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-xl bg-accent/10 shrink-0"><Megaphone className="h-5 w-5 sm:h-6 sm:w-6 text-accent" /></div><div><p className="text-xl sm:text-2xl font-bold text-foreground">{announcements.length}</p><p className="text-xs sm:text-sm text-muted-foreground">Announcements</p></div></div></CardContent></Card>
        </div>

        <Tabs defaultValue="employees" className="space-y-4">
          <TabsList className="bg-muted/50 flex-wrap h-auto gap-1">
            <TabsTrigger value="employees" className="flex items-center gap-2"><Users className="h-4 w-4" /><span className="hidden sm:inline">Employees</span></TabsTrigger>
            <TabsTrigger value="announcements" className="flex items-center gap-2"><Megaphone className="h-4 w-4" /><span className="hidden sm:inline">Announcements</span></TabsTrigger>
            <TabsTrigger value="leave" className="flex items-center gap-2"><Calendar className="h-4 w-4" /><span className="hidden sm:inline">Leave</span></TabsTrigger>
            <TabsTrigger value="training" className="flex items-center gap-2"><GraduationCap className="h-4 w-4" /><span className="hidden sm:inline">Training</span></TabsTrigger>
          </TabsList>

          {/* Employees Tab */}
          <TabsContent value="employees">
            <Card className="card-elevated">
              <CardHeader className="pb-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <CardTitle className="text-lg font-semibold">Employee Directory</CardTitle>
                  <div className="relative w-full sm:w-64">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input placeholder="Search employees..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader><TableRow>
                      <TableHead>Employee</TableHead><TableHead className="hidden md:table-cell">Department</TableHead><TableHead className="hidden md:table-cell">Role</TableHead><TableHead className="hidden lg:table-cell">Phone</TableHead><TableHead>Actions</TableHead>
                    </TableRow></TableHeader>
                    <TableBody>
                      {filteredProfiles.map((profile) => (
                        <TableRow key={profile.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-primary/10 font-semibold text-primary text-sm shrink-0">
                                {profile.full_name?.split(' ').map(n => n[0]).join('').slice(0, 2) || '?'}
                              </div>
                              <div className="min-w-0">
                                <p className="font-medium truncate">{profile.full_name || 'Unknown'}</p>
                                <p className="text-xs text-muted-foreground truncate">{profile.email}</p>
                                <p className="text-xs text-muted-foreground md:hidden">{profile.department || '—'} · {profile.job_title || '—'}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="hidden md:table-cell"><Badge variant="outline" className="bg-muted/50"><Briefcase className="mr-1 h-3 w-3" />{profile.department || '—'}</Badge></TableCell>
                          <TableCell className="hidden md:table-cell capitalize">{profile.job_title || '—'}</TableCell>
                          <TableCell className="hidden lg:table-cell text-sm">{profile.phone || '—'}</TableCell>
                          <TableCell>
                            {canEditEmployee(profile.id) && (
                              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditEmployee(profile)}>
                                <Pencil className="h-4 w-4 text-muted-foreground" />
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Announcements Tab */}
          <TabsContent value="announcements">
            <Card className="card-elevated">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-semibold flex items-center gap-2"><Bell className="h-5 w-5 text-primary" />Company Announcements</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                {announcements.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Megaphone className="h-12 w-12 mx-auto mb-3 opacity-30" />
                    <p>No announcements yet</p>
                    <p className="text-sm mt-1">Use the Announce button to notify all employees</p>
                  </div>
                ) : (
                  <ScrollArea className="max-h-[600px]">
                    <div className="space-y-4">
                      {announcements.map((ann, i) => (
                        <motion.div key={ann.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                          className="group rounded-xl border border-border/50 p-4 hover:bg-muted/30 transition-colors"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap mb-1">
                                <h3 className="font-semibold text-foreground">{ann.title}</h3>
                                {getCategoryBadge(ann.category)}
                              </div>
                              <p className="text-sm text-foreground/80 whitespace-pre-wrap">{ann.content}</p>
                              <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                                <span>By {profileMap[ann.created_by] || 'Unknown'}</span>
                                <span>·</span>
                                <span>{format(new Date(ann.created_at), 'MMM d, yyyy h:mm a')}</span>
                              </div>
                            </div>
                            {(isAdmin || ann.created_by === user?.id) && (
                              <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                                onClick={() => deleteAnnouncementMutation.mutate(ann.id)}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            )}
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Leave Tab */}
          <TabsContent value="leave">
            <Card className="card-elevated">
              <CardHeader><CardTitle className="text-lg font-semibold">Leave Requests</CardTitle></CardHeader>
              <CardContent>
                {leaveRequests.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">No leave requests yet.</div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader><TableRow>
                        <TableHead>Employee</TableHead><TableHead>Type</TableHead><TableHead className="hidden sm:table-cell">From</TableHead><TableHead className="hidden sm:table-cell">To</TableHead><TableHead>Days</TableHead><TableHead>Status</TableHead>{isAdmin && <TableHead>Actions</TableHead>}
                      </TableRow></TableHeader>
                      <TableBody>
                        {leaveRequests.map((leave) => (
                          <TableRow key={leave.id}>
                            <TableCell className="font-medium">{profileMap[leave.user_id] || 'Unknown'}</TableCell>
                            <TableCell className="capitalize text-sm">{leave.leave_type.replace('_', ' ')}</TableCell>
                            <TableCell className="hidden sm:table-cell text-sm">{leave.start_date}</TableCell>
                            <TableCell className="hidden sm:table-cell text-sm">{leave.end_date}</TableCell>
                            <TableCell>{leave.days}</TableCell>
                            <TableCell>{getStatusBadge(leave.status)}</TableCell>
                            {isAdmin && (
                              <TableCell>
                                {leave.status === 'pending' && (
                                  <div className="flex gap-1">
                                    <Button size="sm" variant="outline" className="text-success border-success/50 hover:bg-success/10 h-7 text-xs" onClick={() => updateLeaveMutation.mutate({ id: leave.id, status: 'approved' })}>Approve</Button>
                                    <Button size="sm" variant="outline" className="text-destructive border-destructive/50 hover:bg-destructive/10 h-7 text-xs" onClick={() => updateLeaveMutation.mutate({ id: leave.id, status: 'rejected' })}>Reject</Button>
                                  </div>
                                )}
                              </TableCell>
                            )}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Training Tab */}
          <TabsContent value="training">
            <Card className="card-elevated">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-semibold">Training Programs</CardTitle>
                  <Dialog open={isTrainingDialogOpen} onOpenChange={setIsTrainingDialogOpen}>
                    <DialogTrigger asChild>
                      <Button className="gradient-primary text-primary-foreground gap-2"><Plus className="h-4 w-4" />Create Training</Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader><DialogTitle>Create New Training</DialogTitle></DialogHeader>
                      <div className="space-y-4">
                        <div className="space-y-2"><Label>Training Name *</Label><Input value={trainingName} onChange={(e) => setTrainingName(e.target.value)} placeholder="Cybersecurity Basics" /></div>
                        <div className="space-y-2"><Label>Description</Label><Textarea value={trainingDesc} onChange={(e) => setTrainingDesc(e.target.value)} placeholder="Describe the training..." rows={3} /></div>
                        <div className="space-y-2"><Label>Due Date</Label><Input type="date" value={trainingDueDate} onChange={(e) => setTrainingDueDate(e.target.value)} /></div>
                        <Button className="w-full" onClick={() => createTrainingMutation.mutate()} disabled={!trainingName || createTrainingMutation.isPending}>
                          {createTrainingMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Create Training
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                {trainings.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">No trainings yet.</div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader><TableRow>
                        <TableHead>Training</TableHead><TableHead>Enrolled</TableHead><TableHead>Completed</TableHead><TableHead className="hidden sm:table-cell">Due Date</TableHead><TableHead>Progress</TableHead>
                      </TableRow></TableHeader>
                      <TableBody>
                        {trainings.map((training) => (
                          <TableRow key={training.id}>
                            <TableCell><div><p className="font-medium">{training.name}</p>{training.description && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{training.description}</p>}</div></TableCell>
                            <TableCell>{training.enrolled_count}</TableCell>
                            <TableCell>{training.completed_count}</TableCell>
                            <TableCell className="hidden sm:table-cell">{training.due_date || '—'}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <div className="w-16 sm:w-20 h-2 bg-muted rounded-full overflow-hidden">
                                  <div className="h-full bg-primary rounded-full" style={{ width: `${training.enrolled_count > 0 ? (training.completed_count / training.enrolled_count * 100) : 0}%` }} />
                                </div>
                                <span className="text-xs sm:text-sm">{training.enrolled_count > 0 ? Math.round(training.completed_count / training.enrolled_count * 100) : 0}%</span>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Edit Employee Dialog */}
        <Dialog open={isEditEmployeeOpen} onOpenChange={setIsEditEmployeeOpen}>
          <DialogContent>
            <DialogHeader><DialogTitle>Edit Employee</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2"><Label>Email</Label><Input value={editingEmployee?.email || ''} disabled className="bg-muted" /></div>
              <div className="space-y-2"><Label>Full Name</Label><Input value={editName} onChange={(e) => setEditName(e.target.value)} placeholder="Full name" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Department</Label><Input value={editDept} onChange={(e) => setEditDept(e.target.value)} placeholder="Department" /></div>
                <div className="space-y-2"><Label>Job Title</Label><Input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} placeholder="Job title" /></div>
              </div>
              <div className="space-y-2"><Label>Phone</Label><Input value={editPhone} onChange={(e) => setEditPhone(e.target.value)} placeholder="Phone number" /></div>
              <Button className="w-full" onClick={() => editEmployeeMutation.mutate()} disabled={editEmployeeMutation.isPending}>
                {editEmployeeMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Save Changes
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}
