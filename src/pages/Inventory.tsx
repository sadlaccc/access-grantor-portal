import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Package, Plus, Search, AlertTriangle, TrendingUp, TrendingDown, ShoppingCart, Loader2, Trash2, Pencil } from 'lucide-react';
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
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { notifyAllUsers, logAuditAction } from '@/hooks/useNotifications';

interface Product {
  id: string;
  name: string;
  sku: string;
  description: string | null;
  category: string | null;
  quantity_in_stock: number;
  unit_price: number;
  reorder_level: number;
  created_at: string;
}

interface Order {
  id: string;
  order_number: string;
  vendor_customer: string | null;
  status: string;
  total_amount: number;
  order_type: string;
  created_at: string;
  created_by: string;
}

const Inventory = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [isProductDialogOpen, setIsProductDialogOpen] = useState(false);
  const [isOrderDialogOpen, setIsOrderDialogOpen] = useState(false);
  const [isEditProductOpen, setIsEditProductOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Product form state
  const [productName, setProductName] = useState('');
  const [productSku, setProductSku] = useState('');
  const [productCategory, setProductCategory] = useState('');
  const [productQuantity, setProductQuantity] = useState('');
  const [productPrice, setProductPrice] = useState('');
  const [productReorderLevel, setProductReorderLevel] = useState('');

  // Order form state
  const [orderSupplier, setOrderSupplier] = useState('');
  const [orderProducts, setOrderProducts] = useState<{ productId: string; quantity: number }[]>([]);

  // Fetch products
  const { data: products = [], isLoading: productsLoading } = useQuery({
    queryKey: ['inventory-products'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('inventory_products')
        .select('*')
        .order('name');
      if (error) throw error;
      return data as Product[];
    },
  });

  // Fetch orders
  const { data: orders = [], isLoading: ordersLoading } = useQuery({
    queryKey: ['inventory-orders'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('inventory_orders')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Order[];
    },
  });

  // Add product mutation
  const addProductMutation = useMutation({
    mutationFn: async (product: Omit<Product, 'id' | 'created_at'>) => {
      const { error } = await supabase.from('inventory_products').insert(product);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory-products'] });
      toast({ title: 'Product added successfully' });
      setIsProductDialogOpen(false);
      resetProductForm();
      if (user) {
        notifyAllUsers({ title: 'New Product Added', message: `Product "${productName}" was added to inventory`, type: 'info', app: 'inventory', excludeUserId: user.id });
        logAuditAction({ userId: user.id, action: 'create', tableName: 'inventory_products', recordSummary: productName });
      }
    },
    onError: (error: Error) => {
      toast({ title: 'Failed to add product', description: error.message, variant: 'destructive' });
    },
  });

  // Edit product mutation
  const editProductMutation = useMutation({
    mutationFn: async () => {
      if (!editingProduct) return;
      const { error } = await supabase.from('inventory_products').update({
        name: productName, sku: productSku, category: productCategory || null,
        quantity_in_stock: parseInt(productQuantity) || 0, unit_price: parseFloat(productPrice) || 0,
        reorder_level: parseInt(productReorderLevel) || 10,
      }).eq('id', editingProduct.id);
      if (error) throw error;
      if (user) {
        logAuditAction({ userId: user.id, action: 'update', tableName: 'inventory_products', recordId: editingProduct.id, recordSummary: productName });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory-products'] });
      toast({ title: 'Product updated' });
      setIsEditProductOpen(false);
      setEditingProduct(null);
      resetProductForm();
    },
    onError: (error: Error) => toast({ title: 'Failed to update product', description: error.message, variant: 'destructive' }),
  });


  const deleteProductMutation = useMutation({
    mutationFn: async (product: Product) => {
      const { error } = await supabase.from('inventory_products').delete().eq('id', product.id);
      if (error) throw error;
      return product;
    },
    onSuccess: (product) => {
      queryClient.invalidateQueries({ queryKey: ['inventory-products'] });
      toast({ title: 'Product deleted' });
      if (user) {
        notifyAllUsers({ title: 'Product Deleted', message: `Product "${product.name}" was removed from inventory`, type: 'warning', app: 'inventory', excludeUserId: user.id });
        logAuditAction({ userId: user.id, action: 'delete', tableName: 'inventory_products', recordId: product.id, recordSummary: product.name });
      }
    },
    onError: (error: Error) => {
      toast({ title: 'Failed to delete product', description: error.message, variant: 'destructive' });
    },
  });

  // Delete order mutation
  const deleteOrderMutation = useMutation({
    mutationFn: async (order: Order) => {
      // Delete order items first
      await supabase.from('inventory_order_items').delete().eq('order_id', order.id);
      const { error } = await supabase.from('inventory_orders').delete().eq('id', order.id);
      if (error) throw error;
      return order;
    },
    onSuccess: (order) => {
      queryClient.invalidateQueries({ queryKey: ['inventory-orders'] });
      toast({ title: 'Order deleted' });
      if (user) {
        notifyAllUsers({ title: 'Order Deleted', message: `Order "${order.order_number}" was deleted`, type: 'warning', app: 'inventory', excludeUserId: user.id });
        logAuditAction({ userId: user.id, action: 'delete', tableName: 'inventory_orders', recordId: order.id, recordSummary: order.order_number });
      }
    },
    onError: (error: Error) => {
      toast({ title: 'Failed to delete order', description: error.message, variant: 'destructive' });
    },
  });

  // Create order mutation
  const createOrderMutation = useMutation({
    mutationFn: async () => {
      const orderNumber = `ORD-${Date.now().toString(36).toUpperCase()}`;
      const totalAmount = orderProducts.reduce((sum, op) => {
        const product = products.find(p => p.id === op.productId);
        return sum + (product ? product.unit_price * op.quantity : 0);
      }, 0);

      const { data: order, error: orderError } = await supabase
        .from('inventory_orders')
        .insert({
          order_number: orderNumber,
          vendor_customer: orderSupplier,
          order_type: 'purchase',
          status: 'pending',
          total_amount: totalAmount,
          created_by: user?.id,
        })
        .select()
        .single();

      if (orderError) throw orderError;

      const orderItems = orderProducts.map(op => {
        const product = products.find(p => p.id === op.productId);
        return {
          order_id: order.id,
          product_id: op.productId,
          quantity: op.quantity,
          unit_price: product?.unit_price || 0,
        };
      });

      const { error: itemsError } = await supabase.from('inventory_order_items').insert(orderItems);
      if (itemsError) throw itemsError;
      return orderNumber;
    },
    onSuccess: (orderNumber) => {
      queryClient.invalidateQueries({ queryKey: ['inventory-orders'] });
      toast({ title: 'Order created successfully' });
      setIsOrderDialogOpen(false);
      setOrderSupplier('');
      setOrderProducts([]);
      if (user) {
        notifyAllUsers({ title: 'New Order Created', message: `Purchase order "${orderNumber}" was created`, type: 'info', app: 'inventory', excludeUserId: user.id });
        logAuditAction({ userId: user.id, action: 'create', tableName: 'inventory_orders', recordSummary: orderNumber });
      }
    },
    onError: (error: Error) => {
      toast({ title: 'Failed to create order', description: error.message, variant: 'destructive' });
    },
  });

  // Update order status mutation
  const updateOrderStatusMutation = useMutation({
    mutationFn: async ({ orderId, status }: { orderId: string; status: string }) => {
      const { error } = await supabase
        .from('inventory_orders')
        .update({ status })
        .eq('id', orderId);
      if (error) throw error;

      if (status === 'received') {
        const { data: orderItems } = await supabase
          .from('inventory_order_items')
          .select('product_id, quantity')
          .eq('order_id', orderId);

        if (orderItems) {
          for (const item of orderItems) {
            const product = products.find(p => p.id === item.product_id);
            if (product) {
              await supabase
                .from('inventory_products')
                .update({ quantity_in_stock: product.quantity_in_stock + item.quantity })
                .eq('id', item.product_id);
            }
          }
        }
      }
      return { orderId, status };
    },
    onSuccess: ({ orderId, status }) => {
      queryClient.invalidateQueries({ queryKey: ['inventory-products'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-orders'] });
      toast({ title: 'Order status updated' });
      const order = orders.find(o => o.id === orderId);
      if (user && order) {
        notifyAllUsers({ title: 'Order Updated', message: `Order "${order.order_number}" marked as ${status}`, type: 'info', app: 'inventory', excludeUserId: user.id });
        logAuditAction({ userId: user.id, action: 'update', tableName: 'inventory_orders', recordId: orderId, recordSummary: `${order.order_number} → ${status}` });
      }
    },
  });

  const resetProductForm = () => {
    setProductName('');
    setProductSku('');
    setProductCategory('');
    setProductQuantity('');
    setProductPrice('');
    setProductReorderLevel('');
  };

  const openEditProduct = (product: Product) => {
    setEditingProduct(product);
    setProductName(product.name);
    setProductSku(product.sku);
    setProductCategory(product.category || '');
    setProductQuantity(product.quantity_in_stock.toString());
    setProductPrice(product.unit_price.toString());
    setProductReorderLevel(product.reorder_level.toString());
    setIsEditProductOpen(true);
  };


  const handleAddProduct = (e: React.FormEvent) => {
    e.preventDefault();
    addProductMutation.mutate({
      name: productName,
      sku: productSku,
      description: null,
      category: productCategory || null,
      quantity_in_stock: parseInt(productQuantity) || 0,
      unit_price: parseFloat(productPrice) || 0,
      reorder_level: parseInt(productReorderLevel) || 10,
    });
  };

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.sku.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const lowStockProducts = products.filter(p => p.quantity_in_stock <= p.reorder_level);
  const totalValue = products.reduce((sum, p) => sum + p.quantity_in_stock * p.unit_price, 0);
  const pendingOrders = orders.filter(o => o.status === 'pending').length;

  if (productsLoading || ordersLoading) {
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
      <div className="p-8">
        <div className="mb-8 flex items-center justify-between animate-fade-in">
          <div>
            <h1 className="font-display text-3xl font-bold text-foreground">Inventory Management</h1>
            <p className="mt-1 text-muted-foreground">Track stock levels, manage products, and process orders</p>
          </div>
          <div className="flex gap-2">
            <Dialog open={isProductDialogOpen} onOpenChange={setIsProductDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gradient-primary">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Product
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Product</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleAddProduct} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Product Name</Label>
                      <Input value={productName} onChange={e => setProductName(e.target.value)} required />
                    </div>
                    <div className="space-y-2">
                      <Label>SKU</Label>
                      <Input value={productSku} onChange={e => setProductSku(e.target.value)} required />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Category</Label>
                    <Input value={productCategory} onChange={e => setProductCategory(e.target.value)} />
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Quantity</Label>
                      <Input type="number" value={productQuantity} onChange={e => setProductQuantity(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Unit Price</Label>
                      <Input type="number" step="0.01" value={productPrice} onChange={e => setProductPrice(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Reorder Level</Label>
                      <Input type="number" value={productReorderLevel} onChange={e => setProductReorderLevel(e.target.value)} />
                    </div>
                  </div>
                  <Button type="submit" className="w-full gradient-primary" disabled={addProductMutation.isPending}>
                    {addProductMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Add Product
                  </Button>
                </form>
              </DialogContent>
            </Dialog>

            <Dialog open={isOrderDialogOpen} onOpenChange={setIsOrderDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <ShoppingCart className="mr-2 h-4 w-4" />
                  New Order
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>Create Purchase Order</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Supplier Name</Label>
                    <Input value={orderSupplier} onChange={e => setOrderSupplier(e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <Label>Select Products</Label>
                    <Select onValueChange={(productId) => {
                      if (!orderProducts.find(op => op.productId === productId)) {
                        setOrderProducts([...orderProducts, { productId, quantity: 1 }]);
                      }
                    }}>
                      <SelectTrigger><SelectValue placeholder="Add product to order" /></SelectTrigger>
                      <SelectContent>
                        {products.map(p => (
                          <SelectItem key={p.id} value={p.id}>{p.name} ({p.sku})</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {orderProducts.length > 0 && (
                    <div className="space-y-2">
                      {orderProducts.map(op => {
                        const product = products.find(p => p.id === op.productId);
                        return (
                          <div key={op.productId} className="flex items-center justify-between rounded-lg border p-3">
                            <span className="text-sm">{product?.name}</span>
                            <div className="flex items-center gap-2">
                              <Input
                                type="number"
                                min="1"
                                value={op.quantity}
                                onChange={e => setOrderProducts(ops =>
                                  ops.map(o => o.productId === op.productId ? { ...o, quantity: parseInt(e.target.value) || 1 } : o)
                                )}
                                className="w-20"
                              />
                              <Button variant="ghost" size="sm" onClick={() => setOrderProducts(ops => ops.filter(o => o.productId !== op.productId))}>
                                Remove
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  <Button
                    onClick={() => createOrderMutation.mutate()}
                    className="w-full gradient-primary"
                    disabled={orderProducts.length === 0 || createOrderMutation.isPending}
                  >
                    {createOrderMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Create Order
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Stats */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Products</p>
                  <p className="text-2xl font-bold">{products.length}</p>
                </div>
                <Package className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Inventory Value</p>
                  <p className="text-2xl font-bold">KES {totalValue.toLocaleString()}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-success" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Low Stock Items</p>
                  <p className="text-2xl font-bold">{lowStockProducts.length}</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-warning" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pending Orders</p>
                  <p className="text-2xl font-bold">{pendingOrders}</p>
                </div>
                <ShoppingCart className="h-8 w-8 text-accent" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="products" className="space-y-4">
          <TabsList>
            <TabsTrigger value="products">Products</TabsTrigger>
            <TabsTrigger value="orders">Orders</TabsTrigger>
            <TabsTrigger value="low-stock">Low Stock Alerts</TabsTrigger>
          </TabsList>

          <TabsContent value="products">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Product Inventory</CardTitle>
                <div className="relative w-64">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input placeholder="Search products..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-10" />
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>SKU</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead className="text-right">Quantity</TableHead>
                      <TableHead className="text-right">Unit Price</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProducts.map(product => (
                      <TableRow key={product.id}>
                        <TableCell className="font-medium">{product.name}</TableCell>
                        <TableCell>{product.sku}</TableCell>
                        <TableCell>{product.category || '-'}</TableCell>
                        <TableCell className="text-right">{product.quantity_in_stock}</TableCell>
                        <TableCell className="text-right">KES {product.unit_price.toLocaleString()}</TableCell>
                        <TableCell>
                          {product.quantity_in_stock <= product.reorder_level ? (
                            <Badge variant="destructive" className="flex w-fit items-center gap-1">
                              <TrendingDown className="h-3 w-3" />Low Stock
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="bg-success/10 text-success">In Stock</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => deleteProductMutation.mutate(product)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="orders">
            <Card>
              <CardHeader>
                <CardTitle>Purchase Orders</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order #</TableHead>
                      <TableHead>Supplier</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orders.map(order => (
                      <TableRow key={order.id}>
                        <TableCell className="font-medium">{order.order_number}</TableCell>
                        <TableCell>{order.vendor_customer || '-'}</TableCell>
                        <TableCell>{new Date(order.created_at).toLocaleDateString()}</TableCell>
                        <TableCell className="text-right">KES {order.total_amount.toLocaleString()}</TableCell>
                        <TableCell>
                          <Badge variant={order.status === 'received' ? 'default' : order.status === 'pending' ? 'secondary' : 'outline'}>
                            {order.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            {order.status === 'pending' && (
                              <Button size="sm" variant="outline" onClick={() => updateOrderStatusMutation.mutate({ orderId: order.id, status: 'received' })}>
                                Mark Received
                              </Button>
                            )}
                            <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => deleteOrderMutation.mutate(order)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="low-stock">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-warning" />
                  Low Stock Alerts
                </CardTitle>
              </CardHeader>
              <CardContent>
                {lowStockProducts.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">All products are well stocked!</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product</TableHead>
                        <TableHead>SKU</TableHead>
                        <TableHead className="text-right">Current Qty</TableHead>
                        <TableHead className="text-right">Reorder Level</TableHead>
                        <TableHead className="text-right">Shortage</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {lowStockProducts.map(product => (
                        <TableRow key={product.id}>
                          <TableCell className="font-medium">{product.name}</TableCell>
                          <TableCell>{product.sku}</TableCell>
                          <TableCell className="text-right text-destructive font-semibold">{product.quantity_in_stock}</TableCell>
                          <TableCell className="text-right">{product.reorder_level}</TableCell>
                          <TableCell className="text-right text-destructive">{product.reorder_level - product.quantity_in_stock}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
};

export default Inventory;
