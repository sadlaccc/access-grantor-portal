import { useState, useMemo } from 'react';
import { Search, UserPlus, Edit2, Loader2, Shield, KeyRound, Settings2, Filter, ScrollText } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { z } from 'zod';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatDistanceToNow } from 'date-fns';

const createUserSchema = z.object({
  email: z.string().email('Invalid email address').max(255),
  password: z.string().min(6, 'Password must be at least 6 characters').max(72),
  full_name: z.string().trim().min(1, 'Name is required').max(100),
  department: z.string().trim().max(50).optional(),
  job_title: z.string().trim().max(50).optional(),
});

const resetPasswordSchema = z.object({
  new_password: z.string().min(6, 'Password must be at least 6 characters').max(72),
  confirm_password: z.string(),
}).refine((data) => data.new_password === data.confirm_password, {
  message: "Passwords don't match",
  path: ["confirm_password"],
});

interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  department: string | null;
  job_title: string | null;
}

interface UserRole {
  user_id: string;
  role: 'admin' | 'user';
}

interface App {
  id: string;
  name: string;
  description: string | null;
}

interface UserAppAssignment {
  app_id: string;
  user_id: string;
}

interface AuditLogEntry {
  id: string;
  user_id: string | null;
  action: string;
  table_name: string;
  record_id: string | null;
  record_summary: string | null;
  details: any;
  created_at: string;
}

export default function Admin() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [userApps, setUserApps] = useState<string[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditAppsDialogOpen, setIsEditAppsDialogOpen] = useState(false);
  const [isResetPasswordDialogOpen, setIsResetPasswordDialogOpen] = useState(false);
  const [selectedUserForReset, setSelectedUserForReset] = useState<Profile | null>(null);
  const [auditSearchQuery, setAuditSearchQuery] = useState('');

  // New user form state
  const [newUserForm, setNewUserForm] = useState({
    email: '',
    password: '',
    full_name: '',
    department: '',
    job_title: '',
    is_admin: false,
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Reset password form state
  const [resetPasswordForm, setResetPasswordForm] = useState({
    new_password: '',
    confirm_password: '',
  });
  const [resetPasswordErrors, setResetPasswordErrors] = useState<Record<string, string>>({});

  // Fetch profiles
  const { data: profiles = [], isLoading: profilesLoading } = useQuery({
    queryKey: ['admin-profiles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, full_name, department, job_title')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Profile[];
    },
  });

  // Fetch user roles
  const { data: userRoles = [] } = useQuery({
    queryKey: ['admin-user-roles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_roles')
        .select('user_id, role');
      if (error) throw error;
      return data as UserRole[];
    },
  });

  // Fetch apps
  const { data: apps = [] } = useQuery({
    queryKey: ['admin-apps'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('apps')
        .select('id, name, description')
        .eq('is_active', true);
      if (error) throw error;
      return data as App[];
    },
  });

  // Fetch user app assignments
  const { data: appAssignments = [] } = useQuery({
    queryKey: ['admin-app-assignments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_app_assignments')
        .select('app_id, user_id');
      if (error) throw error;
      return data as UserAppAssignment[];
    },
  });

  // Fetch audit log
  const { data: auditLog = [], isLoading: auditLoading } = useQuery({
    queryKey: ['audit-log'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('audit_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200);
      if (error) throw error;
      return data as AuditLogEntry[];
    },
  });

  // Profile map for audit log user names
  const profileMap = useMemo(() => {
    const map: Record<string, string> = {};
    profiles.forEach(p => { map[p.id] = p.full_name || p.email; });
    return map;
  }, [profiles]);

  // Create user mutation
  const createUserMutation = useMutation({
    mutationFn: async (userData: typeof newUserForm) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const response = await supabase.functions.invoke('admin-create-user', {
        body: userData,
      });

      if (response.error) throw new Error(response.error.message);
      if (response.data?.error) throw new Error(response.data.error);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-profiles'] });
      queryClient.invalidateQueries({ queryKey: ['admin-user-roles'] });
      toast.success('User created successfully');
      setIsAddDialogOpen(false);
      setNewUserForm({
        email: '',
        password: '',
        full_name: '',
        department: '',
        job_title: '',
        is_admin: false,
      });
    },
    onError: (error) => {
      toast.error('Failed to create user: ' + error.message);
    },
  });

  // Update app assignments mutation
  const updateAppsMutation = useMutation({
    mutationFn: async ({ userId, appIds }: { userId: string; appIds: string[] }) => {
      const currentAssignments = appAssignments.filter(a => a.user_id === userId);
      const currentAppIds = currentAssignments.map(a => a.app_id);
      const toAdd = appIds.filter(id => !currentAppIds.includes(id));
      const toRemove = currentAppIds.filter(id => !appIds.includes(id));

      if (toAdd.length > 0) {
        const { error } = await supabase
          .from('user_app_assignments')
          .insert(toAdd.map(app_id => ({ user_id: userId, app_id })));
        if (error) throw error;
      }

      if (toRemove.length > 0) {
        const { error } = await supabase
          .from('user_app_assignments')
          .delete()
          .eq('user_id', userId)
          .in('app_id', toRemove);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-app-assignments'] });
      toast.success('App access updated');
      setIsEditAppsDialogOpen(false);
    },
    onError: (error) => {
      toast.error('Failed to update app access: ' + error.message);
    },
  });

  // Reset password mutation
  const resetPasswordMutation = useMutation({
    mutationFn: async ({ userId, newPassword }: { userId: string; newPassword: string }) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const response = await supabase.functions.invoke('admin-reset-password', {
        body: { user_id: userId, new_password: newPassword },
      });

      if (response.error) throw new Error(response.error.message);
      if (response.data?.error) throw new Error(response.data.error);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Password reset successfully');
      setIsResetPasswordDialogOpen(false);
      setResetPasswordForm({ new_password: '', confirm_password: '' });
      setSelectedUserForReset(null);
    },
    onError: (error) => {
      toast.error('Failed to reset password: ' + error.message);
    },
  });

  const handleCreateUser = () => {
    setFormErrors({});
    const result = createUserSchema.safeParse(newUserForm);
    if (!result.success) {
      const errors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) errors[err.path[0] as string] = err.message;
      });
      setFormErrors(errors);
      return;
    }
    createUserMutation.mutate(newUserForm);
  };

  const handleResetPassword = () => {
    setResetPasswordErrors({});
    const result = resetPasswordSchema.safeParse(resetPasswordForm);
    if (!result.success) {
      const errors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) errors[err.path[0] as string] = err.message;
      });
      setResetPasswordErrors(errors);
      return;
    }
    if (selectedUserForReset) {
      resetPasswordMutation.mutate({
        userId: selectedUserForReset.id,
        newPassword: resetPasswordForm.new_password,
      });
    }
  };

  const openResetPasswordDialog = (profile: Profile) => {
    setSelectedUserForReset(profile);
    setResetPasswordForm({ new_password: '', confirm_password: '' });
    setResetPasswordErrors({});
    setIsResetPasswordDialogOpen(true);
  };

  const handleEditApps = (userId: string) => {
    setSelectedUserId(userId);
    const currentApps = appAssignments
      .filter(a => a.user_id === userId)
      .map(a => a.app_id);
    setUserApps(currentApps);
    setIsEditAppsDialogOpen(true);
  };

  const handleToggleApp = (appId: string) => {
    setUserApps((prev) =>
      prev.includes(appId) ? prev.filter((id) => id !== appId) : [...prev, appId]
    );
  };

  const handleSaveApps = () => {
    if (selectedUserId) {
      updateAppsMutation.mutate({ userId: selectedUserId, appIds: userApps });
    }
  };

  const getUserRole = (userId: string) => {
    return userRoles.find(r => r.user_id === userId)?.role || 'user';
  };

  const getUserAppCount = (userId: string) => {
    return appAssignments.filter(a => a.user_id === userId).length;
  };

  const departments = useMemo(() => {
    const depts = profiles
      .map(p => p.department)
      .filter((d): d is string => !!d);
    return [...new Set(depts)].sort();
  }, [profiles]);

  const filteredProfiles = profiles.filter((profile) => {
    const matchesSearch =
      (profile.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false) ||
      profile.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDepartment =
      departmentFilter === 'all' || profile.department === departmentFilter;
    return matchesSearch && matchesDepartment;
  });

  const filteredAuditLog = auditLog.filter((entry) => {
    if (!auditSearchQuery) return true;
    const q = auditSearchQuery.toLowerCase();
    return (
      entry.action.toLowerCase().includes(q) ||
      entry.table_name.toLowerCase().includes(q) ||
      (entry.record_summary?.toLowerCase().includes(q) ?? false) ||
      (entry.user_id && profileMap[entry.user_id]?.toLowerCase().includes(q))
    );
  });

  const getActionColor = (action: string) => {
    if (action.toLowerCase().includes('delete')) return 'destructive';
    if (action.toLowerCase().includes('create') || action.toLowerCase().includes('add')) return 'default';
    if (action.toLowerCase().includes('update') || action.toLowerCase().includes('edit')) return 'secondary';
    return 'outline';
  };

  return (
    <MainLayout>
      <div className="p-8">
        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-display text-3xl font-bold text-foreground">Administration</h1>
            <p className="mt-1 text-muted-foreground">
              Manage users, app assignments, and view activity logs
            </p>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="gradient" className="gap-2">
                <UserPlus className="h-4 w-4" />
                Add User
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="font-display">Add New User</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="new-name">Full Name *</Label>
                  <Input
                    id="new-name"
                    value={newUserForm.full_name}
                    onChange={(e) => setNewUserForm(prev => ({ ...prev, full_name: e.target.value }))}
                    placeholder="John Doe"
                    maxLength={100}
                  />
                  {formErrors.full_name && (
                    <p className="text-xs text-destructive">{formErrors.full_name}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-email">Email *</Label>
                  <Input
                    id="new-email"
                    type="email"
                    value={newUserForm.email}
                    onChange={(e) => setNewUserForm(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="user@intellinks.co.ke"
                    maxLength={255}
                  />
                  {formErrors.email && (
                    <p className="text-xs text-destructive">{formErrors.email}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-password">Password *</Label>
                  <Input
                    id="new-password"
                    type="password"
                    value={newUserForm.password}
                    onChange={(e) => setNewUserForm(prev => ({ ...prev, password: e.target.value }))}
                    placeholder="Minimum 6 characters"
                    maxLength={72}
                  />
                  {formErrors.password && (
                    <p className="text-xs text-destructive">{formErrors.password}</p>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="new-department">Department</Label>
                    <Input
                      id="new-department"
                      value={newUserForm.department}
                      onChange={(e) => setNewUserForm(prev => ({ ...prev, department: e.target.value }))}
                      placeholder="IT"
                      maxLength={50}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="new-job-title">Job Title</Label>
                    <Input
                      id="new-job-title"
                      value={newUserForm.job_title}
                      onChange={(e) => setNewUserForm(prev => ({ ...prev, job_title: e.target.value }))}
                      placeholder="Developer"
                      maxLength={50}
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between pt-2">
                  <div className="space-y-0.5">
                    <Label>Admin Access</Label>
                    <p className="text-sm text-muted-foreground">
                      Grant administrative privileges
                    </p>
                  </div>
                  <Switch
                    checked={newUserForm.is_admin}
                    onCheckedChange={(checked) => setNewUserForm(prev => ({ ...prev, is_admin: checked }))}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <DialogClose asChild>
                  <Button variant="outline">Cancel</Button>
                </DialogClose>
                <Button 
                  variant="gradient" 
                  onClick={handleCreateUser}
                  disabled={createUserMutation.isPending}
                >
                  {createUserMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Create User
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <Tabs defaultValue="users" className="space-y-6">
          <TabsList>
            <TabsTrigger value="users" className="gap-2">
              <Shield className="h-4 w-4" />
              Users
            </TabsTrigger>
            <TabsTrigger value="audit" className="gap-2">
              <ScrollText className="h-4 w-4" />
              Audit Log
            </TabsTrigger>
          </TabsList>

          {/* Users Tab */}
          <TabsContent value="users">
            {/* Search and Filter */}
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search users..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="All Departments" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Departments</SelectItem>
                    {departments.map((dept) => (
                      <SelectItem key={dept} value={dept}>
                        {dept}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Users Table */}
            <div className="rounded-xl border border-border bg-card overflow-hidden">
              {profilesLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border bg-muted/50">
                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">User</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Department</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Role</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Assigned Apps</th>
                      <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredProfiles.map((profile) => (
                      <tr key={profile.id} className="transition-colors hover:bg-muted/50">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full gradient-primary text-sm font-medium text-primary-foreground">
                              {profile.full_name?.split(' ').map((n) => n[0]).join('') || profile.email[0].toUpperCase()}
                            </div>
                            <div>
                              <p className="font-medium text-card-foreground">{profile.full_name || 'No name'}</p>
                              <p className="text-sm text-muted-foreground">{profile.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4"><span className="text-card-foreground">{profile.department || '-'}</span></td>
                        <td className="px-6 py-4">
                          <Badge variant={getUserRole(profile.id) === 'admin' ? 'default' : 'secondary'} className="capitalize gap-1">
                            {getUserRole(profile.id) === 'admin' && <Shield className="h-3 w-3" />}
                            {getUserRole(profile.id)}
                          </Badge>
                        </td>
                        <td className="px-6 py-4"><Badge variant="outline">{getUserAppCount(profile.id)} apps</Badge></td>
                        <td className="px-6 py-4 text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm"><Settings2 className="h-4 w-4" /></Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleEditApps(profile.id)}>
                                <Edit2 className="mr-2 h-4 w-4" />Edit App Access
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => openResetPasswordDialog(profile)}>
                                <KeyRound className="mr-2 h-4 w-4" />Reset Password
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    ))}
                    {filteredProfiles.length === 0 && (
                      <tr><td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">No users found</td></tr>
                    )}
                  </tbody>
                </table>
              )}
            </div>
          </TabsContent>

          {/* Audit Log Tab */}
          <TabsContent value="audit">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <ScrollText className="h-5 w-5" />
                  Activity Audit Log
                </CardTitle>
                <div className="relative w-64">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search audit log..."
                    value={auditSearchQuery}
                    onChange={(e) => setAuditSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </CardHeader>
              <CardContent>
                {auditLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : filteredAuditLog.length === 0 ? (
                  <p className="text-center text-muted-foreground py-12">No audit log entries found.</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Time</TableHead>
                        <TableHead>User</TableHead>
                        <TableHead>Action</TableHead>
                        <TableHead>Module</TableHead>
                        <TableHead>Record</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredAuditLog.map((entry) => (
                        <TableRow key={entry.id}>
                          <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                            {formatDistanceToNow(new Date(entry.created_at), { addSuffix: true })}
                          </TableCell>
                          <TableCell className="font-medium">
                            {entry.user_id ? profileMap[entry.user_id] || 'Unknown' : 'System'}
                          </TableCell>
                          <TableCell>
                            <Badge variant={getActionColor(entry.action) as any} className="capitalize">
                              {entry.action}
                            </Badge>
                          </TableCell>
                          <TableCell className="capitalize">{entry.table_name.replace(/_/g, ' ')}</TableCell>
                          <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                            {entry.record_summary || entry.record_id || '-'}
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

        {/* Edit Apps Dialog */}
        <Dialog open={isEditAppsDialogOpen} onOpenChange={setIsEditAppsDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="font-display">Edit App Access</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4 max-h-96 overflow-y-auto">
              {apps.map((app) => (
                <div key={app.id} className="flex items-center justify-between rounded-lg border border-border p-4">
                  <div className="flex items-center gap-3">
                    <Checkbox id={app.id} checked={userApps.includes(app.id)} onCheckedChange={() => handleToggleApp(app.id)} />
                    <div>
                      <label htmlFor={app.id} className="font-medium text-foreground cursor-pointer">{app.name}</label>
                      {app.description && <p className="text-sm text-muted-foreground">{app.description}</p>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsEditAppsDialogOpen(false)}>Cancel</Button>
              <Button variant="gradient" onClick={handleSaveApps} disabled={updateAppsMutation.isPending}>
                {updateAppsMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Reset Password Dialog */}
        <Dialog open={isResetPasswordDialogOpen} onOpenChange={setIsResetPasswordDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="font-display">Reset Password</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <p className="text-sm text-muted-foreground">
                Reset password for <span className="font-medium text-foreground">{selectedUserForReset?.full_name || selectedUserForReset?.email}</span>
              </p>
              <div className="space-y-2">
                <Label htmlFor="new-password">New Password</Label>
                <Input id="new-password" type="password" value={resetPasswordForm.new_password} onChange={(e) => setResetPasswordForm(prev => ({ ...prev, new_password: e.target.value }))} placeholder="Minimum 6 characters" maxLength={72} />
                {resetPasswordErrors.new_password && <p className="text-xs text-destructive">{resetPasswordErrors.new_password}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirm Password</Label>
                <Input id="confirm-password" type="password" value={resetPasswordForm.confirm_password} onChange={(e) => setResetPasswordForm(prev => ({ ...prev, confirm_password: e.target.value }))} placeholder="Re-enter password" maxLength={72} />
                {resetPasswordErrors.confirm_password && <p className="text-xs text-destructive">{resetPasswordErrors.confirm_password}</p>}
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsResetPasswordDialogOpen(false)}>Cancel</Button>
              <Button variant="gradient" onClick={handleResetPassword} disabled={resetPasswordMutation.isPending}>
                {resetPasswordMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Reset Password
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}
