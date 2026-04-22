"use client";

import { useState } from "react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";

const STATUS_BADGE_CLASS: Record<string, string> = {
  pending:   "bg-yellow-100 text-yellow-800 border-yellow-200",
  approved:  "bg-green-100 text-green-800 border-green-200",
  denied:    "bg-red-100 text-red-800 border-red-200",
  expired:   "bg-slate-100 text-slate-600 border-slate-200",
  cancelled: "bg-slate-100 text-slate-600 border-slate-200",
};

const ROLE_BADGE_CLASS: Record<string, string> = {
  user:        "bg-slate-100 text-slate-600 border-slate-200",
  store_owner: "bg-blue-100 text-blue-800 border-blue-200",
  approver:    "bg-yellow-100 text-yellow-800 border-yellow-200",
  admin:       "bg-red-100 text-red-800 border-red-200",
};

const ROLE_LABEL: Record<string, string> = {
  user: "User",
  store_owner: "Store Owner",
  approver: "Approver",
  admin: "Admin",
};

type Stats = {
  totalAds: number;
  pendingAds: number;
  approvedAds: number;
  deniedAds: number;
  totalUsers: number;
  totalLocations: number;
  totalRevenueCents: number;
};

type User = {
  id: string;
  name: string;
  email: string;
  role: string;
  emailVerified: boolean;
  twoFactorEnabled: boolean;
  createdAt: string;
};

type Ad = {
  id: string;
  title: string;
  imageUrl: string;
  status: string;
  paymentStatus: string;
  reviewNote: string | null;
  startedAt: string;
  endedAt: string;
  createdAt: string;
  user: { id: string; name: string; email: string };
  location: { id: string; storeName: string; slug: string };
};

function StatCard({ label, value, sub, accentClass }: { label: string; value: string | number; sub?: string; accentClass?: string }) {
  return (
    <div className="flex-1 basis-40 bg-white rounded-xl border border-[#D8E4EE] px-6 py-5">
      <div className="text-[11px] font-semibold text-[#6B8FA8] uppercase tracking-[0.05em] mb-2">{label}</div>
      <div className={`text-[28px] font-bold leading-none ${accentClass ?? "text-[#1A3A5C]"}`}>{value}</div>
      {sub && <div className="text-xs text-[#6B8FA8] mt-1">{sub}</div>}
    </div>
  );
}

export default function AdminPanelClient({
  initialStats,
  initialUsers,
  initialAds,
  currentUserId,
}: {
  initialStats: Stats;
  initialUsers: User[];
  initialAds: Ad[];
  currentUserId: string;
}) {
  const [activeTab, setActiveTab] = useState<"overview" | "users" | "ads">("overview");
  const [stats] = useState<Stats>(initialStats);

  // Users state
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [roleChanging, setRoleChanging] = useState<string | null>(null);
  const [userToast, setUserToast] = useState<{ msg: string; ok: boolean } | null>(null);

  // Ads state
  const [ads, setAds] = useState<Ad[]>(initialAds);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [overriding, setOverriding] = useState<string | null>(null);
  const [adToast, setAdToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const [overrideNote, setOverrideNote] = useState<Record<string, string>>({});

  function showUserToast(msg: string, ok: boolean) {
    setUserToast({ msg, ok });
    setTimeout(() => setUserToast(null), 3500);
  }

  function showAdToast(msg: string, ok: boolean) {
    setAdToast({ msg, ok });
    setTimeout(() => setAdToast(null), 3500);
  }

  async function changeRole(userId: string, role: string) {
    setRoleChanging(userId);
    try {
      const res = await fetch(`/api/admin/users/${userId}/role`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role } : u));
      showUserToast(`Role updated to ${ROLE_LABEL[role]}`, true);
    } catch (e: any) {
      showUserToast(e.message || "Failed to update role", false);
    } finally {
      setRoleChanging(null);
    }
  }

  async function overrideAdStatus(adId: string, status: string) {
    setOverriding(adId);
    try {
      const res = await fetch("/api/admin/ads", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adId, status, reviewNote: overrideNote[adId] ?? "" }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      setAds(prev => prev.map(a => a.id === adId ? { ...a, status, reviewNote: overrideNote[adId] ?? a.reviewNote } : a));
      showAdToast("Ad status overridden", true);
    } catch (e: any) {
      showAdToast(e.message || "Override failed", false);
    } finally {
      setOverriding(null);
    }
  }

  const filteredAds = statusFilter === "all" ? ads : ads.filter(a => a.status === statusFilter);

  const tabClass = (tab: "overview" | "users" | "ads") =>
    `px-[18px] py-2 rounded-lg text-[13px] transition-all border-0 cursor-pointer
     ${activeTab === tab
       ? "bg-[#1A3A5C] text-white font-semibold"
       : "bg-transparent text-[#6B8FA8] font-normal hover:bg-white/50"}`;

  return (
    <div className="max-w-[920px]">
      {/* Toasts */}
      {userToast && (
        <div className={`fixed top-6 right-6 z-[9999] px-5 py-3 rounded-xl text-sm font-medium text-white shadow-lg ${userToast.ok ? "bg-green-800" : "bg-red-800"}`}>
          {userToast.msg}
        </div>
      )}
      {adToast && (
        <div className={`fixed top-[68px] right-6 z-[9999] px-5 py-3 rounded-xl text-sm font-medium text-white shadow-lg ${adToast.ok ? "bg-green-800" : "bg-red-800"}`}>
          {adToast.msg}
        </div>
      )}

      {/* Header */}
      <div className="mb-7">
        <h1 className="font-serif text-[26px] font-bold text-[#1A3A5C] mb-1.5">Admin Panel</h1>
        <p className="text-[#6B8FA8] text-sm">Platform-wide oversight — users, ads, and revenue.</p>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1.5 mb-7 bg-[#F0F5FA] rounded-[10px] p-1 w-fit">
        <button className={tabClass("overview")} onClick={() => setActiveTab("overview")}>Overview</button>
        <button className={tabClass("users")} onClick={() => setActiveTab("users")}>Users ({stats.totalUsers})</button>
        <button className={tabClass("ads")} onClick={() => setActiveTab("ads")}>All Ads ({stats.totalAds})</button>
      </div>

      {/* OVERVIEW TAB */}
      {activeTab === "overview" && (
        <div>
          {/* Stat cards */}
          <div className="flex flex-wrap gap-4 mb-8">
            <StatCard label="Total Revenue" value={`$${(stats.totalRevenueCents / 100).toFixed(2)}`} sub="from paid ads" accentClass="text-green-800" />
            <StatCard label="Total Ads" value={stats.totalAds} />
            <StatCard label="Pending Review" value={stats.pendingAds} accentClass={stats.pendingAds > 0 ? "text-yellow-800" : "text-[#1A3A5C]"} />
            <StatCard label="Approved" value={stats.approvedAds} accentClass="text-green-800" />
            <StatCard label="Denied" value={stats.deniedAds} accentClass="text-red-800" />
            <StatCard label="Users" value={stats.totalUsers} />
            <StatCard label="Locations" value={stats.totalLocations} />
          </div>

          {/* Quick links */}
          <Card className="rounded-xl border-[#D8E4EE] overflow-hidden">
            <CardHeader className="px-6 py-4 border-b border-[#D8E4EE]">
              <CardTitle className="font-serif text-[17px] text-[#1A3A5C]">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-3 p-6">
              <Button
                variant="outline"
                className="bg-blue-50 text-blue-800 border-blue-200 hover:bg-blue-100 text-[13px] font-semibold h-auto px-5 py-2.5"
                onClick={() => setActiveTab("users")}
              >
                Manage Users
              </Button>
              <Button
                variant="outline"
                className="bg-green-50 text-green-800 border-green-200 hover:bg-green-100 text-[13px] font-semibold h-auto px-5 py-2.5"
                onClick={() => setActiveTab("ads")}
              >
                Review All Ads
              </Button>
              <Button variant="outline" className="bg-[#F0F5FA] text-[#1A3A5C] border-[#D8E4EE] hover:bg-[#E8EFF6] text-[13px] font-semibold h-auto px-5 py-2.5" asChild>
                <Link href="/dashboard/store-owner">All Store Locations</Link>
              </Button>
              <Button variant="outline" className="bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100 text-[13px] font-semibold h-auto px-5 py-2.5" asChild>
                <Link href="/dashboard/approver">Approver Queue</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* USERS TAB */}
      {activeTab === "users" && (
        <Card className="rounded-xl border-[#D8E4EE] overflow-hidden">
          <CardHeader className="px-6 py-4 border-b border-[#D8E4EE]">
            <CardTitle className="font-serif text-[18px] text-[#1A3A5C]">All Users</CardTitle>
            <p className="text-xs text-[#6B8FA8] mt-1">{users.length} registered accounts</p>
          </CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            <table className="w-full border-collapse text-[13px]">
              <thead>
                <tr className="bg-[#F7F9FC]">
                  <th className="px-4 py-2.5 text-left font-semibold text-[#6B8FA8] text-[11px] uppercase tracking-[0.04em]">Name</th>
                  <th className="px-4 py-2.5 text-left font-semibold text-[#6B8FA8] text-[11px] uppercase tracking-[0.04em]">Email</th>
                  <th className="px-4 py-2.5 text-left font-semibold text-[#6B8FA8] text-[11px] uppercase tracking-[0.04em]">Role</th>
                  <th className="px-4 py-2.5 text-left font-semibold text-[#6B8FA8] text-[11px] uppercase tracking-[0.04em]">Joined</th>
                  <th className="px-4 py-2.5 text-left font-semibold text-[#6B8FA8] text-[11px] uppercase tracking-[0.04em]">Change Role</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u, idx) => {
                  const badgeClass = ROLE_BADGE_CLASS[u.role] ?? ROLE_BADGE_CLASS.user;
                  const isSelf = u.id === currentUserId;
                  return (
                    <tr key={u.id} className={idx > 0 ? "border-t border-[#D8E4EE]" : ""}>
                      <td className="px-4 py-3 text-[#1A3A5C] font-semibold">
                        {u.name}
                        {isSelf && <span className="ml-1.5 text-[10px] text-[#6B8FA8]">(you)</span>}
                        {u.twoFactorEnabled && <span title="2FA enabled" className="ml-1.5 text-[10px] text-green-700">2FA</span>}
                      </td>
                      <td className="px-4 py-3 text-[#6B8FA8]">{u.email}</td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${badgeClass}`}>
                          {ROLE_LABEL[u.role] ?? u.role}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-[#6B8FA8] text-xs">
                        {new Date(u.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        {isSelf ? (
                          <span className="text-xs text-[#6B8FA8]">—</span>
                        ) : (
                          <Select
                            value={u.role}
                            disabled={roleChanging === u.id}
                            onValueChange={(value) => changeRole(u.id, value)}
                          >
                            <SelectTrigger className={`h-8 w-36 text-xs text-[#1A3A5C] border-[#D8E4EE] bg-[#F7F9FC] ${roleChanging === u.id ? "opacity-60" : ""}`}>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="user">User</SelectItem>
                              <SelectItem value="store_owner">Store Owner</SelectItem>
                              <SelectItem value="approver">Approver</SelectItem>
                              <SelectItem value="admin">Admin</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {users.length === 0 && (
              <div className="py-8 text-center text-[#6B8FA8] text-sm">No users found.</div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ADS TAB */}
      {activeTab === "ads" && (
        <div>
          {/* Filter bar */}
          <div className="flex gap-2 mb-4 flex-wrap">
            {["all", "pending", "approved", "denied", "expired", "cancelled"].map(s => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3.5 py-1.5 rounded-full border text-xs transition-colors
                  ${statusFilter === s
                    ? "bg-[#1A3A5C] border-[#1A3A5C] text-white font-semibold"
                    : "bg-white border-[#D8E4EE] text-[#6B8FA8] font-normal hover:border-[#1A3A5C] cursor-pointer"
                  }`}
              >
                {s.charAt(0).toUpperCase() + s.slice(1)}
                {s !== "all" && (
                  <span className="ml-1 opacity-75">
                    ({ads.filter(a => a.status === s).length})
                  </span>
                )}
              </button>
            ))}
          </div>

          <Card className="rounded-xl border-[#D8E4EE] overflow-hidden">
            <div className="px-5 py-3.5 border-b border-[#D8E4EE]">
              <span className="text-[13px] text-[#6B8FA8]">{filteredAds.length} ads</span>
            </div>
            {filteredAds.length === 0 ? (
              <div className="py-8 text-center text-[#6B8FA8] text-sm">No ads match this filter.</div>
            ) : (
              filteredAds.map((ad, idx) => {
                const statusClass = STATUS_BADGE_CLASS[ad.status] ?? STATUS_BADGE_CLASS.pending;
                return (
                  <div key={ad.id} className={`${idx > 0 ? "border-t border-[#D8E4EE]" : ""} px-5 py-3.5`}>
                    <div className="flex gap-3.5 items-start">
                      <img src={ad.imageUrl} alt={ad.title} className="w-[72px] h-[50px] object-cover rounded-md shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="font-semibold text-sm text-[#1A3A5C]">{ad.title}</span>
                          <Badge variant="outline" className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${statusClass}`}>
                            {ad.status.charAt(0).toUpperCase() + ad.status.slice(1)}
                          </Badge>
                          <span className="text-[11px] text-[#9DC4E0] bg-blue-50 rounded px-1.5 py-0.5">{ad.paymentStatus}</span>
                        </div>
                        <div className="text-xs text-[#6B8FA8] mb-0.5">
                          by {ad.user.name} · {ad.location.storeName} · submitted {new Date(ad.createdAt).toLocaleDateString()}
                        </div>
                        {ad.reviewNote && (
                          <div className="text-xs text-yellow-800 bg-yellow-50 rounded px-2 py-0.5 inline-block">
                            Note: {ad.reviewNote}
                          </div>
                        )}
                        {/* Override controls */}
                        <div className="mt-2.5 flex gap-2 items-center flex-wrap">
                          <Input
                            placeholder="Review note (optional)"
                            value={overrideNote[ad.id] ?? ""}
                            onChange={e => setOverrideNote(n => ({ ...n, [ad.id]: e.target.value }))}
                            className="h-[30px] w-[200px] text-xs text-[#1A3A5C] border-[#D8E4EE] bg-[#F7F9FC]"
                          />
                          {["approved", "denied", "pending", "expired", "cancelled"]
                            .filter(s => s !== ad.status)
                            .map(targetStatus => {
                              const tc = STATUS_BADGE_CLASS[targetStatus] ?? STATUS_BADGE_CLASS.pending;
                              return (
                                <button
                                  key={targetStatus}
                                  disabled={overriding === ad.id}
                                  onClick={() => overrideAdStatus(ad.id, targetStatus)}
                                  className={`px-2.5 py-1 rounded-md border text-[11px] font-semibold transition-opacity ${overriding === ad.id ? "opacity-60 cursor-not-allowed" : "cursor-pointer"} ${tc}`}
                                >
                                  → {targetStatus}
                                </button>
                              );
                            })}
                          <Link href={`/dashboard/user/ads/${ad.id}`} className="text-xs text-[#4A90C4] no-underline px-2 py-1">
                            Details ↗
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </Card>
        </div>
      )}
    </div>
  );
}
