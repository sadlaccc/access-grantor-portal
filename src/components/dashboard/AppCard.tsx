import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Headphones, FolderKanban, Monitor, Users, BarChart3, BookOpen,
  ArrowUpRight, UserCog, Handshake, MessageCircle, Package, DollarSign,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Headphones, FolderKanban, Monitor, Users, BarChart3, BookOpen,
  UserCog, Handshake, MessageCircle, Package, DollarSign,
};

interface AppCardProps {
  app: {
    id: string;
    name: string;
    description: string | null;
    icon: string;
    color: string;
    route: string;
    category: string;
  };
  index: number;
}

export function AppCard({ app, index }: AppCardProps) {
  const Icon = iconMap[app.icon] || Monitor;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: index * 0.06, ease: [0.22, 1, 0.36, 1] }}
    >
      <Link
        to={app.route}
        className="group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-card p-6 card-interactive"
      >
        {/* Hover gradient overlay */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-br from-primary/[0.04] via-transparent to-accent/[0.02] pointer-events-none" />
        
        <div className="relative flex items-start justify-between">
          <div
            className={cn(
              'flex h-12 w-12 items-center justify-center rounded-2xl transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg',
              app.color
            )}
          >
            <Icon className="h-6 w-6 text-primary-foreground" />
          </div>
          <ArrowUpRight className="h-4 w-4 text-muted-foreground/40 transition-all duration-300 group-hover:text-primary group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </div>
        <div className="relative mt-5">
          <h3 className="font-display text-[15px] font-semibold text-card-foreground group-hover:text-primary transition-colors duration-200">
            {app.name}
          </h3>
          <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground line-clamp-2">
            {app.description}
          </p>
        </div>
        
        {/* Bottom accent line */}
        <div className="absolute bottom-0 left-0 h-[2px] w-0 bg-gradient-to-r from-primary to-primary-glow transition-all duration-500 ease-out group-hover:w-full" />
      </Link>
    </motion.div>
  );
}
