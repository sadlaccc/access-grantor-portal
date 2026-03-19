import { useState } from 'react';
import { format } from 'date-fns';
import { DatePicker } from '@/components/ui/date-picker';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  DollarSign, Plus, Search, FileText, Receipt, PiggyBank, 
  TrendingUp, TrendingDown, Loader2, Download, Send, FileDown, Trash2
} from 'lucide-react';
import { generateInvoicePdf, generateExpenseReportPdf } from '@/lib/generateInvoicePdf';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { FileUpload } from '@/components/FileUpload';
import { notifyAllUsers, logAuditAction } from '@/hooks/useNotifications';

interface Invoice {
  id: string;
  invoice_number: string;
  client_name: string;
  client_email: string | null;
  status: string;
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  total_amount: number;
  due_date: string;
  created_at: string;
}

interface Expense {
  id: string;
  expense_number: string;
  description: string | null;
  category: string;
  amount: number;
  expense_date: string | null;
  vendor: string | null;
  receipt_url: string | null;
  status: string;
}

interface Budget {
  id: string;
  name: string;
  department: string | null;
  allocated_amount: number;
  spent_amount: number;
  start_date: string;
  end_date: string;
}

const Finance = () => {
  const { user, isAdmin } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [isInvoiceDialogOpen, setIsInvoiceDialogOpen] = useState(false);
  const [isExpenseDialogOpen, setIsExpenseDialogOpen] = useState(false);
  const [isBudgetDialogOpen, setIsBudgetDialogOpen] = useState(false);

  const [invoiceClient, setInvoiceClient] = useState('');
  const [invoiceEmail, setInvoiceEmail] = useState('');
  const [invoiceDueDate, setInvoiceDueDate] = useState<Date | undefined>();
  const [invoiceItems, setInvoiceItems] = useState<{ description: string; quantity: number; price: number }[]>([
    { description: '', quantity: 1, price: 0 }
  ]);

  const [expenseDescription, setExpenseDescription] = useState('');
  const [expenseCategory, setExpenseCategory] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseVendor, setExpenseVendor] = useState('');
  const [expenseDate, setExpenseDate] = useState<Date | undefined>(new Date());
  const [expenseReceipt, setExpenseReceipt] = useState('');

  const [budgetName, setBudgetName] = useState('');
  const [budgetCategory, setBudgetCategory] = useState('');
  const [budgetAmount, setBudgetAmount] = useState('');
  const [budgetStart, setBudgetStart] = useState<Date | undefined>();
  const [budgetEnd, setBudgetEnd] = useState<Date | undefined>();

  const { data: invoices = [], isLoading: invoicesLoading } = useQuery({
    queryKey: ['invoices'],
    queryFn: async () => {
      const { data, error } = await supabase.from('invoices').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data as Invoice[];
    },
  });

  const { data: expenses = [], isLoading: expensesLoading } = useQuery({
    queryKey: ['expenses'],
    queryFn: async () => {
      const { data, error } = await supabase.from('expenses').select('*').order('expense_date', { ascending: false });
      if (error) throw error;
      return data as Expense[];
    },
  });

  const { data: budgets = [], isLoading: budgetsLoading } = useQuery({
    queryKey: ['budgets'],
    queryFn: async () => {
      const { data, error } = await supabase.from('budgets').select('*').order('start_date', { ascending: false });
      if (error) throw error;
      return data as Budget[];
    },
  });

  const createInvoiceMutation = useMutation({
    mutationFn: async () => {
      const invoiceNumber = `INV-${Date.now().toString(36).toUpperCase()}`;
      const subtotal = invoiceItems.reduce((sum, item) => sum + item.quantity * item.price, 0);
      const taxRate = 16;
      const taxAmount = subtotal * (taxRate / 100);
      const totalAmount = subtotal + taxAmount;

      const { data: invoice, error: invoiceError } = await supabase
        .from('invoices')
        .insert({
          invoice_number: invoiceNumber, client_name: invoiceClient, client_email: invoiceEmail || null,
          status: 'draft', subtotal, tax_rate: taxRate, tax_amount: taxAmount, total_amount: totalAmount,
          due_date: invoiceDueDate ? format(invoiceDueDate, 'yyyy-MM-dd') : null, created_by: user?.id,
        })
        .select().single();

      if (invoiceError) throw invoiceError;

      const items = invoiceItems.filter(i => i.description).map(item => ({
        invoice_id: invoice.id, description: item.description, quantity: item.quantity,
        unit_price: item.price, total: item.quantity * item.price,
      }));

      if (items.length > 0) {
        const { error: itemsError } = await supabase.from('invoice_items').insert(items);
        if (itemsError) throw itemsError;
      }

      await notifyAllUsers({ title: 'New Invoice Created', message: `Invoice ${invoiceNumber} for ${invoiceClient} - KES ${totalAmount.toLocaleString()}`, type: 'create', app: 'finance', entity_id: invoice.id, excludeUserId: user?.id });
      await logAuditAction({ userId: user?.id!, action: 'create', tableName: 'invoices', recordId: invoice.id, recordSummary: `Invoice ${invoiceNumber} - ${invoiceClient}` });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      toast({ title: 'Invoice created successfully' });
      setIsInvoiceDialogOpen(false);
      resetInvoiceForm();
    },
    onError: (error: Error) => toast({ title: 'Failed to create invoice', description: error.message, variant: 'destructive' }),
  });

  const createExpenseMutation = useMutation({
    mutationFn: async () => {
      const expenseNumber = `EXP-${Date.now().toString(36).toUpperCase()}`;
      const { error } = await supabase.from('expenses').insert({
        expense_number: expenseNumber, description: expenseDescription, category: expenseCategory,
        amount: parseFloat(expenseAmount), expense_date: expenseDate ? format(expenseDate, 'yyyy-MM-dd') : null,
        vendor: expenseVendor || null, receipt_url: expenseReceipt || null, status: 'pending', created_by: user?.id,
      });
      if (error) throw error;
      await notifyAllUsers({ title: 'New Expense Recorded', message: `${expenseDescription} - KES ${parseFloat(expenseAmount).toLocaleString()}`, type: 'create', app: 'finance', excludeUserId: user?.id });
      await logAuditAction({ userId: user?.id!, action: 'create', tableName: 'expenses', recordSummary: `Expense ${expenseNumber}` });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      toast({ title: 'Expense recorded successfully' });
      setIsExpenseDialogOpen(false);
      resetExpenseForm();
    },
    onError: (error: Error) => toast({ title: 'Failed to record expense', description: error.message, variant: 'destructive' }),
  });

  const createBudgetMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('budgets').insert({
        name: budgetName, department: budgetCategory, allocated_amount: parseFloat(budgetAmount),
        spent_amount: 0, start_date: budgetStart ? format(budgetStart, 'yyyy-MM-dd') : null,
        end_date: budgetEnd ? format(budgetEnd, 'yyyy-MM-dd') : null, created_by: user?.id,
      });
      if (error) throw error;
      await notifyAllUsers({ title: 'New Budget Created', message: `${budgetName} - KES ${parseFloat(budgetAmount).toLocaleString()}`, type: 'create', app: 'finance', excludeUserId: user?.id });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      toast({ title: 'Budget created successfully' });
      setIsBudgetDialogOpen(false);
      resetBudgetForm();
    },
    onError: (error: Error) => toast({ title: 'Failed to create budget', description: error.message, variant: 'destructive' }),
  });

  const updateInvoiceStatusMutation = useMutation({
    mutationFn: async ({ invoiceId, status }: { invoiceId: string; status: string }) => {
      const { error } = await supabase.from('invoices').update({ status }).eq('id', invoiceId);
      if (error) throw error;
      const inv = invoices.find(i => i.id === invoiceId);
      await notifyAllUsers({ title: 'Invoice Status Updated', message: `${inv?.invoice_number} marked as ${status}`, type: 'update', app: 'finance', entity_id: invoiceId, excludeUserId: user?.id });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      toast({ title: 'Invoice status updated' });
    },
  });

  const approveExpenseMutation = useMutation({
    mutationFn: async ({ expenseId, status }: { expenseId: string; status: string }) => {
      const { error } = await supabase.from('expenses').update({ status }).eq('id', expenseId);
      if (error) throw error;
      const exp = expenses.find(e => e.id === expenseId);
      await notifyAllUsers({ title: `Expense ${status}`, message: `${exp?.description} - KES ${exp?.amount.toLocaleString()}`, type: 'update', app: 'finance', entity_id: expenseId, excludeUserId: user?.id });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      toast({ title: 'Expense updated' });
    },
  });

  const deleteInvoiceMutation = useMutation({
    mutationFn: async (invoice: Invoice) => {
      await supabase.from('invoice_items').delete().eq('invoice_id', invoice.id);
      const { error } = await supabase.from('invoices').delete().eq('id', invoice.id);
      if (error) throw error;
      await logAuditAction({ userId: user?.id!, action: 'delete', tableName: 'invoices', recordId: invoice.id, recordSummary: `Invoice ${invoice.invoice_number} - ${invoice.client_name}` });
      await notifyAllUsers({ title: 'Invoice Deleted', message: `${invoice.invoice_number} - ${invoice.client_name}`, type: 'delete', app: 'finance', excludeUserId: user?.id });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      toast({ title: 'Invoice deleted' });
    },
  });

  const deleteExpenseMutation = useMutation({
    mutationFn: async (expense: Expense) => {
      const { error } = await supabase.from('expenses').delete().eq('id', expense.id);
      if (error) throw error;
      await logAuditAction({ userId: user?.id!, action: 'delete', tableName: 'expenses', recordId: expense.id, recordSummary: `Expense ${expense.expense_number}` });
      await notifyAllUsers({ title: 'Expense Deleted', message: `${expense.description}`, type: 'delete', app: 'finance', excludeUserId: user?.id });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      toast({ title: 'Expense deleted' });
    },
  });

  const deleteBudgetMutation = useMutation({
    mutationFn: async (budget: Budget) => {
      const { error } = await supabase.from('budgets').delete().eq('id', budget.id);
      if (error) throw error;
      await logAuditAction({ userId: user?.id!, action: 'delete', tableName: 'budgets', recordId: budget.id, recordSummary: `Budget ${budget.name}` });
      await notifyAllUsers({ title: 'Budget Deleted', message: budget.name, type: 'delete', app: 'finance', excludeUserId: user?.id });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      toast({ title: 'Budget deleted' });
    },
  });

  const resetInvoiceForm = () => { setInvoiceClient(''); setInvoiceEmail(''); setInvoiceDueDate(undefined); setInvoiceItems([{ description: '', quantity: 1, price: 0 }]); };
  const resetExpenseForm = () => { setExpenseDescription(''); setExpenseCategory(''); setExpenseAmount(''); setExpenseVendor(''); setExpenseDate(new Date()); setExpenseReceipt(''); };
  const resetBudgetForm = () => { setBudgetName(''); setBudgetCategory(''); setBudgetAmount(''); setBudgetStart(undefined); setBudgetEnd(undefined); };
  const addInvoiceItem = () => { setInvoiceItems([...invoiceItems, { description: '', quantity: 1, price: 0 }]); };

  const totalRevenue = invoices.filter(i => i.status === 'paid').reduce((sum, i) => sum + i.total_amount, 0);
  const pendingInvoices = invoices.filter(i => i.status === 'sent').reduce((sum, i) => sum + i.total_amount, 0);
  const totalExpenses = expenses.filter(e => e.status === 'approved').reduce((sum, e) => sum + e.amount, 0);
  const netProfit = totalRevenue - totalExpenses;
  const isLoading = invoicesLoading || expensesLoading || budgetsLoading;

  if (isLoading) {
    return (<MainLayout><div className="flex h-[50vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div></MainLayout>);
  }

  return (
    <MainLayout>
      <div className="p-8">
        <div className="mb-8 flex items-center justify-between animate-fade-in">
          <div>
            <h1 className="font-display text-3xl font-bold text-foreground">Finance & Accounting</h1>
            <p className="mt-1 text-muted-foreground">Manage invoices, expenses, and budgets</p>
          </div>
        </div>

        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card><CardContent className="pt-6"><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">Total Revenue</p><p className="text-2xl font-bold text-success">KES {totalRevenue.toLocaleString()}</p></div><TrendingUp className="h-8 w-8 text-success" /></div></CardContent></Card>
          <Card><CardContent className="pt-6"><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">Pending Invoices</p><p className="text-2xl font-bold text-warning">KES {pendingInvoices.toLocaleString()}</p></div><FileText className="h-8 w-8 text-warning" /></div></CardContent></Card>
          <Card><CardContent className="pt-6"><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">Total Expenses</p><p className="text-2xl font-bold text-destructive">KES {totalExpenses.toLocaleString()}</p></div><TrendingDown className="h-8 w-8 text-destructive" /></div></CardContent></Card>
          <Card><CardContent className="pt-6"><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">Net Profit</p><p className={`text-2xl font-bold ${netProfit >= 0 ? 'text-success' : 'text-destructive'}`}>KES {netProfit.toLocaleString()}</p></div><DollarSign className="h-8 w-8 text-primary" /></div></CardContent></Card>
        </div>

        <Tabs defaultValue="invoices" className="space-y-4">
          <div className="flex items-center justify-between">
            <TabsList>
              <TabsTrigger value="invoices">Invoices</TabsTrigger>
              <TabsTrigger value="expenses">Expenses</TabsTrigger>
              <TabsTrigger value="budgets">Budgets</TabsTrigger>
            </TabsList>
            <div className="flex gap-2">
              <Dialog open={isInvoiceDialogOpen} onOpenChange={setIsInvoiceDialogOpen}>
                <DialogTrigger asChild><Button className="gradient-primary"><Plus className="mr-2 h-4 w-4" />New Invoice</Button></DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader><DialogTitle>Create Invoice</DialogTitle></DialogHeader>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2"><Label>Client Name</Label><Input value={invoiceClient} onChange={e => setInvoiceClient(e.target.value)} required /></div>
                      <div className="space-y-2"><Label>Client Email</Label><Input type="email" value={invoiceEmail} onChange={e => setInvoiceEmail(e.target.value)} /></div>
                    </div>
                    <div className="space-y-2"><Label>Due Date</Label><DatePicker date={invoiceDueDate} onDateChange={setInvoiceDueDate} placeholder="Select due date" /></div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between"><Label>Line Items</Label><Button type="button" variant="outline" size="sm" onClick={addInvoiceItem}>Add Item</Button></div>
                      {invoiceItems.map((item, idx) => (
                        <div key={idx} className="grid grid-cols-6 gap-2">
                          <div className="col-span-3"><Input placeholder="Description" value={item.description} onChange={e => { const items = [...invoiceItems]; items[idx].description = e.target.value; setInvoiceItems(items); }} /></div>
                          <Input type="number" placeholder="Qty" value={item.quantity} onChange={e => { const items = [...invoiceItems]; items[idx].quantity = parseInt(e.target.value) || 1; setInvoiceItems(items); }} />
                          <Input type="number" placeholder="Price" value={item.price} onChange={e => { const items = [...invoiceItems]; items[idx].price = parseFloat(e.target.value) || 0; setInvoiceItems(items); }} />
                          <div className="flex items-center justify-center font-medium">KES {(item.quantity * item.price).toLocaleString()}</div>
                        </div>
                      ))}
                      <div className="mt-4 border-t pt-4">
                        <div className="flex justify-between text-sm"><span>Subtotal</span><span>KES {invoiceItems.reduce((sum, i) => sum + i.quantity * i.price, 0).toLocaleString()}</span></div>
                        <div className="flex justify-between text-sm text-muted-foreground"><span>VAT (16%)</span><span>KES {(invoiceItems.reduce((sum, i) => sum + i.quantity * i.price, 0) * 0.16).toLocaleString()}</span></div>
                        <div className="flex justify-between font-bold mt-2"><span>Total</span><span>KES {(invoiceItems.reduce((sum, i) => sum + i.quantity * i.price, 0) * 1.16).toLocaleString()}</span></div>
                      </div>
                    </div>
                    <Button onClick={() => createInvoiceMutation.mutate()} className="w-full gradient-primary" disabled={!invoiceClient || !invoiceDueDate || createInvoiceMutation.isPending}>
                      {createInvoiceMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Create Invoice
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>

              <Dialog open={isExpenseDialogOpen} onOpenChange={setIsExpenseDialogOpen}>
                <DialogTrigger asChild><Button variant="outline"><Receipt className="mr-2 h-4 w-4" />Record Expense</Button></DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Record Expense</DialogTitle></DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2"><Label>Description</Label><Textarea value={expenseDescription} onChange={e => setExpenseDescription(e.target.value)} required /></div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2"><Label>Category</Label>
                        <Select value={expenseCategory} onValueChange={setExpenseCategory}><SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="office">Office Supplies</SelectItem><SelectItem value="travel">Travel</SelectItem><SelectItem value="software">Software</SelectItem>
                            <SelectItem value="utilities">Utilities</SelectItem><SelectItem value="salaries">Salaries</SelectItem><SelectItem value="marketing">Marketing</SelectItem><SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2"><Label>Amount (KES)</Label><Input type="number" value={expenseAmount} onChange={e => setExpenseAmount(e.target.value)} required /></div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2"><Label>Vendor</Label><Input value={expenseVendor} onChange={e => setExpenseVendor(e.target.value)} /></div>
                      <div className="space-y-2"><Label>Date</Label><DatePicker date={expenseDate} onDateChange={setExpenseDate} placeholder="Select date" /></div>
                    </div>
                    <div className="space-y-2"><Label>Receipt (optional)</Label><FileUpload bucket="documents" folder={`receipts/${user?.id}`} accept="image/*,application/pdf" maxSizeMB={10} onUploadComplete={(url) => setExpenseReceipt(url)} /></div>
                    <Button onClick={() => createExpenseMutation.mutate()} className="w-full gradient-primary" disabled={!expenseDescription || !expenseCategory || !expenseAmount || createExpenseMutation.isPending}>
                      {createExpenseMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Record Expense
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>

              <Dialog open={isBudgetDialogOpen} onOpenChange={setIsBudgetDialogOpen}>
                <DialogTrigger asChild><Button variant="outline"><PiggyBank className="mr-2 h-4 w-4" />New Budget</Button></DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Create Budget</DialogTitle></DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2"><Label>Budget Name</Label><Input value={budgetName} onChange={e => setBudgetName(e.target.value)} required /></div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2"><Label>Category</Label>
                        <Select value={budgetCategory} onValueChange={setBudgetCategory}><SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="operations">Operations</SelectItem><SelectItem value="marketing">Marketing</SelectItem><SelectItem value="development">Development</SelectItem>
                            <SelectItem value="hr">Human Resources</SelectItem><SelectItem value="it">IT & Infrastructure</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2"><Label>Amount (KES)</Label><Input type="number" value={budgetAmount} onChange={e => setBudgetAmount(e.target.value)} required /></div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2"><Label>Period Start</Label><DatePicker date={budgetStart} onDateChange={setBudgetStart} placeholder="Start date" /></div>
                      <div className="space-y-2"><Label>Period End</Label><DatePicker date={budgetEnd} onDateChange={setBudgetEnd} placeholder="End date" /></div>
                    </div>
                    <Button onClick={() => createBudgetMutation.mutate()} className="w-full gradient-primary" disabled={!budgetName || !budgetCategory || !budgetAmount || createBudgetMutation.isPending}>
                      {createBudgetMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Create Budget
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          <TabsContent value="invoices">
            <Card><CardHeader><CardTitle>Invoices</CardTitle></CardHeader>
              <CardContent>
                <Table>
                  <TableHeader><TableRow>
                    <TableHead>Invoice #</TableHead><TableHead>Client</TableHead><TableHead>Date</TableHead><TableHead>Due Date</TableHead>
                    <TableHead className="text-right">Amount</TableHead><TableHead>Status</TableHead><TableHead>Actions</TableHead>
                  </TableRow></TableHeader>
                  <TableBody>
                    {invoices.map(invoice => (
                      <TableRow key={invoice.id}>
                        <TableCell className="font-medium">{invoice.invoice_number}</TableCell>
                        <TableCell>{invoice.client_name}</TableCell>
                        <TableCell>{new Date(invoice.created_at).toLocaleDateString()}</TableCell>
                        <TableCell>{new Date(invoice.due_date).toLocaleDateString()}</TableCell>
                        <TableCell className="text-right font-semibold">KES {invoice.total_amount.toLocaleString()}</TableCell>
                        <TableCell><Badge variant={invoice.status === 'paid' ? 'default' : invoice.status === 'sent' ? 'secondary' : invoice.status === 'overdue' ? 'destructive' : 'outline'}>{invoice.status}</Badge></TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button size="sm" variant="ghost" title="Download PDF" onClick={async () => {
                              const { data: items } = await supabase.from('invoice_items').select('*').eq('invoice_id', invoice.id);
                              generateInvoicePdf({ ...invoice, items: items || [] });
                            }}><FileDown className="h-3 w-3" /></Button>
                            {invoice.status === 'draft' && (
                              <Button size="sm" variant="outline" onClick={() => updateInvoiceStatusMutation.mutate({ invoiceId: invoice.id, status: 'sent' })}><Send className="h-3 w-3 mr-1" />Send</Button>
                            )}
                            {invoice.status === 'sent' && (
                              <Button size="sm" variant="outline" onClick={() => updateInvoiceStatusMutation.mutate({ invoiceId: invoice.id, status: 'paid' })}>Mark Paid</Button>
                            )}
                            <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => deleteInvoiceMutation.mutate(invoice)}><Trash2 className="h-3 w-3" /></Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="expenses">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Expenses</CardTitle>
                <Button variant="outline" size="sm" onClick={() => generateExpenseReportPdf(expenses)}><FileDown className="h-4 w-4 mr-2" />Export PDF</Button>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader><TableRow>
                    <TableHead>Description</TableHead><TableHead>Category</TableHead><TableHead>Vendor</TableHead><TableHead>Date</TableHead>
                    <TableHead className="text-right">Amount</TableHead><TableHead>Status</TableHead><TableHead>Actions</TableHead>
                  </TableRow></TableHeader>
                  <TableBody>
                    {expenses.map(expense => (
                      <TableRow key={expense.id}>
                        <TableCell className="font-medium max-w-xs truncate">{expense.description}</TableCell>
                        <TableCell className="capitalize">{expense.category}</TableCell>
                        <TableCell>{expense.vendor || '-'}</TableCell>
                        <TableCell>{expense.expense_date ? new Date(expense.expense_date).toLocaleDateString() : '-'}</TableCell>
                        <TableCell className="text-right font-semibold">KES {expense.amount.toLocaleString()}</TableCell>
                        <TableCell><Badge variant={expense.status === 'approved' ? 'default' : expense.status === 'rejected' ? 'destructive' : 'secondary'}>{expense.status}</Badge></TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            {expense.status === 'pending' && (
                              <>
                                <Button size="sm" variant="outline" onClick={() => approveExpenseMutation.mutate({ expenseId: expense.id, status: 'approved' })}>Approve</Button>
                                <Button size="sm" variant="ghost" onClick={() => approveExpenseMutation.mutate({ expenseId: expense.id, status: 'rejected' })}>Reject</Button>
                              </>
                            )}
                            <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => deleteExpenseMutation.mutate(expense)}><Trash2 className="h-3 w-3" /></Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="budgets">
            <Card><CardHeader><CardTitle>Budgets</CardTitle></CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {budgets.map(budget => {
                    const percentage = budget.allocated_amount > 0 ? (budget.spent_amount / budget.allocated_amount) * 100 : 0;
                    const isOverBudget = percentage > 100;
                    return (
                      <Card key={budget.id} className="border group relative">
                        <Button size="icon" variant="ghost" className="absolute top-2 right-2 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive" onClick={() => deleteBudgetMutation.mutate(budget)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                        <CardContent className="pt-6">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-semibold">{budget.name}</h4>
                            <Badge variant="outline" className="capitalize">{budget.department || 'General'}</Badge>
                          </div>
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm"><span className="text-muted-foreground">Spent</span><span className={isOverBudget ? 'text-destructive font-semibold' : ''}>KES {budget.spent_amount.toLocaleString()} / {budget.allocated_amount.toLocaleString()}</span></div>
                            <div className="h-2 overflow-hidden rounded-full bg-muted"><div className={`h-full rounded-full transition-all ${isOverBudget ? 'bg-destructive' : 'gradient-primary'}`} style={{ width: `${Math.min(percentage, 100)}%` }} /></div>
                            <div className="flex justify-between text-xs text-muted-foreground"><span>{new Date(budget.start_date).toLocaleDateString()}</span><span>{new Date(budget.end_date).toLocaleDateString()}</span></div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
};

export default Finance;
