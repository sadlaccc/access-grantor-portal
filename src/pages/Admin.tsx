import { useState } from 'react';
import { Search, UserPlus, Check, X, Edit2 } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { users, apps } from '@/data/mockData';
import { User } from '@/types';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export default function Admin() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userApps, setUserApps] = useState<string[]>([]);

  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleEditApps = (user: User) => {
    setSelectedUser(user);
    setUserApps([...user.assignedApps]);
  };

  const handleToggleApp = (appId: string) => {
    setUserApps((prev) =>
      prev.includes(appId) ? prev.filter((id) => id !== appId) : [...prev, appId]
    );
  };

  const handleSaveApps = () => {
    if (selectedUser) {
      toast.success(`Updated app access for ${selectedUser.name}`);
      setSelectedUser(null);
    }
  };

  return (
    <MainLayout>
      <div className="p-8">
        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-display text-3xl font-bold text-foreground">User Management</h1>
            <p className="mt-1 text-muted-foreground">
              Manage users and their app assignments
            </p>
          </div>
          <Button variant="gradient" className="gap-2">
            <UserPlus className="h-4 w-4" />
            Add User
          </Button>
        </div>

        {/* Search */}
        <div className="mb-6 relative max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Users Table */}
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  User
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Department
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Role
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Assigned Apps
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Status
                </th>
                <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredUsers.map((user) => (
                <tr
                  key={user.id}
                  className="transition-colors hover:bg-muted/50"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full gradient-primary text-sm font-medium text-primary-foreground">
                        {user.name
                          .split(' ')
                          .map((n) => n[0])
                          .join('')}
                      </div>
                      <div>
                        <p className="font-medium text-card-foreground">{user.name}</p>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-card-foreground">{user.department}</span>
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant="secondary" className="capitalize">
                      {user.role}
                    </Badge>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1">
                      {user.assignedApps.slice(0, 3).map((appId) => {
                        const app = apps.find((a) => a.id === appId);
                        return (
                          <Badge key={appId} variant="outline" className="text-xs">
                            {app?.name}
                          </Badge>
                        );
                      })}
                      {user.assignedApps.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{user.assignedApps.length - 3}
                        </Badge>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <Badge
                      variant="outline"
                      className={cn(
                        'capitalize',
                        user.status === 'active'
                          ? 'bg-success/10 text-success border-success/20'
                          : 'bg-muted text-muted-foreground'
                      )}
                    >
                      {user.status}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditApps(user)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                          <DialogTitle className="font-display">
                            Edit App Access for {user.name}
                          </DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          {apps.map((app) => (
                            <div
                              key={app.id}
                              className="flex items-center justify-between rounded-lg border border-border p-4"
                            >
                              <div className="flex items-center gap-3">
                                <Checkbox
                                  id={app.id}
                                  checked={userApps.includes(app.id)}
                                  onCheckedChange={() => handleToggleApp(app.id)}
                                />
                                <div>
                                  <label
                                    htmlFor={app.id}
                                    className="font-medium text-foreground cursor-pointer"
                                  >
                                    {app.name}
                                  </label>
                                  <p className="text-sm text-muted-foreground">
                                    {app.description}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                        <div className="flex justify-end gap-2">
                          <DialogTrigger asChild>
                            <Button variant="outline">Cancel</Button>
                          </DialogTrigger>
                          <DialogTrigger asChild>
                            <Button variant="gradient" onClick={handleSaveApps}>
                              Save Changes
                            </Button>
                          </DialogTrigger>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </MainLayout>
  );
}
