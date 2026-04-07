"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { 
  TrendingUp, 
  Package, 
  ShoppingBag, 
  AlertTriangle,
  ArrowUpRight
} from "lucide-react";
import { formatPeso } from "@/lib/vat";

export default function DashboardOverview() {
  const supabase = createClient();
  const [stats, setStats] = useState({
    todaySales: 0,
    ordersToday: 0,
    lowStockItems: 0,
    avgOrderValue: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      const { data: user } = await supabase.auth.getUser();
      const { data: profile } = await supabase.from("profiles").select("store_id").eq("id", user.user?.id).single();
      
      if (!profile) return;

      // Today's date range
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);

      // Fetch today's transactions
      const { data: txs } = await supabase
        .from("transactions")
        .select("total_amount")
        .eq("store_id", profile.store_id)
        .gte("created_at", startOfDay.toISOString());

      // Fetch low stock items
      const { data: lowStock } = await supabase
        .from("products")
        .select("id")
        .eq("store_id", profile.store_id)
        .eq("is_active", true)
        .lt("stock_quantity", 5); // Simplification, normally compare to reorder_point

      const totalSales = txs?.reduce((sum, tx) => sum + tx.total_amount, 0) || 0;
      const orderCount = txs?.length || 0;

      setStats({
        todaySales: totalSales,
        ordersToday: orderCount,
        lowStockItems: lowStock?.length || 0,
        avgOrderValue: orderCount > 0 ? totalSales / orderCount : 0
      });

      setLoading(false);
    }

    loadStats();
  }, [supabase]);

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight" style={{ fontFamily: "var(--font-display)" }}>Overview</h1>
          <p className="text-sm text-surface-400 mt-1">Here's what's happening at your store today.</p>
        </div>
      </div>

      {loading ? (
        <div className="h-64 grid place-items-center text-surface-500">Loading metrics...</div>
      ) : (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-surface-900 border border-surface-800 rounded-2xl p-6 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <TrendingUp className="w-16 h-16 text-primary-400" />
              </div>
              <div className="relative z-10">
                <h3 className="text-surface-400 font-medium text-sm mb-2">Today's Sales</h3>
                <div className="text-3xl font-extrabold text-white font-sans tracking-tight">
                  {formatPeso(stats.todaySales)}
                </div>
                <div className="mt-2 flex items-center text-xs text-emerald-400 font-medium">
                  <ArrowUpRight className="w-3 h-3 mr-1" /> +12% from yesterday
                </div>
              </div>
            </div>

            <div className="bg-surface-900 border border-surface-800 rounded-2xl p-6 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <ShoppingBag className="w-16 h-16 text-emerald-400" />
              </div>
              <div className="relative z-10">
                <h3 className="text-surface-400 font-medium text-sm mb-2">Orders Today</h3>
                <div className="text-3xl font-extrabold text-white font-sans tracking-tight">
                  {stats.ordersToday}
                </div>
                <div className="mt-2 text-xs text-surface-500 font-medium">
                  Completed transactions
                </div>
              </div>
            </div>

            <div className="bg-surface-900 border border-surface-800 rounded-2xl p-6 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <AlertTriangle className="w-16 h-16 text-amber-400" />
              </div>
              <div className="relative z-10">
                <h3 className="text-surface-400 font-medium text-sm mb-2">Low Stock Alerts</h3>
                <div className="text-3xl font-extrabold text-amber-400 font-sans tracking-tight">
                  {stats.lowStockItems}
                </div>
                <div className="mt-2 text-xs text-amber-500/70 font-medium">
                  Items below reorder point
                </div>
              </div>
            </div>

            <div className="bg-surface-900 border border-surface-800 rounded-2xl p-6 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <ShoppingBag className="w-16 h-16 text-primary-400" />
              </div>
              <div className="relative z-10">
                <h3 className="text-surface-400 font-medium text-sm mb-2">Avg. Order Value</h3>
                <div className="text-3xl font-extrabold text-white font-sans tracking-tight">
                  {formatPeso(stats.avgOrderValue)}
                </div>
                <div className="mt-2 text-xs text-surface-500 font-medium">
                  Value per transaction
                </div>
              </div>
            </div>
          </div>

          {/* Placeholder for charts (Phase 4) */}
          <div className="bg-surface-900 border border-surface-800 rounded-2xl p-6 h-96 flex flex-col items-center justify-center text-surface-500 text-center gap-4">
             <TrendingUp className="w-12 h-12 opacity-20" />
             <div>
               <h3 className="text-lg font-medium text-surface-300">Sales Analytics Workspace</h3>
               <p className="text-sm mt-1">Detailed charts and graphs will be activated in Phase 4 of the roadmap.</p>
             </div>
          </div>
        </>
      )}

    </div>
  );
}
