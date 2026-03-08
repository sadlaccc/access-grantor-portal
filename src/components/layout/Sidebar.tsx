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
import { ThemeToggle } from '@/components/ThemeToggle';
import intellinksLogo from '@/assets/intellinks-logo.png';

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Headphones, FolderKanban, Monitor, Users, BarChart3, BookOpen,
  UserCog, Handshake, MessageCircle, Package, DollarSign,
};

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const { user, profile, isAdmin, signOut, loading: authLoading } = useAuth();
  const { data: apps = [], isLoading: appsLoading } = useApps();

  const handleSignOut = async () => { await signOut(); };

  const userInitials = profile?.full_name
    ?.split(' ').map((n) => n[0]).join('') || user?.email?.[0]?.toUpperCase() || '?';

  const isLoading = authLoading || appsLoading;

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 h-screen gradient-sidebar border-r border-sidebar-border transition-all duration-300 ease-out',
        collapsed ? 'w-[72px]' : 'w-[260px]'
      )}
    >
      <div className="flex h-full flex-col">
        {/* Logo */}
        <div className="flex h-16 items-center justify-between px-4 border-b border-white/[0.06]">
          {!collapsed && (
            <div className="flex items-center gap-2.5 animate-fade-in">
              <img src={intellinksLogo} alt="Intellinks EA" className="h-8 w-auto" />
            </div>
          )}
          {collapsed && (
            <div className="flex h-9 w-9 items-center justify-center rounded-xl gradient-primary shadow-glow">
              <span className="text-primary-foreground font-bold text-xs">IE</span>
            </div>
          )}
          <div className="flex items-center gap-0.5">
            <ThemeToggle />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setCollapsed(!collapsed)}
              className="h-8 w-8 text-sidebar-muted hover:text-sidebar-foreground hover:bg-white/[0.06] rounded-lg"
            >
              {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-0.5 px-3 py-4 overflow-y-auto scrollbar-thin">
          <NavItem
            to="/"
            icon={LayoutDashboard}
            label="Dashboard"
            active={location.pathname === '/'}
            collapsed={collapsed}
          />

          {!collapsed && (
            <div className="px-3 pb-1 pt-5">
              <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-sidebar-muted">
                Applications
              </span>
            </div>
          )}
          {collapsed && <div className="my-3 mx-2 h-px bg-white/[0.06]" />}

          {isLoading ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="h-4 w-4 animate-spin text-sidebar-muted" />
            </div>
          ) : (
            apps.map((app) => {
              const Icon = iconMap[app.icon] || Monitor;
              return (
                <NavItem
                  key={app.id}
                  to={app.route}
                  icon={Icon}
                  label={app.name}
                  active={location.pathname === app.route}
                  collapsed={collapsed}
                />
              );
            })
          )}

          {isAdmin && (
            <>
              {!collapsed && (
                <div className="px-3 pb-1 pt-5">
                  <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-sidebar-muted">
                    Administration
                  </span>
                </div>
              )}
              {collapsed && <div className="my-3 mx-2 h-px bg-white/[0.06]" />}
              <NavItem
                to="/admin"
                icon={Settings}
                label="User Management"
                active={location.pathname === '/admin'}
                collapsed={collapsed}
              />
            </>
          )}
        </nav>

        {/* User */}
        <div className="border-t border-white/[0.06] p-3">
          <Link
            to="/profile"
            className={cn(
              'flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all duration-200',
              'hover:bg-white/[0.06]',
              location.pathname === '/profile' && 'bg-white/[0.06]',
              collapsed && 'justify-center px-0'
            )}
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary/80 to-accent/80 text-xs font-bold text-white shadow-sm">
              {userInitials}
            </div>
            {!collapsed && (
              <div className="flex-1 overflow-hidden">
                <p className="truncate text-sm font-medium text-sidebar-foreground">
                  {profile?.full_name || user?.email}
                </p>
                <p className="truncate text-xs text-sidebar-muted">
                  {isAdmin ? 'Administrator' : 'Member'}
                </p>
              </div>
            )}
          </Link>
          {!collapsed && (
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start mt-1 text-sidebar-muted hover:text-sidebar-foreground hover:bg-white/[0.06] rounded-lg"
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

function NavItem({
  to, icon: Icon, label, active, collapsed
}: {
  to: string; icon: React.ComponentType<{ className?: string }>; label: string; active: boolean; collapsed: boolean;
}) {
  return (
    <Link
      to={to}
      className={cn(
        'group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200',
        active
          ? 'bg-primary/15 text-primary shadow-sm shadow-primary/10'
          : 'text-sidebar-muted hover:text-sidebar-foreground hover:bg-white/[0.06]',
        collapsed && 'justify-center px-0'
      )}
    >
      <Icon className={cn(
        'h-[18px] w-[18px] shrink-0 transition-colors',
        active ? 'text-primary' : 'text-sidebar-muted group-hover:text-sidebar-foreground'
      )} />
      {!collapsed && <span>{label}</span>}
      {active && !collapsed && (
        <div className="ml-auto h-1.5 w-1.5 rounded-full bg-primary shadow-sm shadow-primary/50" />
      )}
    </Link>
  );
}
