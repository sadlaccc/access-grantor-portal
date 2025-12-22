import { Link } from 'react-router-dom';
import {
  Headphones,
  FolderKanban,
  Monitor,
  Users,
  BarChart3,
  BookOpen,
  ArrowRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { App } from '@/types';

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Headphones,
  FolderKanban,
  Monitor,
  Users,
  BarChart3,
  BookOpen,
};

interface AppCardProps {
  app: App;
  index: number;
}

export function AppCard({ app, index }: AppCardProps) {
  const Icon = iconMap[app.icon] || Monitor;

  return (
    <Link
      to={app.route}
      className="group relative overflow-hidden rounded-xl border border-border bg-card p-6 transition-all duration-300 hover:border-primary/30 hover:shadow-lg hover:-translate-y-1"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <div className="flex items-start justify-between">
        <div
          className={cn(
            'flex h-12 w-12 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110',
            app.color
          )}
        >
          <Icon className="h-6 w-6 text-primary-foreground" />
        </div>
        <ArrowRight className="h-5 w-5 text-muted-foreground opacity-0 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-1" />
      </div>
      <div className="mt-4">
        <h3 className="font-display font-semibold text-card-foreground">{app.name}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{app.description}</p>
      </div>
      <div className="absolute bottom-0 left-0 h-1 w-0 bg-gradient-to-r from-primary to-accent transition-all duration-300 group-hover:w-full" />
    </Link>
  );
}
