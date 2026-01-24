import { Ticket, FolderKanban, Monitor, Users, Loader2 } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { AppCard } from '@/components/dashboard/AppCard';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { RecentTickets } from '@/components/dashboard/RecentTickets';
import { NotificationsWidget } from '@/components/dashboard/NotificationsWidget';
import { WelcomeGreeting } from '@/components/dashboard/WelcomeGreeting';
import { useAuth } from '@/contexts/AuthContext';
import { useApps } from '@/hooks/useApps';
import { tickets, projects, assets } from '@/data/mockData';

const Index = () => {
  const { profile } = useAuth();
  const { data: apps = [], isLoading } = useApps();
  
  const openTickets = tickets.filter((t) => t.status === 'open' || t.status === 'in-progress').length;
  const activeProjects = projects.filter((p) => p.status === 'active').length;
  const availableAssets = assets.filter((a) => a.status === 'available').length;

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
        {/* Welcome Greeting */}
        <div className="mb-8 animate-fade-in">
          <WelcomeGreeting />
        </div>

        {/* Stats */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            title="Open Tickets"
            value={openTickets}
            icon={Ticket}
            trend={{ value: 12, positive: false }}
          />
          <StatsCard
            title="Active Projects"
            value={activeProjects}
            icon={FolderKanban}
            trend={{ value: 8, positive: true }}
          />
          <StatsCard
            title="Available Assets"
            value={availableAssets}
            icon={Monitor}
          />
          <StatsCard
            title="Team Members"
            value={5}
            icon={Users}
            trend={{ value: 2, positive: true }}
          />
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
        <div className="mt-6">
          <div className="rounded-xl border border-border bg-card">
            <div className="border-b border-border px-6 py-4">
              <h3 className="font-display font-semibold text-card-foreground">Active Projects</h3>
            </div>
            <div className="divide-y divide-border">
              {projects
                .filter((p) => p.status === 'active' || p.status === 'planning')
                .slice(0, 3)
                .map((project) => (
                  <div key={project.id} className="px-6 py-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-card-foreground">{project.name}</p>
                        <p className="text-sm text-muted-foreground">{project.description}</p>
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
      </div>
    </MainLayout>
  );
};

export default Index;
