export interface SubscriptionInfo {
  status: 'none' | 'trial' | 'active' | 'expired' | 'blocked';
  plan: 'starter' | 'professional' | 'enterprise';
  expiryDate: string; // ISO date string
  trialDaysRemaining: number;
  billingCycle?: 'monthly' | 'yearly';
}

export interface UserProfile {
  id: string;
  fullName: string;
  businessName: string;
  email: string;
  phone: string;
  address?: string;
  taxNumber?: string; // NPWP
  bankName?: string;
  bankAccountNumber?: string;
  bankAccountHolder?: string;
  businessLogo?: string; // base64 or placeholder
  signatureImage?: string; // base64 or placeholder
  stampImage?: string; // base64 or placeholder
  profilePicture?: string; // base64 or image url for profile photo
  subscription: SubscriptionInfo;
}

export interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  businessName?: string;
  createdAt: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  unit: string; // e.g., 'Pcs', 'Jam', 'Hari', 'Bulan'
  category?: string;
}

export interface InvoiceItem {
  id: string;
  description: string;
  qty: number;
  unit: string;
  price: number;
  discountPercent: number; // Diskon per item (%)
  subtotal: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  userId: string;
  clientId: string;
  clientName: string;
  date: string; // YYYY-MM-DD
  dueDate: string; // YYYY-MM-DD
  type: 'Proforma' | 'Tax Invoice' | 'Commercial Invoice' | 'Credit Note';
  items: InvoiceItem[];
  globalDiscountPercent: number; // %
  hasTax: boolean; // PPN 11%
  hasTax2: boolean; // PPh 2%
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  tax2Amount: number;
  total: number;
  spelledOut: string; // Terbilang (e.g. "Dua Juta Rupiah")
  status: 'Draft' | 'Dikirim' | 'Lunas' | 'Sebagian' | 'Jatuh Tempo';
  notes?: string;
  terms?: string;
  templateId: 'corporate' | 'minimalist' | 'premium';
  currency: 'IDR' | 'USD' | 'SGD' | 'EUR';
  paymentMethodInfo?: string;
  createdAt: string;
}

export interface SystemNotification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  time: string;
  read: boolean;
}

export interface AdminUserListItem {
  id: string;
  fullName: string;
  email: string;
  businessName: string;
  phone: string;
  plan: 'starter' | 'professional' | 'enterprise';
  status: 'trial' | 'active' | 'expired' | 'blocked';
  expiryDate: string;
  createdAt: string;
}

export interface Quotation {
  id: string;
  quotationNumber: string;
  userId: string;
  clientId: string;
  clientName: string;
  date: string; // YYYY-MM-DD
  validUntil: string; // YYYY-MM-DD
  items: InvoiceItem[];
  globalDiscountPercent: number; // %
  hasTax: boolean; // PPN 11%
  hasTax2: boolean; // PPh 2%
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  tax2Amount: number;
  total: number;
  spelledOut: string; // Terbilang
  status: 'Draft' | 'Dikirim' | 'Disetujui' | 'Ditolak' | 'Dibuat Invoice';
  notes?: string;
  terms?: string;
  templateId: 'corporate' | 'minimalist' | 'premium';
  currency: 'IDR' | 'USD' | 'SGD' | 'EUR';
  createdAt: string;
  convertedInvoiceId?: string; // If converted to invoice
}

export interface AppNotification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'maintenance';
  title: string;
  message: string;
  targetUserId: string; // "all" or specific userId
  createdAt: string;
  dismissedBy: string[]; // List of userIds who dismissed this notification
  showPopup: boolean;
}


