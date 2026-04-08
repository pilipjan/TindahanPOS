"use client";

import { useEffect, useState, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { 
  AlertTriangle,
  ArrowUpRight,
  TrendingUp,
  Package,
  CalendarClock,
  ShoppingBag
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

type ChartPeriod = "7D" | "30D" | "3M" | "YTD" | "1Y";

export default function DashboardOverview() {
  const supabase = createClient();
  const [stats, setStats] = useState({
    todaySales: 0,
    ordersToday: 0,
    lowStockItems: 0,
    avgOrderValue: 0,
    expiringSoon: 0
  });
  const [chartData, setChartData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [chartPeriod, setChartPeriod] = useState<ChartPeriod>("7D");
  const [periodTotal, setPeriodTotal] = useState(0);

  // Load KPI Metrics (runs only once)
  useEffect(() => {
    async function loadKPIs() {
      const { data: user } = await supabase.auth.getUser();
      const { data: profile } = await supabase.from("profiles").select("store_id").eq("id", user.user?.id).single();
      if (!profile) return;

      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);

      const next7Days = new Date();
      next7Days.setDate(next7Days.getDate() + 7);

      const [txRes, stockRes, expiryRes] = await Promise.all([
        supabase
          .from("transactions")
          .select("total_amount")
          .eq("status", "completed")
          .eq("store_id", profile.store_id)
          .gte("created_at", startOfDay.toISOString()),
        supabase
          .from("products")
          .select("id")
          .eq("store_id", profile.store_id)
          .eq("is_active", true)
          .lt("stock_quantity", 5),
        supabase
          .from("product_batches")
          .select("id")
          .eq("store_id", profile.store_id)
          .gt("quantity", 0)
          .lte("expiry_date", next7Days.toISOString())
      ]);

      const txs = txRes.data || [];
      const totalSales = txs.reduce((sum, tx) => sum + tx.total_amount, 0);
      const orderCount = txs.length;

      setStats({
        todaySales: totalSales,
        ordersToday: orderCount,
        lowStockItems: stockRes.data?.length || 0,
        avgOrderValue: orderCount > 0 ? totalSales / orderCount : 0,
        expiringSoon: expiryRes.data?.length || 0
      });
      setLoading(false);
    }
    loadKPIs();
  }, [supabase]);

  // Load Chart Data based on selected period
  useEffect(() => {
    async function loadChartData() {
      const { data: user } = await supabase.auth.getUser();
      const { data: profile } = await supabase.from("profiles").select("store_id").eq("id", user.user?.id).single();
      if (!profile) return;

      const now = new Date();
      let startDate = new Date();

      if (chartPeriod === "7D") startDate.setDate(now.getDate() - 6);
      else if (chartPeriod === "30D") startDate.setDate(now.getDate() - 29);
      else if (chartPeriod === "3M") startDate.setMonth(now.getMonth() - 2);
      else if (chartPeriod === "YTD") { startDate.setMonth(0); startDate.setDate(1); }
      else if (chartPeriod === "1Y") { startDate.setFullYear(now.getFullYear() - 1); startDate.setDate(1); }

      startDate.setHours(0, 0, 0, 0);

      const { data: weekTxs } = await supabase
        .from("transactions")
        .select("total_amount, created_at")
        .eq("status", "completed")
        .eq("store_id", profile.store_id)
        .gte("created_at", startDate.toISOString())
        .order("created_at", { ascending: true });

      const groupedData: Record<string, number> = {};

      if (chartPeriod === "7D" || chartPeriod === "30D") {
        const days = chartPeriod === "7D" ? 7 : 30;
        for (let i = 0; i < days; i++) {
          const d = new Date(startDate);
          d.setDate(d.getDate() + i);
          groupedData[d.toLocaleDateString("en-PH", { month: 'short', day: 'numeric' })] = 0;
        }
        weekTxs?.forEach(tx => {
           const label = new Date(tx.created_at).toLocaleDateString("en-PH", { month: 'short', day: 'numeric' });
           if (groupedData[label] !== undefined) groupedData[label] += tx.total_amount;
        });
      }
      else if (chartPeriod === "3M") {
        weekTxs?.forEach(tx => {
          const d = new Date(tx.created_at);
          const diff = d.getDate() - d.getDay() + (d.getDay() === 0 ? -6 : 1); 
          const monday = new Date(d.setDate(diff));
          const label = "Wk of " + monday.toLocaleDateString("en-PH", { month: 'short', day: 'numeric' });
          groupedData[label] = (groupedData[label] || 0) + tx.total_amount;
        });
      }
      else {
        // YTD or 1Y
        if (chartPeriod === "YTD") {
           for (let i = 0; i <= now.getMonth(); i++) {
             const label = new Date(now.getFullYear(), i, 1).toLocaleDateString("en-PH", { month: 'short' });
             groupedData[label] = 0;
           }
        } else {
           for (let i = 0; i < 12; i++) {
             const label = new Date(now.getFullYear(), now.getMonth() - 11 + i, 1).toLocaleDateString("en-PH", { month: 'short', year: '2-digit' });
             groupedData[label] = 0;
           }
        }
        weekTxs?.forEach(tx => {
           const label = new Date(tx.created_at).toLocaleDateString("en-PH", { 
             month: 'short', 
             year: chartPeriod === "1Y" ? '2-digit' : undefined 
           });
           if (groupedData[label] !== undefined) groupedData[label] += tx.total_amount;
        });
      }

      const formattedChartData = Object.keys(groupedData).map(key => ({
        name: key,
        sales: groupedData[key]
      }));

      setChartData(formattedChartData);
      setPeriodTotal(weekTxs?.reduce((sum, tx) => sum + tx.total_amount, 0) || 0);
    }

    loadChartData();
  }, [supabase, chartPeriod]);

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
                <CalendarClock className="w-16 h-16 text-coral-400" />
              </div>
              <div className="relative z-10">
                <h3 className="text-surface-400 font-medium text-sm mb-2">Expiring Soon</h3>
                <div className={`text-3xl font-extrabold font-sans tracking-tight ${stats.expiringSoon > 0 ? 'text-coral-400' : 'text-white'}`}>
                  {stats.expiringSoon}
                </div>
                <div className="mt-2 text-xs text-surface-500 font-medium italic">
                  Batches expiring ≤ 7 days
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
          <div className="bg-surface-900 border border-surface-800 rounded-2xl p-6 h-auto">
             <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
               <div>
                  <h3 className="text-lg font-bold text-white mb-1">Revenue Overview</h3>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-extrabold text-emerald-400 font-sans tracking-tight">{formatPeso(periodTotal)}</span>
                    <span className="text-xs text-surface-500 font-medium tracking-wide uppercase">Total this period</span>
                  </div>
               </div>
               
               {/* Quick Tabs */}
               <div className="flex items-center bg-surface-950 p-1 rounded-lg border border-surface-800 self-start">
                 {(["7D", "30D", "3M", "YTD", "1Y"] as ChartPeriod[]).map(period => (
                   <button
                     key={period}
                     onClick={() => setChartPeriod(period)}
                     className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                       chartPeriod === period 
                         ? "bg-surface-800 text-white shadow-sm" 
                         : "text-surface-500 hover:text-surface-300"
                     }`}
                   >
                     {period}
                   </button>
                 ))}
               </div>
             </div>
             
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
                     formatter={(value: any) => [formatPeso(value as number), "Sales"]}
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
