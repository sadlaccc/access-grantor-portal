import { Ticket, FolderKanban, Monitor, Users, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
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
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Loading dashboard...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="p-6 lg:p-8 max-w-[1400px] space-y-6">
        {/* Welcome */}
        <WelcomeGreeting />

        {/* Bento Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 auto-rows-[minmax(140px,auto)] gap-4">
          {/* Stats — small tiles */}
          <div className="lg:col-span-1"><StatsCard title="Open Tickets" value={ticketCount} icon={Ticket} index={0} /></div>
          <div className="lg:col-span-1"><StatsCard title="Active Projects" value={projectCount} icon={FolderKanban} index={1} /></div>
          <div className="lg:col-span-1"><StatsCard title="Available Assets" value={assetCount} icon={Monitor} index={2} /></div>
          <div className="lg:col-span-1"><StatsCard title="Team Members" value={userCount} icon={Users} index={3} /></div>

          {/* Quick Actions — wide */}
          <div className="sm:col-span-2 lg:col-span-2 lg:row-span-2 h-full">
            <QuickActionsPanel />
          </div>

          {/* Notifications — tall */}
          <div className="sm:col-span-2 lg:col-span-2 lg:row-span-2 h-full">
            <NotificationsWidget />
          </div>

          {/* Recent tickets — wide */}
          <div className="sm:col-span-2 lg:col-span-2 lg:row-span-2 h-full">
            <RecentTickets />
          </div>

          {/* Active Projects — tall accent */}
          {activeProjects.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.4 }}
              className="sm:col-span-2 lg:col-span-2 lg:row-span-2 rounded-2xl border border-border bg-gradient-to-br from-card to-secondary/40 card-elevated overflow-hidden"
            >
              <div className="border-b border-border px-6 py-4 flex items-center justify-between">
                <h3 className="font-display text-sm font-semibold tracking-wide uppercase text-card-foreground">Active Projects</h3>
                <span className="text-xs text-muted-foreground">{activeProjects.length} live</span>
              </div>
              <div className="divide-y divide-border">
                {activeProjects.map((project) => (
                  <div key={project.id} className="px-6 py-4 hover:bg-muted/30 transition-colors">
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-medium text-card-foreground truncate">{project.name}</p>
                        <p className="text-xs text-muted-foreground mt-0.5 truncate">{project.description || 'No description'}</p>
                      </div>
                      <span className="text-xl font-bold font-display text-gradient shrink-0">{project.progress}%</span>
                    </div>
                    <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-muted">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${project.progress}%` }}
                        transition={{ duration: 1, delay: 0.6, ease: [0.22, 1, 0.36, 1] }}
                        className="h-full rounded-full gradient-primary"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </div>

        {/* Apps — bento sub-grid with varied tile sizes */}
        <div>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mb-4 flex items-end justify-between"
          >
            <div>
              <h2 className="font-display text-2xl font-bold tracking-tight text-foreground">Your Applications</h2>
              <p className="text-sm text-muted-foreground mt-1">Jump into any module</p>
            </div>
            <span className="text-xs font-medium text-accent uppercase tracking-wider">{apps.length} apps</span>
          </motion.div>
          {apps.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-card/50 p-12 text-center">
              <p className="text-muted-foreground">No apps assigned yet. Contact your administrator.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {apps.map((app, index) => (
                <div
                  key={app.id}
                  className={
                    index === 0
                      ? 'sm:col-span-2 lg:col-span-2 lg:row-span-2'
                      : index === 3
                      ? 'lg:col-span-2'
                      : ''
                  }
                >
                  <AppCard app={app} index={index} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
};

export default Index;
