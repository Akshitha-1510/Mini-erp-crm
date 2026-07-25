export type UserRole = 'ADMIN' | 'SALES' | 'WAREHOUSE' | 'ACCOUNTS';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

export interface CustomerNote {
  id: string;
  customerId: string;
  note: string;
  createdBy: string;
  createdAt: string;
  customer?: {
    name: string;
    businessName: string;
  };
}

export interface Customer {
  id: string;
  name: string;
  mobile: string;
  email?: string;
  businessName: string;
  gstNumber?: string;
  type: 'Retail' | 'Wholesale' | 'Distributor';
  status: 'Lead' | 'Active' | 'Inactive';
  address?: string;
  followUpDate?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  noteLogs?: CustomerNote[];
  challans?: Challan[];
  _count?: {
    noteLogs: number;
    challans: number;
  };
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  unitPrice: number;
  currentStock: number;
  minStockAlert: number;
  location?: string;
  createdAt: string;
  updatedAt: string;
}

export interface StockMovement {
  id: string;
  productId: string;
  quantity: number;
  type: 'IN' | 'OUT';
  reason: string;
  createdBy: string;
  timestamp: string;
  product?: {
    name: string;
    sku: string;
    category: string;
  };
}

export interface ChallanItem {
  id?: string;
  productId: string;
  productName: string;
  sku: string;
  unitPrice: number;
  quantity: number;
  subtotal: number;
}

export interface Challan {
  id: string;
  challanNumber: string;
  customerId: string;
  totalQuantity: number;
  totalAmount: number;
  status: 'Draft' | 'Confirmed' | 'Cancelled';
  productSnapshot: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  customer: Customer;
  items: ChallanItem[];
  parsedSnapshot?: any[];
}

export interface DashboardStats {
  summary: {
    totalCustomers: number;
    leadCustomers: number;
    activeCustomers: number;
    totalProducts: number;
    lowStockCount: number;
    totalChallans: number;
    confirmedChallansCount: number;
    draftChallansCount: number;
    totalSalesAmount: number;
  };
  lowStockAlerts: Product[];
  activityFeed: {
    stockMovements: StockMovement[];
    notes: CustomerNote[];
    recentChallans: Challan[];
  };
}
