"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Product, Category } from "@/types";
import { 
  Package, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  MoreVertical,
  AlertCircle,
  X,
  Download,
  Truck,
  CalendarClock
} from "lucide-react";
import { formatPeso } from "@/lib/vat";

export default function ProductsPage() {
  const supabase = createClient();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [batches, setBatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Modal State
  const [showProductModal, setShowProductModal] = useState(false);
  const [showReceiveModal, setShowReceiveModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  
  // Form State
  const [formData, setFormData] = useState({
    name: "",
    barcode: "",
    category_id: "",
    price: "",
    cost_price: "",
    stock_quantity: "",
    reorder_point: "5",
    unit: "pcs",
  });
  
  const [receiveData, setReceiveData] = useState({
    product_id: "",
    quantity: "",
    cost_price: "",
    supplier_name: "",
    expiry_date: ""
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    const { data: user } = await supabase.auth.getUser();
    const { data: profile } = await supabase.from("profiles").select("store_id").eq("id", user.user?.id).single();
    
    if (profile) {
      const [productsData, categoriesData, batchesData] = await Promise.all([
        supabase.from("products").select("*").eq("store_id", profile.store_id).order("name"),
        supabase.from("categories").select("*").eq("store_id", profile.store_id).order("name"),
        supabase.from("product_batches").select("product_id, expiry_date, quantity").eq("store_id", profile.store_id).gt("quantity", 0)
      ]);

      if (productsData.data) setProducts(productsData.data);
      if (categoriesData.data) setCategories(categoriesData.data);
      if (batchesData.data) setBatches(batchesData.data);
    }
    setLoading(false);
  }

  function openCreateModal() {
    setEditingProduct(null);
    setFormData({
      name: "",
      barcode: "",
      category_id: categories.length > 0 ? categories[0].id : "",
      price: "",
      cost_price: "",
      stock_quantity: "0",
      reorder_point: "5",
      unit: "pcs",
    });
    setShowProductModal(true);
  }

  function openEditModal(product: Product) {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      barcode: product.barcode || "",
      category_id: product.category_id || "",
      price: product.price.toString(),
      cost_price: product.cost_price?.toString() || "",
      stock_quantity: product.stock_quantity.toString(),
      reorder_point: product.reorder_point.toString(),
      unit: product.unit || "pcs",
    });
    setShowProductModal(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const { data: user } = await supabase.auth.getUser();
      const { data: profile } = await supabase.from("profiles").select("store_id").eq("id", user.user?.id).single();
      
      const payload = {
        store_id: profile?.store_id,
        name: formData.name,
        barcode: formData.barcode || null,
        category_id: formData.category_id || null,
        price: parseFloat(formData.price),
        cost_price: formData.cost_price ? parseFloat(formData.cost_price) : null,
        stock_quantity: parseInt(formData.stock_quantity, 10),
        reorder_point: parseInt(formData.reorder_point, 10),
        unit: formData.unit,
      };

      if (editingProduct) {
        const { error } = await supabase.from("products").update(payload).eq("id", editingProduct.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("products").insert(payload);
        if (error) throw error;
      }

      setShowProductModal(false);
      fetchData();
    } catch (error: any) {
      alert(`Error saving product: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleReceiveSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const { data: user } = await supabase.auth.getUser();
      const { data: profile } = await supabase.from("profiles").select("store_id").eq("id", user.user?.id).single();
      
      const qty = parseInt(receiveData.quantity, 10);
      if (!qty || qty <= 0) throw new Error("Invalid quantity");

      // 1. Insert Batch
      const { error: batchErr } = await supabase.from("product_batches").insert({
        store_id: profile?.store_id,
        product_id: receiveData.product_id,
        quantity: qty,
        cost_price: receiveData.cost_price ? parseFloat(receiveData.cost_price) : 0,
        supplier_name: receiveData.supplier_name || null,
        expiry_date: receiveData.expiry_date || null
      });

      if (batchErr) throw batchErr;

      // 2. Update Product Stock (using a quick RPC or just select + update)
      const targetProduct = products.find(p => p.id === receiveData.product_id);
      if (targetProduct) {
        const { error: prodErr } = await supabase.from("products")
          .update({ stock_quantity: targetProduct.stock_quantity + qty })
          .eq("id", targetProduct.id);
        if (prodErr) throw prodErr;
      }

      setShowReceiveModal(false);
      setReceiveData({ product_id: "", quantity: "", cost_price: "", supplier_name: "", expiry_date: "" });
      fetchData();
    } catch (error: any) {
      alert(`Error receiving stock: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function toggleStatus(product: Product) {
    const { error } = await supabase.from("products").update({ is_active: !product.is_active }).eq("id", product.id);
    if (!error) {
      setProducts(products.map(p => p.id === product.id ? { ...p, is_active: !p.is_active } : p));
    }
  }

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    p.barcode?.includes(searchQuery)
  );

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight" style={{ fontFamily: "var(--font-display)" }}>Inventory Hub</h1>
          <p className="text-sm text-surface-400 mt-1">Manage products, stock levels, and pricing.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
             onClick={() => setShowReceiveModal(true)}
             className="flex items-center gap-2 px-4 py-2 bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 rounded-xl text-sm font-bold hover:bg-indigo-500/20 transition-colors"
          >
             <Truck className="w-4 h-4" /> Receive Stock
          </button>
          <button 
            onClick={openCreateModal}
            className="flex items-center gap-2 px-4 py-2 gradient-primary text-white rounded-xl text-sm font-bold hover:opacity-90 shadow-lg transition-opacity"
          >
             <Plus className="w-4 h-4" /> New Product
          </button>
        </div>
      </div>

      {/* Stats/Alerts Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-surface-900 border border-surface-800 rounded-2xl p-5">
          <div className="text-surface-400 text-sm font-medium mb-1">Total Items</div>
          <div className="text-3xl font-bold text-white">{products.length}</div>
        </div>
        <div className="bg-surface-900 border border-surface-800 rounded-2xl p-5">
          <div className="flex items-center gap-2 text-amber-400 text-sm font-medium mb-1">
             <AlertCircle className="w-4 h-4" /> Low Stock Items
          </div>
          <div className="text-3xl font-bold text-amber-400">
             {products.filter(p => p.stock_quantity > 0 && p.stock_quantity <= p.reorder_point).length}
          </div>
        </div>
        <div className="bg-surface-900 border border-surface-800 rounded-2xl p-5">
          <div className="flex items-center gap-2 text-coral-400 text-sm font-medium mb-1">
             <AlertCircle className="w-4 h-4" /> Out of Stock
          </div>
          <div className="text-3xl font-bold text-coral-400">
             {products.filter(p => p.stock_quantity <= 0).length}
          </div>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-surface-900 border border-surface-800 rounded-2xl overflow-hidden shadow-xl">
        
        {/* Table Toolbar */}
        <div className="p-4 border-b border-surface-800 flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-500" />
            <input 
              type="text" 
              placeholder="Search by name or barcode..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-surface-950 border border-surface-700 rounded-lg text-sm text-white placeholder-surface-500 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none"
            />
          </div>
          <button className="text-surface-400 hover:text-white px-3 py-2 text-sm bg-surface-800 rounded-lg transition-colors border border-surface-700">
            Export <Download className="inline w-4 h-4 ml-1" />
          </button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-surface-950/50 text-surface-400 font-medium">
              <tr>
                <th className="px-6 py-4 font-medium">Product</th>
                <th className="px-6 py-4 font-medium">Barcode</th>
                <th className="px-6 py-4 font-medium">Category</th>
                <th className="px-6 py-4 font-medium text-right">Price</th>
                <th className="px-6 py-4 font-medium text-right">Stock</th>
                <th className="px-6 py-4 font-medium text-center">Status</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-800/60">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-surface-400">Loading products...</td>
                </tr>
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-surface-400 flex flex-col items-center">
                    <Package className="w-8 h-8 mb-2 opacity-50" />
                    No products found matching your search.
                  </td>
                </tr>
              ) : (
                filteredProducts.map(product => {
                  const categoryName = categories.find(c => c.id === product.category_id)?.name || "Uncategorized";
                  const isLow = product.stock_quantity > 0 && product.stock_quantity <= product.reorder_point;
                  const isOut = product.stock_quantity <= 0;
                  
                  // Find soonest expiry
                  const productBatches = batches.filter(b => b.product_id === product.id && b.expiry_date);
                  const soonestBatch = productBatches.sort((a, b) => new Date(a.expiry_date).getTime() - new Date(b.expiry_date).getTime())[0];
                  let expiryWarning = false;
                  let expiryText = "";
                  if (soonestBatch) {
                     const daysUntil = Math.ceil((new Date(soonestBatch.expiry_date).getTime() - new Date().getTime()) / (1000 * 3600 * 24));
                     if (daysUntil <= 0) { expiryWarning = true; expiryText = "Expired!"; }
                     else if (daysUntil <= 14) { expiryWarning = true; expiryText = `Exp in ${daysUntil}d`; }
                  }
                  
                  return (
                    <tr key={product.id} className="hover:bg-surface-800/30 transition-colors">
                      <td className="px-6 py-3">
                        <div className="font-semibold text-white flex items-center gap-2">
                           {product.name}
                           {expiryWarning && <span className="flex items-center gap-1 text-[10px] bg-coral-500/20 text-coral-300 px-1.5 py-0.5 rounded border border-coral-500/30"><CalendarClock className="w-3 h-3" /> {expiryText}</span>}
                        </div>
                        <div className="text-xs text-surface-500">{product.unit}</div>
                      </td>
                      <td className="px-6 py-3 font-mono text-surface-300 text-xs">
                        {product.barcode || <span className="text-surface-600">N/A</span>}
                      </td>
                      <td className="px-6 py-3">
                        <span className="px-2 py-1 bg-surface-800 text-surface-300 rounded text-xs">{categoryName}</span>
                      </td>
                      <td className="px-6 py-3 text-right font-medium text-emerald-400">
                        {formatPeso(product.price)}
                      </td>
                      <td className="px-6 py-3 text-right">
                        <span className={`px-2 py-1 rounded text-xs font-bold ${
                          isOut ? 'bg-coral-500/10 text-coral-400 border border-coral-500/20' : 
                          isLow ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 
                          'text-surface-200'
                        }`}>
                          {product.stock_quantity}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-center">
                        <button 
                          onClick={() => toggleStatus(product)}
                          className={`w-10 h-5 rounded-full relative transition-colors ${product.is_active ? 'bg-emerald-500' : 'bg-surface-700'}`}
                        >
                          <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${product.is_active ? 'left-[22px]' : 'left-0.5'}`} />
                        </button>
                      </td>
                      <td className="px-6 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => openEditModal(product)} className="p-1.5 text-surface-400 hover:text-white hover:bg-surface-700 rounded-lg transition-colors">
                            <Edit className="w-4 h-4" />
                          </button>
                          <button className="p-1.5 text-surface-400 hover:text-coral-400 hover:bg-coral-500/10 rounded-lg transition-colors">
                            <MoreVertical className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── Product Modal ─── */}
      {showProductModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-surface-950/80 backdrop-blur-sm">
          <div className="bg-surface-900 border border-surface-700 rounded-2xl shadow-2xl max-w-xl w-full flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center p-6 border-b border-surface-800">
              <h3 className="text-xl font-bold text-white">{editingProduct ? "Edit Product" : "New Product"}</h3>
              <button onClick={() => setShowProductModal(false)} className="text-surface-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
              
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-surface-400 mb-1.5">Product Name *</label>
                  <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}
                    className="w-full bg-surface-950 border border-surface-700 rounded-xl px-4 py-2.5 text-white outline-none focus:border-primary-500" />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-surface-400 mb-1.5">Barcode</label>
                  <input type="text" value={formData.barcode} onChange={e => setFormData({...formData, barcode: e.target.value})}
                    placeholder="Scan or type..."
                    className="w-full bg-surface-950 border border-surface-700 rounded-xl px-4 py-2.5 text-white font-mono outline-none focus:border-primary-500" />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-surface-400 mb-1.5">Category</label>
                  <select value={formData.category_id} onChange={e => setFormData({...formData, category_id: e.target.value})}
                    className="w-full bg-surface-950 border border-surface-700 rounded-xl px-4 py-2.5 text-white outline-none focus:border-primary-500 appearance-none">
                     <option value="">Ungrouped</option>
                     {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-surface-400 mb-1.5">Selling Price *</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-surface-500 font-medium">₱</span>
                    <input required type="number" step="0.01" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})}
                      className="w-full bg-surface-950 border border-surface-700 rounded-xl pl-8 pr-4 py-2.5 text-white outline-none focus:border-primary-500" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-surface-400 mb-1.5">Cost Price</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-surface-500 font-medium">₱</span>
                    <input type="number" step="0.01" value={formData.cost_price} onChange={e => setFormData({...formData, cost_price: e.target.value})}
                      className="w-full bg-surface-950 border border-surface-700 rounded-xl pl-8 pr-4 py-2.5 text-white outline-none focus:border-primary-500" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-surface-400 mb-1.5">Initial Stock *</label>
                  <input required type="number" value={formData.stock_quantity} onChange={e => setFormData({...formData, stock_quantity: e.target.value})}
                    className="w-full bg-surface-950 border border-surface-700 rounded-xl px-4 py-2.5 text-white outline-none focus:border-primary-500" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-surface-400 mb-1.5">Reorder Point Alert At</label>
                  <input required type="number" value={formData.reorder_point} onChange={e => setFormData({...formData, reorder_point: e.target.value})}
                    className="w-full bg-surface-950 border border-surface-700 rounded-xl px-4 py-2.5 text-white outline-none focus:border-primary-500" />
                </div>
              </div>

              <div className="pt-4 border-t border-surface-800 flex justify-end gap-3">
                <button type="button" onClick={() => setShowProductModal(false)} className="px-5 py-2.5 rounded-xl font-medium text-surface-300 hover:text-white hover:bg-surface-800 transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={isSubmitting} className="px-6 py-2.5 rounded-xl gradient-primary text-white font-bold shadow-lg hover:shadow-[var(--shadow-glow)] transition-all">
                  {isSubmitting ? "Saving..." : "Save Product"}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* ─── Receive Stock Modal ─── */}
      {showReceiveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-surface-950/80 backdrop-blur-sm">
          <div className="bg-surface-900 border border-surface-700 rounded-2xl shadow-2xl max-w-md w-full flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center p-6 border-b border-surface-800 bg-indigo-500/5">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-500/20 rounded-lg text-indigo-400">
                  <Truck className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-bold text-white">Receive Stock</h3>
              </div>
              <button onClick={() => setShowReceiveModal(false)} className="text-surface-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleReceiveSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
              
              <div>
                <label className="block text-sm font-medium text-surface-400 mb-1.5">Select Product *</label>
                <select required value={receiveData.product_id} onChange={e => setReceiveData({...receiveData, product_id: e.target.value})}
                  className="w-full bg-surface-950 border border-surface-700 rounded-xl px-4 py-2.5 text-white outline-none focus:border-indigo-500">
                   <option value="">-- Choose --</option>
                   {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-surface-400 mb-1.5">Qty Received *</label>
                  <input required type="number" value={receiveData.quantity} onChange={e => setReceiveData({...receiveData, quantity: e.target.value})}
                    className="w-full bg-surface-950 border border-surface-700 rounded-xl px-4 py-2.5 text-white outline-none focus:border-indigo-500" />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-surface-400 mb-1.5">Cost per Unit</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-surface-500 font-medium">₱</span>
                    <input type="number" step="0.01" value={receiveData.cost_price} onChange={e => setReceiveData({...receiveData, cost_price: e.target.value})}
                      className="w-full bg-surface-950 border border-surface-700 rounded-xl pl-8 pr-4 py-2.5 text-white outline-none focus:border-indigo-500" />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-surface-400 mb-1.5">Expiry Date (For perishables)</label>
                <input type="date" value={receiveData.expiry_date} onChange={e => setReceiveData({...receiveData, expiry_date: e.target.value})}
                  className="w-full bg-surface-950 border border-surface-700 rounded-xl px-4 py-2.5 text-white outline-none focus:border-indigo-500 [color-scheme:dark]" />
              </div>

              <div>
                <label className="block text-sm font-medium text-surface-400 mb-1.5">Supplier Name</label>
                <input type="text" value={receiveData.supplier_name} onChange={e => setReceiveData({...receiveData, supplier_name: e.target.value})}
                  placeholder="Optional"
                  className="w-full bg-surface-950 border border-surface-700 rounded-xl px-4 py-2.5 text-white outline-none focus:border-indigo-500" />
              </div>

              <div className="pt-4 border-t border-surface-800 flex justify-end gap-3 mt-6">
                <button type="button" onClick={() => setShowReceiveModal(false)} className="px-5 py-2.5 rounded-xl font-medium text-surface-300 hover:text-white hover:bg-surface-800 transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={isSubmitting} className="px-6 py-2.5 rounded-xl bg-indigo-500 text-white font-bold shadow-lg hover:bg-indigo-400 transition-all">
                  {isSubmitting ? "Saving..." : "Confirm Delivery"}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
