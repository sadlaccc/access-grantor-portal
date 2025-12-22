import { useState } from 'react';
import { Search, Mail, Building2, Phone, Lock } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';

interface Profile {
  id: string;
  full_name: string | null;
  email: string;
  phone: string | null;
  department: string | null;
  job_title: string | null;
  avatar_url: string | null;
  show_email: boolean | null;
  show_phone: boolean | null;
  show_department: boolean | null;
  show_job_title: boolean | null;
}

export default function Directory() {
  const [searchQuery, setSearchQuery] = useState('');
  const { user } = useAuth();

  const { data: profiles = [], isLoading } = useQuery({
    queryKey: ['directory-profiles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email, phone, department, job_title, avatar_url, show_email, show_phone, show_department, show_job_title');
      
      if (error) throw error;
      return data as Profile[];
    },
  });

  // Filter profiles and respect privacy settings for non-own profiles
  const getDisplayData = (profile: Profile) => {
    const isOwnProfile = profile.id === user?.id;
    return {
      ...profile,
      email: isOwnProfile || profile.show_email ? profile.email : null,
      phone: isOwnProfile || profile.show_phone ? profile.phone : null,
      department: isOwnProfile || profile.show_department ? profile.department : null,
      job_title: isOwnProfile || profile.show_job_title ? profile.job_title : null,
    };
  };

  const filteredProfiles = profiles
    .map(getDisplayData)
    .filter(
      (profile) =>
        (profile.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false) ||
        (profile.email?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false) ||
        (profile.department?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false)
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
        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="rounded-xl border border-border bg-card p-6">
                <div className="flex flex-col items-center">
                  <Skeleton className="h-16 w-16 rounded-full" />
                  <Skeleton className="mt-4 h-5 w-24" />
                  <Skeleton className="mt-2 h-4 w-16" />
                  <Skeleton className="mt-4 h-4 w-32" />
                  <Skeleton className="mt-2 h-4 w-28" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredProfiles.map((profile, index) => (
              <div
                key={profile.id}
                className="group rounded-xl border border-border bg-card p-6 transition-all duration-300 hover:border-primary/30 hover:shadow-lg animate-slide-up"
                style={{ animationDelay: `${index * 30}ms` }}
              >
                <div className="flex flex-col items-center text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full gradient-primary text-xl font-semibold text-primary-foreground">
                    {profile.full_name
                      ?.split(' ')
                      .map((n) => n[0])
                      .join('') || '?'}
                  </div>
                  <h3 className="mt-4 font-semibold text-card-foreground">
                    {profile.full_name || 'Unknown'}
                  </h3>

                  <div className="mt-4 space-y-2 text-sm w-full">
                    {profile.email ? (
                      <div className="flex items-center justify-center gap-2 text-muted-foreground">
                        <Mail className="h-4 w-4 flex-shrink-0" />
                        <span className="truncate">{profile.email}</span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center gap-2 text-muted-foreground/50">
                        <Lock className="h-4 w-4" />
                        <span className="italic">Email hidden</span>
                      </div>
                    )}
                    
                    {profile.phone ? (
                      <div className="flex items-center justify-center gap-2 text-muted-foreground">
                        <Phone className="h-4 w-4 flex-shrink-0" />
                        <span>{profile.phone}</span>
                      </div>
                    ) : profile.id !== user?.id && (
                      <div className="flex items-center justify-center gap-2 text-muted-foreground/50">
                        <Lock className="h-4 w-4" />
                        <span className="italic">Phone hidden</span>
                      </div>
                    )}
                    
                    {profile.department ? (
                      <div className="flex items-center justify-center gap-2 text-muted-foreground">
                        <Building2 className="h-4 w-4 flex-shrink-0" />
                        <span>{profile.department}</span>
                      </div>
                    ) : profile.id !== user?.id && (
                      <div className="flex items-center justify-center gap-2 text-muted-foreground/50">
                        <Lock className="h-4 w-4" />
                        <span className="italic">Department hidden</span>
                      </div>
                    )}
                  </div>

                  {profile.job_title ? (
                    <Badge variant="secondary" className="mt-4 capitalize">
                      {profile.job_title}
                    </Badge>
                  ) : profile.id !== user?.id && (
                    <Badge variant="outline" className="mt-4 text-muted-foreground/50">
                      <Lock className="h-3 w-3 mr-1" />
                      Hidden
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {!isLoading && filteredProfiles.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            No employees found matching your search.
          </div>
        )}
      </div>
    </MainLayout>
  );
}