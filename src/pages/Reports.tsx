import { BarChart3, TrendingUp, Users, Ticket } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { StatsCard } from '@/components/dashboard/StatsCard';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from 'recharts';

const ticketData = [
  { month: 'Jan', tickets: 45 },
  { month: 'Feb', tickets: 52 },
  { month: 'Mar', tickets: 38 },
  { month: 'Apr', tickets: 61 },
  { month: 'May', tickets: 55 },
  { month: 'Jun', tickets: 42 },
];

const assetData = [
  { name: 'Laptops', value: 45, color: 'hsl(226, 70%, 45%)' },
  { name: 'Monitors', value: 30, color: 'hsl(199, 89%, 48%)' },
  { name: 'Phones', value: 15, color: 'hsl(142, 76%, 36%)' },
  { name: 'Other', value: 10, color: 'hsl(38, 92%, 50%)' },
];

const projectProgress = [
  { week: 'W1', progress: 15 },
  { week: 'W2', progress: 28 },
  { week: 'W3', progress: 42 },
  { week: 'W4', progress: 55 },
  { week: 'W5', progress: 65 },
  { week: 'W6', progress: 78 },
];

export default function Reports() {
  return (
    <MainLayout>
      <div className="p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold text-foreground">Reports</h1>
          <p className="mt-1 text-muted-foreground">Analytics and insights dashboard</p>
        </div>

        {/* Stats */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            title="Total Tickets"
            value={293}
            icon={Ticket}
            trend={{ value: 12, positive: true }}
          />
          <StatsCard
            title="Resolution Rate"
            value="94%"
            icon={TrendingUp}
            trend={{ value: 3, positive: true }}
          />
          <StatsCard
            title="Active Users"
            value={48}
            icon={Users}
            trend={{ value: 5, positive: true }}
          />
          <StatsCard
            title="Avg. Response Time"
            value="2.4h"
            icon={BarChart3}
            trend={{ value: 8, positive: false }}
          />
        </div>

        {/* Charts */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Tickets Over Time */}
          <div className="rounded-xl border border-border bg-card p-6">
            <h3 className="mb-6 font-display font-semibold text-card-foreground">
              Tickets Over Time
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={ticketData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                />
                <Bar dataKey="tickets" fill="hsl(226, 70%, 45%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Asset Distribution */}
          <div className="rounded-xl border border-border bg-card p-6">
            <h3 className="mb-6 font-display font-semibold text-card-foreground">
              Asset Distribution
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={assetData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {assetData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-4 flex flex-wrap justify-center gap-4">
              {assetData.map((item) => (
                <div key={item.name} className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-sm text-muted-foreground">{item.name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Project Progress */}
          <div className="rounded-xl border border-border bg-card p-6 lg:col-span-2">
            <h3 className="mb-6 font-display font-semibold text-card-foreground">
              Cloud Migration Progress
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={projectProgress}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="week" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="progress"
                  stroke="hsl(199, 89%, 48%)"
                  strokeWidth={3}
                  dot={{ fill: 'hsl(199, 89%, 48%)', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
