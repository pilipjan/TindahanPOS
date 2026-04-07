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
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from "recharts";

export default function DashboardOverview() {
  const supabase = createClient();
  const [stats, setStats] = useState({
    todaySales: 0,
    ordersToday: 0,
    lowStockItems: 0,
    avgOrderValue: 0
  });
  const [chartData, setChartData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      const { data: user } = await supabase.auth.getUser();
      const { data: profile } = await supabase.from("profiles").select("store_id").eq("id", user.user?.id).single();
      
      if (!profile) return;

      // KPI Metrics (Today)
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);

      const { data: txs } = await supabase
        .from("transactions")
        .select("total_amount")
        .eq("status", "completed")
        .eq("store_id", profile.store_id)
        .gte("created_at", startOfDay.toISOString());

      const { data: lowStock } = await supabase
        .from("products")
        .select("id")
        .eq("store_id", profile.store_id)
        .eq("is_active", true)
        .lt("stock_quantity", 5); 

      const totalSales = txs?.reduce((sum, tx) => sum + tx.total_amount, 0) || 0;
      const orderCount = txs?.length || 0;

      setStats({
        todaySales: totalSales,
        ordersToday: orderCount,
        lowStockItems: lowStock?.length || 0,
        avgOrderValue: orderCount > 0 ? totalSales / orderCount : 0
      });

      // Chart Data (Last 7 Days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
      sevenDaysAgo.setHours(0, 0, 0, 0);

      const { data: weekTxs } = await supabase
        .from("transactions")
        .select("total_amount, created_at")
        .eq("status", "completed")
        .eq("store_id", profile.store_id)
        .gte("created_at", sevenDaysAgo.toISOString())
        .order("created_at", { ascending: true });

      // Group by day for Chart
      const groupedData: Record<string, number> = {};
      
      // Initialize last 7 days with 0
      for (let i = 0; i < 7; i++) {
        const d = new Date(sevenDaysAgo);
        d.setDate(d.getDate() + i);
        const dayLabel = d.toLocaleDateString("en-PH", { weekday: 'short', month: 'short', day: 'numeric' });
        groupedData[dayLabel] = 0;
      }

      if (weekTxs) {
        weekTxs.forEach(tx => {
          const d = new Date(tx.created_at);
          const dayLabel = d.toLocaleDateString("en-PH", { weekday: 'short', month: 'short', day: 'numeric' });
          if (groupedData[dayLabel] !== undefined) {
             groupedData[dayLabel] += tx.total_amount;
          }
        });
      }

      const formattedChartData = Object.keys(groupedData).map(key => ({
        name: key,
        sales: groupedData[key]
      }));

      setChartData(formattedChartData);
      setLoading(false);
    }

    loadData();
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
                  <ArrowUpRight className="w-3 h-3 mr-1" /> Active Day
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
                <Package className="w-16 h-16 text-primary-400" />
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

          {/* Revenue Chart */}
          <div className="bg-surface-900 border border-surface-800 rounded-2xl p-6 h-[400px]">
             <h3 className="text-lg font-bold text-white mb-6">Revenue (Last 7 Days)</h3>
             <div className="w-full h-[300px]">
               <ResponsiveContainer width="100%" height="100%">
                 <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 10, bottom: 0 }}>
                   <defs>
                     <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                       <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                       <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                     </linearGradient>
                   </defs>
                   <XAxis 
                     dataKey="name" 
                     stroke="#71717A" 
                     fontSize={12} 
                     tickLine={false} 
                     axisLine={false} 
                   />
                   <YAxis 
                     stroke="#71717A" 
                     fontSize={12} 
                     tickLine={false} 
                     axisLine={false} 
                     tickFormatter={(value) => `₱${value}`} 
                   />
                   <CartesianGrid strokeDasharray="3 3" stroke="#27272A" vertical={false} />
                   <Tooltip 
                     contentStyle={{ backgroundColor: '#18181B', borderColor: '#27272A', borderRadius: '12px', color: '#fff' }}
                     itemStyle={{ color: '#34D399', fontWeight: 'bold' }}
                     formatter={(value: number) => [formatPeso(value), "Sales"]}
                   />
                   <Area 
                     type="monotone" 
                     dataKey="sales" 
                     stroke="#10B981" 
                     strokeWidth={3}
                     fillOpacity={1} 
                     fill="url(#colorSales)" 
                   />
                 </AreaChart>
               </ResponsiveContainer>
             </div>
          </div>
        </>
      )}

    </div>
  );
}
