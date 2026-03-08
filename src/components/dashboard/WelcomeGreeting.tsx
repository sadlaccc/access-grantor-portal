import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Sun, Moon, CloudSun, Calendar } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return { text: 'Good morning', icon: Sun, period: 'morning' };
  if (hour < 17) return { text: 'Good afternoon', icon: CloudSun, period: 'afternoon' };
  return { text: 'Good evening', icon: Moon, period: 'evening' };
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
  const [greeting] = useState(getGreeting);
  const [motivationalMessage] = useState(() =>
    motivationalMessages[Math.floor(Math.random() * motivationalMessages.length)]
  );

  const firstName = profile?.full_name?.split(' ')[0] || 'there';
  const Icon = greeting.icon;
  const today = new Date();

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="relative overflow-hidden rounded-2xl gradient-primary p-8 text-primary-foreground"
      style={{ boxShadow: '0 8px 32px -8px hsl(199 89% 48% / 0.3)' }}
    >
      {/* Background decorations */}
      <div className="absolute -right-12 -top-12 h-48 w-48 rounded-full bg-white/[0.08] blur-3xl" />
      <div className="absolute -bottom-8 -left-8 h-36 w-36 rounded-full bg-white/[0.04] blur-2xl" />
      <div className="absolute right-20 top-10 h-2 w-2 rounded-full bg-white/30 animate-float" />
      <div className="absolute right-40 bottom-8 h-1.5 w-1.5 rounded-full bg-white/20 animate-float" style={{ animationDelay: '1s' }} />

      <div className="relative flex items-start justify-between">
        <div className="space-y-3">
          <motion.div
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, duration: 0.4 }}
            className="inline-flex items-center gap-2 rounded-full bg-white/[0.12] backdrop-blur-sm px-3 py-1"
          >
            <Icon className="h-3.5 w-3.5" />
            <span className="text-xs font-medium">{greeting.text}</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="font-display text-2xl font-bold sm:text-3xl tracking-tight"
          >
            Welcome back, {firstName}!
            <Sparkles className="inline ml-2 h-5 w-5 animate-float" style={{ animationDelay: '0.5s' }} />
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.8 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="text-sm sm:text-base max-w-md"
          >
            {motivationalMessage}
          </motion.p>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, duration: 0.4 }}
          className="hidden sm:flex flex-col items-center rounded-2xl bg-white/[0.1] backdrop-blur-md p-4 min-w-[72px]"
        >
          <Calendar className="h-4 w-4 mb-1 opacity-60" />
          <p className="text-2xl font-bold leading-none">
            {today.toLocaleDateString('en-US', { day: 'numeric' })}
          </p>
          <p className="text-xs mt-1 opacity-70 font-medium">
            {today.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
          </p>
        </motion.div>
      </div>
    </motion.div>
  );
}
