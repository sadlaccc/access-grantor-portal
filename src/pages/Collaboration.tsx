import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  MessageSquare,
  Video,
  FileText,
  Users,
  Plus,
  Search,
  Hash,
  Lock,
  Calendar,
  Clock,
  Paperclip,
  Send,
  MoreVertical,
} from 'lucide-react';
import { users } from '@/data/mockData';

const channels = [
  { id: 1, name: 'general', type: 'public', members: 35, unread: 12, lastMessage: 'Welcome to the new quarter!' },
  { id: 2, name: 'engineering', type: 'public', members: 12, unread: 5, lastMessage: 'Sprint planning at 2pm' },
  { id: 3, name: 'hr-team', type: 'private', members: 4, unread: 0, lastMessage: 'Onboarding docs updated' },
  { id: 4, name: 'project-alpha', type: 'private', members: 8, unread: 3, lastMessage: 'Milestone achieved!' },
  { id: 5, name: 'random', type: 'public', members: 28, unread: 0, lastMessage: 'Friday lunch plans?' },
];

const meetings = [
  { id: 1, title: 'Daily Standup', time: '09:00 AM', duration: '15 min', participants: 8, type: 'recurring', status: 'upcoming' },
  { id: 2, title: 'Product Review', time: '11:00 AM', duration: '1 hour', participants: 12, type: 'one-time', status: 'upcoming' },
  { id: 3, title: 'Client Demo', time: '02:00 PM', duration: '45 min', participants: 5, type: 'one-time', status: 'upcoming' },
  { id: 4, title: 'Team Retrospective', time: '04:00 PM', duration: '1 hour', participants: 6, type: 'recurring', status: 'scheduled' },
];

const documents = [
  { id: 1, name: 'Q1 2024 Planning.docx', type: 'document', size: '245 KB', modified: '2024-01-15', author: 'John Smith', shared: 12 },
  { id: 2, name: 'Product Roadmap.xlsx', type: 'spreadsheet', size: '1.2 MB', modified: '2024-01-14', author: 'Sarah Johnson', shared: 8 },
  { id: 3, name: 'Brand Guidelines.pdf', type: 'pdf', size: '5.8 MB', modified: '2024-01-10', author: 'Emily Davis', shared: 35 },
  { id: 4, name: 'Meeting Notes - Jan.docx', type: 'document', size: '128 KB', modified: '2024-01-18', author: 'Mike Chen', shared: 6 },
  { id: 5, name: 'Budget Proposal.xlsx', type: 'spreadsheet', size: '890 KB', modified: '2024-01-12', author: 'Alex Turner', shared: 4 },
];

const messages = [
  { id: 1, user: 'John Smith', avatar: 'JS', message: 'Good morning team! Ready for the sprint review?', time: '9:15 AM', reactions: ['👍', '🚀'] },
  { id: 2, user: 'Sarah Johnson', avatar: 'SJ', message: 'Just pushed the latest updates to staging. Please review when you get a chance.', time: '9:22 AM', reactions: ['✅'] },
  { id: 3, user: 'Mike Chen', avatar: 'MC', message: 'Looking great! I\'ll run the tests this afternoon.', time: '9:30 AM', reactions: [] },
];

export default function Collaboration() {
  const [searchTerm, setSearchTerm] = useState('');
  const [messageInput, setMessageInput] = useState('');

  const getFileIcon = (type: string) => {
    return <FileText className="h-5 w-5" />;
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="font-display text-3xl font-bold text-foreground">Collaboration</h1>
            <p className="text-muted-foreground">Chat, meet, and share with your team</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline">
              <Video className="mr-2 h-4 w-4" />
              Start Meeting
            </Button>
            <Button className="gradient-primary text-primary-foreground">
              <Plus className="mr-2 h-4 w-4" />
              Create Channel
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="card-elevated">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                  <MessageSquare className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{channels.length}</p>
                  <p className="text-sm text-muted-foreground">Active Channels</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="card-elevated">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-success/10">
                  <Users className="h-6 w-6 text-success" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{users.filter(u => u.status === 'active').length}</p>
                  <p className="text-sm text-muted-foreground">Online Now</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="card-elevated">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-warning/10">
                  <Video className="h-6 w-6 text-warning" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{meetings.filter(m => m.status === 'upcoming').length}</p>
                  <p className="text-sm text-muted-foreground">Meetings Today</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="card-elevated">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10">
                  <FileText className="h-6 w-6 text-accent" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{documents.length}</p>
                  <p className="text-sm text-muted-foreground">Shared Files</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="channels" className="space-y-4">
          <TabsList className="bg-muted/50">
            <TabsTrigger value="channels" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Channels
            </TabsTrigger>
            <TabsTrigger value="meetings" className="flex items-center gap-2">
              <Video className="h-4 w-4" />
              Meetings
            </TabsTrigger>
            <TabsTrigger value="files" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Files
            </TabsTrigger>
          </TabsList>

          <TabsContent value="channels">
            <div className="grid gap-6 lg:grid-cols-3">
              {/* Channel List */}
              <Card className="card-elevated lg:col-span-1">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-semibold">Channels</CardTitle>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Search channels..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </CardHeader>
                <CardContent className="space-y-1">
                  {channels
                    .filter(ch => ch.name.includes(searchTerm.toLowerCase()))
                    .map((channel) => (
                    <div
                      key={channel.id}
                      className="flex items-center justify-between rounded-lg p-3 hover:bg-muted/50 cursor-pointer transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                          channel.type === 'private' ? 'bg-warning/10' : 'bg-primary/10'
                        }`}>
                          {channel.type === 'private' ? (
                            <Lock className="h-4 w-4 text-warning" />
                          ) : (
                            <Hash className="h-4 w-4 text-primary" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-sm">{channel.name}</p>
                          <p className="text-xs text-muted-foreground truncate max-w-[140px]">{channel.lastMessage}</p>
                        </div>
                      </div>
                      {channel.unread > 0 && (
                        <Badge className="bg-primary text-primary-foreground">{channel.unread}</Badge>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Chat Area */}
              <Card className="card-elevated lg:col-span-2">
                <CardHeader className="border-b">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                        <Hash className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-lg font-semibold">general</CardTitle>
                        <p className="text-sm text-muted-foreground">35 members</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="flex flex-col h-[400px]">
                  <div className="flex-1 space-y-4 overflow-y-auto py-4">
                    {messages.map((msg) => (
                      <div key={msg.id} className="flex gap-3">
                        <Avatar className="h-9 w-9">
                          <AvatarFallback className="bg-primary/10 text-primary text-sm">{msg.avatar}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-sm">{msg.user}</p>
                            <span className="text-xs text-muted-foreground">{msg.time}</span>
                          </div>
                          <p className="text-sm text-foreground mt-1">{msg.message}</p>
                          {msg.reactions.length > 0 && (
                            <div className="flex gap-1 mt-2">
                              {msg.reactions.map((reaction, idx) => (
                                <span key={idx} className="text-sm bg-muted/50 rounded px-2 py-0.5">{reaction}</span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="border-t pt-4">
                    <div className="flex gap-2">
                      <Button variant="ghost" size="icon" className="shrink-0">
                        <Paperclip className="h-4 w-4" />
                      </Button>
                      <Input
                        placeholder="Type a message..."
                        value={messageInput}
                        onChange={(e) => setMessageInput(e.target.value)}
                        className="flex-1"
                      />
                      <Button className="gradient-primary text-primary-foreground shrink-0">
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="meetings">
            <Card className="card-elevated">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-semibold">Today's Meetings</CardTitle>
                  <Button className="gradient-primary text-primary-foreground">
                    <Plus className="mr-2 h-4 w-4" />
                    Schedule Meeting
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {meetings.map((meeting) => (
                    <div key={meeting.id} className="flex items-center justify-between rounded-lg border bg-card p-4">
                      <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                          <Video className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{meeting.title}</p>
                          <div className="flex items-center gap-3 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {meeting.time}
                            </span>
                            <span>•</span>
                            <span>{meeting.duration}</span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              {meeting.participants}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className={meeting.type === 'recurring' ? 'border-primary/30 text-primary' : ''}>
                          {meeting.type === 'recurring' ? <Calendar className="mr-1 h-3 w-3" /> : null}
                          {meeting.type}
                        </Badge>
                        <Button variant="outline">Join</Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="files">
            <Card className="card-elevated">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-semibold">Shared Files</CardTitle>
                  <Button variant="outline">
                    <Plus className="mr-2 h-4 w-4" />
                    Upload File
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {documents.map((doc) => (
                    <div key={doc.id} className="flex items-center justify-between rounded-lg border bg-card p-4 hover:bg-muted/30 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                          doc.type === 'spreadsheet' ? 'bg-success/10 text-success' :
                          doc.type === 'pdf' ? 'bg-destructive/10 text-destructive' :
                          'bg-primary/10 text-primary'
                        }`}>
                          {getFileIcon(doc.type)}
                        </div>
                        <div>
                          <p className="font-medium">{doc.name}</p>
                          <p className="text-sm text-muted-foreground">{doc.size} • Modified {doc.modified}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right text-sm">
                          <p className="text-muted-foreground">by {doc.author}</p>
                          <p className="text-muted-foreground">Shared with {doc.shared}</p>
                        </div>
                        <Button variant="outline" size="sm">Open</Button>
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
