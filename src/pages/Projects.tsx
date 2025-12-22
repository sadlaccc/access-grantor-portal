import { Plus } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { projects } from '@/data/mockData';
import { cn } from '@/lib/utils';

const statusColors = {
  planning: 'bg-muted text-muted-foreground',
  active: 'bg-accent/10 text-accent',
  'on-hold': 'bg-warning/10 text-warning',
  completed: 'bg-success/10 text-success',
};

export default function Projects() {
  return (
    <MainLayout>
      <div className="p-8">
        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-display text-3xl font-bold text-foreground">Projects</h1>
            <p className="mt-1 text-muted-foreground">Track and manage team projects</p>
          </div>
          <Button variant="gradient" className="gap-2">
            <Plus className="h-4 w-4" />
            New Project
          </Button>
        </div>

        {/* Projects Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project, index) => (
            <div
              key={project.id}
              className="group rounded-xl border border-border bg-card p-6 transition-all duration-300 hover:border-primary/30 hover:shadow-lg animate-slide-up"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="flex items-start justify-between">
                <Badge variant="outline" className={cn('capitalize', statusColors[project.status])}>
                  {project.status}
                </Badge>
                <span className="text-sm text-muted-foreground">{project.id}</span>
              </div>

              <h3 className="mt-4 font-display text-xl font-semibold text-card-foreground">
                {project.name}
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">{project.description}</p>

              {/* Progress */}
              <div className="mt-6">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Progress</span>
                  <span className="font-semibold text-primary">{project.progress}%</span>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full gradient-primary transition-all duration-500"
                    style={{ width: `${project.progress}%` }}
                  />
                </div>
              </div>

              {/* Team */}
              <div className="mt-6 flex items-center justify-between">
                <div className="flex -space-x-2">
                  {project.team.slice(0, 3).map((member) => (
                    <div
                      key={member.id}
                      className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-card bg-primary text-xs font-medium text-primary-foreground"
                      title={member.name}
                    >
                      {member.name
                        .split(' ')
                        .map((n) => n[0])
                        .join('')}
                    </div>
                  ))}
                  {project.team.length > 3 && (
                    <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-card bg-muted text-xs font-medium text-muted-foreground">
                      +{project.team.length - 3}
                    </div>
                  )}
                </div>
                <span className="text-xs text-muted-foreground">
                  {project.startDate.toLocaleDateString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </MainLayout>
  );
}
