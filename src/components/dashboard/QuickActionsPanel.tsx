import { Plus, FileText, BarChart3, Users, FolderPlus, Bell, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { toast } from 'sonner';

interface QuickAction {
  id: string;
  label: string;
  icon: React.ElementType;
  action: () => void;
  color: string;
}

export function QuickActionsPanel() {
  const navigate = useNavigate();
  const { permission, requestPermission, isSupported } = usePushNotifications();

  const handleEnableNotifications = async () => {
    if (!isSupported) {
      toast.error('Push notifications are not supported in this browser');
      return;
    }

    if (permission === 'granted') {
      toast.info('Push notifications are already enabled');
      return;
    }

    if (permission === 'denied') {
      toast.error('Push notifications were blocked. Please enable them in your browser settings.');
      return;
    }

    const granted = await requestPermission();
    if (granted) {
      toast.success('Push notifications enabled! You\'ll now receive alerts for new tickets.');
    } else {
      toast.error('Push notification permission was denied');
    }
  };

  const quickActions: QuickAction[] = [
    {
      id: 'new-ticket',
      label: 'New Ticket',
      icon: Plus,
      action: () => navigate('/helpdesk'),
      color: 'bg-primary/10 text-primary hover:bg-primary/20',
    },
    {
      id: 'view-reports',
      label: 'View Reports',
      icon: BarChart3,
      action: () => navigate('/reports'),
      color: 'bg-accent/10 text-accent hover:bg-accent/20',
    },
    {
      id: 'browse-directory',
      label: 'Directory',
      icon: Users,
      action: () => navigate('/directory'),
      color: 'bg-success/10 text-success hover:bg-success/20',
    },
    {
      id: 'new-project',
      label: 'New Project',
      icon: FolderPlus,
      action: () => navigate('/projects'),
      color: 'bg-warning/10 text-warning hover:bg-warning/20',
    },
    {
      id: 'knowledge-base',
      label: 'Knowledge',
      icon: FileText,
      action: () => navigate('/knowledge'),
      color: 'bg-secondary/80 text-secondary-foreground hover:bg-secondary',
    },
    {
      id: 'notifications',
      label: permission === 'granted' ? 'Notifications On' : 'Enable Alerts',
      icon: Bell,
      action: handleEnableNotifications,
      color: permission === 'granted' 
        ? 'bg-success/10 text-success hover:bg-success/20'
        : 'bg-muted text-muted-foreground hover:bg-muted/80',
    },
  ];

  return (
    <div className="rounded-xl border border-border bg-card">
      <div className="flex items-center justify-between border-b border-border px-6 py-4">
        <div className="flex items-center gap-2">
          <Settings className="h-5 w-5 text-primary" />
          <h3 className="font-display font-semibold text-card-foreground">Quick Actions</h3>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-3">
        {quickActions.map((action) => {
          const Icon = action.icon;
          return (
            <Button
              key={action.id}
              variant="ghost"
              className={`flex h-auto flex-col items-center gap-2 rounded-lg p-4 transition-all ${action.color}`}
              onClick={action.action}
            >
              <Icon className="h-5 w-5" />
              <span className="text-xs font-medium">{action.label}</span>
            </Button>
          );
        })}
      </div>
    </div>
  );
}
