import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Headphones,
  FolderKanban,
  Monitor,
  Users,
  BarChart3,
  BookOpen,
  Settings,
  Shield,
  ChevronLeft,
  ChevronRight,
  LogOut,
  UserCog,
  Handshake,
  MessageCircle,
  Package,
  DollarSign,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useApps } from '@/hooks/useApps';

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Headphones,
  FolderKanban,
  Monitor,
  Users,
  BarChart3,
  BookOpen,
  UserCog,
  Handshake,
  MessageCircle,
  Package,
  DollarSign,
};

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const { user, profile, isAdmin, signOut, loading: authLoading } = useAuth();
  const { data: apps = [], isLoading: appsLoading } = useApps();

  const handleSignOut = async () => {
    await signOut();
  };

  const userInitials = profile?.full_name
    ?.split(' ')
    .map((n) => n[0])
    .join('') || user?.email?.[0]?.toUpperCase() || '?';

  const isLoading = authLoading || appsLoading;

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 h-screen gradient-sidebar border-r border-sidebar-border transition-all duration-300',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      <div className="flex h-full flex-col">
        {/* Logo */}
        <div className="flex h-16 items-center justify-between border-b border-sidebar-border px-4">
          {!collapsed && (
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg gradient-primary">
                <Shield className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="font-display font-bold text-sidebar-foreground">Intellinks</span>
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCollapsed(!collapsed)}
            className="text-sidebar-foreground hover:bg-sidebar-accent"
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 p-3 overflow-y-auto">
          <Link
            to="/"
            className={cn(
              'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200',
              location.pathname === '/'
                ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                : 'text-sidebar-foreground hover:bg-sidebar-accent'
            )}
          >
            <LayoutDashboard className="h-5 w-5 shrink-0" />
            {!collapsed && <span>Dashboard</span>}
          </Link>

          {!collapsed && (
            <div className="px-3 py-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Apps
              </span>
            </div>
          )}

          {isLoading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : (
            apps.map((app) => {
              const Icon = iconMap[app.icon] || Monitor;
              return (
                <Link
                  key={app.id}
                  to={app.route}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200',
                    location.pathname === app.route
                      ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                      : 'text-sidebar-foreground hover:bg-sidebar-accent'
                  )}
                >
                  <Icon className="h-5 w-5 shrink-0" />
                  {!collapsed && <span>{app.name}</span>}
                </Link>
              );
            })
          )}

          {isAdmin && (
            <>
              {!collapsed && (
                <div className="px-3 py-2 pt-4">
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Admin
                  </span>
                </div>
              )}
              <Link
                to="/admin"
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200',
                  location.pathname === '/admin'
                    ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                    : 'text-sidebar-foreground hover:bg-sidebar-accent'
                )}
              >
                <Settings className="h-5 w-5 shrink-0" />
                {!collapsed && <span>User Management</span>}
              </Link>
            </>
          )}
        </nav>

        {/* User */}
        <div className="border-t border-sidebar-border p-3">
          <Link
            to="/profile"
            className={cn(
              'flex items-center gap-3 rounded-lg px-3 py-2 transition-all duration-200 hover:bg-sidebar-accent',
              location.pathname === '/profile' && 'bg-sidebar-accent',
              collapsed && 'justify-center'
            )}
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-sidebar-accent text-sm font-semibold text-sidebar-foreground">
              {userInitials}
            </div>
            {!collapsed && (
              <div className="flex-1 overflow-hidden">
                <p className="truncate text-sm font-medium text-sidebar-foreground">
                  {profile?.full_name || user?.email}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {isAdmin ? 'Admin' : 'User'}
                </p>
              </div>
            )}
          </Link>
          {!collapsed && (
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start mt-1 text-sidebar-foreground hover:bg-sidebar-accent"
              onClick={handleSignOut}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          )}
        </div>
      </div>
    </aside>
  );
}
