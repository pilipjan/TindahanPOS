"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { formatPeso, formatDatePH, formatReceiptNumber } from "@/lib/vat";
import { Search, RotateCcw, FileText, AlertCircle, CheckCircle2, Download, Printer, X, Calendar, Package } from "lucide-react";

export default function ReportsPage() {
  const supabase = createClient();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Date Filters
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  
  // Store context
  const [storeId, setStoreId] = useState<string | null>(null);

  // Void modal state
  const [showVoidModal, setShowVoidModal] = useState(false);
  const [voidTarget, setVoidTarget] = useState<any>(null);
  const [voidReason, setVoidReason] = useState("");
  const [isVoiding, setIsVoiding] = useState(false);

  // Z-Reading state
  const [showZReadModal, setShowZReadModal] = useState(false);
  const [zReadData, setZReadData] = useState<any>(null);
  const [storeInfo, setStoreInfo] = useState<any>(null);

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("store_id, role, stores(*)")
        .eq("id", user.id)
        .single();
      
      if (profile) {
        setStoreInfo(profile.stores);
        setStoreId(profile.store_id);

        let query = supabase
          .from("transactions")
          .select(`
            *,
            profiles!transactions_cashier_id_fkey(full_name),
            transaction_items(product_id, product_name, quantity, line_total, unit_price),
            payment_splits(method)
          `)
          .eq("store_id", profile.store_id)
          .order("created_at", { ascending: false });

        if (startDate) {
          query = query.gte("created_at", new Date(`${startDate}T00:00:00`).toISOString());
        }
        if (endDate) {
          query = query.lte("created_at", new Date(`${endDate}T23:59:59`).toISOString());
        }
        if (!startDate && !endDate) {
          query = query.limit(300);
        }

        const { data, error: txError } = await query;
        if (!txError && data) setTransactions(data);
      }
    } catch (err) {
      console.error("Reports: Unexpected error", err);
    } finally {
      setLoading(false);
    }
  }, [supabase, startDate, endDate]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  function exportCSV() {
    const headers = ["Receipt No", "Date", "Cashier", "Subtotal", "VAT Amount", "VAT Exempt", "Discount", "Net Sales", "Total Gross", "Payment Method", "Status"].join(",");
    const rows = filtered.map(tx => {
       const method = tx.payment_splits?.[0]?.method || 'Cash';
       const netSales = tx.total_amount - (tx.vat_amount || 0);
       return [
         tx.receipt_number,
         new Date(tx.created_at).toLocaleString('en-PH'),
         `"${tx.profiles?.full_name || 'Unknown'}"`,
         tx.subtotal,
         tx.vat_amount,
         tx.vat_exempt_sales,
         tx.discount_amount,
         netSales,
         tx.total_amount,
         method.toUpperCase(),
         tx.status
       ].join(",");
    });
    
    const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `TindahanPOS_Financial_Ledger_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  async function exportItemizedCSV() {
    if (!storeId) return;
    
    // Fetch live remaining stock for all active products
    const { data: products } = await supabase.from("products").select("name, stock_quantity").eq("store_id", storeId);
    const stockMap = new Map();
    if (products) {
       products.forEach(p => stockMap.set(p.name, p.stock_quantity));
    }

    const headers = ["Receipt No", "Date", "Status", "Product Name", "Qty Sold", "Unit Price", "Line Total", "Final Remaining Stock"].join(",");
    const rows: string[] = [];
    
    filtered.forEach(tx => {
       const date = new Date(tx.created_at).toLocaleString('en-PH');
       tx.transaction_items?.forEach((item: any) => {
          const remaining = stockMap.has(item.product_name) ? stockMap.get(item.product_name) : 'N/A';
          rows.push([
            tx.receipt_number,
            date,
            tx.status,
            `"${item.product_name}"`,
            item.quantity,
            item.unit_price,
            item.line_total,
            remaining
          ].join(","));
       });
    });

    const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `TindahanPOS_Item_Sales_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  function generateZReading() {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const todaysTxs = transactions.filter(tx => new Date(tx.created_at) >= startOfDay && tx.status === 'completed');
    const voidedTxs = transactions.filter(tx => new Date(tx.created_at) >= startOfDay && tx.status === 'voided');

    let cashTotal = 0; let gcashTotal = 0; let mayaTotal = 0;
    let grandTotal = storeInfo?.grand_total_sales || 0;
    let vatable = 0; let vatAmount = 0; let vatExempt = 0; let totalDiscount = 0;

    todaysTxs.forEach(tx => {
      vatable += tx.vatable_sales;
      vatAmount += tx.vat_amount;
      vatExempt += tx.vat_exempt_sales;
      totalDiscount += tx.discount_amount;
      
      const method = tx.payment_splits?.[0]?.method || 'cash';
      if (method === 'cash') cashTotal += tx.total_amount;
      if (method === 'gcash') gcashTotal += tx.total_amount;
      if (method === 'maya') mayaTotal += tx.total_amount;
    });

    setZReadData({
      date: new Date().toISOString(),
      transactionCount: todaysTxs.length,
      voidCount: voidedTxs.length,
      voidAmount: voidedTxs.reduce((sum, tx) => sum + tx.total_amount, 0),
      grossSales: cashTotal + gcashTotal + mayaTotal + totalDiscount,
      totalDiscount,
      netSales: cashTotal + gcashTotal + mayaTotal,
      cashTotal, gcashTotal, mayaTotal,
      vatable, vatAmount, vatExempt,
      grandTotal,
      startOrigin: todaysTxs.length > 0 ? formatReceiptNumber(todaysTxs[todaysTxs.length - 1].receipt_number) : 'N/A',
      endOrigin: todaysTxs.length > 0 ? formatReceiptNumber(todaysTxs[0].receipt_number) : 'N/A',
    });

    setShowZReadModal(true);
  }

  function printZReading() {
    window.print();
  }

  function openVoidModal(tx: any) {
    setVoidTarget(tx);
    setVoidReason("");
    setShowVoidModal(true);
  }

  async function handleVoid(e: React.FormEvent) {
    e.preventDefault();
    if (!voidTarget || voidTarget.status !== 'completed') return;

    setIsVoiding(true);
    try {
      const { data: user } = await supabase.auth.getUser();
      const { data: profile } = await supabase.from("profiles").select("store_id, role").eq("id", user.user?.id).single();
      
      if (profile?.role === 'cashier') {
        alert("Only Admins or Owners can void transactions.");
        return;
      }

      const { error: txError } = await supabase
        .from("transactions")
        .update({ status: 'voided', void_reason: voidReason, voided_by: user.user?.id })
        .eq("id", voidTarget.id);

      if (txError) throw txError;

      await supabase.from("audit_logs").insert({
        store_id: profile?.store_id,
        user_id: user.user?.id,
        action: 'VOID_TRANSACTION',
        entity_type: 'transaction',
        entity_id: voidTarget.id,
        new_values: { reason: voidReason, receipt_number: voidTarget.receipt_number }
      });

      setShowVoidModal(false);
      fetchTransactions();
      alert(`Receipt ${formatReceiptNumber(voidTarget.receipt_number)} successfully voided.`);
      
    } catch (err: any) {
      alert(`Void failed: ${err.message}`);
    } finally {
      setIsVoiding(false);
    }
  }

  const filtered = transactions.filter(tx => {
    const receiptMatch = String(tx.receipt_number).includes(searchQuery);
    const nameMatch = tx.profiles?.full_name ? tx.profiles.full_name.toLowerCase().includes(searchQuery.toLowerCase()) : false;
    return receiptMatch || nameMatch;
  });

  const totalFilteredSales = filtered
    .filter(tx => tx.status === 'completed')
    .reduce((sum, tx) => sum + tx.total_amount, 0);

  return (
    <>
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6 print:hidden">
      
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight" style={{ fontFamily: "var(--font-display)" }}>Reports & Ledger</h1>
          <p className="text-sm text-surface-400 mt-1">Audit transactions, export financial data, and generate Z-Readings.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button 
             onClick={exportItemizedCSV}
             title="Export itemized sales containing remaining stock levels"
             className="flex items-center gap-2 px-4 py-2.5 bg-surface-800 text-surface-200 border border-surface-700 rounded-xl text-sm font-medium hover:bg-surface-700 hover:text-white transition-colors"
          >
             <Package className="w-4 h-4 text-emerald-400" /> Export Item Sales
          </button>
          <button 
             onClick={exportCSV}
             className="flex items-center gap-2 px-4 py-2.5 bg-surface-800 text-surface-200 border border-surface-700 rounded-xl text-sm font-medium hover:bg-surface-700 hover:text-white transition-colors"
          >
             <Download className="w-4 h-4" /> Financial Export
          </button>
          <button 
            onClick={generateZReading}
            disabled={!storeInfo}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 rounded-xl text-sm font-bold hover:bg-indigo-500/20 transition-colors"
          >
             <FileText className="w-4 h-4" /> Generate Z-Reading
          </button>
        </div>
      </div>

      <div className="bg-surface-900 border border-surface-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-surface-800 flex flex-col md:flex-row items-center justify-between gap-4">
          
          <div className="relative flex-1 md:max-w-md w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-500" />
            <input 
              type="text" 
              placeholder="Search by receipt number or cashier..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-surface-950 border border-surface-700 rounded-xl text-sm text-white placeholder-surface-500 focus:border-primary-500 outline-none focus:ring-1 focus:ring-primary-500"
            />
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto">
            <div className="flex items-center gap-2 px-3 py-2 bg-surface-950 rounded-lg border border-surface-800 shrink-0">
               <Calendar className="w-4 h-4 text-surface-500" />
               <input 
                 type="date" 
                 value={startDate}
                 onChange={e => setStartDate(e.target.value)}
                 className="bg-transparent text-sm text-surface-300 outline-none"
               />
               <span className="text-surface-500">-</span>
               <input 
                 type="date" 
                 value={endDate}
                 onChange={e => setEndDate(e.target.value)}
                 className="bg-transparent text-sm text-surface-300 outline-none"
               />
            </div>
            
            <div className="px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg shrink-0">
              <span className="text-xs text-surface-400 uppercase font-bold tracking-wider mr-2">Total Sales</span>
              <span className="text-sm font-bold text-emerald-400">{formatPeso(totalFilteredSales)}</span>
            </div>
          </div>

        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-surface-950/50 text-surface-400 font-medium">
              <tr>
                <th className="px-6 py-4">Receipt No.</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Cashier</th>
                <th className="px-6 py-4">Items</th>
                <th className="px-6 py-4 text-right">Total Gross</th>
                <th className="px-6 py-4 text-center">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-800/60">
              {loading ? (
                <tr><td colSpan={7} className="px-6 py-12 text-center text-surface-400">Loading...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7} className="px-6 py-12 text-center text-surface-400">No transactions found for this selection.</td></tr>
              ) : (
                filtered.map(tx => (
                  <tr key={tx.id} className="hover:bg-surface-800/30 transition-colors">
                    <td className="px-6 py-4 font-mono text-surface-300 font-medium">
                      {formatReceiptNumber(tx.receipt_number)}
                    </td>
                    <td className="px-6 py-4 text-surface-400">{formatDatePH(tx.created_at)}</td>
                    <td className="px-6 py-4">{tx.profiles?.full_name}</td>
                    <td className="px-6 py-4 text-surface-400">{tx.transaction_items?.length || 0} items</td>
                    <td className="px-6 py-4 text-right font-medium text-emerald-400">{formatPeso(tx.total_amount)}</td>
                    <td className="px-6 py-4 text-center">
                      {tx.status === 'completed' ? (
                        <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          <CheckCircle2 className="w-3 h-3" /> OK
                        </span>
                      ) : (
                         <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-semibold bg-coral-500/10 text-coral-400 border border-coral-500/20">
                           <AlertCircle className="w-3 h-3" /> VOIDED
                         </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                       {tx.status === 'completed' && (
                         <button onClick={() => openVoidModal(tx)} className="p-2 text-surface-400 hover:text-coral-400 hover:bg-coral-500/10 rounded-lg ml-2 transition-colors" title="Void Transaction">
                           <RotateCcw className="w-4 h-4" />
                         </button>
                       )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Void Modal */}
      {showVoidModal && voidTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-surface-950/80 backdrop-blur-sm">
          <div className="bg-surface-900 border border-coral-500/50 rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-start gap-4 mb-4">
               <div className="p-3 bg-coral-500/20 text-coral-400 rounded-xl">
                 <AlertCircle className="w-6 h-6" />
               </div>
               <div>
                 <h3 className="text-lg font-bold text-white">Void Transaction</h3>
                 <p className="text-sm text-surface-400 mt-1">
                   You are about to void Receipt No. <strong className="text-white">{formatReceiptNumber(voidTarget.receipt_number)}</strong> for <strong>{formatPeso(voidTarget.total_amount)}</strong>.
                 </p>
               </div>
            </div>

            <form onSubmit={handleVoid}>
              <div className="mb-6">
                <label className="block text-sm font-medium text-surface-400 mb-2">Audit Reason (Required) *</label>
                <textarea 
                  required
                  value={voidReason}
                  onChange={e => setVoidReason(e.target.value)}
                  className="w-full bg-surface-950 border border-surface-700 rounded-xl p-3 text-white focus:border-coral-500 focus:ring-1 focus:ring-coral-500 outline-none"
                  rows={3}
                  placeholder="e.g., Wrong payment method entered, customer returned items..."
                />
              </div>

              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setShowVoidModal(false)} className="px-5 py-2.5 rounded-xl font-medium text-surface-300 hover:text-white hover:bg-surface-800">
                  Cancel
                </button>
                <button type="submit" disabled={isVoiding} className="px-6 py-2.5 rounded-xl bg-coral-500 hover:bg-coral-400 text-white font-bold transition-colors">
                  {isVoiding ? "Voiding..." : "Confirm Void"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Z-Reading Modal Preview (Hidden from print) */}
      {showZReadModal && zReadData && storeInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-surface-950/80 backdrop-blur-sm print:hidden">
          <div className="bg-white text-black p-0 w-[400px] max-h-[90vh] overflow-y-auto shadow-2xl relative">
            
            <button 
              onClick={() => setShowZReadModal(false)} 
              className="absolute right-4 top-4 text-surface-400 hover:text-black hover:bg-gray-100 rounded-full p-1 transition-colors z-10"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="p-8 border-b border-gray-100">
              <h3 className="text-xl font-bold uppercase tracking-tight text-center mb-1">End of Day Reading</h3>
              <p className="text-center text-sm text-gray-500">Preview Layout (Not Printed Yet)</p>
            </div>

            <div className="p-8 pt-4 flex flex-col gap-4">
              <button 
                onClick={printZReading}
                className="w-full py-3.5 bg-indigo-600 text-white rounded-lg font-bold flex items-center justify-center gap-2 hover:bg-indigo-700"
              >
                <Printer className="w-5 h-5" /> Print Thermal Z-Reading
              </button>
              <p className="text-xs text-center text-gray-400">This will trigger the exact format below to your thermal printer.</p>
            </div>

          </div>
        </div>
      )}
    </div>

    {/* Actual Printable Z-Reading (Hidden from screen, shown on print) */}
    {showZReadModal && zReadData && storeInfo && (
      <div className="hidden print:block printable-receipt w-[80mm] mx-auto text-black font-mono text-xs p-4 bg-white">
        
        <div className="text-center mb-4">
          <h1 className="font-bold text-base uppercase">{storeInfo.store_name}</h1>
          <p className="whitespace-pre-line">{storeInfo.store_address}</p>
          <p>VAT Reg TIN: {storeInfo.tin}</p>
          <p>MIN: {storeInfo.min}</p>
          <p>SN: {storeInfo.serial_number}</p>
          
          <h2 className="font-bold text-lg mt-4 border-t border-b border-black py-1">Z-READING</h2>
        </div>

        <div className="space-y-1 mb-4 border-b border-dashed border-black pb-2">
          <div className="flex justify-between"><span>Date:</span> <span>{formatDatePH(zReadData.date)}</span></div>
          <div className="flex justify-between"><span>Beg. OR No:</span> <span>{zReadData.startOrigin}</span></div>
          <div className="flex justify-between"><span>End OR No:</span> <span>{zReadData.endOrigin}</span></div>
        </div>

        <div className="space-y-1 mb-4 border-b border-dashed border-black pb-2">
          <div className="flex justify-between font-bold"><span>Gross Sales</span> <span>{formatPeso(zReadData.grossSales)}</span></div>
          <div className="flex justify-between"><span>Less: SC/PWD Disc.</span> <span>({formatPeso(zReadData.totalDiscount)})</span></div>
          <div className="flex justify-between font-bold border-t border-dashed border-black pt-1 mt-1"><span>Net Sales</span> <span>{formatPeso(zReadData.netSales)}</span></div>
        </div>

        <div className="space-y-1 mb-4 border-b border-dashed border-black pb-2">
           <p className="font-bold border-b border-black inline-block mb-1">Payment Breakdowns</p>
           <div className="flex justify-between"><span>Cash:</span> <span>{formatPeso(zReadData.cashTotal)}</span></div>
           <div className="flex justify-between"><span>GCash:</span> <span>{formatPeso(zReadData.gcashTotal)}</span></div>
           <div className="flex justify-between"><span>Maya:</span> <span>{formatPeso(zReadData.mayaTotal)}</span></div>
        </div>

        <div className="space-y-1 mb-4 border-b border-dashed border-black pb-2">
           <div className="flex justify-between"><span>VATable Sales:</span> <span>{formatPeso(zReadData.vatable)}</span></div>
           <div className="flex justify-between"><span>VAT Amount (12%):</span> <span>{formatPeso(zReadData.vatAmount)}</span></div>
           <div className="flex justify-between"><span>VAT-Exempt Sales:</span> <span>{formatPeso(zReadData.vatExempt)}</span></div>
        </div>

        <div className="space-y-1 mb-4 border-b border-dashed border-black pb-2">
           <div className="flex justify-between text-red-600"><span>Voided Trx Count:</span> <span>{zReadData.voidCount}</span></div>
           <div className="flex justify-between text-red-600"><span>Voided Amount:</span> <span>{formatPeso(zReadData.voidAmount)}</span></div>
        </div>

        <div className="flex justify-between font-bold border-t border-b border-black py-1 mt-4 mb-8">
           <span>Ending Grand Total:</span>
           <span>{formatPeso(zReadData.grandTotal)}</span>
        </div>

        <div className="text-center text-[10px]">
          <p>THIS IS A SYSTEM GENERATED Z-READING</p>
          <p>Software By TindahanPOS</p>
        </div>

      </div>
    )}
    </>
  );
}
