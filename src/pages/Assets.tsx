import { Plus, Search, Laptop, Monitor, Smartphone, Tablet, Headphones, Package, Loader2, UserCircle } from 'lucide-react';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface Asset {
  id: string;
  name: string;
  serial_number: string;
  type: string;
  status: string;
  assigned_to: string | null;
  purchase_date: string | null;
  notes: string | null;
  created_at: string;
}

const statusColors: Record<string, string> = {
  available: 'bg-success/10 text-success border-success/20',
  assigned: 'bg-primary/10 text-primary border-primary/20',
  maintenance: 'bg-warning/10 text-warning border-warning/20',
  retired: 'bg-muted text-muted-foreground border-muted',
};

const typeIcons: Record<string, React.ElementType> = {
  laptop: Laptop,
  desktop: Monitor,
  monitor: Monitor,
  phone: Smartphone,
  tablet: Tablet,
  accessory: Headphones,
  software: Package,
};

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] } },
};

export default function Assets() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [name, setName] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  const [type, setType] = useState('laptop');
  const [status, setStatus] = useState('available');
  const [assignedTo, setAssignedTo] = useState<string | null>(null);

  const { data: assets = [], isLoading } = useQuery({
    queryKey: ['it-assets'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('it_assets')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Asset[];
    },
  });

  const { data: profiles = [] } = useQuery({
    queryKey: ['profiles-for-assets'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email');
      if (error) throw error;
      return data;
    },
  });

  const profileMap = profiles.reduce((acc, p) => {
    acc[p.id] = p.full_name || p.email;
    return acc;
  }, {} as Record<string, string>);

  const createAssetMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('it_assets').insert({
        name,
        serial_number: serialNumber || `SN-${Date.now().toString(36).toUpperCase()}`,
        type,
        status,
        assigned_to: assignedTo,
        created_by: user?.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['it-assets'] });
      toast.success('Asset added successfully');
      setIsDialogOpen(false);
      setName('');
      setSerialNumber('');
      setType('laptop');
      setStatus('available');
      setAssignedTo(null);
    },
    onError: (error: Error) => {
      toast.error('Failed to add asset: ' + error.message);
    },
  });

  const filteredAssets = assets.filter(
    (asset) =>
      asset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      asset.serial_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (asset.assigned_to && profileMap[asset.assigned_to]?.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const statusCounts = assets.reduce((acc, asset) => {
    acc[asset.status] = (acc[asset.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex h-[50vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="p-6 lg:p-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-display text-3xl font-bold text-foreground">IT Assets</h1>
            <p className="mt-1 text-muted-foreground">Track and manage your organization's IT inventory</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="gradient" className="gap-2">
                <Plus className="h-4 w-4" />
                Add Asset
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Asset</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Asset Name *</Label>
                  <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="MacBook Pro 16&quot;" />
                </div>
                <div className="space-y-2">
                  <Label>Serial Number</Label>
                  <Input value={serialNumber} onChange={(e) => setSerialNumber(e.target.value)} placeholder="Auto-generated if empty" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Type</Label>
                    <Select value={type} onValueChange={setType}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="laptop">Laptop</SelectItem>
                        <SelectItem value="desktop">Desktop</SelectItem>
                        <SelectItem value="monitor">Monitor</SelectItem>
                        <SelectItem value="phone">Phone</SelectItem>
                        <SelectItem value="tablet">Tablet</SelectItem>
                        <SelectItem value="accessory">Accessory</SelectItem>
                        <SelectItem value="software">Software</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <Select value={status} onValueChange={setStatus}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="available">Available</SelectItem>
                        <SelectItem value="assigned">Assigned</SelectItem>
                        <SelectItem value="maintenance">Maintenance</SelectItem>
                        <SelectItem value="retired">Retired</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Assign To</Label>
                  <Select value={assignedTo || ''} onValueChange={(v) => setAssignedTo(v || null)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a person (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      {profiles.map((profile) => (
                        <SelectItem key={profile.id} value={profile.id}>
                          {profile.full_name || profile.email}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button className="w-full" onClick={() => createAssetMutation.mutate()} disabled={!name || createAssetMutation.isPending}>
                  {createAssetMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Add Asset
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {['available', 'assigned', 'maintenance', 'retired'].map((s) => (
            <motion.div
              key={s}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="rounded-2xl border border-border bg-card p-5 text-center card-interactive"
            >
              <span className="text-3xl font-bold text-card-foreground">{statusCounts[s] || 0}</span>
              <p className="mt-1 text-sm capitalize text-muted-foreground">{s}</p>
            </motion.div>
          ))}
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search by name, serial number, or assignee..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
        </div>

        {/* Assets Grid */}
        {filteredAssets.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            {assets.length === 0 ? 'No assets yet. Add your first asset above.' : 'No assets found matching your search.'}
          </div>
        ) : (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
          >
            {filteredAssets.map((asset) => {
              const Icon = typeIcons[asset.type] || Package;
              return (
                <motion.div
                  key={asset.id}
                  variants={itemVariants}
                  className="group rounded-2xl border border-border bg-card p-5 transition-all duration-300 hover:border-primary/30 hover:shadow-lg"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 transition-colors group-hover:bg-primary/15">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <Badge variant="outline" className={cn('capitalize text-xs', statusColors[asset.status])}>
                      {asset.status}
                    </Badge>
                  </div>
                  <h3 className="mt-4 font-semibold text-card-foreground leading-tight">{asset.name}</h3>
                  <p className="mt-1 text-xs font-mono text-muted-foreground">{asset.serial_number}</p>

                  {/* Assigned To section */}
                  <div className="mt-4 pt-3 border-t border-border">
                    {asset.assigned_to && profileMap[asset.assigned_to] ? (
                      <div className="flex items-center gap-2">
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                          {profileMap[asset.assigned_to].split(' ').map((n) => n[0]).join('').slice(0, 2)}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-card-foreground truncate">{profileMap[asset.assigned_to]}</p>
                          <p className="text-[11px] text-muted-foreground">Assigned</p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <UserCircle className="h-5 w-5" />
                        <span className="text-xs">Unassigned</span>
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </div>
    </MainLayout>
  );
}