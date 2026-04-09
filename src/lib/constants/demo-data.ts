import { Product, Transaction, Profile, Store } from "@/types";

export const DEMO_STORE: Store = {
  id: "demo-store-id",
  store_name: "Tindahan Demo Store",
  store_address: "123 Mabini St, Metro Manila, Philippines",
  tin: "123-456-789-000",
  vat_registered: true,
  ptu_number: "PTU-12345678",
  ptu_valid_until: "2030-12-31",
  min: "MIN1234567",
  serial_number: "SN-DEMO-001",
  accreditation_no: "ACC-987654321",
  accreditation_valid_until: "2030-12-31",
  grand_total_sales: 125430.50,
  receipt_counter: 452,
  created_at: new Date().toISOString(),
};

export const DEMO_PROFILE: Profile = {
  id: "demo-user-id",
  store_id: "demo-store-id",
  full_name: "Juan Demo Dela Cruz",
  email: "demo@tindahanpos.com",
  role: "owner",
  pin_hash: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

export const DEMO_PRODUCTS: Product[] = [
  {
    id: "p1",
    store_id: "demo-store-id",
    category_id: "cat1",
    name: "Royal Tru Orange 500ml",
    description: "Orange flavored soda",
    barcode: "4800016621124",
    price: 35.00,
    cost_price: 28.50,
    stock_quantity: 48,
    reorder_point: 12,
    unit: "bottle",
    is_active: true,
    supplier_name: "Coca-Cola Beverages",
    image_url: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "p2",
    store_id: "demo-store-id",
    category_id: "cat2",
    name: "Lucky Me Pancit Canton Extra Hot",
    description: "Spicy instant noodles",
    barcode: "4800011122233",
    price: 18.00,
    cost_price: 14.00,
    stock_quantity: 24,
    reorder_point: 10,
    unit: "pack",
    is_active: true,
    supplier_name: "Monde Nissin",
    image_url: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "p3",
    store_id: "demo-store-id",
    category_id: "cat1",
    name: "Kopiko Lucky Day 180ml",
    description: "Strong RTD coffee",
    barcode: "4800044556677",
    price: 25.00,
    cost_price: 20.00,
    stock_quantity: 15,
    reorder_point: 10,
    unit: "bottle",
    is_active: true,
    supplier_name: "Inbisco",
    image_url: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "p4",
    store_id: "demo-store-id",
    category_id: "cat3",
    name: "Gardenia White Bread 600g",
    description: "Classic white bread",
    barcode: "4800055667788",
    price: 65.00,
    cost_price: 55.00,
    stock_quantity: 3,
    reorder_point: 5,
    unit: "loaf",
    is_active: true,
    supplier_name: "Gardenia Bakeries",
    image_url: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "p5",
    store_id: "demo-store-id",
    category_id: "cat4",
    name: "Safeguard White 130g",
    description: "Anti-bacterial soap",
    barcode: "4800066778899",
    price: 55.00,
    cost_price: 45.00,
    stock_quantity: 12,
    reorder_point: 6,
    unit: "bar",
    is_active: true,
    supplier_name: "P&G",
    image_url: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "p6",
    store_id: "demo-store-id",
    category_id: "cat2",
    name: "SkyFlakes Crackers 10s",
    description: "Plain crackers",
    barcode: "4800001234567",
    price: 55.00,
    cost_price: 48.00,
    stock_quantity: 30,
    reorder_point: 10,
    unit: "pack",
    is_active: true,
    supplier_name: "M.Y. San",
    image_url: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

export const generateDemoChartData = () => {
  const data = [];
  const now = new Date();
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(now.getDate() - i);
    data.push({
      name: d.toLocaleDateString("en-PH", { month: 'short', day: 'numeric' }),
      sales: 2000 + Math.random() * 5000 + (i === 29 ? 3000 : 0),
    });
  }
  return data;
};

export const DEMO_STATS = {
  todaySales: 4250.75,
  ordersToday: 24,
  lowStockItems: 2,
  avgOrderValue: 177.11,
  expiringSoon: 1
};
