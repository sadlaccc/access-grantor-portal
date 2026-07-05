import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DatePicker } from '@/components/ui/date-picker';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Calendar, Plus, Loader2, Users, Clock, MapPin, Video, Trash2, CalendarClock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { motion } from 'framer-motion';

interface Profile { id: string; full_name: string | null; email: string; }
interface Meeting {
  id: string; title: string; agenda: string | null; scheduled_at: string;
  duration_minutes: number; location: string | null; meeting_link: string | null;
  status: string; organizer_id: string; created_at: string;
}
interface Participant { id: string; meeting_id: string; user_id: string; response: string; }

interface Props {
  profiles: Profile[];
  profileMap: Record<string, string>;
  isHROrAdmin: boolean;
}

export function MeetingsSection({ profiles, profileMap, isHROrAdmin }: Props) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  const [title, setTitle] = useState('');
  const [agenda, setAgenda] = useState('');
  const [date, setDate] = useState<Date | undefined>();
  const [time, setTime] = useState('09:00');
  const [duration, setDuration] = useState('30');
  const [location, setLocation] = useState('');
  const [link, setLink] = useState('');
  const [selected, setSelected] = useState<string[]>([]);

  const { data: meetings = [], isLoading } = useQuery({
    queryKey: ['meetings'],
    queryFn: async () => {
      const { data, error } = await supabase.from('meetings').select('*').order('scheduled_at', { ascending: true });
      if (error) throw error;
      return data as Meeting[];
    },
  });

  const { data: participants = [] } = useQuery({
    queryKey: ['meeting-participants'],
    queryFn: async () => {
      const { data, error } = await supabase.from('meeting_participants').select('*');
      if (error) throw error;
      return data as Participant[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!date) throw new Error('Date is required');
      if (selected.length === 0) throw new Error('Add at least one participant');
      const [h, m] = time.split(':').map(Number);
      const scheduled = new Date(date);
      scheduled.setHours(h, m, 0, 0);
      const { data: mt, error } = await supabase.from('meetings').insert({
        title, agenda: agenda || null, scheduled_at: scheduled.toISOString(),
        duration_minutes: parseInt(duration) || 30, location: location || null,
        meeting_link: link || null, organizer_id: user?.id!,
      }).select().single();
      if (error) throw error;
      const rows = selected.map((uid) => ({ meeting_id: mt.id, user_id: uid }));
      const { error: pErr } = await supabase.from('meeting_participants').insert(rows);
      if (pErr) throw pErr;
      // Notify participants
      const notifs = selected.map((uid) => ({
        user_id: uid, title: 'Meeting Invitation',
        message: `${title} on ${format(scheduled, 'MMM d, h:mm a')}`,
        type: 'info', app: 'hrm', entity_id: mt.id,
      }));
      await supabase.from('notifications').insert(notifs);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meetings'] });
      queryClient.invalidateQueries({ queryKey: ['meeting-participants'] });
      toast.success('Meeting scheduled and invitations sent');
      setOpen(false);
      setTitle(''); setAgenda(''); setDate(undefined); setTime('09:00');
      setDuration('30'); setLocation(''); setLink(''); setSelected([]);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('meetings').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meetings'] });
      toast.success('Meeting cancelled');
    },
  });

  const participantsFor = (mid: string) => participants.filter((p) => p.meeting_id === mid);
  const toggle = (id: string) =>
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const visible = meetings.filter(
    (m) => m.organizer_id === user?.id || participantsFor(m.id).some((p) => p.user_id === user?.id) || isHROrAdmin,
  );

  return (
    <Card className="card-elevated">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <CalendarClock className="h-5 w-5 text-primary" />Meetings
          </CardTitle>
          {isHROrAdmin && (
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button variant="gradient" className="gap-2"><Plus className="h-4 w-4" />Book Meeting</Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader><DialogTitle>Schedule a Meeting</DialogTitle></DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2"><Label>Title *</Label>
                    <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="1:1 Check-in" /></div>
                  <div className="space-y-2"><Label>Agenda</Label>
                    <Textarea value={agenda} onChange={(e) => setAgenda(e.target.value)} rows={3} placeholder="Discussion points..." /></div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-2 col-span-2"><Label>Date *</Label>
                      <DatePicker date={date} onDateChange={setDate} placeholder="Pick a date" /></div>
                    <div className="space-y-2"><Label>Time *</Label>
                      <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} /></div>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-2"><Label>Duration (min)</Label>
                      <Input type="number" value={duration} onChange={(e) => setDuration(e.target.value)} /></div>
                    <div className="space-y-2 col-span-2"><Label>Location</Label>
                      <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Boardroom / Office" /></div>
                  </div>
                  <div className="space-y-2"><Label>Meeting Link</Label>
                    <Input value={link} onChange={(e) => setLink(e.target.value)} placeholder="https://meet..." /></div>
                  <div className="space-y-2">
                    <Label>Invite Employees * ({selected.length} selected)</Label>
                    <ScrollArea className="h-48 rounded-lg border p-2">
                      <div className="space-y-1">
                        {profiles.filter((p) => p.id !== user?.id).map((p) => (
                          <label key={p.id} className="flex items-center gap-3 p-2 rounded-md hover:bg-muted/50 cursor-pointer">
                            <Checkbox checked={selected.includes(p.id)} onCheckedChange={() => toggle(p.id)} />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{p.full_name || p.email}</p>
                              <p className="text-xs text-muted-foreground truncate">{p.email}</p>
                            </div>
                          </label>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                  <Button variant="gradient" className="w-full" onClick={() => createMutation.mutate()}
                    disabled={!title || !date || selected.length === 0 || createMutation.isPending}>
                    {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Schedule Meeting
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
        ) : visible.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Calendar className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p>No meetings scheduled</p>
          </div>
        ) : (
          <div className="space-y-3">
            {visible.map((m, i) => {
              const parts = participantsFor(m.id);
              const past = new Date(m.scheduled_at) < new Date();
              return (
                <motion.div key={m.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="group rounded-xl border border-border/60 p-4 hover:border-primary/40 hover:bg-muted/20 transition-all">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1.5">
                        <h3 className="font-semibold text-foreground">{m.title}</h3>
                        <Badge variant="outline" className={past ? 'bg-muted' : 'bg-primary/10 text-primary border-primary/30'}>
                          {past ? 'Past' : m.status}
                        </Badge>
                      </div>
                      {m.agenda && <p className="text-sm text-muted-foreground mb-2 whitespace-pre-wrap">{m.agenda}</p>}
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />
                          {format(new Date(m.scheduled_at), 'MMM d, yyyy · h:mm a')} · {m.duration_minutes}m</span>
                        {m.location && <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{m.location}</span>}
                        {m.meeting_link && (
                          <a href={m.meeting_link} target="_blank" rel="noreferrer"
                            className="flex items-center gap-1 text-primary hover:underline">
                            <Video className="h-3.5 w-3.5" />Join
                          </a>
                        )}
                        <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" />{parts.length} invited</span>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {parts.slice(0, 6).map((p) => (
                          <Badge key={p.id} variant="secondary" className="text-xs font-normal">
                            {profileMap[p.user_id] || 'User'}
                          </Badge>
                        ))}
                        {parts.length > 6 && <Badge variant="secondary" className="text-xs">+{parts.length - 6}</Badge>}
                      </div>
                    </div>
                    {(m.organizer_id === user?.id || isHROrAdmin) && (
                      <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 text-destructive"
                        onClick={() => deleteMutation.mutate(m.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
