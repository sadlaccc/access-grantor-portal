import { motion } from 'framer-motion';
import { Plus, FileText, BarChart3, Users, FolderPlus, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface QuickAction {
  id: string;
  label: string;
  icon: React.ElementType;
  action: () => void;
  color: string;
  iconColor: string;
}

export function QuickActionsPanel() {
  const navigate = useNavigate();
  const { permission, requestPermission, isSupported } = usePushNotifications();

  const handleEnableNotifications = async () => {
    if (!isSupported) { toast.error('Push notifications not supported'); return; }
    if (permission === 'granted') { toast.info('Already enabled'); return; }
    if (permission === 'denied') { toast.error('Blocked in browser settings'); return; }
    const granted = await requestPermission();
    granted ? toast.success('Notifications enabled!') : toast.error('Permission denied');
  };

  const quickActions: QuickAction[] = [
    { id: 'new-ticket', label: 'New Ticket', icon: Plus, action: () => navigate('/helpdesk'), color: 'bg-primary/8 hover:bg-primary/14', iconColor: 'text-primary' },
    { id: 'view-reports', label: 'Reports', icon: BarChart3, action: () => navigate('/reports'), color: 'bg-accent/8 hover:bg-accent/14', iconColor: 'text-accent' },
    { id: 'browse-directory', label: 'Directory', icon: Users, action: () => navigate('/directory'), color: 'bg-success/8 hover:bg-success/14', iconColor: 'text-success' },
    { id: 'new-project', label: 'New Project', icon: FolderPlus, action: () => navigate('/projects'), color: 'bg-warning/8 hover:bg-warning/14', iconColor: 'text-warning' },
    { id: 'knowledge-base', label: 'Knowledge', icon: FileText, action: () => navigate('/knowledge'), color: 'bg-muted hover:bg-muted/80', iconColor: 'text-muted-foreground' },
    {
      id: 'notifications',
      label: permission === 'granted' ? 'Alerts On' : 'Enable Alerts',
      icon: Bell,
      action: handleEnableNotifications,
      color: permission === 'granted' ? 'bg-success/8 hover:bg-success/14' : 'bg-muted hover:bg-muted/80',
      iconColor: permission === 'granted' ? 'text-success' : 'text-muted-foreground',
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2 }}
      className="rounded-2xl border border-border bg-card card-elevated overflow-hidden"
    >
      <div className="flex items-center gap-2.5 px-6 py-4 border-b border-border">
        <div className="h-2 w-2 rounded-full bg-primary animate-float" />
        <h3 className="font-display text-sm font-semibold text-card-foreground">Quick Actions</h3>
      </div>
      <div className="grid grid-cols-2 gap-2 p-3 sm:grid-cols-3">
        {quickActions.map((action, i) => {
          const Icon = action.icon;
          return (
            <motion.div
              key={action.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 + i * 0.04, duration: 0.3 }}
            >
              <Button
                variant="ghost"
                className={cn(
                  'flex h-auto min-h-[84px] w-full flex-col items-center justify-center gap-2 rounded-xl px-2 py-3 transition-all duration-200',
                  action.color
                )}
                onClick={action.action}
              >
                <Icon className={cn('h-5 w-5 shrink-0', action.iconColor)} />
                <span className="text-xs font-medium text-card-foreground text-center leading-tight break-words whitespace-normal max-w-full">
                  {action.label}
                </span>
              </Button>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
