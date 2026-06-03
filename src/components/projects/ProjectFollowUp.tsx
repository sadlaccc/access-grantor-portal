import { useState } from 'react';
import { format } from 'date-fns';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, Plus, Trash2, CheckCircle2, Circle, Clock, MessageSquare, Calendar } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DatePicker } from '@/components/ui/date-picker';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { notifyAllUsers, logAuditAction } from '@/hooks/useNotifications';

interface Project {
  id: string; name: string; status: string; progress: number;
  description: string | null; start_date: string | null; end_date: string | null;
}

interface ProjectTask {
  id: string; project_id: string; title: string; description: string | null;
  status: string; assignee_id: string | null; due_date: string | null;
  completed_at: string | null; created_by: string | null; created_at: string;
}

interface ProjectUpdate {
  id: string; project_id: string; user_id: string; content: string;
  status_change: string | null; created_at: string;
}

interface Profile { id: string; full_name: string | null; email: string }

interface Props {
  project: Project | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const taskStatusMeta: Record<string, { label: string; icon: typeof Circle; className: string }> = {
  todo: { label: 'To Do', icon: Circle, className: 'text-muted-foreground' },
  in_progress: { label: 'In Progress', icon: Clock, className: 'text-primary' },
  done: { label: 'Done', icon: CheckCircle2, className: 'text-success' },
};

export function ProjectFollowUp({ project, open, onOpenChange }: Props) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [taskAssignee, setTaskAssignee] = useState<string | null>(null);
  const [taskDueDate, setTaskDueDate] = useState<Date | undefined>();
  const [updateContent, setUpdateContent] = useState('');
  const [statusChange, setStatusChange] = useState<string>('');

  const projectId = project?.id;

  const { data: tasks = [] } = useQuery({
    queryKey: ['project-tasks', projectId],
    enabled: !!projectId && open,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('project_tasks')
        .select('*')
        .eq('project_id', projectId!)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data as ProjectTask[];
    },
  });

  const { data: updates = [] } = useQuery({
    queryKey: ['project-updates', projectId],
    enabled: !!projectId && open,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('project_updates')
        .select('*')
        .eq('project_id', projectId!)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as ProjectUpdate[];
    },
  });

  const { data: profiles = [] } = useQuery({
    queryKey: ['profiles-min'],
    queryFn: async () => {
      const { data, error } = await supabase.from('profiles').select('id, full_name, email');
      if (error) throw error;
      return data as Profile[];
    },
  });
  const profileMap = profiles.reduce((acc, p) => { acc[p.id] = p.full_name || p.email; return acc; }, {} as Record<string, string>);

  /** Recompute project progress from tasks; auto-complete when all done. */
  const syncProgress = async (allTasks: ProjectTask[]) => {
    if (!projectId || allTasks.length === 0) return;
    const done = allTasks.filter(t => t.status === 'done').length;
    const pct = Math.round((done / allTasks.length) * 100);
    const updates: Record<string, unknown> = { progress: pct };
    if (pct === 100 && project?.status !== 'completed') {
      updates.status = 'completed';
      updates.end_date = new Date().toISOString().slice(0, 10);
      await notifyAllUsers({
        title: 'Project Completed', message: `${project?.name} reached 100%`,
        type: 'success', app: 'project', entity_id: projectId, excludeUserId: user?.id,
      });
      await supabase.from('project_updates').insert({
        project_id: projectId, user_id: user?.id, content: 'All tasks complete — project marked as completed.',
        status_change: 'completed',
      });
    }
    await supabase.from('projects').update(updates).eq('id', projectId);
    queryClient.invalidateQueries({ queryKey: ['projects'] });
    queryClient.invalidateQueries({ queryKey: ['project-updates', projectId] });
  };

  const createTask = useMutation({
    mutationFn: async () => {
      if (!projectId) return;
      const { data, error } = await supabase.from('project_tasks').insert({
        project_id: projectId, title: taskTitle, description: taskDescription || null,
        assignee_id: taskAssignee, due_date: taskDueDate ? format(taskDueDate, 'yyyy-MM-dd') : null,
        created_by: user?.id, status: 'todo',
      }).select().single();
      if (error) throw error;
      await logAuditAction({ userId: user?.id!, action: 'create', tableName: 'project_tasks', recordSummary: `Task: ${taskTitle}` });
      if (taskAssignee && taskAssignee !== user?.id) {
        await supabase.from('notifications').insert({
          user_id: taskAssignee, title: 'New task assigned', message: `${taskTitle} (${project?.name})`,
          type: 'info', app: 'project', entity_id: projectId,
        });
      }
      return data as ProjectTask;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-tasks', projectId] });
      toast.success('Task added');
      setTaskTitle(''); setTaskDescription(''); setTaskAssignee(null); setTaskDueDate(undefined);
    },
    onError: (e: Error) => toast.error('Failed: ' + e.message),
  });

  const updateTaskStatus = useMutation({
    mutationFn: async ({ task, status }: { task: ProjectTask; status: string }) => {
      const patch: Record<string, unknown> = { status };
      if (status === 'done') patch.completed_at = new Date().toISOString();
      else patch.completed_at = null;
      const { error } = await supabase.from('project_tasks').update(patch).eq('id', task.id);
      if (error) throw error;
      const next = tasks.map(t => t.id === task.id ? { ...t, status, completed_at: status === 'done' ? new Date().toISOString() : null } : t);
      await syncProgress(next);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['project-tasks', projectId] }),
    onError: (e: Error) => toast.error('Failed: ' + e.message),
  });

  const deleteTask = useMutation({
    mutationFn: async (task: ProjectTask) => {
      const { error } = await supabase.from('project_tasks').delete().eq('id', task.id);
      if (error) throw error;
      await logAuditAction({ userId: user?.id!, action: 'delete', tableName: 'project_tasks', recordSummary: `Task: ${task.title}` });
      const next = tasks.filter(t => t.id !== task.id);
      await syncProgress(next);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-tasks', projectId] });
      toast.success('Task deleted');
    },
  });

  const postUpdate = useMutation({
    mutationFn: async () => {
      if (!projectId || !user) return;
      const { error } = await supabase.from('project_updates').insert({
        project_id: projectId, user_id: user.id, content: updateContent,
        status_change: statusChange || null,
      });
      if (error) throw error;
      if (statusChange) {
        await supabase.from('projects').update({ status: statusChange }).eq('id', projectId);
        await notifyAllUsers({
          title: 'Project status changed', message: `${project?.name} → ${statusChange}`,
          type: 'update', app: 'project', entity_id: projectId, excludeUserId: user.id,
        });
        queryClient.invalidateQueries({ queryKey: ['projects'] });
      } else {
        await notifyAllUsers({
          title: 'New project update', message: `${project?.name}: ${updateContent.slice(0, 60)}`,
          type: 'info', app: 'project', entity_id: projectId, excludeUserId: user.id,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-updates', projectId] });
      toast.success('Update posted');
      setUpdateContent(''); setStatusChange('');
    },
    onError: (e: Error) => toast.error('Failed: ' + e.message),
  });

  const deleteUpdate = useMutation({
    mutationFn: async (u: ProjectUpdate) => {
      const { error } = await supabase.from('project_updates').delete().eq('id', u.id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['project-updates', projectId] }),
  });

  if (!project) return null;

  const doneCount = tasks.filter(t => t.status === 'done').length;
  const inProgress = tasks.filter(t => t.status === 'in_progress').length;
  const overdue = tasks.filter(t => t.status !== 'done' && t.due_date && new Date(t.due_date) < new Date()).length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            {project.name}
            <Badge variant="outline" className="capitalize">{project.status.replace('-', ' ')}</Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-2 pb-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Overall progress (auto from tasks)</span>
            <span className="font-semibold text-primary">{project.progress}%</span>
          </div>
          <Progress value={project.progress} className="h-2" />
          <div className="flex gap-3 text-xs text-muted-foreground pt-1">
            <span>{tasks.length} tasks</span>
            <span className="text-success">{doneCount} done</span>
            <span className="text-primary">{inProgress} in progress</span>
            {overdue > 0 && <span className="text-destructive">{overdue} overdue</span>}
          </div>
        </div>

        <Tabs defaultValue="tasks" className="flex-1 overflow-hidden flex flex-col">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="tasks">Tasks ({tasks.length})</TabsTrigger>
            <TabsTrigger value="updates">Updates ({updates.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="tasks" className="flex-1 overflow-hidden flex flex-col mt-3">
            <div className="space-y-3 border border-border rounded-lg p-3 bg-muted/30">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <Input placeholder="Task title *" value={taskTitle} onChange={(e) => setTaskTitle(e.target.value)} />
                <Select value={taskAssignee || 'none'} onValueChange={(v) => setTaskAssignee(v === 'none' ? null : v)}>
                  <SelectTrigger><SelectValue placeholder="Assignee" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Unassigned</SelectItem>
                    {profiles.map(p => <SelectItem key={p.id} value={p.id}>{p.full_name || p.email}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <Textarea placeholder="Description (optional)" value={taskDescription} onChange={(e) => setTaskDescription(e.target.value)} rows={2} />
              <div className="flex gap-2">
                <div className="flex-1"><DatePicker date={taskDueDate} onDateChange={setTaskDueDate} placeholder="Due date" /></div>
                <Button onClick={() => createTask.mutate()} disabled={!taskTitle || createTask.isPending}>
                  {createTask.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Plus className="h-4 w-4 mr-1" />Add Task</>}
                </Button>
              </div>
            </div>

            <ScrollArea className="flex-1 mt-3 pr-2">
              {tasks.length === 0 ? (
                <p className="text-center text-sm text-muted-foreground py-8">No tasks yet. Break the project into actionable steps.</p>
              ) : (
                <div className="space-y-2">
                  {tasks.map(task => {
                    const meta = taskStatusMeta[task.status] || taskStatusMeta.todo;
                    const Icon = meta.icon;
                    const isOverdue = task.status !== 'done' && task.due_date && new Date(task.due_date) < new Date();
                    return (
                      <div key={task.id} className={cn('flex items-start gap-3 p-3 rounded-lg border border-border bg-card', task.status === 'done' && 'opacity-60')}>
                        <button
                          onClick={() => updateTaskStatus.mutate({ task, status: task.status === 'done' ? 'todo' : 'done' })}
                          className={cn('mt-0.5 transition-colors', meta.className)}
                          aria-label="Toggle done"
                        >
                          <Icon className="h-5 w-5" />
                        </button>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className={cn('font-medium text-sm', task.status === 'done' && 'line-through')}>{task.title}</p>
                            {task.due_date && (
                              <span className={cn('text-xs flex items-center gap-1', isOverdue ? 'text-destructive' : 'text-muted-foreground')}>
                                <Calendar className="h-3 w-3" />{new Date(task.due_date).toLocaleDateString()}
                                {isOverdue && ' • overdue'}
                              </span>
                            )}
                            {task.assignee_id && <Badge variant="secondary" className="text-xs">{profileMap[task.assignee_id] || 'User'}</Badge>}
                          </div>
                          {task.description && <p className="text-xs text-muted-foreground mt-1">{task.description}</p>}
                        </div>
                        <Select value={task.status} onValueChange={(s) => updateTaskStatus.mutate({ task, status: s })}>
                          <SelectTrigger className="w-[130px] h-8 text-xs"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="todo">To Do</SelectItem>
                            <SelectItem value="in_progress">In Progress</SelectItem>
                            <SelectItem value="done">Done</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => deleteTask.mutate(task)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="updates" className="flex-1 overflow-hidden flex flex-col mt-3">
            <div className="space-y-3 border border-border rounded-lg p-3 bg-muted/30">
              <Textarea placeholder="Post a status update or note…" value={updateContent} onChange={(e) => setUpdateContent(e.target.value)} rows={3} />
              <div className="flex gap-2">
                <Select value={statusChange || 'none'} onValueChange={(v) => setStatusChange(v === 'none' ? '' : v)}>
                  <SelectTrigger className="flex-1"><SelectValue placeholder="Optional: change project status" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No status change</SelectItem>
                    <SelectItem value="planning">Planning</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="on-hold">On Hold</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
                <Button onClick={() => postUpdate.mutate()} disabled={!updateContent || postUpdate.isPending}>
                  {postUpdate.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <><MessageSquare className="h-4 w-4 mr-1" />Post</>}
                </Button>
              </div>
            </div>

            <ScrollArea className="flex-1 mt-3 pr-2">
              {updates.length === 0 ? (
                <p className="text-center text-sm text-muted-foreground py-8">No updates yet.</p>
              ) : (
                <div className="space-y-3">
                  {updates.map(u => (
                    <div key={u.id} className="p-3 rounded-lg border border-border bg-card">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span className="font-medium text-foreground">{profileMap[u.user_id] || 'User'}</span>
                          <span>•</span>
                          <span>{new Date(u.created_at).toLocaleString()}</span>
                          {u.status_change && <Badge variant="outline" className="capitalize">→ {u.status_change}</Badge>}
                        </div>
                        {u.user_id === user?.id && (
                          <Button size="icon" variant="ghost" className="h-6 w-6 text-destructive hover:text-destructive" onClick={() => deleteUpdate.mutate(u)}>
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                      <p className="text-sm whitespace-pre-wrap">{u.content}</p>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
