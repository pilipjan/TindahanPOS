"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Profile, UserRole } from "@/types";
import { 
  Users, 
  Search, 
  Mail, 
  UserCircle,
  ShieldCheck,
  ShieldAlert,
  Calendar,
  UserPlus,
  Link2,
  Copy,
  Check,
  X,
  Trash2,
  ChevronDown,
  AlertCircle,
  Clock,
  RefreshCw
} from "lucide-react";

type Invite = {
  id: string;
  token: string;
  role: string;
  expires_at: string;
  used_by: string | null;
  created_at: string;
};

export default function StaffPage() {
  const supabase = createClient();
  const [staff, setStaff] = useState<Profile[]>([]);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentUserId, setCurrentUserId] = useState<string>("");
  const [currentUserRole, setCurrentUserRole] = useState<string>("");
  const [storeId, setStoreId] = useState<string>("");

  // Invite modal state
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteRole, setInviteRole] = useState<"cashier" | "admin">("cashier");
  const [generatedLink, setGeneratedLink] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  // Delete confirmation
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setCurrentUserId(user.id);

      const { data: profile } = await supabase
        .from("profiles")
        .select("store_id, role")
        .eq("id", user.id)
        .single();
      
      if (profile) {
        setStoreId(profile.store_id);
        setCurrentUserRole(profile.role);

        const [staffRes, invitesRes] = await Promise.all([
          supabase
            .from("profiles")
            .select("*")
            .eq("store_id", profile.store_id)
            .order("full_name"),
          supabase
            .from("store_invites")
            .select("*")
            .eq("store_id", profile.store_id)
            .is("used_by", null)
            .gt("expires_at", new Date().toISOString())
            .order("created_at", { ascending: false })
        ]);

        if (staffRes.data) setStaff(staffRes.data);
        if (invitesRes.data) setInvites(invitesRes.data as Invite[]);
      }
    } catch (error: any) {
      console.error("Error fetching staff:", error.message);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filteredStaff = staff.filter(member => 
    member.full_name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    member.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const canManage = currentUserRole === "owner" || currentUserRole === "admin";

  async function generateInviteLink() {
    if (!storeId) return;
    setIsGenerating(true);
    setGeneratedLink("");
    try {
      const { data: user } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from("store_invites")
        .insert({
          store_id: storeId,
          created_by: user.user?.id,
          role: inviteRole
        })
        .select()
        .single();

      if (error) throw error;

      const link = `${window.location.origin}/login?invite=${data.token}`;
      setGeneratedLink(link);
      // Refresh invites list
      fetchData();
    } catch (err: any) {
      alert(`Error generating invite: ${err.message}`);
    } finally {
      setIsGenerating(false);
    }
  }

  async function copyToClipboard(text: string) {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  async function revokeInvite(inviteId: string) {
    const { error } = await supabase.from("store_invites").delete().eq("id", inviteId);
    if (!error) {
      setInvites(prev => prev.filter(i => i.id !== inviteId));
    }
  }

  async function changeRole(profileId: string, newRole: string) {
    if (profileId === currentUserId) {
      alert("You cannot change your own role.");
      return;
    }
    const { error } = await supabase
      .from("profiles")
      .update({ role: newRole })
      .eq("id", profileId);
    if (!error) {
      setStaff(prev => prev.map(s => s.id === profileId ? { ...s, role: newRole as UserRole } : s));
    } else {
      alert(`Error changing role: ${error.message}`);
    }
  }

  async function removeStaff(profileId: string) {
    if (profileId === currentUserId) {
      alert("You cannot remove yourself.");
      return;
    }
    if (!confirm("Remove this staff member? They will lose access to the store.")) return;
    // We can only delete from profiles; auth.users deletion requires admin. 
    // Best practice: set role to inactive or remove profile.
    const { error } = await supabase.from("profiles").delete().eq("id", profileId);
    if (!error) {
      setStaff(prev => prev.filter(s => s.id !== profileId));
    } else {
      alert(`Error removing staff: ${error.message}`);
    }
  }

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
        {canManage && (
          <button
            onClick={() => { setShowInviteModal(true); setGeneratedLink(""); }}
            className="flex items-center gap-2 px-4 py-2.5 gradient-primary text-white rounded-xl text-sm font-bold hover:opacity-90 shadow-lg transition-opacity"
          >
            <UserPlus className="w-4 h-4" /> Invite Member
          </button>
        )}
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

      {/* Pending Invites (owners/admins only) */}
      {canManage && invites.length > 0 && (
        <div className="bg-surface-900 border border-amber-500/20 rounded-2xl overflow-hidden">
          <div className="px-5 py-3 border-b border-surface-800 flex items-center justify-between">
            <div className="flex items-center gap-2 text-amber-400 text-sm font-bold">
              <Clock className="w-4 h-4" />
              Pending Invites ({invites.length})
            </div>
          </div>
          <div className="divide-y divide-surface-800/60">
            {invites.map(invite => (
              <div key={invite.id} className="px-5 py-3 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-1.5 bg-amber-500/10 rounded-lg">
                    <Link2 className="w-3.5 h-3.5 text-amber-400" />
                  </div>
                  <div>
                    <span className="text-xs font-bold capitalize text-white">{invite.role}</span>
                    <span className="text-surface-500 text-xs ml-2">
                      · Expires {new Date(invite.expires_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => copyToClipboard(`${window.location.origin}/login?invite=${invite.token}`)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-surface-800 hover:bg-surface-700 text-surface-300 rounded-lg transition-colors"
                  >
                    <Copy className="w-3 h-3" /> Copy Link
                  </button>
                  <button
                    onClick={() => revokeInvite(invite.id)}
                    className="p-1.5 text-surface-500 hover:text-coral-400 hover:bg-coral-500/10 rounded-lg transition-colors"
                    title="Revoke invite"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

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
          <button onClick={fetchData} className="p-2 text-surface-400 hover:text-white transition-colors" title="Refresh">
            <RefreshCw className="w-4 h-4" />
          </button>
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
                {canManage && <th className="px-6 py-4 font-medium text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-800/60">
              {loading ? (
                <tr>
                  <td colSpan={canManage ? 5 : 4} className="px-6 py-12 text-center text-surface-400">Loading staff directory...</td>
                </tr>
              ) : filteredStaff.length === 0 ? (
                <tr>
                  <td colSpan={canManage ? 5 : 4} className="px-6 py-12 text-center text-surface-400">
                    <Users className="w-8 h-8 mb-2 opacity-50 mx-auto" />
                    No staff members found.
                  </td>
                </tr>
              ) : (
                filteredStaff.map(member => (
                  <tr key={member.id} className={`hover:bg-surface-800/30 transition-colors ${member.id === currentUserId ? 'bg-primary-500/5' : ''}`}>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center text-[10px] font-bold text-white uppercase">
                          {member.full_name.substring(0, 2)}
                        </div>
                        <div>
                          <div className="font-semibold text-white">{member.full_name}</div>
                          {member.id === currentUserId && (
                            <div className="text-[10px] text-primary-400 font-medium">You</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-surface-300 font-mono text-xs">
                        <Mail className="w-3.5 h-3.5 text-surface-500" />
                        {member.email}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {canManage && member.id !== currentUserId && member.role !== 'owner' ? (
                        <div className="relative inline-block">
                          <select
                            value={member.role}
                            onChange={e => changeRole(member.id, e.target.value)}
                            className={`appearance-none pr-6 pl-2.5 py-1 rounded-full border text-xs font-bold capitalize cursor-pointer outline-none ${getRoleBadgeClass(member.role as UserRole)} bg-transparent`}
                          >
                            <option value="cashier">cashier</option>
                            <option value="admin">admin</option>
                          </select>
                          <ChevronDown className="absolute right-1 top-1/2 -translate-y-1/2 w-3 h-3 pointer-events-none" />
                        </div>
                      ) : (
                        <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-bold capitalize ${getRoleBadgeClass(member.role as UserRole)}`}>
                          {getRoleIcon(member.role as UserRole)}
                          {member.role}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-surface-400 text-xs">
                        <Calendar className="w-3.5 h-3.5" />
                        {new Date(member.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                      </div>
                    </td>
                    {canManage && (
                      <td className="px-6 py-4 text-right">
                        {member.id !== currentUserId && member.role !== 'owner' && (
                          <button
                            onClick={() => removeStaff(member.id)}
                            className="p-1.5 text-surface-500 hover:text-coral-400 hover:bg-coral-500/10 rounded-lg transition-colors"
                            title="Remove from store"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Non-admin notice */}
      {!canManage && (
        <div className="flex items-center gap-3 p-4 bg-surface-900 border border-surface-800 rounded-xl text-surface-400 text-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-amber-400" />
          You are logged in as a Cashier. Only Owners and Admins can invite or manage staff.
        </div>
      )}

      {/* ─── Invite Modal ─── */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-surface-950/80 backdrop-blur-sm">
          <div className="bg-surface-900 border border-surface-700 rounded-2xl shadow-2xl max-w-md w-full">
            <div className="flex justify-between items-center p-6 border-b border-surface-800">
              <div>
                <h3 className="text-xl font-bold text-white">Invite a Staff Member</h3>
                <p className="text-sm text-surface-400 mt-0.5">Generate a one-time link to share with your staff.</p>
              </div>
              <button onClick={() => setShowInviteModal(false)} className="text-surface-400 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Role Selector */}
              <div>
                <label className="block text-sm font-medium text-surface-400 mb-2">Staff Role</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setInviteRole("cashier")}
                    className={`p-3 rounded-xl border text-left transition-all ${inviteRole === 'cashier' ? 'border-emerald-500 bg-emerald-500/10' : 'border-surface-700 hover:border-surface-600'}`}
                  >
                    <UserCircle className={`w-5 h-5 mb-1 ${inviteRole === 'cashier' ? 'text-emerald-400' : 'text-surface-500'}`} />
                    <div className={`text-sm font-bold ${inviteRole === 'cashier' ? 'text-emerald-300' : 'text-surface-300'}`}>Cashier</div>
                    <div className="text-xs text-surface-500 mt-0.5">POS access only</div>
                  </button>
                  <button
                    onClick={() => setInviteRole("admin")}
                    className={`p-3 rounded-xl border text-left transition-all ${inviteRole === 'admin' ? 'border-primary-500 bg-primary-500/10' : 'border-surface-700 hover:border-surface-600'}`}
                  >
                    <ShieldCheck className={`w-5 h-5 mb-1 ${inviteRole === 'admin' ? 'text-primary-400' : 'text-surface-500'}`} />
                    <div className={`text-sm font-bold ${inviteRole === 'admin' ? 'text-primary-300' : 'text-surface-300'}`}>Admin</div>
                    <div className="text-xs text-surface-500 mt-0.5">Full dashboard access</div>
                  </button>
                </div>
              </div>

              {/* Generate Button */}
              {!generatedLink ? (
                <button
                  onClick={generateInviteLink}
                  disabled={isGenerating}
                  className="w-full flex items-center justify-center gap-2 py-3 gradient-primary text-white font-bold rounded-xl hover:opacity-90 transition-opacity disabled:opacity-60"
                >
                  {isGenerating ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <><Link2 className="w-4 h-4" /> Generate Invite Link</>
                  )}
                </button>
              ) : (
                <div className="space-y-3">
                  <div className="p-3 bg-surface-950 border border-emerald-500/30 rounded-xl">
                    <p className="text-xs text-emerald-400 font-medium mb-1.5">✓ Link Ready — Expires in 7 days</p>
                    <p className="text-xs text-surface-300 font-mono break-all leading-relaxed">{generatedLink}</p>
                  </div>
                  <button
                    onClick={() => copyToClipboard(generatedLink)}
                    className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold transition-all ${copied ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-surface-800 text-white border border-surface-700 hover:bg-surface-700'}`}
                  >
                    {copied ? <><Check className="w-4 h-4" /> Copied!</> : <><Copy className="w-4 h-4" /> Copy to Clipboard</>}
                  </button>
                  <button
                    onClick={() => { setGeneratedLink(""); }}
                    className="w-full py-2 text-sm text-surface-400 hover:text-white transition-colors"
                  >
                    Generate another link
                  </button>
                </div>
              )}

              <p className="text-xs text-center text-surface-500">
                Share this link with your staff. Each link can only be used once and expires in 7 days.
              </p>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
