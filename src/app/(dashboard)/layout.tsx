import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  FileText,
  Users,
  Settings,
  LogOut,
  ChevronRight,
  Zap
} from "lucide-react";
import Link from "next/link";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const guestCookie = (await cookies()).get("tindahan_guest")?.value;
  const isGuest = guestCookie === "true";

  if (!user && !isGuest) {
    redirect("/login");
  }

  // Fetch the extended profile
  let profile: any = null;
  if (isGuest) {
    const { DEMO_PROFILE, DEMO_STORE } = await import("@/lib/constants/demo-data");
    profile = { ...DEMO_PROFILE, stores: DEMO_STORE };
  } else if (user) {
    const { data } = await supabase
      .from("profiles")
      .select("*, stores(store_name)")
      .eq("id", user.id)
      .single();
    profile = data;
  }

  const role = profile?.role || "cashier";
  const storeName = profile?.stores?.store_name || "My Store";

  const navLinks = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, roles: ["admin", "owner"] },
    { href: "/pos", label: "Cashier (POS)", icon: ShoppingCart, roles: ["admin", "owner", "cashier"] },
    { href: "/products", label: "Inventory", icon: Package, roles: ["admin", "owner", "cashier"] },
    { href: "/reports", label: "Reports", icon: FileText, roles: ["admin", "owner"] },
    { href: "/staff", label: "Staff", icon: Users, roles: ["admin", "owner"] },
    { href: "/settings", label: "Settings", icon: Settings, roles: ["admin", "owner"] },
  ];

  return (
    <div className="flex h-screen bg-surface-950 text-foreground overflow-hidden">
      {/* Sidebar  */}
      <aside className="w-64 border-r border-surface-800 bg-surface-950 flex flex-col hidden md:flex">
        {/* Brand */}
        <div className="h-16 flex items-center gap-2 px-6 border-b border-surface-800">
          <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-white tracking-tight" style={{ fontFamily: "var(--font-display)" }}>
            Tindahan<span className="text-primary-400">POS</span>
          </span>
        </div>

        {/* Store Info */}
        <div className="p-4 mx-2 mt-4 rounded-xl bg-surface-900 border border-surface-800">
          <div className="text-sm font-semibold text-white truncate">{storeName}</div>
          <div className="text-xs text-surface-400 capitalize mt-1 flex items-center gap-1.5">
            <div className={`w-2 h-2 rounded-full ${isGuest ? 'bg-amber-400 animate-pulse' : role === 'admin' || role === 'owner' ? 'bg-primary-400' : 'bg-emerald-400'}`} />
            {isGuest ? 'Demo Mode' : role}
          </div>
        </div>

        {/* Demo mode banner in sidebar */}
        {isGuest && (
          <div className="mx-2 mt-3 px-3 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-center">
            <p className="text-xs text-amber-400 font-medium">✨ You&apos;re in Demo Mode</p>
            <a href="/login" className="text-xs text-amber-300 hover:text-white underline">Sign up to get started →</a>
          </div>
        )}

        {/* Nav Links */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {navLinks
            .filter((link) => link.roles.includes(role))
            .map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-surface-300 hover:text-white hover:bg-surface-800 transition-colors group"
                >
                  <Icon className="w-5 h-5 text-surface-400 group-hover:text-primary-400 transition-colors" />
                  {link.label}
                  <ChevronRight className="w-4 h-4 ml-auto opacity-0 group-hover:opacity-100 text-surface-500 transition-opacity" />
                </Link>
              );
            })}
        </nav>

        {/* User / Logout */}
        <div className="p-4 border-t border-surface-800">
          <div className="flex items-center justify-between">
            <div className="truncate">
              <div className="text-sm font-medium text-white truncate">{isGuest ? 'Demo User' : profile?.full_name}</div>
              <div className="text-xs text-surface-400 truncate">{isGuest ? 'demo@tindahanpos.com' : profile?.email}</div>
            </div>
            
            {isGuest ? (
              <a
                href="/api/auth/demo/exit"
                title="Exit Demo"
                className="p-2 text-surface-400 hover:text-amber-400 hover:bg-amber-400/10 rounded-lg transition-colors"
              >
                <LogOut className="w-5 h-5" />
              </a>
            ) : (
              <form action="/auth/signout" method="post">
                 <button className="p-2 text-surface-400 hover:text-coral-400 hover:bg-coral-400/10 rounded-lg transition-colors">
                   <LogOut className="w-5 h-5" />
                 </button>
              </form>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0">
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
