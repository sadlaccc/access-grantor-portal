import { useState } from 'react';
import { Plus, Loader2, FolderKanban, Calendar, Trash2, Pencil, ListChecks } from 'lucide-react';
import { ProjectFollowUp } from '@/components/projects/ProjectFollowUp';
import { format } from 'date-fns';
import { DatePicker } from '@/components/ui/date-picker';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { notifyAllUsers, logAuditAction } from '@/hooks/useNotifications';

interface Project {
  id: string; name: string; description: string | null; status: string; priority: string | null;
  progress: number; start_date: string | null; end_date: string | null; created_by: string | null; created_at: string;
}

const statusColors: Record<string, string> = {
  planning: 'bg-muted text-muted-foreground',
  active: 'bg-primary/10 text-primary border-primary/20',
  'on-hold': 'bg-warning/10 text-warning border-warning/20',
  completed: 'bg-success/10 text-success border-success/20',
};

const containerVariants = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.06 } } };
const itemVariants = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] } } };

export default function Projects() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [followUpProject, setFollowUpProject] = useState<Project | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('planning');
  const [startDate, setStartDate] = useState<Date | undefined>();

  const { data: projects = [], isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const { data, error } = await supabase.from('projects').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data as Project[];
    },
  });

  const createProjectMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('projects').insert({
        name, description: description || null, status,
        start_date: startDate ? format(startDate, 'yyyy-MM-dd') : null, created_by: user?.id,
      });
      if (error) throw error;
      await notifyAllUsers({ title: 'New Project Created', message: name, type: 'create', app: 'project', excludeUserId: user?.id });
      await logAuditAction({ userId: user?.id!, action: 'create', tableName: 'projects', recordSummary: name });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast.success('Project created successfully');
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error: Error) => toast.error('Failed to create project: ' + error.message),
  });

  const editProjectMutation = useMutation({
    mutationFn: async () => {
      if (!editingProject) return;
      const { error } = await supabase.from('projects').update({
        name, description: description || null, status,
        start_date: startDate ? format(startDate, 'yyyy-MM-dd') : null,
      }).eq('id', editingProject.id);
      if (error) throw error;
      await logAuditAction({ userId: user?.id!, action: 'update', tableName: 'projects', recordId: editingProject.id, recordSummary: name });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast.success('Project updated');
      setIsEditDialogOpen(false);
      setEditingProject(null);
      resetForm();
    },
    onError: (error: Error) => toast.error('Failed to update project: ' + error.message),
  });

  const updateProgressMutation = useMutation({
    mutationFn: async ({ id, progress }: { id: string; progress: number }) => {
      const updates: Record<string, unknown> = { progress };
      if (progress >= 100) updates.status = 'completed';
      const { error } = await supabase.from('projects').update(updates).eq('id', id);
      if (error) throw error;
      const proj = projects.find(p => p.id === id);
      await notifyAllUsers({ title: 'Project Progress Updated', message: `${proj?.name} - ${progress}%`, type: 'update', app: 'project', entity_id: id, excludeUserId: user?.id });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['projects'] }),
  });

  const deleteProjectMutation = useMutation({
    mutationFn: async (project: Project) => {
      await supabase.from('project_members').delete().eq('project_id', project.id);
      const { error } = await supabase.from('projects').delete().eq('id', project.id);
      if (error) throw error;
      await logAuditAction({ userId: user?.id!, action: 'delete', tableName: 'projects', recordId: project.id, recordSummary: project.name });
      await notifyAllUsers({ title: 'Project Deleted', message: project.name, type: 'delete', app: 'project', excludeUserId: user?.id });
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['projects'] }); toast.success('Project deleted'); },
  });

  const resetForm = () => { setName(''); setDescription(''); setStatus('planning'); setStartDate(undefined); };

  const openEditDialog = (project: Project) => {
    setEditingProject(project);
    setName(project.name);
    setDescription(project.description || '');
    setStatus(project.status);
    setStartDate(project.start_date ? new Date(project.start_date) : undefined);
    setIsEditDialogOpen(true);
  };

  const statusCounts = projects.reduce((acc, p) => { acc[p.status] = (acc[p.status] || 0) + 1; return acc; }, {} as Record<string, number>);

  if (isLoading) {
    return (<MainLayout><div className="flex h-[50vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div></MainLayout>);
  }

  const projectFormContent = (isEdit: boolean) => (
    <div className="space-y-4">
      <div className="space-y-2"><Label>Project Name *</Label><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Cloud Migration" /></div>
      <div className="space-y-2"><Label>Description</Label><Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Project description..." rows={3} /></div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2"><Label>Status</Label>
          <Select value={status} onValueChange={setStatus}><SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="planning">Planning</SelectItem><SelectItem value="active">Active</SelectItem><SelectItem value="on-hold">On Hold</SelectItem><SelectItem value="completed">Completed</SelectItem></SelectContent>
          </Select>
        </div>
        <div className="space-y-2"><Label>Start Date</Label><DatePicker date={startDate} onDateChange={setStartDate} placeholder="Select start date" /></div>
      </div>
      <Button className="w-full" onClick={() => isEdit ? editProjectMutation.mutate() : createProjectMutation.mutate()} disabled={!name || (isEdit ? editProjectMutation.isPending : createProjectMutation.isPending)}>
        {(isEdit ? editProjectMutation.isPending : createProjectMutation.isPending) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {isEdit ? 'Save Changes' : 'Create Project'}
      </Button>
    </div>
  );

  return (
    <MainLayout>
      <div className="p-6 lg:p-8 space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div><h1 className="font-display text-3xl font-bold text-foreground">Projects</h1><p className="mt-1 text-muted-foreground">Track and manage team projects</p></div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild><Button variant="gradient" className="gap-2"><Plus className="h-4 w-4" />New Project</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Create New Project</DialogTitle></DialogHeader>
              {projectFormContent(false)}
            </DialogContent>
          </Dialog>
        </div>

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={(open) => { setIsEditDialogOpen(open); if (!open) { setEditingProject(null); resetForm(); } }}>
          <DialogContent>
            <DialogHeader><DialogTitle>Edit Project</DialogTitle></DialogHeader>
            {projectFormContent(true)}
          </DialogContent>
        </Dialog>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: 'Planning', key: 'planning', color: 'bg-muted' },
            { label: 'Active', key: 'active', color: 'bg-primary/10' },
            { label: 'On Hold', key: 'on-hold', color: 'bg-warning/10' },
            { label: 'Completed', key: 'completed', color: 'bg-success/10' },
          ].map(({ label, key, color }) => (
            <motion.div key={key} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={cn('rounded-2xl border border-border p-5 text-center', color)}>
              <span className="text-3xl font-bold text-foreground">{statusCounts[key] || 0}</span>
              <p className="mt-1 text-sm text-muted-foreground">{label}</p>
            </motion.div>
          ))}
        </div>

        {projects.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <FolderKanban className="h-12 w-12 mb-4 opacity-50" /><p>No projects yet. Create your first project above.</p>
          </motion.div>
        ) : (
          <motion.div variants={containerVariants} initial="hidden" animate="show" className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => (
              <motion.div key={project.id} variants={itemVariants} className="group rounded-2xl border border-border bg-card p-6 transition-all duration-300 hover:border-primary/30 hover:shadow-lg card-interactive relative">
                <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEditDialog(project)}><Pencil className="h-3.5 w-3.5" /></Button>
                  <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => deleteProjectMutation.mutate(project)}><Trash2 className="h-3.5 w-3.5" /></Button>
                </div>
                <div className="flex items-start justify-between">
                  <Badge variant="outline" className={cn('capitalize text-xs', statusColors[project.status])}>{project.status.replace('-', ' ')}</Badge>
                  {project.start_date && (<span className="flex items-center gap-1 text-xs text-muted-foreground"><Calendar className="h-3 w-3" />{new Date(project.start_date).toLocaleDateString()}</span>)}
                </div>
                <h3 className="mt-4 font-display text-lg font-semibold text-card-foreground leading-tight">{project.name}</h3>
                <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{project.description || 'No description'}</p>
                <div className="mt-6">
                  <div className="flex items-center justify-between text-sm"><span className="text-muted-foreground">Progress</span><span className="font-semibold text-primary">{project.progress}%</span></div>
                  <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-muted"><motion.div initial={{ width: 0 }} animate={{ width: `${project.progress}%` }} transition={{ duration: 0.8, ease: 'easeOut' }} className="h-full rounded-full gradient-primary" /></div>
                </div>
                <div className="mt-4 flex gap-2">
                  {[25, 50, 75, 100].map((p) => (
                    <Button key={p} variant={project.progress >= p ? 'default' : 'outline'} size="sm"
                      className={cn('flex-1 text-xs transition-all', project.progress >= p && 'gradient-primary text-white border-0')}
                      onClick={() => updateProgressMutation.mutate({ id: project.id, progress: p })}>{p}%</Button>
                  ))}
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </MainLayout>
  );
}
