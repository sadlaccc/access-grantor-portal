import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface App {
  id: string;
  name: string;
  description: string | null;
  icon: string;
  color: string;
  route: string;
  category: string;
}

export function useApps() {
  const { user, isAdmin } = useAuth();

  return useQuery({
    queryKey: ['apps', user?.id, isAdmin],
    queryFn: async (): Promise<App[]> => {
      if (!user) return [];

      // Admin gets all apps
      if (isAdmin) {
        const { data, error } = await supabase
          .from('apps')
          .select('*')
          .order('name');

        if (error) throw error;
        return data || [];
      }

      // Regular users get assigned apps only
      const { data, error } = await supabase
        .from('user_app_assignments')
        .select(`
          app_id,
          apps (*)
        `)
        .eq('user_id', user.id);

      if (error) throw error;
      
      return data?.map(d => d.apps).filter(Boolean) as App[] || [];
    },
    enabled: !!user,
  });
}
