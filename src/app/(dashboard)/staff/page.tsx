"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Profile, UserRole } from "@/types";
import { 
  Users, 
  Search, 
  Mail, 
  Shield, 
  UserCircle,
  MoreVertical,
  ShieldCheck,
  ShieldAlert,
  Calendar
} from "lucide-react";

export default function StaffPage() {
  const supabase = createClient();
  const [staff, setStaff] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchStaff();
  }, []);

  async function fetchStaff() {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("store_id")
        .eq("id", user.id)
        .single();
      
      if (profile) {
        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("store_id", profile.store_id)
          .order("full_name");

        if (error) throw error;
        if (data) setStaff(data);
      }
    } catch (error: any) {
      console.error("Error fetching staff:", error.message);
    } finally {
      setLoading(false);
    }
  }

  const filteredStaff = staff.filter(member => 
    member.full_name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    member.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case "admin": return <ShieldCheck className="w-4 h-4 text-primary-400" />;
      case "owner": return <ShieldAlert className="w-4 h-4 text-amber-400" />;
      default: return <UserCircle className="w-4 h-4 text-emerald-400" />;
    }
  };

  const getRoleBadgeClass = (role: UserRole) => {
    switch (role) {
      case "admin": return "bg-primary-500/10 text-primary-400 border-primary-500/20";
      case "owner": return "bg-amber-500/10 text-amber-400 border-amber-500/20";
      default: return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight" style={{ fontFamily: "var(--font-display)" }}>Staff Directory</h1>
          <p className="text-sm text-surface-400 mt-1">Manage your team members and their access levels.</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-surface-900 border border-surface-800 rounded-2xl p-5">
          <div className="text-surface-400 text-sm font-medium mb-1 text-center">Total Staff</div>
          <div className="text-3xl font-bold text-white text-center">{staff.length}</div>
        </div>
        <div className="bg-surface-900 border border-surface-800 rounded-2xl p-5">
          <div className="text-surface-400 text-sm font-medium mb-1 text-center">Admins & Owners</div>
          <div className="text-3xl font-bold text-primary-400 text-center">
            {staff.filter(s => s.role === 'admin' || s.role === 'owner').length}
          </div>
        </div>
        <div className="bg-surface-900 border border-surface-800 rounded-2xl p-5">
          <div className="text-surface-400 text-sm font-medium mb-1 text-center">Cashiers</div>
          <div className="text-3xl font-bold text-emerald-400 text-center">
            {staff.filter(s => s.role === 'cashier').length}
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
              placeholder="Search by name or email..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-surface-950 border border-surface-700 rounded-lg text-sm text-white placeholder-surface-500 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-surface-950/50 text-surface-400 font-medium">
              <tr>
                <th className="px-6 py-4 font-medium">Full Name</th>
                <th className="px-6 py-4 font-medium">Email Address</th>
                <th className="px-6 py-4 font-medium">Role</th>
                <th className="px-6 py-4 font-medium">Joined Date</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-800/60">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-surface-400">Loading staff directory...</td>
                </tr>
              ) : filteredStaff.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-surface-400 flex flex-col items-center">
                    <Users className="w-8 h-8 mb-2 opacity-50" />
                    No staff members found matching your search.
                  </td>
                </tr>
              ) : (
                filteredStaff.map(member => (
                  <tr key={member.id} className="hover:bg-surface-800/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center text-[10px] font-bold text-white uppercase">
                          {member.full_name.substring(0, 2)}
                        </div>
                        <div className="font-semibold text-white">{member.full_name}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-surface-300 font-mono text-xs">
                        <Mail className="w-3.5 h-3.5 text-surface-500" />
                        {member.email}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-bold capitalize ${getRoleBadgeClass(member.role)}`}>
                        {getRoleIcon(member.role)}
                        {member.role}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-surface-400 text-xs text-right md:text-left">
                        <Calendar className="w-3.5 h-3.5" />
                        {new Date(member.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="p-1.5 text-surface-400 hover:text-white hover:bg-surface-700 rounded-lg transition-colors">
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
