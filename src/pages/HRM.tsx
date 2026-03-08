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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Users, Calendar, Clock, Award, Search, Plus, FileText, GraduationCap, Loader2, Briefcase } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface Profile {
  id: string;
  full_name: string | null;
  email: string;
  department: string | null;
  job_title: string | null;
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

export default function HRM() {
  const { user, isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [isLeaveDialogOpen, setIsLeaveDialogOpen] = useState(false);
  const [isTrainingDialogOpen, setIsTrainingDialogOpen] = useState(false);
  const [leaveType, setLeaveType] = useState('annual');
  const [leaveStart, setLeaveStart] = useState('');
  const [leaveEnd, setLeaveEnd] = useState('');
  const [leaveReason, setLeaveReason] = useState('');
  const [trainingName, setTrainingName] = useState('');
  const [trainingDueDate, setTrainingDueDate] = useState('');

  const { data: profiles = [], isLoading: profilesLoading } = useQuery({
    queryKey: ['hrm-profiles'],
    queryFn: async () => {
      const { data, error } = await supabase.from('profiles').select('id, full_name, email, department, job_title').order('full_name');
      if (error) throw error;
      return data as Profile[];
    },
  });

  const { data: leaveRequests = [] } = useQuery({
    queryKey: ['leave-requests'],
    queryFn: async () => {
      const { data, error } = await supabase.from('leave_requests').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data as LeaveRequest[];
    },
  });

  const { data: trainings = [] } = useQuery({
    queryKey: ['trainings'],
    queryFn: async () => {
      const { data, error } = await supabase.from('trainings').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data as Training[];
    },
  });

  const profileMap = profiles.reduce((acc, p) => { acc[p.id] = p.full_name || p.email; return acc; }, {} as Record<string, string>);

  const createLeaveMutation = useMutation({
    mutationFn: async () => {
      const start = new Date(leaveStart);
      const end = new Date(leaveEnd);
      const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      const { error } = await supabase.from('leave_requests').insert({
        user_id: user?.id!,
        leave_type: leaveType,
        start_date: leaveStart,
        end_date: leaveEnd,
        days,
        reason: leaveReason || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leave-requests'] });
      toast.success('Leave request submitted');
      setIsLeaveDialogOpen(false);
      setLeaveType('annual'); setLeaveStart(''); setLeaveEnd(''); setLeaveReason('');
    },
    onError: (error: Error) => toast.error('Failed: ' + error.message),
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
        name: trainingName,
        due_date: trainingDueDate || null,
        created_by: user?.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trainings'] });
      toast.success('Training created');
      setIsTrainingDialogOpen(false);
      setTrainingName(''); setTrainingDueDate('');
    },
    onError: (error: Error) => toast.error('Failed: ' + error.message),
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved': return <Badge className="bg-success/20 text-success border-success/30">Approved</Badge>;
      case 'pending': return <Badge className="bg-warning/20 text-warning border-warning/30">Pending</Badge>;
      case 'rejected': return <Badge className="bg-destructive/20 text-destructive border-destructive/30">Rejected</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (profilesLoading) {
    return <MainLayout><div className="flex h-[50vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div></MainLayout>;
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="font-display text-3xl font-bold text-foreground">Human Resources</h1>
            <p className="text-muted-foreground">Manage employees, attendance, and HR operations</p>
          </div>
          <Dialog open={isLeaveDialogOpen} onOpenChange={setIsLeaveDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gradient-primary text-primary-foreground"><Plus className="mr-2 h-4 w-4" />Request Leave</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Request Leave</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Leave Type</Label>
                  <Select value={leaveType} onValueChange={setLeaveType}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
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

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="card-elevated"><CardContent className="p-6"><div className="flex items-center gap-4"><div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10"><Users className="h-6 w-6 text-primary" /></div><div><p className="text-2xl font-bold text-foreground">{profiles.length}</p><p className="text-sm text-muted-foreground">Total Employees</p></div></div></CardContent></Card>
          <Card className="card-elevated"><CardContent className="p-6"><div className="flex items-center gap-4"><div className="flex h-12 w-12 items-center justify-center rounded-xl bg-success/10"><Clock className="h-6 w-6 text-success" /></div><div><p className="text-2xl font-bold text-foreground">98%</p><p className="text-sm text-muted-foreground">Attendance Rate</p></div></div></CardContent></Card>
          <Card className="card-elevated"><CardContent className="p-6"><div className="flex items-center gap-4"><div className="flex h-12 w-12 items-center justify-center rounded-xl bg-warning/10"><Calendar className="h-6 w-6 text-warning" /></div><div><p className="text-2xl font-bold text-foreground">{leaveRequests.filter(l => l.status === 'pending').length}</p><p className="text-sm text-muted-foreground">Pending Leaves</p></div></div></CardContent></Card>
          <Card className="card-elevated"><CardContent className="p-6"><div className="flex items-center gap-4"><div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10"><Award className="h-6 w-6 text-accent" /></div><div><p className="text-2xl font-bold text-foreground">{trainings.length}</p><p className="text-sm text-muted-foreground">Active Trainings</p></div></div></CardContent></Card>
        </div>

        <Tabs defaultValue="employees" className="space-y-4">
          <TabsList className="bg-muted/50">
            <TabsTrigger value="employees" className="flex items-center gap-2"><Users className="h-4 w-4" />Employees</TabsTrigger>
            <TabsTrigger value="leave" className="flex items-center gap-2"><Calendar className="h-4 w-4" />Leave Management</TabsTrigger>
            <TabsTrigger value="training" className="flex items-center gap-2"><GraduationCap className="h-4 w-4" />Training</TabsTrigger>
          </TabsList>

          <TabsContent value="employees">
            <Card className="card-elevated">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-semibold">Employee Directory</CardTitle>
                  <div className="relative w-64">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input placeholder="Search employees..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader><TableRow>
                    <TableHead>Employee</TableHead><TableHead>Department</TableHead><TableHead>Role</TableHead>
                  </TableRow></TableHeader>
                  <TableBody>
                    {profiles.filter(p => (p.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false) || p.email.toLowerCase().includes(searchTerm.toLowerCase())).map((profile) => (
                      <TableRow key={profile.id}>
                        <TableCell><div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 font-semibold text-primary">{profile.full_name?.split(' ').map(n => n[0]).join('') || '?'}</div><div><p className="font-medium">{profile.full_name || 'Unknown'}</p><p className="text-sm text-muted-foreground">{profile.email}</p></div></div></TableCell>
                        <TableCell><Badge variant="outline" className="bg-muted/50"><Briefcase className="mr-1 h-3 w-3" />{profile.department || '—'}</Badge></TableCell>
                        <TableCell className="capitalize">{profile.job_title || '—'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="leave">
            <Card className="card-elevated">
              <CardHeader><CardTitle className="text-lg font-semibold">Leave Requests</CardTitle></CardHeader>
              <CardContent>
                {leaveRequests.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">No leave requests yet.</div>
                ) : (
                  <Table>
                    <TableHeader><TableRow>
                      <TableHead>Employee</TableHead><TableHead>Leave Type</TableHead><TableHead>From</TableHead><TableHead>To</TableHead><TableHead>Days</TableHead><TableHead>Status</TableHead>{isAdmin && <TableHead>Actions</TableHead>}
                    </TableRow></TableHeader>
                    <TableBody>
                      {leaveRequests.map((leave) => (
                        <TableRow key={leave.id}>
                          <TableCell className="font-medium">{profileMap[leave.user_id] || 'Unknown'}</TableCell>
                          <TableCell className="capitalize">{leave.leave_type.replace('_', ' ')}</TableCell>
                          <TableCell>{leave.start_date}</TableCell>
                          <TableCell>{leave.end_date}</TableCell>
                          <TableCell>{leave.days}</TableCell>
                          <TableCell>{getStatusBadge(leave.status)}</TableCell>
                          {isAdmin && (
                            <TableCell>
                              {leave.status === 'pending' && (
                                <div className="flex gap-2">
                                  <Button size="sm" variant="outline" className="text-success border-success hover:bg-success/10" onClick={() => updateLeaveMutation.mutate({ id: leave.id, status: 'approved' })}>Approve</Button>
                                  <Button size="sm" variant="outline" className="text-destructive border-destructive hover:bg-destructive/10" onClick={() => updateLeaveMutation.mutate({ id: leave.id, status: 'rejected' })}>Reject</Button>
                                </div>
                              )}
                            </TableCell>
                          )}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="training">
            <Card className="card-elevated">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-semibold">Training Programs</CardTitle>
                  <Dialog open={isTrainingDialogOpen} onOpenChange={setIsTrainingDialogOpen}>
                    <DialogTrigger asChild>
                      <Button className="gradient-primary text-primary-foreground"><Plus className="mr-2 h-4 w-4" />Create Training</Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader><DialogTitle>Create New Training</DialogTitle></DialogHeader>
                      <div className="space-y-4">
                        <div className="space-y-2"><Label>Training Name *</Label><Input value={trainingName} onChange={(e) => setTrainingName(e.target.value)} placeholder="Cybersecurity Basics" /></div>
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
                  <div className="text-center py-8 text-muted-foreground">No trainings yet. Create your first training above.</div>
                ) : (
                  <Table>
                    <TableHeader><TableRow>
                      <TableHead>Training</TableHead><TableHead>Enrolled</TableHead><TableHead>Completed</TableHead><TableHead>Due Date</TableHead><TableHead>Progress</TableHead>
                    </TableRow></TableHeader>
                    <TableBody>
                      {trainings.map((training) => (
                        <TableRow key={training.id}>
                          <TableCell className="font-medium">{training.name}</TableCell>
                          <TableCell>{training.enrolled_count}</TableCell>
                          <TableCell>{training.completed_count}</TableCell>
                          <TableCell>{training.due_date || '—'}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className="w-20 h-2 bg-muted rounded-full overflow-hidden">
                                <div className="h-full bg-primary rounded-full" style={{ width: `${training.enrolled_count > 0 ? (training.completed_count / training.enrolled_count * 100) : 0}%` }} />
                              </div>
                              <span className="text-sm">{training.enrolled_count > 0 ? Math.round(training.completed_count / training.enrolled_count * 100) : 0}%</span>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
