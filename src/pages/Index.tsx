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

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatsCard title="Open Tickets" value={ticketCount} icon={Ticket} index={0} />
          <StatsCard title="Active Projects" value={projectCount} icon={FolderKanban} index={1} />
          <StatsCard title="Available Assets" value={assetCount} icon={Monitor} index={2} />
          <StatsCard title="Team Members" value={userCount} icon={Users} index={3} />
        </div>

        {/* Quick Actions */}
        <QuickActionsPanel />

        {/* Apps Grid */}
        <div>
          <motion.h2
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mb-4 font-display text-lg font-semibold text-foreground"
          >
            Your Applications
          </motion.h2>
          {apps.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-card/50 p-12 text-center">
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

        {/* Recent Activity & Notifications */}
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
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.4 }}
            className="rounded-2xl border border-border bg-card card-elevated overflow-hidden"
          >
            <div className="border-b border-border px-6 py-4">
              <h3 className="font-display text-sm font-semibold text-card-foreground">Active Projects</h3>
            </div>
            <div className="divide-y divide-border">
              {activeProjects.map((project) => (
                <div key={project.id} className="px-6 py-5 hover:bg-muted/30 transition-colors">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-card-foreground">{project.name}</p>
                      <p className="text-sm text-muted-foreground mt-0.5">{project.description || 'No description'}</p>
                    </div>
                    <span className="text-2xl font-bold font-display text-gradient">{project.progress}%</span>
                  </div>
                  <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
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
    </MainLayout>
  );
};

export default Index;
