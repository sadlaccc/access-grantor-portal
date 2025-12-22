export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user';
  department: string;
  avatar?: string;
  assignedApps: string[];
  status: 'active' | 'inactive';
}

export interface App {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  route: string;
  category: 'operations' | 'management' | 'tools' | 'analytics';
}

export interface Ticket {
  id: string;
  title: string;
  description: string;
  status: 'open' | 'in-progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'critical';
  assignee?: User;
  createdBy: User;
  createdAt: Date;
  updatedAt: Date;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  status: 'planning' | 'active' | 'on-hold' | 'completed';
  progress: number;
  startDate: Date;
  endDate?: Date;
  team: User[];
}

export interface Asset {
  id: string;
  name: string;
  type: 'laptop' | 'desktop' | 'monitor' | 'phone' | 'tablet' | 'accessory' | 'software';
  status: 'available' | 'assigned' | 'maintenance' | 'retired';
  assignedTo?: User;
  purchaseDate: Date;
  serialNumber: string;
}
