import { useState } from 'react';
import { format } from 'date-fns';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DatePicker } from '@/components/ui/date-picker';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Wallet, Plus, Loader2, Trash2, Building2, User as UserIcon } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { notifyAllUsers, logAuditAction } from '@/hooks/useNotifications';

interface Profile { id: string; full_name: string | null; email: string; }
interface Payment {
  id: string; payment_number: string; payee_type: 'employee' | 'supplier';
  payee_user_id: string | null; payee_name: string; supplier_contact: string | null;
  amount: number; currency: string; method: string; reference: string | null;
  payment_date: string; category: string | null; notes: string | null; status: string;
  created_at: string;
}

export function PaymentsSection() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [payeeType, setPayeeType] = useState<'employee' | 'supplier'>('employee');
  const [employeeId, setEmployeeId] = useState('');
  const [supplierName, setSupplierName] = useState('');
  const [supplierContact, setSupplierContact] = useState('');
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('bank_transfer');
  const [reference, setReference] = useState('');
  const [category, setCategory] = useState('');
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [notes, setNotes] = useState('');

  const { data: profiles = [] } = useQuery({
    queryKey: ['payment-profiles'],
    queryFn: async () => {
      const { data, error } = await supabase.from('profiles').select('id, full_name, email').order('full_name');
      if (error) throw error;
      return data as Profile[];
    },
  });

  const { data: payments = [], isLoading } = useQuery({
    queryKey: ['payments'],
    queryFn: async () => {
      const { data, error } = await supabase.from('payments').select('*').order('payment_date', { ascending: false });
      if (error) throw error;
      return data as Payment[];
    },
  });

  const reset = () => {
    setPayeeType('employee'); setEmployeeId(''); setSupplierName(''); setSupplierContact('');
    setAmount(''); setMethod('bank_transfer'); setReference(''); setCategory('');
    setDate(new Date()); setNotes('');
  };

  const createMutation = useMutation({
    mutationFn: async () => {
      const paymentNumber = `PAY-${Date.now().toString(36).toUpperCase()}`;
      const isEmp = payeeType === 'employee';
      const emp = isEmp ? profiles.find((p) => p.id === employeeId) : null;
      const payee_name = isEmp ? (emp?.full_name || emp?.email || 'Employee') : supplierName;
      if (!amount || (isEmp && !employeeId) || (!isEmp && !supplierName)) {
        throw new Error('Please fill in all required fields');
      }
      const { error } = await supabase.from('payments').insert({
        payment_number: paymentNumber, payee_type: payeeType,
        payee_user_id: isEmp ? employeeId : null,
        payee_name, supplier_contact: !isEmp ? (supplierContact || null) : null,
        amount: parseFloat(amount), method, reference: reference || null,
        payment_date: date ? format(date, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
        category: category || null, notes: notes || null, status: 'completed',
        created_by: user?.id,
      });
      if (error) throw error;
      await notifyAllUsers({
        title: 'Payment Recorded',
        message: `${paymentNumber} · ${payee_name} · KES ${parseFloat(amount).toLocaleString()}`,
        type: 'create', app: 'finance', excludeUserId: user?.id,
      });
      await logAuditAction({ userId: user?.id!, action: 'create', tableName: 'payments', recordSummary: `Payment ${paymentNumber} to ${payee_name}` });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      toast.success('Payment recorded');
      setOpen(false);
      reset();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (p: Payment) => {
      const { error } = await supabase.from('payments').delete().eq('id', p.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      toast.success('Payment deleted');
    },
  });

  const totalPaid = payments.reduce((s, p) => s + Number(p.amount), 0);
  const empPaid = payments.filter((p) => p.payee_type === 'employee').reduce((s, p) => s + Number(p.amount), 0);
  const supPaid = payments.filter((p) => p.payee_type === 'supplier').reduce((s, p) => s + Number(p.amount), 0);

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2"><Wallet className="h-5 w-5 text-primary" />Payments</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">Record payments to employees and suppliers</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button variant="gradient" className="gap-2"><Plus className="h-4 w-4" />Record Payment</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader><DialogTitle>Record Payment</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <Tabs value={payeeType} onValueChange={(v) => setPayeeType(v as 'employee' | 'supplier')}>
                  <TabsList className="grid grid-cols-2 w-full">
                    <TabsTrigger value="employee" className="gap-2"><UserIcon className="h-4 w-4" />Employee</TabsTrigger>
                    <TabsTrigger value="supplier" className="gap-2"><Building2 className="h-4 w-4" />Supplier</TabsTrigger>
                  </TabsList>
                </Tabs>
                {payeeType === 'employee' ? (
                  <div className="space-y-2">
                    <Label>Employee *</Label>
                    <Select value={employeeId} onValueChange={setEmployeeId}>
                      <SelectTrigger><SelectValue placeholder="Select employee" /></SelectTrigger>
                      <SelectContent>
                        {profiles.map((p) => (
                          <SelectItem key={p.id} value={p.id}>{p.full_name || p.email}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2"><Label>Supplier Name *</Label>
                      <Input value={supplierName} onChange={(e) => setSupplierName(e.target.value)} placeholder="Acme Ltd." /></div>
                    <div className="space-y-2"><Label>Contact</Label>
                      <Input value={supplierContact} onChange={(e) => setSupplierContact(e.target.value)} placeholder="Email or phone" /></div>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2"><Label>Amount (KES) *</Label>
                    <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} /></div>
                  <div className="space-y-2"><Label>Payment Date</Label>
                    <DatePicker date={date} onDateChange={setDate} placeholder="Date" /></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2"><Label>Method</Label>
                    <Select value={method} onValueChange={setMethod}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                        <SelectItem value="mpesa">M-Pesa</SelectItem>
                        <SelectItem value="cash">Cash</SelectItem>
                        <SelectItem value="cheque">Cheque</SelectItem>
                        <SelectItem value="card">Card</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2"><Label>Category</Label>
                    <Select value={category} onValueChange={setCategory}>
                      <SelectTrigger><SelectValue placeholder="Optional" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="salary">Salary</SelectItem>
                        <SelectItem value="bonus">Bonus</SelectItem>
                        <SelectItem value="reimbursement">Reimbursement</SelectItem>
                        <SelectItem value="supplier_invoice">Supplier Invoice</SelectItem>
                        <SelectItem value="services">Services</SelectItem>
                        <SelectItem value="goods">Goods</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2"><Label>Reference</Label>
                  <Input value={reference} onChange={(e) => setReference(e.target.value)} placeholder="Transaction ref / invoice #" /></div>
                <div className="space-y-2"><Label>Notes</Label>
                  <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} /></div>
                <Button variant="gradient" className="w-full" onClick={() => createMutation.mutate()} disabled={createMutation.isPending}>
                  {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Record Payment
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="rounded-xl border p-3"><p className="text-xs text-muted-foreground">Total Paid</p><p className="text-lg font-bold">KES {totalPaid.toLocaleString()}</p></div>
          <div className="rounded-xl border p-3"><p className="text-xs text-muted-foreground">To Employees</p><p className="text-lg font-bold">KES {empPaid.toLocaleString()}</p></div>
          <div className="rounded-xl border p-3"><p className="text-xs text-muted-foreground">To Suppliers</p><p className="text-lg font-bold">KES {supPaid.toLocaleString()}</p></div>
        </div>
        {isLoading ? (
          <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
        ) : payments.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Wallet className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p>No payments recorded yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader><TableRow>
                <TableHead>Ref #</TableHead><TableHead>Payee</TableHead><TableHead>Type</TableHead>
                <TableHead>Method</TableHead><TableHead>Date</TableHead>
                <TableHead className="text-right">Amount</TableHead><TableHead>Actions</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {payments.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.payment_number}</TableCell>
                    <TableCell>{p.payee_name}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={p.payee_type === 'employee' ? 'bg-primary/10 text-primary border-primary/30' : 'bg-accent/10'}>
                        {p.payee_type === 'employee' ? <UserIcon className="h-3 w-3 mr-1" /> : <Building2 className="h-3 w-3 mr-1" />}
                        {p.payee_type}
                      </Badge>
                    </TableCell>
                    <TableCell className="capitalize text-sm">{p.method.replace('_', ' ')}</TableCell>
                    <TableCell className="text-sm">{p.payment_date}</TableCell>
                    <TableCell className="text-right font-semibold">KES {Number(p.amount).toLocaleString()}</TableCell>
                    <TableCell>
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive"
                        onClick={() => deleteMutation.mutate(p)}><Trash2 className="h-4 w-4" /></Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
