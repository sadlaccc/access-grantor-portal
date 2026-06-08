import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Headphones, FolderKanban, Monitor, Users, BarChart3,
  BookOpen, Settings, ChevronRight, LogOut, UserCog, Handshake,
  MessageCircle, Package, DollarSign, Loader2,
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

const navItemVariants = {
  hidden: { opacity: 0, x: -8 },
  show: { opacity: 1, x: 0 },
};

interface SidebarProps {
  onNavigate?: () => void;
}

export function Sidebar({ onNavigate }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const { user, profile, isAdmin, signOut, loading: authLoading } = useAuth();
  const { data: apps = [], isLoading: appsLoading } = useApps();

  const handleSignOut = async () => { await signOut(); };

  const userInitials = profile?.full_name
    ?.split(' ').map((n) => n[0]).join('') || user?.email?.[0]?.toUpperCase() || '?';

  const isLoading = authLoading || appsLoading;

  const handleNavClick = () => {
    onNavigate?.();
  };

  return (
    <aside
      className={cn(
        'h-screen gradient-sidebar border-r border-sidebar-border transition-all duration-300 ease-out',
        onNavigate ? 'w-full relative' : 'fixed left-0 top-0 z-40',
        !onNavigate && (collapsed ? 'w-[72px]' : 'w-[260px]')
      )}
    >
      <div className="flex h-full flex-col">
        {/* Logo */}
        <div className="flex h-16 items-center justify-between px-4 border-b border-white/[0.06]">
          <AnimatePresence mode="wait">
            {!collapsed || onNavigate ? (
              <motion.div key="full-logo" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-2.5">
                <img src={intellinksLogo} alt="Intellinks EA" className="h-8 w-auto" />
              </motion.div>
            ) : (
              <motion.div key="mini-logo" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.8, opacity: 0 }} className="flex h-9 w-9 items-center justify-center rounded-xl gradient-primary shadow-glow">
                <span className="text-primary-foreground font-bold text-xs">IE</span>
              </motion.div>
            )}
          </AnimatePresence>
          <div className="flex items-center gap-0.5">
            <ThemeToggle />
            {!onNavigate && (
              <Button variant="ghost" size="icon" onClick={() => setCollapsed(!collapsed)} className="h-8 w-8 text-sidebar-muted hover:text-sidebar-foreground hover:bg-white/[0.06] rounded-lg">
                <motion.div animate={{ rotate: collapsed ? 0 : 180 }} transition={{ duration: 0.2 }}>
                  <ChevronRight className="h-4 w-4" />
                </motion.div>
              </Button>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-0.5 px-3 py-4 overflow-y-auto scrollbar-thin">
          <NavItem to="/" icon={LayoutDashboard} label="Dashboard" active={location.pathname === '/'} collapsed={collapsed && !onNavigate} onClick={handleNavClick} />

          <AnimatePresence>
            {(!collapsed || onNavigate) && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="px-3 pb-1 pt-5">
                <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-sidebar-muted">Applications</span>
              </motion.div>
            )}
          </AnimatePresence>
          {collapsed && !onNavigate && <div className="my-3 mx-2 h-px bg-white/[0.06]" />}

          {isLoading ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="h-4 w-4 animate-spin text-sidebar-muted" />
            </div>
          ) : (
            <motion.div initial="hidden" animate="show" variants={{ show: { transition: { staggerChildren: 0.03 } } }}>
              {apps.map((app) => {
                const Icon = iconMap[app.icon] || Monitor;
                return (
                  <motion.div key={app.id} variants={navItemVariants}>
                    <NavItem to={app.route} icon={Icon} label={app.name} active={location.pathname === app.route} collapsed={collapsed && !onNavigate} onClick={handleNavClick} />
                  </motion.div>
                );
              })}
            </motion.div>
          )}

          {isAdmin && (
            <>
              <AnimatePresence>
                {(!collapsed || onNavigate) && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="px-3 pb-1 pt-5">
                    <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-sidebar-muted">Administration</span>
                  </motion.div>
                )}
              </AnimatePresence>
              {collapsed && !onNavigate && <div className="my-3 mx-2 h-px bg-white/[0.06]" />}
              <NavItem to="/admin" icon={Settings} label="User Management" active={location.pathname === '/admin'} collapsed={collapsed && !onNavigate} onClick={handleNavClick} />
            </>
          )}

          <AnimatePresence>
            {(!collapsed || onNavigate) && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="px-3 pb-1 pt-5">
                <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-sidebar-muted">Preferences</span>
              </motion.div>
            )}
          </AnimatePresence>
          {collapsed && !onNavigate && <div className="my-3 mx-2 h-px bg-white/[0.06]" />}
          <NavItem to="/settings" icon={Settings} label="App Settings" active={location.pathname === '/settings'} collapsed={collapsed && !onNavigate} onClick={handleNavClick} />
        </nav>

        {/* User */}
        <div className="border-t border-white/[0.06] p-3">
          <Link to="/profile" onClick={handleNavClick} className={cn('flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all duration-200 group', 'hover:bg-white/[0.06]', location.pathname === '/profile' && 'bg-white/[0.08]', collapsed && !onNavigate && 'justify-center px-0')}>
            <div className="relative">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary/80 to-accent/80 text-xs font-bold text-white shadow-sm group-hover:shadow-md transition-shadow">
                {userInitials}
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-success border-2 border-sidebar-background"></span>
            </div>
            <AnimatePresence>
              {(!collapsed || onNavigate) && (
                <motion.div initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: 'auto' }} exit={{ opacity: 0, width: 0 }} className="flex-1 overflow-hidden">
                  <p className="truncate text-sm font-medium text-sidebar-foreground">{profile?.full_name || user?.email}</p>
                  <p className="truncate text-xs text-sidebar-muted">{isAdmin ? 'Administrator' : 'Member'}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </Link>
          <AnimatePresence>
            {(!collapsed || onNavigate) && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                <Button variant="ghost" size="sm" className="w-full justify-start mt-1 text-sidebar-muted hover:text-sidebar-foreground hover:bg-white/[0.06] rounded-lg" onClick={handleSignOut}>
                  <LogOut className="h-4 w-4 mr-2" />Sign Out
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </aside>
  );
}

function NavItem({
  to, icon: Icon, label, active, collapsed, onClick
}: {
  to: string; icon: React.ComponentType<{ className?: string }>; label: string; active: boolean; collapsed: boolean; onClick?: () => void;
}) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className={cn(
        'group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200',
        active ? 'bg-primary/15 text-primary' : 'text-sidebar-muted hover:text-sidebar-foreground hover:bg-white/[0.06]',
        collapsed && 'justify-center px-0'
      )}
    >
      {active && (
        <motion.div layoutId="activeIndicator" className="absolute inset-0 rounded-xl bg-primary/15" transition={{ type: 'spring', stiffness: 380, damping: 30 }} />
      )}
      <Icon className={cn('h-[18px] w-[18px] shrink-0 transition-all duration-200 relative z-10', active ? 'text-primary' : 'text-sidebar-muted group-hover:text-sidebar-foreground')} />
      <AnimatePresence>
        {!collapsed && (
          <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="relative z-10">{label}</motion.span>
        )}
      </AnimatePresence>
      {active && !collapsed && (
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="ml-auto h-1.5 w-1.5 rounded-full bg-primary shadow-sm shadow-primary/50 relative z-10" />
      )}
    </Link>
  );
}
