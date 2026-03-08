import { Ticket, FolderKanban, Monitor, Users, Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { MainLayout } from '@/components/layout/MainLayout';
import { AppCard } from '@/components/dashboard/AppCard';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { RecentTickets } from '@/components/dashboard/RecentTickets';
import { NotificationsWidget } from '@/components/dashboard/NotificationsWidget';
import { WelcomeGreeting } from '@/components/dashboard/WelcomeGreeting';
import { QuickActionsPanel } from '@/components/dashboard/QuickActionsPanel';
import { useAuth } from '@/contexts/AuthContext';
import { useApps } from '@/hooks/useApps';
import { supabase } from '@/integrations/supabase/client';
import dashboardHero from '@/assets/dashboard-hero.png';

const Index = () => {
  const { profile } = useAuth();
  const { data: apps = [], isLoading } = useApps();

  const { data: ticketCount = 0 } = useQuery({
    queryKey: ['dashboard-ticket-count'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('tickets')
        .select('*', { count: 'exact', head: true })
        .in('status', ['open', 'in-progress']);
      if (error) throw error;
      return count || 0;
    },
  });

  const { data: projectCount = 0 } = useQuery({
    queryKey: ['dashboard-project-count'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('projects')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');
      if (error) throw error;
      return count || 0;
    },
  });

  const { data: assetCount = 0 } = useQuery({
    queryKey: ['dashboard-asset-count'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('it_assets')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'available');
      if (error) throw error;
      return count || 0;
    },
  });

  const { data: userCount = 0 } = useQuery({
    queryKey: ['dashboard-user-count'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });
      if (error) throw error;
      return count || 0;
    },
  });

  const { data: activeProjects = [] } = useQuery({
    queryKey: ['dashboard-active-projects'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('projects')
        .select('id, name, description, progress, status')
        .in('status', ['active', 'planning'])
        .order('created_at', { ascending: false })
        .limit(3);
      if (error) throw error;
      return data || [];
    },
  });

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex h-[50vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="p-8">
        {/* Hero Banner */}
        <div className="mb-8 relative rounded-2xl overflow-hidden animate-fade-in">
          <img src={dashboardHero} alt="" className="w-full h-48 object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-primary/80 to-primary/40 flex items-center px-8">
            <WelcomeGreeting />
          </div>
        </div>

        {/* Stats */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatsCard title="Open Tickets" value={ticketCount} icon={Ticket} />
          <StatsCard title="Active Projects" value={projectCount} icon={FolderKanban} />
          <StatsCard title="Available Assets" value={assetCount} icon={Monitor} />
          <StatsCard title="Team Members" value={userCount} icon={Users} />
        </div>

        {/* Apps Grid */}
        <div className="mb-8">
          <h2 className="mb-4 font-display text-xl font-semibold text-foreground">Your Apps</h2>
          {apps.length === 0 ? (
            <div className="rounded-xl border border-border bg-card p-8 text-center">
              <p className="text-muted-foreground">No apps assigned yet. Contact your administrator.</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {apps.map((app, index) => (
                <AppCard key={app.id} app={app} index={index} />
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions & Recent Activity & Notifications */}
        <div className="mb-6">
          <QuickActionsPanel />
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <RecentTickets />
          </div>
          <div>
            <NotificationsWidget />
          </div>
        </div>

        {/* Active Projects */}
        {activeProjects.length > 0 && (
          <div className="mt-6">
            <div className="rounded-xl border border-border bg-card">
              <div className="border-b border-border px-6 py-4">
                <h3 className="font-display font-semibold text-card-foreground">Active Projects</h3>
              </div>
              <div className="divide-y divide-border">
                {activeProjects.map((project) => (
                  <div key={project.id} className="px-6 py-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-card-foreground">{project.name}</p>
                        <p className="text-sm text-muted-foreground">{project.description || 'No description'}</p>
                      </div>
                      <div className="text-right">
                        <span className="text-2xl font-bold text-primary">{project.progress}%</span>
                      </div>
                    </div>
                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full gradient-primary transition-all duration-500"
                        style={{ width: `${project.progress}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default Index;
