// Customer Profile
export interface CustomerProfile {
  phone: string;
  name: string;
  hall: string;
  room: string;
  loyaltyPoints: number;
  createdAt: Date;
}

// Order Status
export type OrderStatus = 
  | 'pending_dropoff'
  | 'checked_in'
  | 'sorting'
  | 'washing'
  | 'drying'
  | 'folding'
  | 'ready'
  | 'out_for_delivery'
  | 'completed'
  | 'cancelled';

// Service Type
export type ServiceType = 'wash_and_dry' | 'wash_only' | 'dry_only';

// Payment Method
export type PaymentMethod = 'ussd' | 'mobile_money' | 'cash';

// Order
export interface Order {
  id: string;
  code: string;
  branchId: string;
  customerPhone: string;
  bagCardNumber?: string;
  status: OrderStatus;
  serviceType: ServiceType;
  clothesCount: number;
  hasWhites: boolean;
  washWhitesSeparately: boolean;
  weight?: number;
  loads?: number;
  totalPrice?: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Order Item Category
export interface OrderItem {
  id: string;
  orderId: string;
  category: string;
  quantity: number;
}

// Payment
export interface Payment {
  id: string;
  orderId: string;
  method: PaymentMethod;
  amount: number;
  staffId: string;
  timestamp: Date;
  branchId: string;
}

// Branch
export interface Branch {
  id: string;
  name: string;
  location: string;
  pricePerLoad: number;
  deliveryFee: number;
  isActive: boolean;
}

// Staff
export interface Staff {
  id: string;
  name: string;
  branchId: string;
  role: 'receptionist' | 'admin';
  faceId?: string;
  isActive: boolean;
}

// Attendance Log
export interface AttendanceLog {
  id: string;
  staffId: string;
  action: 'sign_in' | 'sign_out';
  timestamp: Date;
  branchId: string;
}

// Voucher
export interface Voucher {
  id: string;
  code: string;
  phone?: string;
  branchId?: string;
  discountType: 'percentage' | 'fixed' | 'free_wash';
  discountValue: number;
  usageLimit: number;
  usedCount: number;
  validFrom: Date;
  validTo: Date;
  isActive: boolean;
}

// Status stage info - Rapid Wash colors with enhanced styling
export const ORDER_STAGES: { 
  status: OrderStatus; 
  label: string; 
  color: string;
  textColor: string;
  borderColor: string;
}[] = [
  { 
    status: 'pending_dropoff', 
    label: 'Pending Drop-off', 
    color: 'bg-orange-100 dark:bg-orange-950',
    textColor: 'text-orange-700 dark:text-orange-300',
    borderColor: 'border-orange-200 dark:border-orange-800',
  },
  { 
    status: 'checked_in', 
    label: 'Checked In', 
    color: 'bg-blue-100 dark:bg-blue-950',
    textColor: 'text-blue-700 dark:text-blue-300',
    borderColor: 'border-blue-200 dark:border-blue-800',
  },
  { 
    status: 'sorting', 
    label: 'Sorting', 
    color: 'bg-purple-100 dark:bg-purple-950',
    textColor: 'text-purple-700 dark:text-purple-300',
    borderColor: 'border-purple-200 dark:border-purple-800',
  },
  { 
    status: 'washing', 
    label: 'Washing', 
    color: 'bg-sky-100 dark:bg-sky-950',
    textColor: 'text-sky-700 dark:text-sky-300',
    borderColor: 'border-sky-200 dark:border-sky-800',
  },
  { 
    status: 'drying', 
    label: 'Drying', 
    color: 'bg-cyan-100 dark:bg-cyan-950',
    textColor: 'text-cyan-700 dark:text-cyan-300',
    borderColor: 'border-cyan-200 dark:border-cyan-800',
  },
  { 
    status: 'folding', 
    label: 'Folding', 
    color: 'bg-pink-100 dark:bg-pink-950',
    textColor: 'text-pink-700 dark:text-pink-300',
    borderColor: 'border-pink-200 dark:border-pink-800',
  },
  { 
    status: 'ready', 
    label: 'Ready', 
    color: 'bg-green-500 dark:bg-green-600',
    textColor: 'text-white',
    borderColor: 'border-green-600 dark:border-green-700',
  },
  { 
    status: 'out_for_delivery', 
    label: 'Out for Delivery', 
    color: 'bg-purple-100 dark:bg-purple-950',
    textColor: 'text-purple-700 dark:text-purple-300',
    borderColor: 'border-purple-200 dark:border-purple-800',
  },
  { 
    status: 'completed', 
    label: 'Completed', 
    color: 'bg-emerald-100 dark:bg-emerald-950',
    textColor: 'text-emerald-700 dark:text-emerald-300',
    borderColor: 'border-emerald-200 dark:border-emerald-800',
  },
  { 
    status: 'cancelled', 
    label: 'Cancelled', 
    color: 'bg-red-100 dark:bg-red-950',
    textColor: 'text-red-700 dark:text-red-300',
    borderColor: 'border-red-200 dark:border-red-800',
  },
];

// Item categories for receipts
export const ITEM_CATEGORIES = [
  'Shirts',
  'T-Shirts',
  'Shorts',
  'Trousers',
  'Jeans',
  'Dresses',
  'Skirts',
  'Underwear',
  'Bras',
  'Socks',
  'Towels',
  'Bedsheets',
  'Jackets',
  'Hoodies',
  'Other',
];

