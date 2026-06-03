import { useAuth } from '@/contexts/AuthContext';

/**
 * Department-based access helpers. Departments are matched case-insensitively
 * against the user's `profile.department` field. Admins always pass.
 */
export function useDepartment() {
  const { profile, isAdmin } = useAuth();
  const dept = (profile?.department || '').toLowerCase().trim();

  const has = (...names: string[]) =>
    isAdmin || names.some((n) => dept.includes(n.toLowerCase()));

  return {
    department: profile?.department || null,
    isAdmin,
    isFinance: has('finance', 'accounting'),
    isSales: has('sales', 'crm', 'business development'),
    isIT: has('it', 'tech', 'engineering', 'support'),
    isOps: has('ops', 'operation', 'warehouse', 'logistics', 'supply'),
    isHR: has('hr', 'human resources', 'people'),
    canAct: has,
  };
}
