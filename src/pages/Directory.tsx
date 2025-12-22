import { useState } from 'react';
import { Search, Mail, Building2 } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { users } from '@/data/mockData';
import { cn } from '@/lib/utils';

export default function Directory() {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.department.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <MainLayout>
      <div className="p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold text-foreground">Directory</h1>
          <p className="mt-1 text-muted-foreground">Employee directory and contact information</p>
        </div>

        {/* Search */}
        <div className="mb-6 relative max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name, email, or department..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Users Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredUsers.map((user, index) => (
            <div
              key={user.id}
              className="group rounded-xl border border-border bg-card p-6 transition-all duration-300 hover:border-primary/30 hover:shadow-lg animate-slide-up"
              style={{ animationDelay: `${index * 30}ms` }}
            >
              <div className="flex flex-col items-center text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full gradient-primary text-xl font-semibold text-primary-foreground">
                  {user.name
                    .split(' ')
                    .map((n) => n[0])
                    .join('')}
                </div>
                <h3 className="mt-4 font-semibold text-card-foreground">{user.name}</h3>
                <Badge
                  variant="outline"
                  className={cn(
                    'mt-2 capitalize',
                    user.status === 'active'
                      ? 'bg-success/10 text-success border-success/20'
                      : 'bg-muted text-muted-foreground'
                  )}
                >
                  {user.status}
                </Badge>

                <div className="mt-4 space-y-2 text-sm">
                  <div className="flex items-center justify-center gap-2 text-muted-foreground">
                    <Mail className="h-4 w-4" />
                    <span className="truncate">{user.email}</span>
                  </div>
                  <div className="flex items-center justify-center gap-2 text-muted-foreground">
                    <Building2 className="h-4 w-4" />
                    <span>{user.department}</span>
                  </div>
                </div>

                <Badge variant="secondary" className="mt-4 capitalize">
                  {user.role}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </div>
    </MainLayout>
  );
}
