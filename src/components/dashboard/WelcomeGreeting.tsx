import { useEffect, useState } from 'react';
import { Sparkles, Sun, Moon, CloudSun } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) {
    return { text: 'Good morning', icon: Sun, period: 'morning' };
  } else if (hour < 17) {
    return { text: 'Good afternoon', icon: CloudSun, period: 'afternoon' };
  } else {
    return { text: 'Good evening', icon: Moon, period: 'evening' };
  }
};

const motivationalMessages = [
  "Ready to make an impact today!",
  "Let's accomplish great things together.",
  "Your productivity journey starts here.",
  "Great things happen one task at a time.",
  "You're doing amazing work!",
  "Another day to create something awesome.",
];

export function WelcomeGreeting() {
  const { profile } = useAuth();
  const [isVisible, setIsVisible] = useState(false);
  const [greeting] = useState(getGreeting);
  const [motivationalMessage] = useState(() => 
    motivationalMessages[Math.floor(Math.random() * motivationalMessages.length)]
  );

  const firstName = profile?.full_name?.split(' ')[0] || 'there';
  const Icon = greeting.icon;

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-2xl gradient-primary p-6 text-primary-foreground shadow-lg transition-all duration-700',
        isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
      )}
    >
      {/* Background decoration */}
      <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
      <div className="absolute -bottom-4 -left-4 h-24 w-24 rounded-full bg-white/5 blur-xl" />
      
      <div className="relative flex items-start justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Icon className="h-5 w-5" />
            <span className="text-sm font-medium opacity-90">{greeting.text}</span>
          </div>
          <h1 className="font-display text-2xl font-bold sm:text-3xl">
            Welcome back, {firstName}! <Sparkles className="inline h-6 w-6" />
          </h1>
          <p className="text-sm opacity-80 sm:text-base">
            {motivationalMessage}
          </p>
        </div>
        
        <div className="hidden rounded-xl bg-white/10 p-3 backdrop-blur-sm sm:block">
          <div className="text-center">
            <p className="text-xs font-medium opacity-80">Today</p>
            <p className="text-2xl font-bold">
              {new Date().toLocaleDateString('en-US', { day: 'numeric' })}
            </p>
            <p className="text-xs opacity-80">
              {new Date().toLocaleDateString('en-US', { month: 'short' })}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
