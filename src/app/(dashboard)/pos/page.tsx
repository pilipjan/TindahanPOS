"use client";

import { useState, useEffect, useRef } from "react";
import { useCartStore } from "@/stores/cart";
import { createClient } from "@/lib/supabase/client";
import type { Product, DiscountType, PaymentMethod } from "@/types";
import { formatPeso } from "@/lib/vat";
import { 
  Search, 
  Trash2, 
  Minus, 
  Plus, 
  ShoppingBag, 
  UserPlus, 
  CreditCard,
  Keyboard,
  X,
  Package
} from "lucide-react";
import { formatReceiptNumber } from "@/lib/vat";
import Receipt from "@/components/Receipt";

export default function CashierPage() {
  const supabase = createClient();
  const cart = useCartStore();
  const searchInputRef = useRef<HTMLInputElement>(null);
  
  const [products, setProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  // Store & Receipt Data
  const [storeInfo, setStoreInfo] = useState<any>(null);
  const [latestTransaction, setLatestTransaction] = useState<any>(null);
  const [cashierName, setCashierName] = useState("");

  // Modals
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showDiscountModal, setShowDiscountModal] = useState(false);
  const [discountForm, setDiscountForm] = useState({ type: "senior" as DiscountType, idNumber: "", name: "" });
  
  // Payment State
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");
  const [paymentRef, setPaymentRef] = useState("");
  
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    fetchProducts();
    
    // Focus search on mount
    setTimeout(() => {
      searchInputRef.current?.focus();
    }, 100);
  }, []);

  // Keyboard Shortcuts via window event
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if typing in an input other than search
      if (document.activeElement?.tagName === "INPUT" && document.activeElement !== searchInputRef.current) {
        return;
      }
      
      switch (e.key) {
        case "F1": e.preventDefault(); setPaymentMethod("cash"); setShowPaymentModal(true); break;
        case "F2": e.preventDefault(); setPaymentMethod("gcash"); setShowPaymentModal(true); break;
        case "F3": e.preventDefault(); setPaymentMethod("maya"); setShowPaymentModal(true); break;
        case "F8": e.preventDefault(); setShowDiscountModal(true); break;
        case "Escape": 
          setShowPaymentModal(false); 
          setShowDiscountModal(false); 
          searchInputRef.current?.focus();
          break;
      }
    };
    
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  async function fetchProducts() {
    const { data: user } = await supabase.auth.getUser();
    const { data: profile } = await supabase.from("profiles").select("*, stores(*)").eq("id", user.user?.id).single();
    if (!profile) return;

    setStoreInfo(profile.stores);
    setCashierName(profile.full_name);

    const { data } = await supabase
      .from("products")
      .select("*")
      .eq("store_id", profile.store_id)
      .eq("is_active", true)
      .order("name", { ascending: true });

    if (data) setProducts(data);
    setLoading(false);
  }

  // Handle Barcode Scan or Enter Key in Search
  function handleSearchEnter(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && searchQuery.trim() !== "") {
      e.preventDefault();
      
      const exactMatch = products.find(p => p.barcode === searchQuery || p.name.toLowerCase() === searchQuery.toLowerCase());
      
      if (exactMatch) {
        addToCart(exactMatch);
        setSearchQuery(""); // Clear search after successful scan/find
      }
    }
  }

  function addToCart(product: Product) {
    if (product.stock_quantity <= 0) {
      alert("Item out of stock!");
      return;
    }
    
    cart.addItem({
      product_id: product.id,
      product_name: product.name,
      barcode: product.barcode,
      unit_price: product.price,
    });
    searchInputRef.current?.focus();
  }

  async function processCheckout(e: React.FormEvent) {
    e.preventDefault();
    if (cart.items.length === 0) return;
    
    const amountPaid = parseFloat(paymentAmount || "0");
    if (paymentMethod === "cash" && amountPaid < cart.totalAmount) {
      alert("Insufficient payment amount");
      return;
    }

    setIsProcessing(true);

    try {
      // 1. Get user profile and store
      const { data: user } = await supabase.auth.getUser();
      const { data: profile } = await supabase.from("profiles").select("store_id, full_name").eq("id", user.user?.id).single();
      
      if (!profile) throw new Error("Profile not found");

      // 2. Fetch the next unique receipt number from our PostgreSQL function
      const { data: receiptNo, error: rpcError } = await supabase.rpc("get_next_receipt_number", { p_store_id: profile.store_id });
      if (rpcError) throw rpcError;

      // 3. Create Transaction
      const { data: tx, error: txError } = await supabase.from("transactions").insert({
        store_id: profile.store_id,
        cashier_id: user.user?.id,
        receipt_number: receiptNo,
        subtotal: cart.subtotal,
        discount_amount: cart.discountAmount,
        discount_type: cart.discountType,
        discount_id_number: cart.discountIdNumber,
        discount_name: cart.discountName,
        vatable_sales: cart.vatableSales,
        vat_amount: cart.vatAmount,
        vat_exempt_sales: cart.vatExemptSales,
        zero_rated_sales: 0,
        total_amount: cart.totalAmount,
        cash_received: paymentMethod === 'cash' ? amountPaid : cart.totalAmount,
        change_amount: paymentMethod === 'cash' ? (amountPaid - cart.totalAmount) : 0,
        status: "completed",
        is_synced: true // We're online
      }).select("id").single();

      if (txError) throw txError;

      // 4. Create Transaction Items
      const txItems = cart.items.map(item => ({
        transaction_id: tx.id,
        product_id: item.product_id,
        product_name: item.product_name,
        unit_price: item.unit_price,
        quantity: item.quantity,
        line_total: item.line_total,
      }));
      await supabase.from("transaction_items").insert(txItems);

      // 5. Create Payment Split
      await supabase.from("payment_splits").insert({
        transaction_id: tx.id,
        method: paymentMethod,
        amount: cart.totalAmount, // amount due covered
        reference_number: paymentRef || null,
      });

      // Update Product Stock (Decrement via RPC)
      for (const item of cart.items) {
        await supabase.rpc('decrement_stock', { p_product_id: item.product_id, p_quantity: item.quantity });
      }

      // Update Grand Total (Non-resettable counter)
      await supabase.rpc('increment_grand_total', { p_store_id: profile.store_id, p_amount: cart.totalAmount });

      // Save print data
      const printData = {
        receipt_number: receiptNo,
        cashier_name: profile.full_name,
        items: txItems,
        subtotal: cart.subtotal,
        discount_amount: cart.discountAmount,
        discount_type: cart.discountType,
        discount_id_number: cart.discountIdNumber,
        discount_name: cart.discountName,
        vatable_sales: cart.vatableSales,
        vat_amount: cart.vatAmount,
        vat_exempt_sales: cart.vatExemptSales,
        zero_rated_sales: 0,
        total_amount: cart.totalAmount,
        cash_received: paymentMethod === 'cash' ? amountPaid : cart.totalAmount,
        change_amount: paymentMethod === 'cash' ? (amountPaid - cart.totalAmount) : 0,
        created_at: new Date().toISOString(),
      };
      
      setLatestTransaction(printData);

      // Success! Reset UI
      cart.clearCart();
      setShowPaymentModal(false);
      setPaymentAmount("");
      setPaymentRef("");
      setPaymentMethod("cash");
      fetchProducts(); // Refresh stock

      // Print immediately after a slight delay to let React render the Receipt
      setTimeout(() => {
        window.print();
      }, 300);
      
    } catch (error) {
      console.error(error);
      alert("Failed to process transaction. See console for details.");
    } finally {
      setIsProcessing(false);
      searchInputRef.current?.focus();
    }
  }

  // Filter products based on search
  const filteredProducts = products.filter(p => 
    searchQuery === "" || 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    p.barcode?.includes(searchQuery)
  );

  return (
    <>
    <div className="h-full flex flex-col md:flex-row bg-surface-950 print:hidden">
      
      {/* ─── Left Panel: Product Grid ─── */}
      <div className="flex-1 flex flex-col p-4 md:p-6 overflow-hidden">
        
        {/* Search Bar */}
        <div className="relative mb-6">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-surface-400" />
          </div>
          <input
            ref={searchInputRef}
            type="text"
            className="block w-full pl-11 pr-4 py-4 bg-surface-900 border border-surface-700 rounded-xl text-white placeholder-surface-500 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all shadow-sm text-lg"
            placeholder="Scan barcode or search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleSearchEnter}
          />
          <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
             <kbd className="hidden sm:inline-block px-2 py-1 bg-surface-800 border border-surface-700 rounded text-xs text-surface-400 font-mono">
               Enter ↵
             </kbd>
          </div>
        </div>

        {/* Product Grid */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="grid place-items-center h-full text-surface-400">Loading products...</div>
          ) : filteredProducts.length === 0 ? (
            <div className="grid place-items-center h-full text-surface-500 flex-col gap-2">
              <Package className="w-12 h-12 opacity-50" />
              <p>No products found</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 pr-2">
              {filteredProducts.map(product => (
                <button
                  key={product.id}
                  onClick={() => addToCart(product)}
                  disabled={product.stock_quantity <= 0}
                  className={`text-left relative group rounded-2xl border p-4 transition-all duration-200 
                    ${product.stock_quantity > 0 
                      ? 'bg-surface-900 border-surface-700 hover:border-primary-500/50 hover:bg-surface-800 hover:shadow-lg' 
                      : 'bg-surface-900/50 border-surface-800 opacity-60 cursor-not-allowed'}`}
                >
                  {/* Stock Indicator */}
                  <div className={`absolute top-3 right-3 w-2 h-2 rounded-full ${
                    product.stock_quantity > product.reorder_point ? 'bg-emerald-400' 
                    : product.stock_quantity > 0 ? 'bg-amber-400' 
                    : 'bg-coral-500'
                  }`} />
                  
                  <div className="w-12 h-12 mb-3 rounded-xl bg-surface-800 border border-surface-700/50 flex items-center justify-center text-surface-400 group-hover:text-primary-400 transition-colors">
                    <Package className="w-6 h-6" />
                  </div>
                  
                  <h3 className="font-semibold text-white leading-tight mb-1 truncate">{product.name}</h3>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-emerald-400 font-bold">{formatPeso(product.price)}</span>
                    <span className="text-xs text-surface-500">{product.stock_quantity} in stock</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ─── Right Panel: Cart & Checkout ─── */}
      <div className="w-full md:w-[400px] bg-surface-900 border-l border-surface-800 flex flex-col shadow-2xl relative z-10">
        
        {/* Cart Header */}
        <div className="p-4 border-b border-surface-800 flex items-center justify-between">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-primary-400" />
            Current Sale
          </h2>
          {cart.items.length > 0 && (
            <button 
              onClick={() => cart.clearCart()}
              className="text-xs text-surface-400 hover:text-coral-400 p-1.5 hover:bg-coral-400/10 rounded transition-colors"
            >
              Clear
            </button>
          )}
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-2">
          {cart.items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-surface-500 px-6 text-center gap-3">
              <ShoppingBag className="w-12 h-12 opacity-30" />
              <p>Cart is empty. Scan a barcode or select a product.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {cart.items.map((item) => (
                <div key={item.product_id} className="bg-surface-950 border border-surface-800 rounded-xl p-3 flex gap-3 group">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-white truncate text-sm">{item.product_name}</h4>
                    <div className="text-emerald-400 font-medium text-sm mt-1">{formatPeso(item.line_total)}</div>
                  </div>
                  
                  {/* Qty Controls */}
                  <div className="flex flex-col items-end justify-between">
                    <button 
                      onClick={() => cart.removeItem(item.product_id)}
                      className="text-surface-500 hover:text-coral-400 mb-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <div className="flex items-center gap-2 bg-surface-900 border border-surface-700 rounded-lg p-0.5">
                      <button 
                        onClick={() => cart.updateQuantity(item.product_id, item.quantity - 1)}
                        className="w-6 h-6 flex items-center justify-center text-surface-300 hover:bg-surface-800 rounded"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="text-sm font-medium w-4 text-center">{item.quantity}</span>
                      <button 
                        onClick={() => cart.updateQuantity(item.product_id, item.quantity + 1)}
                        className="w-6 h-6 flex items-center justify-center text-surface-300 hover:bg-surface-800 rounded"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Totals Section */}
        <div className="p-4 border-t border-surface-800 bg-surface-950/50 space-y-2">
          {cart.discountType !== "none" && (
            <div className="px-3 py-2 bg-amber-500/10 border border-amber-500/20 rounded-lg flex justify-between text-sm text-amber-500 mb-3">
              <span className="font-medium text-amber-400 uppercase">
                {cart.discountType} DISCOUNT
              </span>
              <span>- {formatPeso(cart.discountAmount)}</span>
            </div>
          )}

          <div className="flex justify-between text-sm text-surface-400 px-1">
            <span>Subtotal</span>
            <span>{formatPeso(cart.subtotal)}</span>
          </div>
          
          <div className="flex justify-between text-sm text-surface-400 px-1">
            <span>VAT (12%) {cart.vatAmount === 0 ? "(Exempt)" : ""}</span>
            <span>{formatPeso(cart.vatAmount)}</span>
          </div>

          <div className="border-t border-surface-800 pt-3 mt-3 flex justify-between items-end px-1">
            <span className="text-lg font-bold text-white">Total</span>
            <span className="text-3xl font-extrabold text-emerald-400 font-sans tracking-tight">
              {formatPeso(cart.totalAmount)}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-4 pt-0 space-y-2 bg-surface-950/50">
          
          <div className="grid grid-cols-2 gap-2 mb-2">
            <button 
              onClick={() => setShowDiscountModal(true)}
              disabled={cart.items.length === 0}
              className="flex items-center justify-center gap-2 bg-surface-800 hover:bg-surface-700 text-surface-300 disabled:opacity-50 disabled:cursor-not-allowed py-2.5 rounded-xl text-xs font-semibold transition-colors border border-surface-700"
            >
              <UserPlus className="w-4 h-4" /> SC/PWD (F8)
            </button>
            <button 
              onClick={() => { setPaymentMethod("maya"); setShowPaymentModal(true); }}
              disabled={cart.items.length === 0}
              className="flex items-center justify-center gap-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-600/30 disabled:opacity-50 disabled:cursor-not-allowed py-2.5 rounded-xl text-xs font-semibold transition-colors"
            >
              <CreditCard className="w-4 h-4" /> GCash/Maya
            </button>
          </div>

          <button
            onClick={() => { setPaymentMethod("cash"); setShowPaymentModal(true); }}
            disabled={cart.items.length === 0}
            className="w-full flex items-center justify-center gap-2 gradient-emerald text-white disabled:opacity-50 disabled:cursor-not-allowed py-4 rounded-xl text-base font-bold shadow-lg hover:shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all"
          >
            <Keyboard className="w-5 h-5" /> Pay Cash (F1)
          </button>
        </div>
      </div>

      {/* ─── Modals ─── */}

      {/* SC/PWD Discount Modal */}
      {showDiscountModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-surface-950/80 backdrop-blur-sm">
          <div className="bg-surface-900 border border-surface-700 rounded-2xl shadow-2xl max-w-sm w-full p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-white">Apply Discount</h3>
              <button onClick={() => setShowDiscountModal(false)} className="text-surface-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-surface-400 mb-1.5">Discount Type</label>
                <div className="grid grid-cols-2 gap-2">
                   <button 
                      onClick={() => setDiscountForm({...discountForm, type: "senior"})}
                      className={`py-2 rounded-lg text-sm font-medium border ${discountForm.type === 'senior' ? 'bg-primary-600/20 text-primary-400 border-primary-500/50' : 'bg-surface-800 text-surface-300 border-surface-700'}`}
                   >Senior Citizen</button>
                   <button 
                      onClick={() => setDiscountForm({...discountForm, type: "pwd"})}
                      className={`py-2 rounded-lg text-sm font-medium border ${discountForm.type === 'pwd' ? 'bg-primary-600/20 text-primary-400 border-primary-500/50' : 'bg-surface-800 text-surface-300 border-surface-700'}`}
                   >PWD</button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-surface-400 mb-1.5">ID Number (Required)</label>
                <input 
                  type="text" 
                  value={discountForm.idNumber}
                  onChange={e => setDiscountForm({...discountForm, idNumber: e.target.value})}
                  autoFocus
                  className="w-full bg-surface-950 border border-surface-700 rounded-xl px-3 py-2 text-white focus:ring-1 focus:ring-primary-500 outline-none"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-surface-400 mb-1.5">Customer Name (Optional)</label>
                <input 
                  type="text" 
                  value={discountForm.name}
                  onChange={e => setDiscountForm({...discountForm, name: e.target.value})}
                  className="w-full bg-surface-950 border border-surface-700 rounded-xl px-3 py-2 text-white outline-none"
                />
              </div>

              <div className="pt-2 flex gap-2">
                 <button 
                    onClick={() => {
                      cart.setDiscount("none");
                      setShowDiscountModal(false);
                    }}
                    className="flex-1 py-2.5 rounded-xl border border-coral-500/30 text-coral-400 font-medium hover:bg-coral-500/10"
                 >Remove</button>
                 <button 
                    onClick={() => {
                      if (!discountForm.idNumber) return alert('ID Number is required by BIR');
                      cart.setDiscount(discountForm.type, discountForm.idNumber, discountForm.name);
                      setShowDiscountModal(false);
                    }}
                    className="flex-[2] py-2.5 rounded-xl gradient-primary text-white font-medium"
                 >Apply 20% + VAT Exemption</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-surface-950/80 backdrop-blur-sm">
          <div className="bg-surface-900 border border-surface-700 rounded-2xl shadow-2xl max-w-sm w-full p-0 overflow-hidden">
             
             {/* Header */}
             <div className="bg-surface-800 p-6 text-center relative border-b border-surface-700">
               <button onClick={() => setShowPaymentModal(false)} className="absolute right-4 top-4 text-surface-400 p-1 hover:text-white rounded">
                 <X className="w-5 h-5" />
               </button>
               <p className="text-surface-400 text-sm font-medium mb-1">Total Due</p>
               <p className="text-4xl font-bold text-white tracking-tight">{formatPeso(cart.totalAmount)}</p>
             </div>

             {/* Body */}
             <form onSubmit={processCheckout} className="p-6 space-y-5">
               
               <div>
                  <label className="block text-sm font-medium text-surface-400 mb-2">Payment Method</label>
                  <div className="grid grid-cols-3 gap-2">
                    <button type="button" onClick={() => setPaymentMethod("cash")} className={`py-2 text-sm rounded border ${paymentMethod === 'cash' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50' : 'bg-surface-950 border-surface-800 text-surface-300'}`}>💵 Cash</button>
                    <button type="button" onClick={() => setPaymentMethod("gcash")} className={`py-2 text-sm rounded border ${paymentMethod === 'gcash' ? 'bg-primary-500/20 text-primary-400 border-primary-500/50' : 'bg-surface-950 border-surface-800 text-surface-300'}`}>📱 GCash</button>
                    <button type="button" onClick={() => setPaymentMethod("maya")} className={`py-2 text-sm rounded border ${paymentMethod === 'maya' ? 'bg-primary-500/20 text-primary-400 border-primary-500/50' : 'bg-surface-950 border-surface-800 text-surface-300'}`}>💳 Maya</button>
                  </div>
               </div>

               {paymentMethod === "cash" ? (
                 <div>
                   <label className="block text-sm font-medium text-surface-400 mb-1.5">Amount Received</label>
                   <input 
                     type="number" 
                     step="0.01" 
                     autoFocus
                     required
                     value={paymentAmount}
                     onChange={(e) => setPaymentAmount(e.target.value)}
                     className="w-full bg-surface-950 border border-surface-700 rounded-xl px-4 py-3 text-white text-lg font-mono outline-none focus:border-emerald-500"
                     placeholder="0.00"
                   />
                   {parseFloat(paymentAmount) >= cart.totalAmount && (
                     <div className="mt-2 text-emerald-400 font-medium text-sm text-right">
                       Change: {formatPeso(parseFloat(paymentAmount) - cart.totalAmount)}
                     </div>
                   )}
                 </div>
               ) : (
                 <div>
                   <label className="block text-sm font-medium text-surface-400 mb-1.5">Reference Number</label>
                   <input 
                     type="text" 
                     required
                     autoFocus
                     value={paymentRef}
                     onChange={(e) => setPaymentRef(e.target.value)}
                     className="w-full bg-surface-950 border border-surface-700 rounded-xl px-4 py-3 text-white font-mono outline-none focus:border-primary-500"
                     placeholder="Enter reference no. from customer app"
                   />
                 </div>
               )}

               <button
                 type="submit"
                 disabled={isProcessing}
                 className="w-full py-4 mt-2 rounded-xl text-white font-bold text-lg shadow-lg flex justify-center items-center gap-2
                 ${isProcessing ? 'bg-surface-700' : 'gradient-emerald hover:scale-[1.02]'} transition-all"
               >
                 {isProcessing ? (
                   <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                 ) : (
                   "Complete Sale (Enter)"
                 )}
               </button>

             </form>
          </div>
        </div>
      )}

    </div>
    
    {latestTransaction && storeInfo && (
      <Receipt storeInfo={storeInfo} transaction={latestTransaction} />
    )}
    </>
  );
}
