import { useState } from 'react';
import { BarChart3, TrendingUp, Users, Ticket, Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { MainLayout } from '@/components/layout/MainLayout';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { supabase } from '@/integrations/supabase/client';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line,
} from 'recharts';

export default function Reports() {
  const { data: tickets = [] } = useQuery({
    queryKey: ['reports-tickets'],
    queryFn: async () => {
      const { data, error } = await supabase.from('tickets').select('status, priority, created_at');
      if (error) throw error;
      return data;
    },
  });

  const { data: assets = [] } = useQuery({
    queryKey: ['reports-assets'],
    queryFn: async () => {
      const { data, error } = await supabase.from('it_assets').select('type, status');
      if (error) throw error;
      return data;
    },
  });

  const { data: userCount = 0 } = useQuery({
    queryKey: ['reports-user-count'],
    queryFn: async () => {
      const { count, error } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
      if (error) throw error;
      return count || 0;
    },
  });

  const { data: projects = [] } = useQuery({
    queryKey: ['reports-projects'],
    queryFn: async () => {
      const { data, error } = await supabase.from('projects').select('status, progress');
      if (error) throw error;
      return data;
    },
  });

  // Compute ticket stats
  const totalTickets = tickets.length;
  const resolvedTickets = tickets.filter(t => t.status === 'resolved' || t.status === 'closed').length;
  const resolutionRate = totalTickets > 0 ? Math.round((resolvedTickets / totalTickets) * 100) : 0;

  // Tickets by month
  const ticketsByMonth = tickets.reduce((acc, t) => {
    const month = new Date(t.created_at).toLocaleString('default', { month: 'short' });
    acc[month] = (acc[month] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  const ticketData = Object.entries(ticketsByMonth).map(([month, count]) => ({ month, tickets: count }));

  // Asset distribution
  const assetTypes = assets.reduce((acc, a) => {
    const type = a.type || 'Other';
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  const colors = ['hsl(226, 70%, 45%)', 'hsl(199, 89%, 48%)', 'hsl(142, 76%, 36%)', 'hsl(38, 92%, 50%)', 'hsl(0, 72%, 51%)'];
  const assetData = Object.entries(assetTypes).map(([name, value], i) => ({ name: name.charAt(0).toUpperCase() + name.slice(1), value, color: colors[i % colors.length] }));

  // Project progress
  const projectData = projects.map((p, i) => ({ name: `P${i + 1}`, progress: p.progress || 0 }));

  // Priority breakdown
  const priorityCounts = tickets.reduce((acc, t) => {
    acc[t.priority] = (acc[t.priority] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <MainLayout>
      <div className="p-8">
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold text-foreground">Reports</h1>
          <p className="mt-1 text-muted-foreground">Analytics and insights dashboard</p>
        </div>

        {/* Stats */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatsCard title="Total Tickets" value={totalTickets} icon={Ticket} />
          <StatsCard title="Resolution Rate" value={`${resolutionRate}%`} icon={TrendingUp} />
          <StatsCard title="Active Users" value={userCount} icon={Users} />
          <StatsCard title="Total Assets" value={assets.length} icon={BarChart3} />
        </div>

        {/* Charts */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Tickets Over Time */}
          <div className="rounded-xl border border-border bg-card p-6">
            <h3 className="mb-6 font-display font-semibold text-card-foreground">Tickets Over Time</h3>
            {ticketData.length === 0 ? (
              <div className="flex h-[300px] items-center justify-center text-muted-foreground">No ticket data yet</div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={ticketData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                  <Bar dataKey="tickets" fill="hsl(226, 70%, 45%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Asset Distribution */}
          <div className="rounded-xl border border-border bg-card p-6">
            <h3 className="mb-6 font-display font-semibold text-card-foreground">Asset Distribution</h3>
            {assetData.length === 0 ? (
              <div className="flex h-[300px] items-center justify-center text-muted-foreground">No asset data yet</div>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie data={assetData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value">
                      {assetData.map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.color} />))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="mt-4 flex flex-wrap justify-center gap-4">
                  {assetData.map((item) => (
                    <div key={item.name} className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-sm text-muted-foreground">{item.name} ({item.value})</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Project Progress */}
          <div className="rounded-xl border border-border bg-card p-6 lg:col-span-2">
            <h3 className="mb-6 font-display font-semibold text-card-foreground">Project Progress</h3>
            {projectData.length === 0 ? (
              <div className="flex h-[300px] items-center justify-center text-muted-foreground">No project data yet</div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={projectData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                  <Line type="monotone" dataKey="progress" stroke="hsl(199, 89%, 48%)" strokeWidth={3} dot={{ fill: 'hsl(199, 89%, 48%)', strokeWidth: 2 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Priority Breakdown */}
          <div className="rounded-xl border border-border bg-card p-6 lg:col-span-2">
            <h3 className="mb-6 font-display font-semibold text-card-foreground">Ticket Priority Breakdown</h3>
            <div className="grid grid-cols-4 gap-4">
              {['low', 'medium', 'high', 'critical'].map((p) => (
                <div key={p} className="text-center rounded-lg border border-border p-4">
                  <p className="text-2xl font-bold text-foreground">{priorityCounts[p] || 0}</p>
                  <p className="text-sm capitalize text-muted-foreground">{p}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
