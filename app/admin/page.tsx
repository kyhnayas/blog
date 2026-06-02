"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  Shield,
  Users,
  Award,
  Search,
  ArrowLeft,
  Loader2,
  AlertCircle,
  CheckCircle,
  UserCheck,
  UserMinus,
  Sparkles,
} from "lucide-react";
import Link from "next/link";

export default function AdminDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [currentProfile, setCurrentProfile] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const supabase = createClient();

  useEffect(() => {
    async function checkAdminAndLoadData() {
      try {
        // 1. Get current session
        const sessionResponse = await supabase.auth.getSession();
        if (!sessionResponse.data?.session) {
          router.push("/login?error=Please login to view admin panel");
          return;
        }

        setCurrentUser(sessionResponse.data.session.user);

        // 2. Load admin data via API (users list + current profile check)
        const adminResponse = await fetch("/api/admin/users");
        const adminData = await adminResponse.json();

        if (!adminResponse.ok) {
          router.push(
            "/settings?message=Only administrators can access the admin dashboard.",
          );
          return;
        }

        // Get current admin profile from the data
        adminData.users.find(
          (u: any) => u.id === sessionResponse?.data?.session?.user?.id,
        );
        setCurrentProfile(currentAdmin);
        setProfiles(adminData.users || []);
      } catch (err: any) {
        console.error("Admin loading error:", err);
        setMessage({
          type: "error",
          text: err.message || "Unexpected connection error.",
        });
      } finally {
        setLoading(false);
      }
    }

    checkAdminAndLoadData();
  }, [supabase, router]);

  // Promote / Demote user function
  const handleToggleRole = async (
    targetUserId: string,
    currentRole: string,
  ) => {
    setUpdatingId(targetUserId);
    setMessage(null);

    const nextRole = currentRole === "reader" ? "editor" : "reader";

    try {
      if (targetUserId === currentUser.id) {
        throw new Error("You cannot change your own admin role!");
      }

      // Update role via API
      const updateResponse = await fetch(`/api/admin/users/${targetUserId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: nextRole }),
      });

      const data = await updateResponse.json();

      if (!updateResponse.ok) {
        throw new Error(data.error || "Failed to update user role");
      }

      setProfiles((prev) =>
        prev.map((p) => (p.id === targetUserId ? { ...p, role: nextRole } : p)),
      );

      setMessage({
        type: "success",
        text: `Successfully updated user role to ${nextRole.toUpperCase()}`,
      });
    } catch (err: any) {
      console.error("Toggle role error:", err);
      setMessage({
        type: "error",
        text: err.message || "Failed to update user role.",
      });
    } finally {
      setUpdatingId(null);
    }
  };

  // Filter profiles based on search query
  const filteredProfiles = profiles.filter(
    (p) =>
      p.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.username?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 text-primary-500 animate-spin" />
          <span className="text-zinc-400 text-sm font-medium">
            Authorizing & loading admin control panel...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white font-sans py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-primary-950/20 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-purple-950/15 blur-[120px] pointer-events-none" />

      <div className="max-w-6xl mx-auto space-y-8 relative z-10">
        {/* Header Breadcrumb */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-400 hover:text-white transition-colors mb-2"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to Home
            </Link>
            <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-2">
              <Shield className="h-8 w-8 text-primary-500 animate-pulse" />
              Admin Control Panel
            </h1>
            <p className="text-sm text-zinc-400">
              Promote readers to Editors, manage platform users, and review ad
              units.
            </p>
          </div>

          {/* Quick Metrics */}
          <div className="flex items-center gap-4">
            <div className="px-4 py-2 rounded-2xl bg-zinc-900 border border-zinc-800 text-center">
              <span className="block text-xs font-bold text-zinc-500 uppercase">
                Total Users
              </span>
              <span className="text-xl font-extrabold text-white">
                {profiles.length}
              </span>
            </div>
            <div className="px-4 py-2 rounded-2xl bg-zinc-900 border border-zinc-800 text-center">
              <span className="block text-xs font-bold text-zinc-500 uppercase">
                Editors
              </span>
              <span className="text-xl font-extrabold text-emerald-400">
                {profiles.filter((p) => p.role === "editor").length}
              </span>
            </div>
          </div>
        </div>

        {message && (
          <div
            className={`p-4 rounded-xl flex items-start gap-3 border animate-in fade-in slide-in-from-top-2 duration-300 ${
              message.type === "success"
                ? "bg-emerald-950/30 border-emerald-500/30 text-emerald-300"
                : "bg-rose-950/30 border-rose-500/30 text-rose-300"
            }`}
          >
            {message.type === "success" ? (
              <CheckCircle className="h-5 w-5 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
            )}
            <span className="text-sm font-medium leading-relaxed">
              {message.text}
            </span>
          </div>
        )}

        {/* SEARCH BAR & QUICK FILTERS */}
        <div className="glassmorphism rounded-3xl p-6 border border-zinc-800/50 flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative w-full sm:max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
              <Search className="h-4.5 w-4.5" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by full name or username..."
              className="block w-full pl-11 pr-4 py-3 bg-zinc-900/80 border border-zinc-850 rounded-2xl text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 text-sm shadow-inner"
            />
          </div>

          <div className="flex gap-2 self-start sm:self-auto">
            <span className="px-3.5 py-2 text-xs font-bold bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-400">
              Admin: {currentProfile?.full_name}
            </span>
          </div>
        </div>

        {/* PROFILES LIST */}
        <div className="glassmorphism rounded-3xl border border-zinc-800/50 overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-zinc-900/60 border-b border-zinc-800/60 text-zinc-400 text-xs font-bold uppercase tracking-wider">
                  <th className="py-4 px-6">User / Avatar</th>
                  <th className="py-4 px-6">Username</th>
                  <th className="py-4 px-6">Role Status</th>
                  <th className="py-4 px-6">Google AdSense ID</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/30 text-sm">
                {filteredProfiles.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="py-12 px-6 text-center text-zinc-500 font-medium"
                    >
                      No users found matching your search.
                    </td>
                  </tr>
                ) : (
                  filteredProfiles.map((p) => (
                    <tr
                      key={p.id}
                      className="hover:bg-zinc-900/25 transition-colors"
                    >
                      {/* Name / Avatar */}
                      <td className="py-4.5 px-6">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full gradient-bg flex items-center justify-center font-bold text-sm border border-primary-500/20 text-white shrink-0">
                            {p.avatar_url ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={p.avatar_url}
                                alt={p.full_name}
                                className="h-full w-full rounded-full object-cover"
                              />
                            ) : (
                              p.full_name?.charAt(0).toUpperCase() || "U"
                            )}
                          </div>
                          <div>
                            <span className="font-semibold text-white block">
                              {p.full_name || "Anonymous User"}
                            </span>
                            <span className="text-[11px] text-zinc-500 block">
                              ID: {p.id.slice(0, 8)}...
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Username */}
                      <td className="py-4.5 px-6 font-medium text-zinc-300">
                        @{p.username || "not-set"}
                      </td>

                      {/* Role Status Badge */}
                      <td className="py-4.5 px-6">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                            p.role === "admin"
                              ? "bg-purple-500/10 text-purple-400 border border-purple-500/20"
                              : p.role === "editor"
                                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                : "bg-zinc-800 text-zinc-400 border border-zinc-700/50"
                          }`}
                        >
                          <Sparkles className="h-3.5 w-3.5 shrink-0" />
                          {p.role}
                        </span>
                      </td>

                      {/* AdSense IDs */}
                      <td className="py-4.5 px-6">
                        {p.adsense_pub_id ? (
                          <div className="space-y-0.5 text-xs text-emerald-400 font-mono font-medium">
                            <span className="block">
                              PUB: {p.adsense_pub_id}
                            </span>
                            {p.adsense_slot_id && (
                              <span className="block text-zinc-400">
                                SLOT: {p.adsense_slot_id}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-zinc-500 italic">
                            No ads connected
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-4.5 px-6 text-right">
                        {p.role === "admin" ? (
                          <span className="text-xs font-semibold text-zinc-500 bg-zinc-900 border border-zinc-850 px-3 py-1.5 rounded-xl cursor-default">
                            Super Admin
                          </span>
                        ) : (
                          <button
                            onClick={() => handleToggleRole(p.id, p.role)}
                            disabled={updatingId === p.id}
                            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                              p.role === "reader"
                                ? "bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-500/10 hover:shadow-emerald-500/20"
                                : "bg-rose-950/40 hover:bg-rose-900/40 text-rose-300 border border-rose-500/20"
                            }`}
                          >
                            {updatingId === p.id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : p.role === "reader" ? (
                              <>
                                <UserCheck className="h-3.5 w-3.5" />
                                Promote to Editor
                              </>
                            ) : (
                              <>
                                <UserMinus className="h-3.5 w-3.5" />
                                Demote to Reader
                              </>
                            )}
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
      </div>
    </div>
  );
}
