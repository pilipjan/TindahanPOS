/* ════════════════════════════════════════════
   Supabase Database SQL Migrations
   Run these in order in the Supabase SQL Editor
   ════════════════════════════════════════════

   ORDER:
   1. Enable extensions
   2. stores
   3. profiles
   4. categories
   5. products
   6. transactions + items + payment_splits
   7. stock_adjustments
   8. audit_logs
   9. RLS policies
   10. Helper functions & triggers
*/

-- 1. Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Stores
CREATE TABLE IF NOT EXISTS stores (
  id                        UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_name                TEXT NOT NULL,
  store_address             TEXT NOT NULL,
  tin                       VARCHAR(15) NOT NULL,
  vat_registered            BOOLEAN DEFAULT true,
  ptu_number                VARCHAR(50),
  ptu_valid_until           DATE,
  min                       VARCHAR(20),
  serial_number             VARCHAR(50),
  accreditation_no          VARCHAR(50),
  accreditation_valid_until DATE,
  grand_total_sales         NUMERIC(15,2) NOT NULL DEFAULT 0.00,
  receipt_counter           BIGINT NOT NULL DEFAULT 0,
  created_at                TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Profiles (extends auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  store_id    UUID REFERENCES stores(id) NOT NULL,
  full_name   TEXT NOT NULL,
  email       TEXT NOT NULL,
  role        TEXT NOT NULL DEFAULT 'cashier'
                CHECK (role IN ('admin', 'owner', 'cashier')),
  pin_hash    TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- 4. Categories
CREATE TABLE IF NOT EXISTS categories (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id   UUID REFERENCES stores(id) NOT NULL,
  name       TEXT NOT NULL,
  parent_id  UUID REFERENCES categories(id) ON DELETE SET NULL,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Products
CREATE TABLE IF NOT EXISTS products (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id        UUID REFERENCES stores(id) NOT NULL,
  category_id     UUID REFERENCES categories(id) ON DELETE SET NULL,
  name            TEXT NOT NULL,
  description     TEXT,
  barcode         VARCHAR(50),
  price           NUMERIC(10,2) NOT NULL CHECK (price >= 0),
  cost_price      NUMERIC(10,2) CHECK (cost_price >= 0),
  stock_quantity  INTEGER NOT NULL DEFAULT 0,
  reorder_point   INTEGER NOT NULL DEFAULT 5,
  unit            TEXT DEFAULT 'pcs',
  is_active       BOOLEAN DEFAULT true,
  image_url       TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(store_id, barcode)
);

CREATE INDEX IF NOT EXISTS idx_products_store_id ON products(store_id);
CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(store_id, barcode);
CREATE INDEX IF NOT EXISTS idx_products_active ON products(store_id, is_active);

CREATE TRIGGER products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- 6. Transactions, Items, Payment Splits
CREATE TABLE IF NOT EXISTS transactions (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id            UUID REFERENCES stores(id) NOT NULL,
  cashier_id          UUID REFERENCES profiles(id) NOT NULL,
  receipt_number      BIGINT NOT NULL,
  subtotal            NUMERIC(10,2) NOT NULL,
  discount_amount     NUMERIC(10,2) DEFAULT 0,
  discount_type       TEXT DEFAULT 'none'
                        CHECK (discount_type IN ('none','senior','pwd','promo')),
  discount_id_number  VARCHAR(50),
  discount_name       TEXT,
  vatable_sales       NUMERIC(10,2) NOT NULL DEFAULT 0,
  vat_amount          NUMERIC(10,2) NOT NULL DEFAULT 0,
  vat_exempt_sales    NUMERIC(10,2) DEFAULT 0,
  zero_rated_sales    NUMERIC(10,2) DEFAULT 0,
  total_amount        NUMERIC(10,2) NOT NULL,
  cash_received       NUMERIC(10,2),
  change_amount       NUMERIC(10,2),
  status              TEXT DEFAULT 'completed'
                        CHECK (status IN ('completed','voided','refunded')),
  void_reason         TEXT,
  voided_by           UUID REFERENCES profiles(id),
  is_synced           BOOLEAN DEFAULT true,
  local_id            VARCHAR(50),
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(store_id, receipt_number)
);

CREATE INDEX IF NOT EXISTS idx_transactions_store_date
  ON transactions(store_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_cashier
  ON transactions(cashier_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_status
  ON transactions(store_id, status);

CREATE TABLE IF NOT EXISTS transaction_items (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  transaction_id   UUID REFERENCES transactions(id) ON DELETE CASCADE NOT NULL,
  product_id       UUID REFERENCES products(id),
  product_name     TEXT NOT NULL,
  unit_price       NUMERIC(10,2) NOT NULL,
  quantity         INTEGER NOT NULL CHECK (quantity > 0),
  line_total       NUMERIC(10,2) NOT NULL,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tx_items_transaction
  ON transaction_items(transaction_id);

CREATE TABLE IF NOT EXISTS payment_splits (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  transaction_id   UUID REFERENCES transactions(id) ON DELETE CASCADE NOT NULL,
  method           TEXT NOT NULL CHECK (method IN ('cash','gcash','maya','card')),
  amount           NUMERIC(10,2) NOT NULL,
  reference_number VARCHAR(100),
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payment_splits_transaction
  ON payment_splits(transaction_id);

-- 7. Stock Adjustments
CREATE TABLE IF NOT EXISTS stock_adjustments (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id      UUID REFERENCES products(id) NOT NULL,
  store_id        UUID REFERENCES stores(id) NOT NULL,
  quantity_change INTEGER NOT NULL,
  previous_qty    INTEGER NOT NULL,
  new_qty         INTEGER NOT NULL,
  reason          TEXT NOT NULL
                    CHECK (reason IN ('sale','received','damaged','returned','correction','sync')),
  adjusted_by     UUID REFERENCES profiles(id),
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_stock_adj_product
  ON stock_adjustments(product_id, created_at DESC);

-- 8. Audit Logs
CREATE TABLE IF NOT EXISTS audit_logs (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id    UUID REFERENCES stores(id) NOT NULL,
  user_id     UUID REFERENCES profiles(id),
  action      TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id   UUID,
  old_values  JSONB,
  new_values  JSONB,
  ip_address  TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_store_date
  ON audit_logs(store_id, created_at DESC);

-- 9. Helper Functions
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT AS $$
  SELECT role FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION get_user_store_id()
RETURNS UUID AS $$
  SELECT store_id FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION decrement_stock(p_product_id UUID, p_quantity INTEGER)
RETURNS INTEGER AS $$
DECLARE
  v_previous INTEGER;
  v_new      INTEGER;
BEGIN
  SELECT stock_quantity INTO v_previous FROM products WHERE id = p_product_id FOR UPDATE;
  v_new := v_previous - p_quantity;
  UPDATE products SET stock_quantity = v_new WHERE id = p_product_id;
  RETURN v_new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_next_receipt_number(p_store_id UUID)
RETURNS BIGINT AS $$
DECLARE
  v_counter BIGINT;
BEGIN
  UPDATE stores SET receipt_counter = receipt_counter + 1 WHERE id = p_store_id RETURNING receipt_counter INTO v_counter;
  RETURN v_counter;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION increment_grand_total(p_store_id UUID, p_amount NUMERIC)
RETURNS VOID AS $$
BEGIN
  UPDATE stores SET grand_total_sales = grand_total_sales + p_amount WHERE id = p_store_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. RLS Policies
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Store members can view their store" ON stores FOR SELECT USING (id = get_user_store_id());
CREATE POLICY "Owners can update their store" ON stores FOR UPDATE USING (id = get_user_store_id() AND get_user_role() IN ('admin','owner'));

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (id = auth.uid());
CREATE POLICY "Admins can view all store profiles" ON profiles FOR SELECT USING (store_id = get_user_store_id() AND get_user_role() IN ('admin','owner'));
CREATE POLICY "Admins can manage profiles" ON profiles FOR ALL USING (store_id = get_user_store_id() AND get_user_role() IN ('admin','owner'));

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Store members can view categories" ON categories FOR SELECT USING (store_id = get_user_store_id());
CREATE POLICY "Admins can manage categories" ON categories FOR ALL USING (store_id = get_user_store_id() AND get_user_role() IN ('admin','owner'));

ALTER TABLE products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Store members can view products" ON products FOR SELECT USING (store_id = get_user_store_id());
CREATE POLICY "Admins can manage products" ON products FOR ALL USING (store_id = get_user_store_id() AND get_user_role() IN ('admin','owner'));
CREATE POLICY "Cashiers can update stock" ON products FOR UPDATE USING (store_id = get_user_store_id());

ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Cashiers see own transactions" ON transactions FOR SELECT USING (cashier_id = auth.uid() AND store_id = get_user_store_id());
CREATE POLICY "Admins see all store transactions" ON transactions FOR SELECT USING (store_id = get_user_store_id() AND get_user_role() IN ('admin','owner'));
CREATE POLICY "Cashiers can create transactions" ON transactions FOR INSERT WITH CHECK (cashier_id = auth.uid() AND store_id = get_user_store_id());
CREATE POLICY "Only admins can void transactions" ON transactions FOR UPDATE USING (store_id = get_user_store_id() AND get_user_role() IN ('admin','owner'));

ALTER TABLE transaction_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Store members can view transaction items" ON transaction_items FOR SELECT USING (EXISTS (SELECT 1 FROM transactions t WHERE t.id = transaction_items.transaction_id AND t.store_id = get_user_store_id()));
CREATE POLICY "Cashiers can insert transaction items" ON transaction_items FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM transactions t WHERE t.id = transaction_items.transaction_id AND t.store_id = get_user_store_id()));

ALTER TABLE payment_splits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Store members can view payment splits" ON payment_splits FOR SELECT USING (EXISTS (SELECT 1 FROM transactions t WHERE t.id = payment_splits.transaction_id AND t.store_id = get_user_store_id()));
CREATE POLICY "Cashiers can insert payment splits" ON payment_splits FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM transactions t WHERE t.id = payment_splits.transaction_id AND t.store_id = get_user_store_id()));

ALTER TABLE stock_adjustments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Store members can view stock adjustments" ON stock_adjustments FOR SELECT USING (store_id = get_user_store_id());
CREATE POLICY "Store members can insert stock adjustments" ON stock_adjustments FOR INSERT WITH CHECK (store_id = get_user_store_id());

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can view audit logs" ON audit_logs FOR SELECT USING (store_id = get_user_store_id() AND get_user_role() IN ('admin','owner'));
CREATE POLICY "System can insert audit logs" ON audit_logs FOR INSERT WITH CHECK (store_id = get_user_store_id());
