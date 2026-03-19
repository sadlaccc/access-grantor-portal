import { useState, useEffect, useRef, useCallback } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Pencil, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Separator } from '@/components/ui/separator';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import {
  MessageSquare, Plus, Search, Hash, Lock, Send, MoreVertical,
  Trash2, Users, User, ArrowLeft,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { useIsMobile } from '@/hooks/use-mobile';

type Channel = { id: string; name: string; type: string; created_by: string };
type ChannelMessage = { id: string; channel_id: string; user_id: string; content: string; created_at: string; profile?: { full_name: string | null; avatar_url: string | null } };
type DirectMessage = { id: string; sender_id: string; receiver_id: string; content: string; created_at: string };
type Profile = { id: string; full_name: string | null; avatar_url: string | null; email: string };
type ChatView = 'channel' | 'dm';

export default function Collaboration() {
  const { user, isAdmin } = useAuth();
  const isMobile = useIsMobile();
  const [channels, setChannels] = useState<Channel[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);
  const [selectedDmUser, setSelectedDmUser] = useState<Profile | null>(null);
  const [chatView, setChatView] = useState<ChatView>('channel');
  const [channelMessages, setChannelMessages] = useState<ChannelMessage[]>([]);
  const [directMessages, setDirectMessages] = useState<DirectMessage[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isChannelDialogOpen, setIsChannelDialogOpen] = useState(false);
  const [channelName, setChannelName] = useState('');
  const [channelType, setChannelType] = useState('public');
  const [sidebarSection, setSidebarSection] = useState<'channels' | 'dms'>('channels');
  const [showMobileChat, setShowMobileChat] = useState(false);
  const [editingChannelId, setEditingChannelId] = useState<string | null>(null);
  const [editChannelName, setEditChannelName] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  // Load channels
  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from('chat_channels').select('*').order('created_at');
      if (data) {
        setChannels(data);
        if (data.length > 0 && !selectedChannel) setSelectedChannel(data[0]);
      }
    };
    load();
  }, []);

  // Load profiles
  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from('profiles').select('id, full_name, avatar_url, email');
      if (data) setProfiles(data.filter(p => p.id !== user?.id));
    };
    load();
  }, [user]);

  // Load channel messages
  useEffect(() => {
    if (!selectedChannel) return;
    const load = async () => {
      const { data } = await supabase.from('channel_messages').select('*').eq('channel_id', selectedChannel.id).order('created_at');
      if (data) {
        const userIds = [...new Set(data.map(m => m.user_id))];
        const { data: profs } = await supabase.from('profiles').select('id, full_name, avatar_url').in('id', userIds);
        const profMap = Object.fromEntries((profs || []).map(p => [p.id, p]));
        setChannelMessages(data.map(m => ({ ...m, profile: profMap[m.user_id] })));
      }
    };
    load();
  }, [selectedChannel]);

  // Load DMs
  useEffect(() => {
    if (!selectedDmUser || !user) return;
    const load = async () => {
      const { data } = await supabase
        .from('direct_messages').select('*')
        .or(`and(sender_id.eq.${user.id},receiver_id.eq.${selectedDmUser.id}),and(sender_id.eq.${selectedDmUser.id},receiver_id.eq.${user.id})`)
        .order('created_at');
      if (data) setDirectMessages(data);
    };
    load();
  }, [selectedDmUser, user]);

  // Realtime channel messages
  useEffect(() => {
    if (!selectedChannel) return;
    const channel = supabase
      .channel(`channel-${selectedChannel.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'channel_messages', filter: `channel_id=eq.${selectedChannel.id}` }, async (payload) => {
        if (payload.eventType === 'INSERT') {
          const msg = payload.new as ChannelMessage;
          const { data: prof } = await supabase.from('profiles').select('full_name, avatar_url').eq('id', msg.user_id).single();
          setChannelMessages(prev => [...prev, { ...msg, profile: prof || undefined }]);
        }
        if (payload.eventType === 'DELETE') {
          setChannelMessages(prev => prev.filter(m => m.id !== (payload.old as any).id));
        }
      }).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [selectedChannel]);

  // Realtime DMs
  useEffect(() => {
    if (!selectedDmUser || !user) return;
    const channel = supabase
      .channel(`dm-${selectedDmUser.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'direct_messages' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          const msg = payload.new as DirectMessage;
          if ((msg.sender_id === user.id && msg.receiver_id === selectedDmUser.id) || (msg.sender_id === selectedDmUser.id && msg.receiver_id === user.id)) {
            setDirectMessages(prev => [...prev, msg]);
          }
        }
        if (payload.eventType === 'DELETE') {
          setDirectMessages(prev => prev.filter(m => m.id !== (payload.old as any).id));
        }
      }).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [selectedDmUser, user]);

  useEffect(() => { scrollToBottom(); }, [channelMessages, directMessages, scrollToBottom]);

  const handleSendMessage = async () => {
    if (!messageInput.trim() || !user) return;
    if (chatView === 'channel' && selectedChannel) {
      await supabase.from('channel_messages').insert({ channel_id: selectedChannel.id, user_id: user.id, content: messageInput.trim() });
    } else if (chatView === 'dm' && selectedDmUser) {
      await supabase.from('direct_messages').insert({ sender_id: user.id, receiver_id: selectedDmUser.id, content: messageInput.trim() });
    }
    setMessageInput('');
  };

  const handleDeleteChannelMessage = async (msgId: string) => {
    const { error } = await supabase.from('channel_messages').delete().eq('id', msgId);
    if (error) toast.error('Failed to delete message');
    else setChannelMessages(prev => prev.filter(m => m.id !== msgId));
  };

  const handleDeleteDm = async (msgId: string) => {
    const { error } = await supabase.from('direct_messages').delete().eq('id', msgId);
    if (error) toast.error('Failed to delete message');
    else setDirectMessages(prev => prev.filter(m => m.id !== msgId));
  };

  const handleCreateChannel = async () => {
    if (!channelName.trim() || !user) { toast.error('Enter a channel name'); return; }
    const { error } = await supabase.from('chat_channels').insert({ name: channelName.trim().toLowerCase().replace(/\s+/g, '-'), type: channelType, created_by: user.id });
    if (error) { toast.error('Failed to create channel'); return; }
    const { data } = await supabase.from('chat_channels').select('*').order('created_at');
    if (data) setChannels(data);
    toast.success(`Channel #${channelName} created`);
    setIsChannelDialogOpen(false);
    setChannelName('');
  };

  const handleDeleteChannel = async (channelId: string) => {
    const { error } = await supabase.from('chat_channels').delete().eq('id', channelId);
    if (error) { toast.error('Failed to delete channel'); return; }
    setChannels(prev => prev.filter(c => c.id !== channelId));
    if (selectedChannel?.id === channelId) setSelectedChannel(channels.find(c => c.id !== channelId) || null);
    toast.success('Channel deleted');
  };

  const handleRenameChannel = async (channelId: string) => {
    if (!editChannelName.trim()) { toast.error('Enter a name'); return; }
    const { error } = await supabase.from('chat_channels').update({ name: editChannelName.trim().toLowerCase().replace(/\s+/g, '-') }).eq('id', channelId);
    if (error) { toast.error('Failed to rename channel'); return; }
    setChannels(prev => prev.map(c => c.id === channelId ? { ...c, name: editChannelName.trim().toLowerCase().replace(/\s+/g, '-') } : c));
    if (selectedChannel?.id === channelId) setSelectedChannel(prev => prev ? { ...prev, name: editChannelName.trim().toLowerCase().replace(/\s+/g, '-') } : prev);
    setEditingChannelId(null);
    toast.success('Channel renamed');
  };

  const getInitials = (name: string | null | undefined) => {
    if (!name) return '??';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const selectChannel = (ch: Channel) => {
    setSelectedChannel(ch); setChatView('channel'); setSelectedDmUser(null);
    if (isMobile) setShowMobileChat(true);
  };

  const selectDm = (p: Profile) => {
    setSelectedDmUser(p); setChatView('dm'); setSelectedChannel(null);
    if (isMobile) setShowMobileChat(true);
  };

  const filteredChannels = channels.filter(c => c.name.includes(searchTerm.toLowerCase()));
  const filteredProfiles = profiles.filter(p => (p.full_name || p.email).toLowerCase().includes(searchTerm.toLowerCase()));

  const chatTitle = chatView === 'channel' && selectedChannel ? `#${selectedChannel.name}` : chatView === 'dm' && selectedDmUser ? selectedDmUser.full_name || selectedDmUser.email : 'Select a conversation';
  const chatSubtitle = chatView === 'channel' && selectedChannel ? `${selectedChannel.type} channel` : chatView === 'dm' && selectedDmUser ? 'Direct message' : '';

  const chatSidebar = (
    <div className="flex flex-col h-full bg-muted/30">
      <div className="p-4 border-b border-border/50">
        <h2 className="font-display text-lg font-bold text-foreground">Intellinks Chat</h2>
        <p className="text-xs text-muted-foreground mt-0.5">Team messaging</p>
      </div>
      <div className="px-3 py-2">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-8 h-8 text-sm bg-background/50 border-border/30" />
        </div>
      </div>
      <div className="flex px-3 gap-1">
        <button onClick={() => setSidebarSection('channels')} className={`flex-1 text-xs font-medium py-1.5 rounded-md transition-colors ${sidebarSection === 'channels' ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground'}`}>
          <Hash className="h-3 w-3 inline mr-1" />Channels
        </button>
        <button onClick={() => setSidebarSection('dms')} className={`flex-1 text-xs font-medium py-1.5 rounded-md transition-colors ${sidebarSection === 'dms' ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground'}`}>
          <User className="h-3 w-3 inline mr-1" />Direct Messages
        </button>
      </div>
      <Separator className="my-2" />
      <ScrollArea className="flex-1">
        <AnimatePresence mode="wait">
          {sidebarSection === 'channels' ? (
            <motion.div key="channels" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="px-2 space-y-0.5">
              <div className="flex items-center justify-between px-2 py-1">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Channels</span>
                <Dialog open={isChannelDialogOpen} onOpenChange={setIsChannelDialogOpen}>
                  <DialogTrigger asChild>
                    <button className="h-5 w-5 rounded flex items-center justify-center hover:bg-muted transition-colors"><Plus className="h-3.5 w-3.5 text-muted-foreground" /></button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader><DialogTitle>Create Channel</DialogTitle></DialogHeader>
                    <div className="space-y-4">
                      <div className="space-y-2"><Label>Name</Label><Input value={channelName} onChange={(e) => setChannelName(e.target.value)} placeholder="e.g. project-updates" /></div>
                      <div className="space-y-2"><Label>Type</Label><Select value={channelType} onValueChange={setChannelType}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="public">Public</SelectItem><SelectItem value="private">Private</SelectItem></SelectContent></Select></div>
                      <Button className="w-full" onClick={handleCreateChannel}>Create</Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
              {filteredChannels.map((ch) => (
                editingChannelId === ch.id ? (
                  <div key={ch.id} className="flex items-center gap-1 px-2 py-1">
                    <Input value={editChannelName} onChange={(e) => setEditChannelName(e.target.value)} className="h-7 text-sm flex-1" autoFocus onKeyDown={(e) => e.key === 'Enter' && handleRenameChannel(ch.id)} />
                    <button onClick={() => handleRenameChannel(ch.id)} className="h-6 w-6 rounded flex items-center justify-center hover:bg-primary/10"><Check className="h-3.5 w-3.5 text-primary" /></button>
                    <button onClick={() => setEditingChannelId(null)} className="h-6 w-6 rounded flex items-center justify-center hover:bg-destructive/10"><X className="h-3.5 w-3.5 text-destructive" /></button>
                  </div>
                ) : (
                <button key={ch.id} onClick={() => selectChannel(ch)} className={`w-full group flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm transition-colors ${chatView === 'channel' && selectedChannel?.id === ch.id ? 'bg-primary/10 text-primary font-medium' : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'}`}>
                  {ch.type === 'private' ? <Lock className="h-3.5 w-3.5 shrink-0" /> : <Hash className="h-3.5 w-3.5 shrink-0" />}
                  <span className="truncate">{ch.name}</span>
                  {isAdmin && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <span className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity shrink-0" onClick={(e) => e.stopPropagation()}><MoreVertical className="h-3.5 w-3.5" /></span>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setEditingChannelId(ch.id); setEditChannelName(ch.name); }}><Pencil className="h-3.5 w-3.5 mr-2" />Rename</DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive" onClick={() => handleDeleteChannel(ch.id)}><Trash2 className="h-3.5 w-3.5 mr-2" />Delete Channel</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </button>
                )
              ))}
            </motion.div>
          ) : (
            <motion.div key="dms" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} className="px-2 space-y-0.5">
              <div className="px-2 py-1"><span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">People</span></div>
              {filteredProfiles.map((p) => (
                <button key={p.id} onClick={() => selectDm(p)} className={`w-full flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm transition-colors ${chatView === 'dm' && selectedDmUser?.id === p.id ? 'bg-primary/10 text-primary font-medium' : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'}`}>
                  <Avatar className="h-6 w-6"><AvatarFallback className="bg-primary/10 text-primary text-[10px]">{getInitials(p.full_name)}</AvatarFallback></Avatar>
                  <span className="truncate">{p.full_name || p.email}</span>
                </button>
              ))}
              {filteredProfiles.length === 0 && <p className="text-xs text-muted-foreground px-2 py-4 text-center">No users found</p>}
            </motion.div>
          )}
        </AnimatePresence>
      </ScrollArea>
    </div>
  );

  const chatArea = (
    <div className="flex-1 flex flex-col min-w-0 h-full">
      {/* Chat header */}
      <div className="h-14 border-b border-border/50 flex items-center justify-between px-4 md:px-5 shrink-0">
        <div className="flex items-center gap-3">
          {isMobile && (
            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => setShowMobileChat(false)}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
          )}
          <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            {chatView === 'channel' ? <Hash className="h-4 w-4 text-primary" /> : <User className="h-4 w-4 text-primary" />}
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold text-sm text-foreground truncate">{chatTitle}</h3>
            <p className="text-[11px] text-muted-foreground">{chatSubtitle}</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8"><Users className="h-4 w-4" /></Button>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 px-3 md:px-5">
        <div className="py-4 space-y-1">
          {chatView === 'channel' && channelMessages.map((msg, i) => {
            const showHeader = i === 0 || channelMessages[i - 1].user_id !== msg.user_id;
            const isOwn = msg.user_id === user?.id;
            return (
              <motion.div key={msg.id} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className={`group flex gap-2 md:gap-3 rounded-lg px-2 py-1 hover:bg-muted/30 transition-colors ${showHeader ? 'mt-3' : ''}`}>
                {showHeader ? (
                  <Avatar className="h-7 w-7 md:h-8 md:w-8 mt-0.5 shrink-0"><AvatarFallback className="bg-primary/10 text-primary text-xs">{getInitials(msg.profile?.full_name)}</AvatarFallback></Avatar>
                ) : <div className="w-7 md:w-8 shrink-0" />}
                <div className="flex-1 min-w-0">
                  {showHeader && (
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-foreground">{msg.profile?.full_name || 'Unknown'}</span>
                      <span className="text-[11px] text-muted-foreground">{format(new Date(msg.created_at), 'h:mm a')}</span>
                    </div>
                  )}
                  <p className="text-sm text-foreground/90 break-words">{msg.content}</p>
                </div>
                {(isOwn || isAdmin) && (
                  <button onClick={() => handleDeleteChannelMessage(msg.id)} className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0 h-6 w-6 rounded flex items-center justify-center hover:bg-destructive/10">
                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                  </button>
                )}
              </motion.div>
            );
          })}

          {chatView === 'dm' && directMessages.map((msg, i) => {
            const isOwn = msg.sender_id === user?.id;
            const senderProfile = isOwn ? null : profiles.find(p => p.id === msg.sender_id);
            const showHeader = i === 0 || directMessages[i - 1].sender_id !== msg.sender_id;
            return (
              <motion.div key={msg.id} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className={`group flex gap-2 md:gap-3 rounded-lg px-2 py-1 hover:bg-muted/30 transition-colors ${showHeader ? 'mt-3' : ''}`}>
                {showHeader ? (
                  <Avatar className="h-7 w-7 md:h-8 md:w-8 mt-0.5 shrink-0"><AvatarFallback className="bg-primary/10 text-primary text-xs">{isOwn ? getInitials(user?.user_metadata?.full_name) : getInitials(senderProfile?.full_name)}</AvatarFallback></Avatar>
                ) : <div className="w-7 md:w-8 shrink-0" />}
                <div className="flex-1 min-w-0">
                  {showHeader && (
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-foreground">{isOwn ? 'You' : (senderProfile?.full_name || 'Unknown')}</span>
                      <span className="text-[11px] text-muted-foreground">{format(new Date(msg.created_at), 'h:mm a')}</span>
                    </div>
                  )}
                  <p className="text-sm text-foreground/90 break-words">{msg.content}</p>
                </div>
                {isOwn && (
                  <button onClick={() => handleDeleteDm(msg.id)} className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0 h-6 w-6 rounded flex items-center justify-center hover:bg-destructive/10">
                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                  </button>
                )}
              </motion.div>
            );
          })}

          {((chatView === 'channel' && channelMessages.length === 0) || (chatView === 'dm' && directMessages.length === 0)) && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4"><MessageSquare className="h-8 w-8 text-primary" /></div>
              <h3 className="font-semibold text-foreground">No messages yet</h3>
              <p className="text-sm text-muted-foreground mt-1">Start the conversation!</p>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Input */}
      {(selectedChannel || selectedDmUser) && (
        <div className="p-3 md:p-4 border-t border-border/50 shrink-0">
          <div className="flex items-center gap-2 rounded-xl bg-muted/40 border border-border/30 px-3 py-1.5">
            <Input
              placeholder={chatView === 'channel' ? `Message #${selectedChannel?.name}` : `Message ${selectedDmUser?.full_name || ''}`}
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
              className="flex-1 border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 px-0 h-9"
            />
            <Button size="icon" className="h-8 w-8 rounded-lg gradient-primary text-primary-foreground shrink-0" onClick={handleSendMessage} disabled={!messageInput.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <MainLayout>
      <div className="p-2 sm:p-4 lg:p-6 h-[calc(100vh-0px)]">
        <div className="flex h-full gap-0 rounded-2xl border border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden shadow-xl">
          {isMobile ? (
            <>
              {!showMobileChat ? (
                <div className="w-full">{chatSidebar}</div>
              ) : (
                <div className="w-full flex flex-col">{chatArea}</div>
              )}
            </>
          ) : (
            <>
              <div className="w-72 border-r border-border/50 flex flex-col shrink-0">{chatSidebar}</div>
              {chatArea}
            </>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
