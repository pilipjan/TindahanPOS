"use client";

import { useEffect, useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { Store, Receipt, Save, AlertCircle, Download, Upload, DatabaseBackup, CheckCircle2, Loader2 } from "lucide-react";

export default function SettingsPage() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [role, setRole] = useState<string>("cashier");

  // Backup state
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [backupMessage, setBackupMessage] = useState({ type: "", text: "" });
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [storeData, setStoreData] = useState({
    id: "",
    store_name: "",
    store_address: "",
    tin: "",
    vat_registered: true,
    ptu_number: "",
    ptu_valid_until: "",
    min: "",
    serial_number: "",
    accreditation_no: "",
    accreditation_valid_until: "",
  });

  const [message, setMessage] = useState({ type: "", text: "" });

  useEffect(() => {
    async function fetchStore() {
      const { data: user } = await supabase.auth.getUser();
      const { data: profile } = await supabase.from("profiles").select("*, stores(*)").eq("id", user.user?.id).single();
      
      if (profile) {
        setRole(profile.role);
        if (profile.stores) {
          const s = profile.stores;
          setStoreData({
            id: s.id,
            store_name: s.store_name || "",
            store_address: s.store_address || "",
            tin: s.tin || "",
            vat_registered: s.vat_registered ?? true,
            ptu_number: s.ptu_number || "",
            ptu_valid_until: s.ptu_valid_until || "",
            min: s.min || "",
            serial_number: s.serial_number || "",
            accreditation_no: s.accreditation_no || "",
            accreditation_valid_until: s.accreditation_valid_until || "",
          });
        }
      }
      setLoading(false);
    }
    fetchStore();
  }, []);

  // ── Export backup as JSON ──
  async function exportBackup() {
    if (!storeData.id) return;
    setIsExporting(true);
    setBackupMessage({ type: "", text: "" });
    try {
      const [productsRes, categoriesRes] = await Promise.all([
        supabase.from("products").select("*").eq("store_id", storeData.id),
        supabase.from("categories").select("*").eq("store_id", storeData.id),
      ]);

      const backup = {
        version: "1.0",
        exportedAt: new Date().toISOString(),
        store: storeData,
        products: productsRes.data || [],
        categories: categoriesRes.data || [],
      };

      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `TindahanPOS_Backup_${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setBackupMessage({ type: "success", text: `Backup exported! ${backup.products.length} products and ${backup.categories.length} categories saved.` });
    } catch (err: any) {
      setBackupMessage({ type: "error", text: `Export failed: ${err.message}` });
    } finally {
      setIsExporting(false);
      setTimeout(() => setBackupMessage({ type: "", text: "" }), 6000);
    }
  }

  // ── Import / Restore from JSON backup ──
  async function importBackup(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !storeData.id) return;

    if (!confirm(
      "Restoring a backup will REPLACE all your current products and categories with those from the backup file.\n\nThis cannot be undone. Continue?"
    )) {
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setIsImporting(true);
    setBackupMessage({ type: "", text: "" });
    try {
      const text = await file.text();
      const backup = JSON.parse(text);

      if (!backup.version || !backup.products || !backup.categories) {
        throw new Error("Invalid backup file format.");
      }

      // Delete existing data for this store
      await supabase.from("products").delete().eq("store_id", storeData.id);
      await supabase.from("categories").delete().eq("store_id", storeData.id);

      // Re-insert categories first (products depend on them)
      if (backup.categories.length > 0) {
        const cats = backup.categories.map((c: any) => ({ ...c, store_id: storeData.id }));
        const { error: catErr } = await supabase.from("categories").upsert(cats, { onConflict: "id" });
        if (catErr) throw catErr;
      }

      // Re-insert products
      if (backup.products.length > 0) {
        const prods = backup.products.map((p: any) => ({ ...p, store_id: storeData.id }));
        const { error: prodErr } = await supabase.from("products").upsert(prods, { onConflict: "id" });
        if (prodErr) throw prodErr;
      }

      setBackupMessage({
        type: "success",
        text: `Restore complete! Imported ${backup.products.length} products and ${backup.categories.length} categories from backup (${backup.exportedAt?.split("T")[0] || "unknown date"}).`
      });
    } catch (err: any) {
      setBackupMessage({ type: "error", text: `Restore failed: ${err.message}` });
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
      setTimeout(() => setBackupMessage({ type: "", text: "" }), 8000);
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage({ type: "", text: "" });

    try {
      if (role === 'cashier') throw new Error("Only admins and owners can update store settings.");
      
      const payload = { ...storeData };
      // Prevent updating empty dates if they are empty strings
      if (!payload.ptu_valid_until) delete (payload as any).ptu_valid_until;
      if (!payload.accreditation_valid_until) delete (payload as any).accreditation_valid_until;

      const { error } = await supabase.from("stores").update(payload).eq("id", storeData.id);
      
      if (error) throw error;
      
      setMessage({ type: "success", text: "Settings saved successfully!" });
    } catch (err: any) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setSaving(false);
      setTimeout(() => setMessage({ type: "", text: "" }), 5000);
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    if (type === "checkbox") {
      setStoreData(prev => ({ ...prev, [name]: (e.target as HTMLInputElement).checked }));
    } else {
      setStoreData(prev => ({ ...prev, [name]: value }));
    }
  };

  if (loading) {
    return <div className="p-8 text-surface-400">Loading settings...</div>;
  }

  const canEdit = role === 'admin' || role === 'owner';

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-6">
      
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight" style={{ fontFamily: "var(--font-display)" }}>Settings</h1>
        <p className="text-sm text-surface-400 mt-1">Configure your store information and BIR compliance details.</p>
      </div>

      {message.text && (
        <div className={`p-4 rounded-xl flex items-center gap-3 ${message.type === 'error' ? 'bg-coral-500/10 text-coral-400 border border-coral-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'}`}>
           <AlertCircle className="w-5 h-5" /> {message.text}
        </div>
      )}

      {role === 'cashier' && (
        <div className="p-4 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center gap-3">
           <AlertCircle className="w-5 h-5 flex-shrink-0" />
           <p className="text-sm">You are logged in as a <strong>Cashier</strong>. You can view these settings but cannot change them.</p>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        
        {/* Section 1: Basic Store Info */}
        <div className="bg-surface-900 border border-surface-800 rounded-2xl overflow-hidden shadow-lg">
          <div className="bg-surface-950/50 p-4 border-b border-surface-800 flex items-center gap-3">
            <div className="p-2 bg-primary-500/20 rounded-lg text-primary-400">
               <Store className="w-5 h-5" />
            </div>
            <h2 className="font-bold text-white text-lg">Store Profile</h2>
          </div>
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-surface-400 mb-1.5">Store Name</label>
              <input 
                type="text" name="store_name" value={storeData.store_name} onChange={handleChange} disabled={!canEdit} required
                className="w-full bg-surface-950 border border-surface-700 rounded-xl px-4 py-2.5 text-white outline-none focus:border-primary-500 disabled:opacity-50" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-400 mb-1.5">Store Address (Printed on Receipts)</label>
              <textarea 
                name="store_address" value={storeData.store_address} onChange={handleChange} disabled={!canEdit} required rows={3}
                className="w-full bg-surface-950 border border-surface-700 rounded-xl px-4 py-2.5 text-white outline-none focus:border-primary-500 disabled:opacity-50" 
              />
            </div>
          </div>
        </div>

        {/* Section 2: BIR & Compliance */}
        <div className="bg-surface-900 border border-surface-800 rounded-2xl overflow-hidden shadow-lg">
          <div className="bg-surface-950/50 p-4 border-b border-surface-800 flex items-center gap-3">
            <div className="p-2 bg-emerald-500/20 rounded-lg text-emerald-400">
               <Receipt className="w-5 h-5" />
            </div>
            <h2 className="font-bold text-white text-lg">BIR Configuration</h2>
          </div>
          <div className="p-6 space-y-4">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-surface-400 mb-1.5">Tax Identification Number (TIN)</label>
                  <input 
                    type="text" name="tin" value={storeData.tin} onChange={handleChange} disabled={!canEdit} required placeholder="000-000-000-00000"
                    className="w-full bg-surface-950 border border-surface-700 rounded-xl px-4 py-2.5 text-white outline-none focus:border-emerald-500 font-mono disabled:opacity-50" 
                  />
                </div>
                <div className="flex items-center h-full pt-6">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input 
                      type="checkbox" name="vat_registered" checked={storeData.vat_registered} onChange={handleChange} disabled={!canEdit}
                      className="w-5 h-5 rounded border-surface-700 text-emerald-500 focus:ring-emerald-500 bg-surface-950"
                    />
                    <span className="text-white font-medium">VAT Registered</span>
                  </label>
                </div>

                <div className="col-span-2 border-t border-surface-800 my-2 pt-4"><h3 className="text-surface-300 font-medium">Permit to Use (PTU) CRM / POS</h3></div>

                <div>
                  <label className="block text-sm font-medium text-surface-400 mb-1.5">PTU Number</label>
                  <input 
                    type="text" name="ptu_number" value={storeData.ptu_number} onChange={handleChange} disabled={!canEdit}
                    className="w-full bg-surface-950 border border-surface-700 rounded-xl px-4 py-2.5 text-white outline-none focus:border-emerald-500 disabled:opacity-50" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-surface-400 mb-1.5">PTU Valid Until</label>
                  <input 
                    type="date" name="ptu_valid_until" value={storeData.ptu_valid_until} onChange={handleChange} disabled={!canEdit}
                    className="w-full bg-surface-950 border border-surface-700 rounded-xl px-4 py-2.5 text-white outline-none focus:border-emerald-500 disabled:opacity-50" 
                  />
                </div>

                <div className="col-span-2 border-t border-surface-800 my-2 pt-4"><h3 className="text-surface-300 font-medium">Hardware Details</h3></div>

                <div>
                  <label className="block text-sm font-medium text-surface-400 mb-1.5">Machine Identification Number (MIN)</label>
                  <input 
                    type="text" name="min" value={storeData.min} onChange={handleChange} disabled={!canEdit}
                    className="w-full bg-surface-950 border border-surface-700 rounded-xl px-4 py-2.5 text-white outline-none focus:border-emerald-500 font-mono disabled:opacity-50" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-surface-400 mb-1.5">Serial Number</label>
                  <input 
                    type="text" name="serial_number" value={storeData.serial_number} onChange={handleChange} disabled={!canEdit}
                    className="w-full bg-surface-950 border border-surface-700 rounded-xl px-4 py-2.5 text-white outline-none focus:border-emerald-500 font-mono disabled:opacity-50" 
                  />
                </div>
             </div>
          </div>
        </div>
        
        {canEdit && (
          <div className="flex justify-end pt-4">
            <button type="submit" disabled={saving} className="flex items-center gap-2 px-8 py-3 gradient-emerald text-white rounded-xl font-bold shadow-lg hover:shadow-[var(--shadow-glow)] transition-all">
              <Save className="w-5 h-5" />
              {saving ? "Saving Changes..." : "Save Settings"}
            </button>
          </div>
        )}

      </form>

      {/* ── Data Management Section ── */}
      <div className="bg-surface-900 border border-surface-800 rounded-2xl overflow-hidden shadow-lg">
        <div className="bg-surface-950/50 p-4 border-b border-surface-800 flex items-center gap-3">
          <div className="p-2 bg-indigo-500/20 rounded-lg text-indigo-400">
            <DatabaseBackup className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-bold text-white text-lg">Data Management</h2>
            <p className="text-xs text-surface-500">Export or restore your store inventory and settings.</p>
          </div>
        </div>
        <div className="p-6 space-y-5">

          {/* Backup status message */}
          {backupMessage.text && (
            <div className={`flex items-start gap-3 p-4 rounded-xl border text-sm ${
              backupMessage.type === "error"
                ? "bg-coral-500/10 text-coral-300 border-coral-500/20"
                : "bg-emerald-500/10 text-emerald-300 border-emerald-500/20"
            }`}>
              {backupMessage.type === "error"
                ? <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                : <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" />}
              <span>{backupMessage.text}</span>
            </div>
          )}

          {/* Export */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-surface-950/50 border border-surface-800 rounded-xl">
            <div>
              <h3 className="font-semibold text-white">Export Backup</h3>
              <p className="text-xs text-surface-500 mt-0.5">
                Downloads a JSON file with all your products, categories, and store info.
              </p>
            </div>
            <button
              onClick={exportBackup}
              disabled={isExporting || !storeData.id}
              className="flex items-center gap-2 px-5 py-2.5 bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 rounded-xl text-sm font-bold hover:bg-indigo-500/20 transition-colors disabled:opacity-50 shrink-0"
            >
              {isExporting
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Exporting...</>
                : <><Download className="w-4 h-4" /> Export JSON</>}
            </button>
          </div>

          {/* Restore */}
          {canEdit && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-surface-950/50 border border-amber-500/10 rounded-xl">
              <div>
                <h3 className="font-semibold text-white">Restore from Backup</h3>
                <p className="text-xs text-surface-500 mt-0.5">
                  Upload a previously exported JSON file. <strong className="text-amber-400">This will replace all current products and categories.</strong>
                </p>
              </div>
              <div className="shrink-0">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json"
                  className="hidden"
                  id="backup-file-input"
                  onChange={importBackup}
                />
                <label
                  htmlFor="backup-file-input"
                  className={`flex items-center gap-2 px-5 py-2.5 bg-amber-500/10 text-amber-300 border border-amber-500/20 rounded-xl text-sm font-bold hover:bg-amber-500/20 transition-colors cursor-pointer ${
                    isImporting ? "opacity-50 pointer-events-none" : ""
                  }`}
                >
                  {isImporting
                    ? <><Loader2 className="w-4 h-4 animate-spin" /> Restoring...</>
                    : <><Upload className="w-4 h-4" /> Restore JSON</>}
                </label>
              </div>
            </div>
          )}

        </div>
      </div>

    </div>
  );
}
