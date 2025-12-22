import { useState } from 'react';
import { Search, BookOpen, FileText, Video, Download } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

const categories = [
  { id: 'getting-started', name: 'Getting Started', count: 8 },
  { id: 'troubleshooting', name: 'Troubleshooting', count: 15 },
  { id: 'security', name: 'Security', count: 6 },
  { id: 'policies', name: 'Policies', count: 10 },
];

const articles = [
  {
    id: '1',
    title: 'VPN Setup Guide',
    description: 'How to configure and connect to the company VPN',
    category: 'getting-started',
    type: 'document',
    updated: '2024-01-10',
  },
  {
    id: '2',
    title: 'Password Reset Procedure',
    description: 'Steps to reset your company account password',
    category: 'troubleshooting',
    type: 'document',
    updated: '2024-01-08',
  },
  {
    id: '3',
    title: 'Email Security Best Practices',
    description: 'Guidelines for identifying and avoiding phishing attempts',
    category: 'security',
    type: 'document',
    updated: '2024-01-05',
  },
  {
    id: '4',
    title: 'New Employee Onboarding',
    description: 'Complete guide for setting up your workstation',
    category: 'getting-started',
    type: 'video',
    updated: '2024-01-12',
  },
  {
    id: '5',
    title: 'Remote Work Policy',
    description: 'Guidelines for working from home',
    category: 'policies',
    type: 'document',
    updated: '2024-01-01',
  },
  {
    id: '6',
    title: 'Software Request Process',
    description: 'How to request new software or licenses',
    category: 'policies',
    type: 'document',
    updated: '2023-12-20',
  },
];

const typeIcons = {
  document: FileText,
  video: Video,
  download: Download,
};

export default function Knowledge() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const filteredArticles = articles.filter((article) => {
    const matchesSearch =
      article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory ? article.category === selectedCategory : true;
    return matchesSearch && matchesCategory;
  });

  return (
    <MainLayout>
      <div className="p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold text-foreground">Knowledge Base</h1>
          <p className="mt-1 text-muted-foreground">Documentation, guides, and resources</p>
        </div>

        {/* Search */}
        <div className="mb-6 relative max-w-lg">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search articles..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="grid gap-8 lg:grid-cols-4">
          {/* Categories Sidebar */}
          <div className="lg:col-span-1">
            <h3 className="mb-4 font-semibold text-foreground">Categories</h3>
            <div className="space-y-2">
              <button
                onClick={() => setSelectedCategory(null)}
                className={`flex w-full items-center justify-between rounded-lg px-4 py-2.5 text-sm transition-colors ${
                  selectedCategory === null
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-muted'
                }`}
              >
                <span>All Articles</span>
                <span>{articles.length}</span>
              </button>
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`flex w-full items-center justify-between rounded-lg px-4 py-2.5 text-sm transition-colors ${
                    selectedCategory === category.id
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-muted'
                  }`}
                >
                  <span>{category.name}</span>
                  <span>{category.count}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Articles Grid */}
          <div className="lg:col-span-3">
            <div className="grid gap-4 sm:grid-cols-2">
              {filteredArticles.map((article, index) => {
                const Icon = typeIcons[article.type as keyof typeof typeIcons] || FileText;
                return (
                  <div
                    key={article.id}
                    className="group cursor-pointer rounded-xl border border-border bg-card p-5 transition-all duration-300 hover:border-primary/30 hover:shadow-lg animate-slide-up"
                    style={{ animationDelay: `${index * 30}ms` }}
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                        <Icon className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-card-foreground group-hover:text-primary transition-colors">
                          {article.title}
                        </h4>
                        <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                          {article.description}
                        </p>
                        <div className="mt-3 flex items-center gap-2">
                          <Badge variant="secondary" className="text-xs capitalize">
                            {article.category.replace('-', ' ')}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            Updated {article.updated}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
