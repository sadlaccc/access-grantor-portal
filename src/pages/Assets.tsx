import { Plus, Search, Laptop, Monitor, Smartphone, Tablet, Headphones, Package } from 'lucide-react';
import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { assets } from '@/data/mockData';
import { cn } from '@/lib/utils';

const statusColors = {
  available: 'bg-success/10 text-success border-success/20',
  assigned: 'bg-accent/10 text-accent border-accent/20',
  maintenance: 'bg-warning/10 text-warning border-warning/20',
  retired: 'bg-muted text-muted-foreground border-muted',
};

const typeIcons = {
  laptop: Laptop,
  desktop: Monitor,
  monitor: Monitor,
  phone: Smartphone,
  tablet: Tablet,
  accessory: Headphones,
  software: Package,
};

export default function Assets() {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredAssets = assets.filter(
    (asset) =>
      asset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      asset.serialNumber.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <MainLayout>
      <div className="p-8">
        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-display text-3xl font-bold text-foreground">Assets</h1>
            <p className="mt-1 text-muted-foreground">IT asset inventory management</p>
          </div>
          <Button variant="gradient" className="gap-2">
            <Plus className="h-4 w-4" />
            Add Asset
          </Button>
        </div>

        {/* Stats */}
        <div className="mb-6 grid gap-4 sm:grid-cols-4">
          {Object.entries(
            assets.reduce((acc, asset) => {
              acc[asset.status] = (acc[asset.status] || 0) + 1;
              return acc;
            }, {} as Record<string, number>)
          ).map(([status, count]) => (
            <div
              key={status}
              className="rounded-xl border border-border bg-card p-4 text-center"
            >
              <span className="text-2xl font-bold text-card-foreground">{count}</span>
              <p className="mt-1 text-sm capitalize text-muted-foreground">{status}</p>
            </div>
          ))}
        </div>

        {/* Search */}
        <div className="mb-6 relative max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name or serial number..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Assets Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredAssets.map((asset, index) => {
            const Icon = typeIcons[asset.type] || Package;
            return (
              <div
                key={asset.id}
                className="group rounded-xl border border-border bg-card p-5 transition-all duration-300 hover:border-primary/30 hover:shadow-lg animate-slide-up"
                style={{ animationDelay: `${index * 30}ms` }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <Badge variant="outline" className={cn('capitalize', statusColors[asset.status])}>
                    {asset.status}
                  </Badge>
                </div>

                <h3 className="mt-4 font-semibold text-card-foreground">{asset.name}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{asset.serialNumber}</p>

                {asset.assignedTo && (
                  <div className="mt-4 flex items-center gap-2">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground">
                      {asset.assignedTo.name
                        .split(' ')
                        .map((n) => n[0])
                        .join('')}
                    </div>
                    <span className="text-sm text-muted-foreground">{asset.assignedTo.name}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </MainLayout>
  );
}
