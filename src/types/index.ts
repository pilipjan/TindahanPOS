/* ═══════════════════════════════════════════
   TindahanPOS — TypeScript Type Definitions
   ═══════════════════════════════════════════ */

// ─── Enums ───
export type UserRole = "admin" | "owner" | "cashier";
export type TransactionStatus = "completed" | "voided" | "refunded";
export type PaymentMethod = "cash" | "gcash" | "maya" | "card";
export type DiscountType = "none" | "senior" | "pwd" | "promo";
export type StockAdjustmentReason = "sale" | "received" | "damaged" | "returned" | "correction" | "sync";

// ─── Database Row Types ───

export interface Store {
  id: string;
  store_name: string;
  store_address: string;
  tin: string;
  vat_registered: boolean;
  ptu_number: string | null;
  ptu_valid_until: string | null;
  min: string | null;
  serial_number: string | null;
  accreditation_no: string | null;
  accreditation_valid_until: string | null;
  grand_total_sales: number;
  receipt_counter: number;
  created_at: string;
}

export interface Profile {
  id: string;
  store_id: string;
  full_name: string;
  email: string;
  role: UserRole;
  pin_hash: string | null;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  name: string;
  parent_id: string | null;
  store_id: string;
  created_at: string;
}

export interface Product {
  id: string;
  store_id: string;
  category_id: string | null;
  name: string;
  description: string | null;
  barcode: string | null;
  price: number;
  cost_price: number | null;
  stock_quantity: number;
  reorder_point: number;
  unit: string;
  is_active: boolean;
  image_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Transaction {
  id: string;
  store_id: string;
  cashier_id: string;
  receipt_number: number;
  subtotal: number;
  discount_amount: number;
  discount_type: DiscountType;
  discount_id_number: string | null;
  discount_name: string | null;
  vatable_sales: number;
  vat_amount: number;
  vat_exempt_sales: number;
  zero_rated_sales: number;
  total_amount: number;
  cash_received: number | null;
  change_amount: number | null;
  status: TransactionStatus;
  void_reason: string | null;
  voided_by: string | null;
  is_synced: boolean;
  local_id: string | null;
  created_at: string;
}

export interface TransactionItem {
  id: string;
  transaction_id: string;
  product_id: string;
  product_name: string;
  unit_price: number;
  quantity: number;
  line_total: number;
  created_at: string;
}

export interface PaymentSplit {
  id: string;
  transaction_id: string;
  method: PaymentMethod;
  amount: number;
  reference_number: string | null;
  created_at: string;
}

export interface StockAdjustment {
  id: string;
  product_id: string;
  store_id: string;
  quantity_change: number;
  previous_qty: number;
  new_qty: number;
  reason: StockAdjustmentReason;
  adjusted_by: string;
  notes: string | null;
  created_at: string;
}

export interface AuditLog {
  id: string;
  store_id: string;
  user_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  old_values: Record<string, unknown> | null;
  new_values: Record<string, unknown> | null;
  ip_address: string | null;
  created_at: string;
}

// ─── Cart / UI Types ───

export interface CartItem {
  product_id: string;
  product_name: string;
  barcode: string | null;
  unit_price: number;
  quantity: number;
  line_total: number;
}

export interface CartState {
  items: CartItem[];
  subtotal: number;
  discountType: DiscountType;
  discountAmount: number;
  discountIdNumber: string;
  discountName: string;
  vatableSales: number;
  vatAmount: number;
  vatExemptSales: number;
  totalAmount: number;
}

export interface PaymentState {
  splits: Array<{
    method: PaymentMethod;
    amount: number;
    reference: string;
  }>;
  totalPaid: number;
  changeDue: number;
}

// ─── VAT Computation ───

export interface VATBreakdown {
  vatableSales: number;
  vatAmount: number;
  vatExemptSales: number;
  zeroRatedSales: number;
  totalAmount: number;
}

export interface SCPWDDiscountResult {
  originalTotal: number;
  vatExemptSales: number;
  discountAmount: number;
  amountDue: number;
  vatAmount: number;
  vatableSales: number;
}
