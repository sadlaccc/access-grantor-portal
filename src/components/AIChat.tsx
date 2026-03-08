import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import { Bot, Send, X, Loader2, Sparkles, Maximize2, Minimize2, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

const chatVariants = {
  hidden: { opacity: 0, scale: 0.9, y: 20 },
  visible: { 
    opacity: 1, 
    scale: 1, 
    y: 0,
    transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }
  },
  exit: { 
    opacity: 0, 
    scale: 0.9, 
    y: 20,
    transition: { duration: 0.2 }
  }
};

const messageVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.2 } }
};

export function AIChat() {
  const { user, profile } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const { data: messages = [] } = useQuery({
    queryKey: ['ai-chat', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('ai_chat_messages')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true })
        .limit(50);
      if (error) throw error;
      return data as Message[];
    },
    enabled: !!user && isOpen,
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      if (!user) throw new Error('Not authenticated');

      const { error: userMsgError } = await supabase
        .from('ai_chat_messages')
        .insert({ user_id: user.id, role: 'user', content });
      if (userMsgError) throw userMsgError;

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
        body: JSON.stringify({ 
          message: content,
          userName: profile?.full_name || 'User',
        }),
      });

      if (!response.ok) throw new Error('Failed to get AI response');
      const data = await response.json();

      const { error: assistantMsgError } = await supabase
        .from('ai_chat_messages')
        .insert({ user_id: user.id, role: 'assistant', content: data.response });
      if (assistantMsgError) throw assistantMsgError;

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-chat', user?.id] });
      setInput('');
    },
  });

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || sendMessageMutation.isPending) return;
    sendMessageMutation.mutate(input);
  };

  if (!user) return null;

  return (
    <>
      {/* Floating Toggle Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 20 }}
            className="fixed bottom-6 right-6 z-50"
          >
            <Button
              onClick={() => setIsOpen(true)}
              className="h-14 w-14 rounded-2xl gradient-primary shadow-xl hover:shadow-2xl transition-all hover:scale-105"
              size="icon"
            >
              <Sparkles className="h-6 w-6" />
            </Button>
            <span className="absolute -top-1 -right-1 flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-4 w-4 bg-primary"></span>
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            variants={chatVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className={cn(
              'fixed z-50 flex flex-col rounded-3xl border border-border bg-card/95 backdrop-blur-xl shadow-2xl',
              isExpanded
                ? 'bottom-4 left-4 right-4 top-4 md:bottom-6 md:left-auto md:right-6 md:top-6 md:h-[calc(100vh-48px)] md:w-[480px]'
                : 'bottom-6 right-6 h-[560px] w-[400px]'
            )}
          >
            {/* Header */}
            <div className="flex items-center justify-between rounded-t-3xl bg-gradient-to-r from-primary/10 via-accent/5 to-transparent px-5 py-4 border-b border-border/50">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-primary shadow-lg">
                    <Bot className="h-5 w-5 text-primary-foreground" />
                  </div>
                  <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-success border-2 border-card"></span>
                </div>
                <div>
                  <h3 className="font-display font-semibold text-foreground">Intellinks AI</h3>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse"></span>
                    Online • Ready to help
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-lg hover:bg-primary/10"
                  onClick={() => setIsExpanded(!isExpanded)}
                >
                  {isExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-lg hover:bg-destructive/10 hover:text-destructive"
                  onClick={() => setIsOpen(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Messages */}
            <ScrollArea ref={scrollRef} className="flex-1 p-4">
              <div className="space-y-4">
                {messages.length === 0 && (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col items-center justify-center py-12 text-center px-4"
                  >
                    <div className="mb-5 relative">
                      <div className="h-20 w-20 rounded-2xl gradient-primary flex items-center justify-center shadow-xl">
                        <MessageCircle className="h-10 w-10 text-primary-foreground" />
                      </div>
                      <div className="absolute -bottom-1 -right-1 h-8 w-8 rounded-xl bg-success/20 flex items-center justify-center">
                        <Sparkles className="h-4 w-4 text-success" />
                      </div>
                    </div>
                    <h4 className="font-display text-lg font-semibold text-foreground">
                      Hi {profile?.full_name?.split(' ')[0] || 'there'}! 👋
                    </h4>
                    <p className="mt-2 text-sm text-muted-foreground max-w-[280px] leading-relaxed">
                      I'm your AI assistant, ready to help with questions about your work, projects, or anything else.
                    </p>
                    <div className="mt-6 flex flex-wrap justify-center gap-2">
                      {['Help me with a task', 'Summarize my tickets', 'What can you do?'].map((suggestion) => (
                        <button
                          key={suggestion}
                          onClick={() => setInput(suggestion)}
                          className="px-3 py-1.5 text-xs rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
                {messages.map((message, index) => (
                  <motion.div
                    key={message.id}
                    variants={messageVariants}
                    initial="hidden"
                    animate="visible"
                    transition={{ delay: index * 0.05 }}
                    className={cn('flex', message.role === 'user' ? 'justify-end' : 'justify-start')}
                  >
                    <div
                      className={cn(
                        'max-w-[85%] rounded-2xl px-4 py-3 text-sm',
                        message.role === 'user'
                          ? 'gradient-primary text-primary-foreground rounded-br-md'
                          : 'bg-muted text-foreground rounded-bl-md'
                      )}
                    >
                      {message.role === 'assistant' ? (
                        <div className="prose prose-sm prose-neutral dark:prose-invert max-w-none">
                          <ReactMarkdown>{message.content}</ReactMarkdown>
                        </div>
                      ) : (
                        <p className="whitespace-pre-wrap">{message.content}</p>
                      )}
                    </div>
                  </motion.div>
                ))}
                {sendMessageMutation.isPending && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex justify-start"
                  >
                    <div className="flex items-center gap-2 rounded-2xl rounded-bl-md bg-muted px-4 py-3 text-sm text-muted-foreground">
                      <div className="flex gap-1">
                        <span className="h-2 w-2 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: '0ms' }}></span>
                        <span className="h-2 w-2 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: '150ms' }}></span>
                        <span className="h-2 w-2 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: '300ms' }}></span>
                      </div>
                      <span className="text-xs">Thinking...</span>
                    </div>
                  </motion.div>
                )}
              </div>
            </ScrollArea>

            {/* Input */}
            <form onSubmit={handleSubmit} className="border-t border-border/50 p-4 bg-muted/30 rounded-b-3xl">
              <div className="flex gap-3">
                <Input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask me anything..."
                  className="flex-1 rounded-xl border-border/50 bg-background/80 focus:bg-background transition-colors"
                  disabled={sendMessageMutation.isPending}
                />
                <Button
                  type="submit"
                  size="icon"
                  className="h-10 w-10 rounded-xl gradient-primary shadow-md hover:shadow-lg transition-shadow"
                  disabled={!input.trim() || sendMessageMutation.isPending}
                >
                  {sendMessageMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <p className="mt-2 text-[10px] text-center text-muted-foreground">
                Powered by Intellinks AI • Responses may not always be accurate
              </p>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}