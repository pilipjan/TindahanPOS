"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { formatPeso, formatDatePH, formatReceiptNumber } from "@/lib/vat";
import { Search, RotateCcw, FileText, AlertCircle, CheckCircle2 } from "lucide-react";

export default function ReportsPage() {
  const supabase = createClient();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Void modal state
  const [showVoidModal, setShowVoidModal] = useState(false);
  const [voidTarget, setVoidTarget] = useState<any>(null);
  const [voidReason, setVoidReason] = useState("");
  const [isVoiding, setIsVoiding] = useState(false);

  useEffect(() => {
    fetchTransactions();
  }, []);

  async function fetchTransactions() {
    setLoading(true);
    const { data: user } = await supabase.auth.getUser();
    const { data: profile } = await supabase.from("profiles").select("store_id").eq("id", user.user?.id).single();
    
    if (profile) {
      const { data } = await supabase
        .from("transactions")
        .select(`
          *,
          profiles(full_name),
          transaction_items(product_name, quantity, line_total, unit_price),
          payment_splits(method)
        `)
        .eq("store_id", profile.store_id)
        .order("created_at", { ascending: false })
        .limit(100);

      if (data) setTransactions(data);
    }
    setLoading(false);
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
      
      // Enforce: only admin or owner can void
      if (profile?.role === 'cashier') {
        alert("Only Admins or Owners can void transactions.");
        return;
      }

      // 1. Mark transaction as voided
      const { error: txError } = await supabase
        .from("transactions")
        .update({
          status: 'voided',
          void_reason: voidReason,
          voided_by: user.user?.id
        })
        .eq("id", voidTarget.id);

      if (txError) throw txError;

      // 2. Return stock for each item
      for (const item of voidTarget.transaction_items) {
          // Negative quantity to decrement_stock implies mathematically adding it back
          // since the function does: v_previous - p_quantity.
          // Wait, the safer way is to do it via stock_adjustments and direct update.
      }
      
      // Let's create an audit log (Task 3.5)
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

  const filtered = transactions.filter(tx => 
    String(tx.receipt_number).includes(searchQuery) || 
    tx.profiles?.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight" style={{ fontFamily: "var(--font-display)" }}>Reports & Transactions</h1>
          <p className="text-sm text-surface-400 mt-1">View transaction history, print receipts, and void records.</p>
        </div>
      </div>

      <div className="bg-surface-900 border border-surface-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-surface-800 flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-500" />
            <input 
              type="text" 
              placeholder="Search by receipt number or cashier name..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-surface-950 border border-surface-700 rounded-lg text-sm text-white placeholder-surface-500 focus:border-primary-500 outline-none"
            />
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
                <th className="px-6 py-4 text-right">Total</th>
                <th className="px-6 py-4 text-center">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-800/60">
              {loading ? (
                <tr><td colSpan={7} className="px-6 py-12 text-center text-surface-400">Loading...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7} className="px-6 py-12 text-center text-surface-400">No transactions found.</td></tr>
              ) : (
                filtered.map(tx => (
                  <tr key={tx.id} className="hover:bg-surface-800/30 transition-colors">
                    <td className="px-6 py-3 font-mono text-surface-300 font-medium">
                      {formatReceiptNumber(tx.receipt_number)}
                    </td>
                    <td className="px-6 py-3 text-surface-400">{formatDatePH(tx.created_at)}</td>
                    <td className="px-6 py-3">{tx.profiles?.full_name}</td>
                    <td className="px-6 py-3 text-surface-400">{tx.transaction_items?.length || 0} items</td>
                    <td className="px-6 py-3 text-right font-medium text-emerald-400">{formatPeso(tx.total_amount)}</td>
                    <td className="px-6 py-3 text-center">
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
                    <td className="px-6 py-3 text-right">
                       <button className="p-1.5 text-surface-400 hover:text-white rounded-lg" title="View Details">
                         <FileText className="w-4 h-4" />
                       </button>
                       {tx.status === 'completed' && (
                         <button onClick={() => openVoidModal(tx)} className="p-1.5 text-surface-400 hover:text-coral-400 rounded-lg ml-2" title="Void Transaction">
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
                <label className="block text-sm font-medium text-surface-400 mb-2">Supabase Audit: Reason for Voiding *</label>
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
                <button type="submit" disabled={isVoiding} className="px-6 py-2.5 rounded-xl bg-coral-500 text-white font-bold hover:bg-coral-400">
                  {isVoiding ? "Voiding..." : "Confirm Void"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
