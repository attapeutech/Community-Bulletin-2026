"use client";

import { useState } from "react";
import Link from "next/link";

const ACCENT = "#1A3A5C";
const MUTED = "#6B8FA8";
const BORDER = "#D8E4EE";

const STATUS_STYLE: Record<string, { bg: string; color: string }> = {
  pending:   { bg: "#fef9c3", color: "#854d0e" },
  approved:  { bg: "#dcfce7", color: "#166534" },
  denied:    { bg: "#fee2e2", color: "#991b1b" },
  expired:   { bg: "#f1f5f9", color: "#475569" },
  cancelled: { bg: "#f1f5f9", color: "#475569" },
};

const ROLE_LABEL: Record<string, string> = {
  user: "User",
  store_owner: "Store Owner",
  approver: "Approver",
  admin: "Admin",
};

const ROLE_COLOR: Record<string, { bg: string; color: string }> = {
  user:        { bg: "#f1f5f9", color: "#475569" },
  store_owner: { bg: "#dbeafe", color: "#1e40af" },
  approver:    { bg: "#fef9c3", color: "#854d0e" },
  admin:       { bg: "#fee2e2", color: "#991b1b" },
};

function Badge({ bg, color, label }: { bg: string; color: string; label: string }) {
  return (
    <span style={{ display: "inline-block", padding: "2px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600, background: bg, color }}>
      {label}
    </span>
  );
}

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

function StatCard({ label, value, sub, accent }: { label: string; value: string | number; sub?: string; accent?: string }) {
  return (
    <div style={{ background: "#fff", borderRadius: 12, border: `1px solid ${BORDER}`, padding: "20px 24px", flex: "1 1 160px" }}>
      <div style={{ fontSize: 11, fontWeight: 600, color: MUTED, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 700, color: accent ?? ACCENT, lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: MUTED, marginTop: 4 }}>{sub}</div>}
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

  const TAB_STYLE = (active: boolean): React.CSSProperties => ({
    padding: "8px 18px",
    borderRadius: 8,
    border: "none",
    background: active ? ACCENT : "transparent",
    color: active ? "#fff" : MUTED,
    fontWeight: active ? 600 : 400,
    fontSize: 13,
    cursor: "pointer",
    transition: "all 0.15s",
  });

  return (
    <div style={{ maxWidth: 920 }}>
      {/* Toasts */}
      {userToast && (
        <div style={{ position: "fixed", top: 24, right: 24, zIndex: 9999, padding: "12px 20px", borderRadius: 10, background: userToast.ok ? "#166534" : "#991b1b", color: "#fff", fontSize: 14, fontWeight: 500, boxShadow: "0 4px 20px rgba(0,0,0,0.15)" }}>
          {userToast.msg}
        </div>
      )}
      {adToast && (
        <div style={{ position: "fixed", top: 68, right: 24, zIndex: 9999, padding: "12px 20px", borderRadius: 10, background: adToast.ok ? "#166534" : "#991b1b", color: "#fff", fontSize: 14, fontWeight: 500, boxShadow: "0 4px 20px rgba(0,0,0,0.15)" }}>
          {adToast.msg}
        </div>
      )}

      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontFamily: "Georgia,serif", fontSize: 26, fontWeight: 700, color: ACCENT, margin: "0 0 6px" }}>Admin Panel</h1>
        <p style={{ color: MUTED, fontSize: 14, margin: 0 }}>Platform-wide oversight — users, ads, and revenue.</p>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 6, marginBottom: 28, background: "#F0F5FA", borderRadius: 10, padding: 4, width: "fit-content" }}>
        <button style={TAB_STYLE(activeTab === "overview")} onClick={() => setActiveTab("overview")}>Overview</button>
        <button style={TAB_STYLE(activeTab === "users")} onClick={() => setActiveTab("users")}>Users ({stats.totalUsers})</button>
        <button style={TAB_STYLE(activeTab === "ads")} onClick={() => setActiveTab("ads")}>All Ads ({stats.totalAds})</button>
      </div>

      {/* OVERVIEW TAB */}
      {activeTab === "overview" && (
        <div>
          {/* Stat cards */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 16, marginBottom: 32 }}>
            <StatCard label="Total Revenue" value={`$${(stats.totalRevenueCents / 100).toFixed(2)}`} sub="from paid ads" accent="#166534" />
            <StatCard label="Total Ads" value={stats.totalAds} />
            <StatCard label="Pending Review" value={stats.pendingAds} accent={stats.pendingAds > 0 ? "#854d0e" : ACCENT} />
            <StatCard label="Approved" value={stats.approvedAds} accent="#166534" />
            <StatCard label="Denied" value={stats.deniedAds} accent="#991b1b" />
            <StatCard label="Users" value={stats.totalUsers} />
            <StatCard label="Locations" value={stats.totalLocations} />
          </div>

          {/* Quick links */}
          <div style={{ background: "#fff", borderRadius: 12, border: `1px solid ${BORDER}`, overflow: "hidden" }}>
            <div style={{ padding: "16px 24px", borderBottom: `1px solid ${BORDER}` }}>
              <h2 style={{ fontFamily: "Georgia,serif", fontSize: 17, color: ACCENT, margin: 0 }}>Quick Actions</h2>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 12, padding: 24 }}>
              <button onClick={() => setActiveTab("users")} style={{ padding: "10px 20px", borderRadius: 8, background: "#EFF6FF", color: "#1e40af", border: "1px solid #BFDBFE", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                Manage Users
              </button>
              <button onClick={() => setActiveTab("ads")} style={{ padding: "10px 20px", borderRadius: 8, background: "#F0FDF4", color: "#166534", border: "1px solid #BBF7D0", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                Review All Ads
              </button>
              <Link href="/dashboard/store-owner" style={{ padding: "10px 20px", borderRadius: 8, background: "#F0F5FA", color: ACCENT, border: `1px solid ${BORDER}`, fontSize: 13, fontWeight: 600, textDecoration: "none", display: "inline-block" }}>
                All Store Locations
              </Link>
              <Link href="/dashboard/approver" style={{ padding: "10px 20px", borderRadius: 8, background: "#FFFBEB", color: "#854d0e", border: "1px solid #FDE68A", fontSize: 13, fontWeight: 600, textDecoration: "none", display: "inline-block" }}>
                Approver Queue
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* USERS TAB */}
      {activeTab === "users" && (
        <div style={{ background: "#fff", borderRadius: 12, border: `1px solid ${BORDER}`, overflow: "hidden" }}>
          <div style={{ padding: "16px 24px", borderBottom: `1px solid ${BORDER}` }}>
            <h2 style={{ fontFamily: "Georgia,serif", fontSize: 18, color: ACCENT, margin: 0 }}>All Users</h2>
            <p style={{ fontSize: 12, color: MUTED, margin: "4px 0 0" }}>{users.length} registered accounts</p>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ background: "#F7F9FC" }}>
                  <th style={{ padding: "10px 16px", textAlign: "left", fontWeight: 600, color: MUTED, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.04em" }}>Name</th>
                  <th style={{ padding: "10px 16px", textAlign: "left", fontWeight: 600, color: MUTED, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.04em" }}>Email</th>
                  <th style={{ padding: "10px 16px", textAlign: "left", fontWeight: 600, color: MUTED, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.04em" }}>Role</th>
                  <th style={{ padding: "10px 16px", textAlign: "left", fontWeight: 600, color: MUTED, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.04em" }}>Joined</th>
                  <th style={{ padding: "10px 16px", textAlign: "left", fontWeight: 600, color: MUTED, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.04em" }}>Change Role</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u, idx) => {
                  const rc = ROLE_COLOR[u.role] ?? ROLE_COLOR.user;
                  const isSelf = u.id === currentUserId;
                  return (
                    <tr key={u.id} style={{ borderTop: idx > 0 ? `1px solid ${BORDER}` : "none" }}>
                      <td style={{ padding: "12px 16px", color: ACCENT, fontWeight: 600 }}>
                        {u.name}
                        {isSelf && <span style={{ marginLeft: 6, fontSize: 10, color: MUTED }}>(you)</span>}
                        {u.twoFactorEnabled && <span title="2FA enabled" style={{ marginLeft: 6, fontSize: 10, color: "#166534" }}>2FA</span>}
                      </td>
                      <td style={{ padding: "12px 16px", color: MUTED }}>{u.email}</td>
                      <td style={{ padding: "12px 16px" }}>
                        <Badge bg={rc.bg} color={rc.color} label={ROLE_LABEL[u.role] ?? u.role} />
                      </td>
                      <td style={{ padding: "12px 16px", color: MUTED, fontSize: 12 }}>
                        {new Date(u.createdAt).toLocaleDateString()}
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        {isSelf ? (
                          <span style={{ fontSize: 12, color: MUTED }}>—</span>
                        ) : (
                          <select
                            value={u.role}
                            disabled={roleChanging === u.id}
                            onChange={e => changeRole(u.id, e.target.value)}
                            style={{ height: 32, padding: "0 8px", borderRadius: 6, border: `1px solid ${BORDER}`, background: "#F7F9FC", color: ACCENT, fontSize: 12, cursor: "pointer", opacity: roleChanging === u.id ? 0.6 : 1 }}
                          >
                            <option value="user">User</option>
                            <option value="store_owner">Store Owner</option>
                            <option value="approver">Approver</option>
                            <option value="admin">Admin</option>
                          </select>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {users.length === 0 && (
              <div style={{ padding: 32, textAlign: "center", color: MUTED, fontSize: 14 }}>No users found.</div>
            )}
          </div>
        </div>
      )}

      {/* ADS TAB */}
      {activeTab === "ads" && (
        <div>
          {/* Filter bar */}
          <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
            {["all", "pending", "approved", "denied", "expired", "cancelled"].map(s => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                style={{
                  padding: "6px 14px",
                  borderRadius: 20,
                  border: `1px solid ${statusFilter === s ? ACCENT : BORDER}`,
                  background: statusFilter === s ? ACCENT : "#fff",
                  color: statusFilter === s ? "#fff" : MUTED,
                  fontSize: 12,
                  fontWeight: statusFilter === s ? 600 : 400,
                  cursor: "pointer",
                }}
              >
                {s.charAt(0).toUpperCase() + s.slice(1)}
                {s !== "all" && (
                  <span style={{ marginLeft: 5, opacity: 0.75 }}>
                    ({ads.filter(a => a.status === s).length})
                  </span>
                )}
              </button>
            ))}
          </div>

          <div style={{ background: "#fff", borderRadius: 12, border: `1px solid ${BORDER}`, overflow: "hidden" }}>
            <div style={{ padding: "14px 20px", borderBottom: `1px solid ${BORDER}` }}>
              <span style={{ fontSize: 13, color: MUTED }}>{filteredAds.length} ads</span>
            </div>
            {filteredAds.length === 0 ? (
              <div style={{ padding: 32, textAlign: "center", color: MUTED, fontSize: 14 }}>No ads match this filter.</div>
            ) : (
              filteredAds.map((ad, idx) => {
                const s = STATUS_STYLE[ad.status] ?? STATUS_STYLE.pending;
                return (
                  <div key={ad.id} style={{ borderTop: idx > 0 ? `1px solid ${BORDER}` : "none", padding: "14px 20px" }}>
                    <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
                      <img src={ad.imageUrl} alt={ad.title} style={{ width: 72, height: 50, objectFit: "cover", borderRadius: 6, flexShrink: 0 }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 4 }}>
                          <span style={{ fontWeight: 600, fontSize: 14, color: ACCENT }}>{ad.title}</span>
                          <Badge bg={s.bg} color={s.color} label={ad.status.charAt(0).toUpperCase() + ad.status.slice(1)} />
                          <span style={{ fontSize: 11, color: "#9DC4E0", background: "#EFF6FF", borderRadius: 4, padding: "2px 6px" }}>{ad.paymentStatus}</span>
                        </div>
                        <div style={{ fontSize: 12, color: MUTED, marginBottom: 2 }}>
                          by {ad.user.name} · {ad.location.storeName} · submitted {new Date(ad.createdAt).toLocaleDateString()}
                        </div>
                        {ad.reviewNote && (
                          <div style={{ fontSize: 12, color: "#854d0e", background: "#fef9c3", borderRadius: 4, padding: "2px 8px", display: "inline-block" }}>
                            Note: {ad.reviewNote}
                          </div>
                        )}
                        {/* Override controls */}
                        <div style={{ marginTop: 10, display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                          <input
                            placeholder="Review note (optional)"
                            value={overrideNote[ad.id] ?? ""}
                            onChange={e => setOverrideNote(n => ({ ...n, [ad.id]: e.target.value }))}
                            style={{ height: 30, borderRadius: 6, padding: "0 10px", border: `1px solid ${BORDER}`, background: "#F7F9FC", color: ACCENT, fontSize: 12, width: 200, outline: "none" }}
                          />
                          {["approved", "denied", "pending", "expired", "cancelled"]
                            .filter(s => s !== ad.status)
                            .map(targetStatus => {
                              const ts = STATUS_STYLE[targetStatus] ?? STATUS_STYLE.pending;
                              return (
                                <button
                                  key={targetStatus}
                                  disabled={overriding === ad.id}
                                  onClick={() => overrideAdStatus(ad.id, targetStatus)}
                                  style={{ padding: "4px 10px", borderRadius: 6, border: `1px solid ${ts.color}`, background: ts.bg, color: ts.color, fontSize: 11, fontWeight: 600, cursor: overriding === ad.id ? "not-allowed" : "pointer", opacity: overriding === ad.id ? 0.6 : 1 }}
                                >
                                  → {targetStatus}
                                </button>
                              );
                            })}
                          <Link href={`/dashboard/user/ads/${ad.id}`} style={{ fontSize: 12, color: "#4A90C4", textDecoration: "none", padding: "4px 8px" }}>
                            Details ↗
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
