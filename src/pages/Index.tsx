import { Ticket, FolderKanban, Monitor, Users } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { AppCard } from '@/components/dashboard/AppCard';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { RecentTickets } from '@/components/dashboard/RecentTickets';
import { apps, currentUser, tickets, projects, assets } from '@/data/mockData';

const Index = () => {
  const userApps = apps.filter((app) => currentUser.assignedApps.includes(app.id));
  const openTickets = tickets.filter((t) => t.status === 'open' || t.status === 'in-progress').length;
  const activeProjects = projects.filter((p) => p.status === 'active').length;
  const availableAssets = assets.filter((a) => a.status === 'available').length;

  return (
    <MainLayout>
      <div className="p-8">
        {/* Header */}
        <div className="mb-8 animate-fade-in">
          <h1 className="font-display text-3xl font-bold text-foreground">
            Welcome back, {currentUser.name.split(' ')[0]}
          </h1>
          <p className="mt-1 text-muted-foreground">
            Here's what's happening across your workspace today.
          </p>
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
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {userApps.map((app, index) => (
              <AppCard key={app.id} app={app} index={index} />
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="grid gap-6 lg:grid-cols-2">
          <RecentTickets />
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
