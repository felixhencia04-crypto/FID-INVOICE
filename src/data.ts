import { Client, Product, Invoice, UserProfile } from './types';

// Let's create a helper to get dates relative to today
const getDateDaysAgo = (days: number): string => {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().split('T')[0];
};

const getDateDaysAhead = (days: number): string => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
};

export const SEED_PRODUCTS: Product[] = [
  {
    id: 'prod-1',
    name: 'Jasa Pembuatan Website Custom',
    description: 'Desain & development website responsif berbasis React dan Node.js',
    price: 8500000,
    unit: 'Paket',
    category: 'Jasa IT'
  },
  {
    id: 'prod-2',
    name: 'UI/UX Desain Dashboard',
    description: 'Riset pengguna, wireframing, high-fidelity UI mockup di Figma',
    price: 3500000,
    unit: 'Proyek',
    category: 'Desain'
  },
  {
    id: 'prod-3',
    name: 'Pemeliharaan Server Bulanan',
    description: 'Backup rutin, update keamanan, monitoring uptime, perbaikan bug',
    price: 1500000,
    unit: 'Bulan',
    category: 'Jasa IT'
  },
  {
    id: 'prod-4',
    name: 'Copywriting Landing Page',
    description: 'Penulisan naskah promosi dengan optimasi SEO dan teknik konversi tinggi',
    price: 750000,
    unit: 'Halaman',
    category: 'Pemasaran'
  },
  {
    id: 'prod-5',
    name: 'Konsultasi Bisnis Digital',
    description: 'Sesi mentoring strategis transformasi digital untuk UMKM selama 2 jam',
    price: 1200000,
    unit: 'Sesi',
    category: 'Konsultasi'
  }
];

export const SEED_CLIENTS: Client[] = [
  {
    id: 'client-1',
    name: 'Budi Santoso',
    email: 'budi@tokoberkah.com',
    phone: '081234567890',
    address: 'Jl. Sudirman No. 45, Jakarta Selatan, DKI Jakarta 12190',
    businessName: 'Toko Berkah Abadi',
    createdAt: getDateDaysAgo(30)
  },
  {
    id: 'client-2',
    name: 'Siti Rahma',
    email: 'siti.rahma@andalas-media.id',
    phone: '085298765432',
    address: 'Kawasan Bisnis Khatulistiwa Blok B3, Padang, Sumatera Barat',
    businessName: 'Andalas Media Group',
    createdAt: getDateDaysAgo(25)
  },
  {
    id: 'client-3',
    name: 'Christian Wibowo',
    email: 'wibowo@creativepulse.agency',
    phone: '081987654321',
    address: 'Gedung Inkubator Lt. 4, Kuningan, Jakarta Selatan',
    businessName: 'CreativePulse Agency',
    createdAt: getDateDaysAgo(15)
  },
  {
    id: 'client-4',
    name: 'Dewi Lestari',
    email: 'dewi.lestari@organicbite.co',
    phone: '082122334455',
    address: 'Komp. Ruko Hijau Lestari No. 12, Bandung, Jawa Barat',
    businessName: 'OrganicBite Healthy Food',
    createdAt: getDateDaysAgo(5)
  }
];

export const SEED_INVOICES: Invoice[] = [
  {
    id: 'inv-1',
    invoiceNumber: 'FID-2026-0001',
    userId: 'user-demo',
    clientId: 'client-1',
    clientName: 'Budi Santoso',
    date: getDateDaysAgo(20),
    dueDate: getDateDaysAgo(13), // Overdue
    type: 'Commercial Invoice',
    items: [
      {
        id: 'item-1',
        description: 'Jasa Pembuatan Website Custom - Toko Online Berkah',
        qty: 1,
        unit: 'Paket',
        price: 8500000,
        discountPercent: 10, // 10% diskon
        subtotal: 7650000
      },
      {
        id: 'item-2',
        description: 'Pemeliharaan Server Bulanan (Juni 2026)',
        qty: 1,
        unit: 'Bulan',
        price: 1500000,
        discountPercent: 0,
        subtotal: 1500000
      }
    ],
    globalDiscountPercent: 0,
    hasTax: true, // PPN 11%
    hasTax2: false,
    subtotal: 9150000,
    discountAmount: 0,
    taxAmount: 1006500, // 11% dari 9150000
    tax2Amount: 0,
    total: 10156500,
    spelledOut: 'Sepuluh Juta Seratus Lima Puluh Enam Ribu Lima Ratus Rupiah',
    status: 'Jatuh Tempo',
    notes: 'Mohon lakukan pembayaran ke rekening Bank Mandiri yang tertera.',
    terms: 'Pembayaran penuh sebelum tanggal jatuh tempo.',
    templateId: 'corporate',
    currency: 'IDR',
    createdAt: getDateDaysAgo(20)
  },
  {
    id: 'inv-2',
    invoiceNumber: 'FID-2026-0002',
    userId: 'user-demo',
    clientId: 'client-2',
    clientName: 'Siti Rahma',
    date: getDateDaysAgo(10),
    dueDate: getDateDaysAhead(5), // Upcoming
    type: 'Commercial Invoice',
    items: [
      {
        id: 'item-3',
        description: 'UI/UX Desain Dashboard Portal Andalas',
        qty: 1,
        unit: 'Proyek',
        price: 3500000,
        discountPercent: 0,
        subtotal: 3500000
      }
    ],
    globalDiscountPercent: 5, // 5% diskon global
    hasTax: false,
    hasTax2: true, // PPh 2%
    subtotal: 3500000,
    discountAmount: 175000, // 5% of 3500000
    taxAmount: 0,
    tax2Amount: 66500, // 2% of (3500000 - 175000)
    total: 3258500, // (3500000 - 175000 - 66500)
    spelledOut: 'Tiga Juta Dua Ratus Lima Puluh Delapan Ribu Lima Ratus Rupiah',
    status: 'Dikirim',
    notes: 'Terima kasih atas kerja sama Anda.',
    terms: 'Sertakan bukti transfer setelah melakukan pembayaran.',
    templateId: 'minimalist',
    currency: 'IDR',
    createdAt: getDateDaysAgo(10)
  },
  {
    id: 'inv-3',
    invoiceNumber: 'FID-2026-0003',
    userId: 'user-demo',
    clientId: 'client-3',
    clientName: 'Christian Wibowo',
    date: getDateDaysAgo(5),
    dueDate: getDateDaysAhead(25),
    type: 'Commercial Invoice',
    items: [
      {
        id: 'item-4',
        description: 'Copywriting Landing Page Bisnis',
        qty: 3,
        unit: 'Halaman',
        price: 750000,
        discountPercent: 0,
        subtotal: 2250000
      },
      {
        id: 'item-5',
        description: 'Konsultasi Bisnis Digital',
        qty: 2,
        unit: 'Sesi',
        price: 1200000,
        discountPercent: 0,
        subtotal: 2400000
      }
    ],
    globalDiscountPercent: 0,
    hasTax: true,
    hasTax2: true,
    subtotal: 4650000,
    discountAmount: 0,
    taxAmount: 511500, // 11% dari 4650000
    tax2Amount: 93000, // 2% dari 4650000
    total: 5068500, // 4650000 + 511500 - 93000 (PPh is typically a deduction in Indonesia, let's keep it simple: total = subtotal + PPN - PPh or total = subtotal + PPN + PPh depending on perspective, Indonesian standard usually treats PPh 23 as withholding tax which reduces the cash received but invoice shows full, let's calculate: total = subtotal + PPN + PPh for invoice grand total, or PPh deduction. Let's do total = subtotal + PPN for payment due if PPh is withholding)
    spelledOut: 'Lima Juta Enam Puluh Delapan Ribu Lima Ratus Rupiah',
    status: 'Lunas',
    notes: 'Invoice ini telah dilunasi sepenuhnya. Terima kasih.',
    terms: 'Lunas.',
    templateId: 'premium',
    currency: 'IDR',
    createdAt: getDateDaysAgo(5)
  }
];

export const DEMO_USER: UserProfile = {
  id: 'user-demo',
  fullName: 'Felix Hencia',
  businessName: 'PT Creative Digital Indonesia',
  email: 'felix.hencia04@gmail.com',
  phone: '081298765432',
  address: 'Jl. Kemang Raya No. 88, Mampang Prapatan, Jakarta Selatan, 12730',
  taxNumber: '01.234.567.8-012.000',
  bankName: 'Bank Mandiri',
  bankAccountNumber: '124-00-987654-3',
  bankAccountHolder: 'PT Creative Digital Indonesia',
  businessLogo: '',
  subscription: {
    status: 'active',
    plan: 'professional',
    expiryDate: getDateDaysAhead(30),
    trialDaysRemaining: 0
  }
};

// Seed multiple users to demonstrate admin panel multi-tenant list
export const SEED_USERS_LIST: UserProfile[] = [
  DEMO_USER,
  {
    id: 'user-2',
    fullName: 'Andi Wijaya',
    businessName: 'Wijaya Media Corp',
    email: 'andi@wijayamedia.com',
    phone: '081122334455',
    address: 'Jl. Riau No. 12, Bandung',
    taxNumber: '12.345.678.9-444.000',
    bankName: 'Bank BCA',
    bankAccountNumber: '233-112-9908',
    bankAccountHolder: 'Andi Wijaya',
    businessLogo: '',
    subscription: {
      status: 'trial',
      plan: 'starter',
      expiryDate: getDateDaysAhead(5),
      trialDaysRemaining: 5
    }
  },
  {
    id: 'user-3',
    fullName: 'Santi Novita',
    businessName: 'Santi Fashion Store',
    email: 'santi@fashionista.id',
    phone: '081998877665',
    address: 'Komp. Pasar Baru Kav 8, Jakarta Pusat',
    taxNumber: '98.765.432.1-999.000',
    bankName: 'Bank BNI',
    bankAccountNumber: '887-1234-556',
    bankAccountHolder: 'Santi Novita',
    businessLogo: '',
    subscription: {
      status: 'expired',
      plan: 'starter',
      expiryDate: getDateDaysAgo(2), // Already expired
      trialDaysRemaining: 0
    }
  },
  {
    id: 'user-4',
    fullName: 'Rian Hidayat',
    businessName: 'Rian Logistik Indonesia',
    email: 'rian@logistikindo.co.id',
    phone: '087766554433',
    address: 'Tanjung Priok Blok D1, Jakarta Utara',
    taxNumber: '09.111.222.3-001.000',
    bankName: 'Bank Mandiri',
    bankAccountNumber: '120-00-556677-8',
    bankAccountHolder: 'Rian Logistik',
    businessLogo: '',
    subscription: {
      status: 'blocked',
      plan: 'enterprise',
      expiryDate: getDateDaysAhead(120),
      trialDaysRemaining: 0
    }
  }
];
