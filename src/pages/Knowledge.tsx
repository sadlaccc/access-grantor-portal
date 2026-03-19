import { useState } from 'react';
import { Search, BookOpen, FileText, Video, Download, Plus, Loader2, Trash2 } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MainLayout } from '@/components/layout/MainLayout';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { notifyAllUsers, logAuditAction } from '@/hooks/useNotifications';

interface Article {
  id: string; title: string; description: string | null; content: string | null;
  category: string; type: string; created_at: string; updated_at: string;
}

const categories = [
  { id: 'getting-started', name: 'Getting Started' },
  { id: 'troubleshooting', name: 'Troubleshooting' },
  { id: 'security', name: 'Security' },
  { id: 'policies', name: 'Policies' },
  { id: 'general', name: 'General' },
];

const typeIcons: Record<string, React.ElementType> = { document: FileText, video: Video, download: Download };

export default function Knowledge() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('general');
  const [type, setType] = useState('document');

  const { data: articles = [], isLoading } = useQuery({
    queryKey: ['knowledge-articles'],
    queryFn: async () => {
      const { data, error } = await supabase.from('knowledge_articles').select('*').order('updated_at', { ascending: false });
      if (error) throw error;
      return data as Article[];
    },
  });

  const createArticleMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('knowledge_articles').insert({
        title, description: description || null, content: content || null, category, type, created_by: user?.id,
      });
      if (error) throw error;
      await notifyAllUsers({ title: 'New Knowledge Article', message: title, type: 'create', app: 'knowledge', excludeUserId: user?.id });
      await logAuditAction({ userId: user?.id!, action: 'create', tableName: 'knowledge_articles', recordSummary: title });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['knowledge-articles'] });
      toast.success('Article created successfully');
      setIsDialogOpen(false);
      setTitle(''); setDescription(''); setContent(''); setCategory('general'); setType('document');
    },
    onError: (error: Error) => toast.error('Failed to create article: ' + error.message),
  });

  const deleteArticleMutation = useMutation({
    mutationFn: async (article: Article) => {
      const { error } = await supabase.from('knowledge_articles').delete().eq('id', article.id);
      if (error) throw error;
      await logAuditAction({ userId: user?.id!, action: 'delete', tableName: 'knowledge_articles', recordId: article.id, recordSummary: article.title });
      await notifyAllUsers({ title: 'Article Deleted', message: article.title, type: 'delete', app: 'knowledge', excludeUserId: user?.id });
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['knowledge-articles'] }); toast.success('Article deleted'); },
  });

  const categoryCounts = articles.reduce((acc, a) => { acc[a.category] = (acc[a.category] || 0) + 1; return acc; }, {} as Record<string, number>);

  const filteredArticles = articles.filter((article) => {
    const matchesSearch = article.title.toLowerCase().includes(searchQuery.toLowerCase()) || (article.description?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);
    const matchesCategory = selectedCategory ? article.category === selectedCategory : true;
    return matchesSearch && matchesCategory;
  });

  if (isLoading) {
    return (<MainLayout><div className="flex h-[50vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div></MainLayout>);
  }

  return (
    <MainLayout>
      <div className="p-8">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div><h1 className="font-display text-3xl font-bold text-foreground">Knowledge Base</h1><p className="mt-1 text-muted-foreground">Documentation, guides, and resources</p></div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild><Button variant="gradient" className="gap-2"><Plus className="h-4 w-4" />New Article</Button></DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader><DialogTitle>Create New Article</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2"><Label>Title *</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Article title" /></div>
                <div className="space-y-2"><Label>Description</Label><Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Brief description" /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>Category</Label>
                    <Select value={category} onValueChange={setCategory}><SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{categories.map((c) => (<SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>))}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2"><Label>Type</Label>
                    <Select value={type} onValueChange={setType}><SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent><SelectItem value="document">Document</SelectItem><SelectItem value="video">Video</SelectItem><SelectItem value="download">Download</SelectItem></SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2"><Label>Content</Label><Textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="Article content..." rows={6} /></div>
                <Button className="w-full" onClick={() => createArticleMutation.mutate()} disabled={!title || createArticleMutation.isPending}>
                  {createArticleMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Create Article
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="mb-6 relative max-w-lg">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search articles..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
        </div>

        <div className="grid gap-8 lg:grid-cols-4">
          <div className="lg:col-span-1">
            <h3 className="mb-4 font-semibold text-foreground">Categories</h3>
            <div className="space-y-2">
              <button onClick={() => setSelectedCategory(null)} className={`flex w-full items-center justify-between rounded-lg px-4 py-2.5 text-sm transition-colors ${selectedCategory === null ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'}`}>
                <span>All Articles</span><span>{articles.length}</span>
              </button>
              {categories.map((cat) => (
                <button key={cat.id} onClick={() => setSelectedCategory(cat.id)} className={`flex w-full items-center justify-between rounded-lg px-4 py-2.5 text-sm transition-colors ${selectedCategory === cat.id ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'}`}>
                  <span>{cat.name}</span><span>{categoryCounts[cat.id] || 0}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="lg:col-span-3">
            {filteredArticles.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">{articles.length === 0 ? 'No articles yet. Create your first article.' : 'No articles found matching your search.'}</div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {filteredArticles.map((article, index) => {
                  const Icon = typeIcons[article.type] || FileText;
                  return (
                    <div key={article.id} className="group cursor-pointer rounded-xl border border-border bg-card p-5 transition-all duration-300 hover:border-primary/30 hover:shadow-lg animate-slide-up relative" style={{ animationDelay: `${index * 30}ms` }}>
                      <Button size="icon" variant="ghost" className="absolute top-3 right-3 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive"
                        onClick={(e) => { e.stopPropagation(); deleteArticleMutation.mutate(article); }}><Trash2 className="h-3.5 w-3.5" /></Button>
                      <div className="flex items-start gap-4">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10"><Icon className="h-5 w-5 text-primary" /></div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-card-foreground group-hover:text-primary transition-colors">{article.title}</h4>
                          <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{article.description || 'No description'}</p>
                          <div className="mt-3 flex items-center gap-2">
                            <Badge variant="secondary" className="text-xs capitalize">{article.category.replace('-', ' ')}</Badge>
                            <span className="text-xs text-muted-foreground">Updated {new Date(article.updated_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
