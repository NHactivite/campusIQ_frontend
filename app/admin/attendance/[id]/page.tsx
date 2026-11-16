"use client";
import { useState, useEffect, useCallback, use } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, Loader2, AlertTriangle, QrCode, Users, CheckCircle2,
  Plus, XCircle, Circle, RefreshCw, Trash2, Copy, Link2, UserPlus,
  Shield, FileDown,
} from "lucide-react";
import {
  adminGetSession, adminGetRecords, adminGetVolunteers, adminGetPoolStats,
  adminMintMore, adminCloseSession,
  adminListSessionVolunteers, adminAddVolunteer, adminRemoveVolunteer,
  adminDownloadAttendanceReport, adminDeleteAttendanceSession,
  type AttendanceSession, type AttendanceRecord, type VolunteerActivity,
  type SessionVolunteer,
} from "@/lib/adminApi";

const APP_URL =
  typeof window !== "undefined"
    ? window.location.origin
    : process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

// ─── Helpers ──────────────────────────────────────────────────────────────────
function StatCard({
  label, value, sub, color,
}: {
  label: string; value: number | string; sub?: string; color?: string;
}) {
  return (
    <div className="rounded-2xl bg-[#13161f] border border-white/6 p-5">
      <p className="text-xs font-medium text-white/40 mb-1">{label}</p>
      <p className={`text-3xl font-bold ${color ?? "text-white"}`}>{value}</p>
      {sub && <p className="text-xs text-white/30 mt-1">{sub}</p>}
    </div>
  );
}

function CopyButton({ text, label }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(text).catch(() => {});
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
      className="flex items-center gap-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 px-2.5 py-1.5 text-xs text-white/60 hover:text-white transition-colors"
    >
      {copied ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
      {copied ? "Copied!" : (label ?? "Copy")}
    </button>
  );
}

type Tab = "overview" | "records" | "volunteers" | "activity";

// ─── Main page ────────────────────────────────────────────────────────────────
export default function SessionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const [session, setSession] = useState<AttendanceSession | null>(null);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [activity, setActivity] = useState<VolunteerActivity[]>([]);
  const [volunteers, setVolunteers] = useState<SessionVolunteer[]>([]);
  const [pool, setPool] = useState({ available: 0, allocated: 0, used: 0 });
  const [submittedCount, setSubmittedCount] = useState(0);

  const [tab, setTab] = useState<Tab>("overview");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Mint
  const [mintCount, setMintCount] = useState(50);
  const [minting, setMinting] = useState(false);
  const [mintMsg, setMintMsg] = useState("");

  // Close
  const [closing, setClosing] = useState(false);
  const [confirmClose, setConfirmClose] = useState(false);

  // Record filters
  const [deptFilter, setDeptFilter] = useState("");
  const [semFilter, setSemFilter] = useState("");
  const [recPage, setRecPage] = useState(1);
  const [recTotal, setRecTotal] = useState(0);

  // Volunteers
  const [volunteerInput, setVolunteerInput] = useState("");
  const [addingVol, setAddingVol] = useState(false);
  const [volMsg, setVolMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [removingVol, setRemovingVol] = useState<string | null>(null);

  // PDF download
  const [downloading, setDownloading] = useState(false);

  // Delete session
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // ── Loaders ───────────────────────────────────────────────────────────────
  const loadSession = useCallback(async () => {
    try {
      const res = await adminGetSession(id);
      const s: AttendanceSession = res.data;
      setSession(s);
      if (s.pool) setPool(s.pool);
      if (s.submittedCount !== undefined) setSubmittedCount(s.submittedCount);
    } catch { /* ignore */ }
  }, [id]);

  const loadPool = useCallback(async () => {
    try {
      const res = await adminGetPoolStats(id);
      setPool(res.data);
    } catch { /* ignore */ }
  }, [id]);

  const loadRecords = useCallback(async () => {
    try {
      const res = await adminGetRecords(id, {
        page: recPage, limit: 20,
        department: deptFilter || undefined,
        semester: semFilter ? Number(semFilter) : undefined,
      });
      setRecords(res.data ?? []);
      setRecTotal(res.pagination?.total ?? 0);
      setSubmittedCount(res.pagination?.total ?? 0);
    } catch { /* ignore */ }
  }, [id, recPage, deptFilter, semFilter]);

  const loadActivity = useCallback(async () => {
    try {
      const res = await adminGetVolunteers(id);
      const list = (res as unknown as { volunteers?: VolunteerActivity[] }).volunteers
        ?? res.data ?? [];
      setActivity(list);
    } catch { /* ignore */ }
  }, [id]);

  const loadVolunteers = useCallback(async () => {
    try {
      const res = await adminListSessionVolunteers(id);
      setVolunteers(res.data ?? []);
    } catch { /* ignore */ }
  }, [id]);

  useEffect(() => {
    setLoading(true);
    Promise.all([loadSession(), loadPool(), loadRecords(), loadActivity(), loadVolunteers()])
      .catch(() => setError("Failed to load session"))
      .finally(() => setLoading(false));
  }, [loadSession, loadPool, loadRecords, loadActivity, loadVolunteers]);

  useEffect(() => {
    if (tab === "overview" || tab === "activity") {
      const t = setInterval(() => { void loadPool(); void loadActivity(); }, 5000);
      return () => clearInterval(t);
    }
  }, [tab, loadPool, loadActivity]);

  useEffect(() => {
    if (tab === "records") {
      const t = setInterval(() => void loadRecords(), 10000);
      return () => clearInterval(t);
    }
  }, [tab, loadRecords]);

  useEffect(() => { void loadRecords(); }, [loadRecords]);

  // ── Handlers ──────────────────────────────────────────────────────────────
  async function handleMint() {
    if (!mintCount || mintCount < 1) return;
    setMinting(true); setMintMsg("");
    try {
      await adminMintMore(id, mintCount);
      setMintMsg(`✓ ${mintCount} tokens minted`);
      await Promise.all([loadPool(), loadSession()]);
    } catch (err: unknown) {
      setMintMsg(err instanceof Error ? err.message : "Failed");
    } finally { setMinting(false); }
  }

  async function handleClose() {
    setClosing(true);
    try {
      await adminCloseSession(id);
      await loadSession();
      setConfirmClose(false);
    } catch { /* ignore */ } finally { setClosing(false); }
  }

  async function handleAddVolunteer(e: React.FormEvent) {
    e.preventDefault();
    const identifier = volunteerInput.trim();
    if (!identifier) return;
    setAddingVol(true); setVolMsg(null);
    try {
      await adminAddVolunteer(id, identifier);
      setVolMsg({ type: "ok", text: `✓ Volunteer added: ${identifier}` });
      setVolunteerInput("");
      await loadVolunteers();
    } catch (err: unknown) {
      setVolMsg({ type: "err", text: err instanceof Error ? err.message : "Failed to add volunteer" });
    } finally { setAddingVol(false); }
  }

  async function handleRemoveVolunteer(userId: string) {
    setRemovingVol(userId);
    try {
      await adminRemoveVolunteer(id, userId);
      setVolunteers((prev) => prev.filter((v) => v.userId !== userId));
    } catch { /* ignore */ } finally { setRemovingVol(null); }
  }

  async function handleDownloadPdf() {
    if (!session) return;
    setDownloading(true);
    try {
      await adminDownloadAttendanceReport(id, session.title);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Download failed");
    } finally { setDownloading(false); }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      await adminDeleteAttendanceSession(id);
      router.push("/admin/attendance");
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Delete failed");
      setDeleting(false);
      setConfirmDelete(false);
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f1117] flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-white/40 animate-spin" />
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="min-h-screen bg-[#0f1117] flex flex-col items-center justify-center gap-3 text-white/40">
        <AlertTriangle className="h-8 w-8 text-red-400" />
        <p>{error || "Session not found"}</p>
      </div>
    );
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: "overview",   label: "Overview" },
    { key: "volunteers", label: `Volunteers (${volunteers.length})` },
    { key: "records",    label: `Records (${submittedCount})` },
    { key: "activity",  label: `Live Activity (${activity.length})` },
  ];

  return (
    <div className="min-h-screen bg-[#0f1117] p-6 md:p-10">

      {/* ── Header ── */}
      <div className="mb-6">
        <button
          onClick={() => router.push("/admin/attendance")}
          className="flex items-center gap-1.5 text-sm text-white/40 hover:text-white mb-4 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> All Sessions
        </button>

        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-bold text-white">{session.title}</h1>
          <span
            className={`inline-flex items-center gap-1 rounded-full px-3 py-0.5 text-xs font-medium ${
              session.status === "open"
                ? "bg-emerald-500/15 text-emerald-400"
                : "bg-red-500/15 text-red-400"
            }`}
          >
            {session.status === "open"
              ? <Circle className="h-2 w-2 fill-current" />
              : <XCircle className="h-3 w-3" />}
            {session.status}
          </span>
          {volunteers.length === 0 && (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-3 py-0.5 text-xs text-amber-400">
              <Shield className="h-3 w-3" /> Open access
            </span>
          )}
        </div>

        {session.description && (
          <p className="text-sm text-white/40 mt-1">{session.description}</p>
        )}

        {/* ── Action buttons ── */}
        <div className="flex flex-wrap items-center gap-2 mt-4">
          <button
            onClick={handleDownloadPdf}
            disabled={downloading}
            className="flex items-center gap-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/20 px-4 py-2 text-sm font-medium text-emerald-400 transition-colors disabled:opacity-50"
          >
            {downloading
              ? <Loader2 className="h-4 w-4 animate-spin" />
              : <FileDown className="h-4 w-4" />}
            {downloading ? "Generating PDF…" : "Download Attendance PDF"}
          </button>

          {!confirmDelete ? (
            <button
              onClick={() => setConfirmDelete(true)}
              className="flex items-center gap-2 rounded-xl bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 px-4 py-2 text-sm font-medium text-red-400 transition-colors"
            >
              <Trash2 className="h-4 w-4" /> Delete Session
            </button>
          ) : (
            <div className="flex items-center gap-2 rounded-xl bg-red-500/10 border border-red-500/30 px-4 py-2">
              <span className="text-sm text-red-300 font-medium">Delete all records too?</span>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex items-center gap-1.5 rounded-lg bg-red-500 hover:bg-red-600 px-3 py-1 text-sm font-semibold text-white disabled:opacity-60"
              >
                {deleting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Yes, Delete
              </button>
              <button onClick={() => setConfirmDelete(false)} className="text-sm text-white/40 hover:text-white">
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="flex flex-wrap gap-1 mb-6 border-b border-white/6">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2.5 text-sm font-medium rounded-t-xl transition-all ${
              tab === t.key
                ? "text-white border-b-2 border-gold -mb-px"
                : "text-white/40 hover:text-white"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Overview ── */}
      {tab === "overview" && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard label="Available QRs" value={pool.available} color="text-blue-400" />
            <StatCard label="Allocated"      value={pool.allocated} color="text-amber-400" />
            <StatCard label="Used"           value={pool.used}      color="text-emerald-400" />
            <StatCard label="Submitted"      value={submittedCount} color="text-purple-400" />
          </div>
          <StatCard label="Total Generated" value={session.totalGenerated}
            sub={`Pool total: ${pool.available + pool.allocated + pool.used}`} />

          {session.status === "open" && (
            <div className="rounded-2xl bg-[#13161f] border border-white/6 p-5">
              <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                <Plus className="h-4 w-4 text-gold" /> Mint More QR Tokens
              </h3>
              <div className="flex items-center gap-3">
                <input type="number" min={1} max={5000} value={mintCount}
                  onChange={(e) => setMintCount(Number(e.target.value))}
                  className="w-32 rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-sm text-white focus:outline-none focus:border-white/30"
                />
                <button onClick={handleMint} disabled={minting}
                  className="flex items-center gap-2 rounded-xl bg-gold/90 hover:bg-gold px-4 py-2 text-sm font-semibold text-black disabled:opacity-60">
                  {minting && <Loader2 className="h-4 w-4 animate-spin" />} Mint Tokens
                </button>
                {mintMsg && <p className="text-sm text-emerald-400">{mintMsg}</p>}
              </div>
            </div>
          )}

          {session.status === "open" && (
            <div className="rounded-2xl bg-[#13161f] border border-red-500/20 p-5">
              <h3 className="text-sm font-semibold text-red-400 mb-2 flex items-center gap-2">
                <XCircle className="h-4 w-4" /> Close Session
              </h3>
              <p className="text-xs text-white/40 mb-3">
                Closing will delete all Redis keys and invalidate remaining QR tokens.
              </p>
              {!confirmClose ? (
                <button onClick={() => setConfirmClose(true)}
                  className="rounded-xl bg-red-500/20 border border-red-500/30 px-4 py-2 text-sm font-medium text-red-400 hover:bg-red-500/30 transition-colors">
                  Close Session
                </button>
              ) : (
                <div className="flex items-center gap-3">
                  <p className="text-sm text-white/70">Are you sure?</p>
                  <button onClick={handleClose} disabled={closing}
                    className="flex items-center gap-1.5 rounded-xl bg-red-500 px-4 py-2 text-sm font-semibold text-white hover:bg-red-600 disabled:opacity-60">
                    {closing && <Loader2 className="h-4 w-4 animate-spin" />} Yes, Close
                  </button>
                  <button onClick={() => setConfirmClose(false)} className="text-sm text-white/40 hover:text-white">
                    Cancel
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── Volunteers ── */}
      {tab === "volunteers" && (
        <div className="space-y-6">
          <div className="rounded-2xl bg-blue-500/8 border border-blue-500/20 p-4 flex gap-3">
            <Shield className="h-5 w-5 text-blue-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-blue-300">Volunteer Access Control</p>
              <p className="text-xs text-white/50 mt-0.5">
                {volunteers.length === 0
                  ? "Empty list = open access. Add a volunteer to restrict."
                  : `Only ${volunteers.length} registered volunteer${volunteers.length > 1 ? "s" : ""} can access the QR dashboard.`}
              </p>
            </div>
          </div>

          <div className="rounded-2xl bg-[#13161f] border border-white/6 p-5">
            <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
              <UserPlus className="h-4 w-4 text-gold" /> Add Volunteer
            </h3>
            <form onSubmit={handleAddVolunteer} className="flex gap-3 flex-wrap">
              <input
                type="text"
                value={volunteerInput}
                onChange={(e) => { setVolunteerInput(e.target.value); setVolMsg(null); }}
                placeholder="Email address or Clerk user ID (user_…)"
                className="flex-1 min-w-0 rounded-xl bg-white/5 border border-white/10 px-3 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-white/30"
              />
              <button type="submit" disabled={addingVol || !volunteerInput.trim()}
                className="flex items-center gap-2 rounded-xl bg-gold/90 hover:bg-gold px-5 py-2.5 text-sm font-semibold text-black disabled:opacity-60 shrink-0">
                {addingVol ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                Add
              </button>
            </form>
            {volMsg && (
              <p className={`mt-3 text-sm flex items-center gap-2 ${volMsg.type === "ok" ? "text-emerald-400" : "text-red-400"}`}>
                {volMsg.type === "ok" ? <CheckCircle2 className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
                {volMsg.text}
              </p>
            )}
          </div>

          {volunteers.length === 0 ? (
            <div className="flex flex-col items-center py-12 text-white/30">
              <Users className="h-12 w-12 mb-3 opacity-30" />
              <p className="text-sm">No volunteers added yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {volunteers.map((v) => {
                const dashboardUrl = `${APP_URL}/volunteer/${id}`;
                return (
                  <div key={v.userId} className="rounded-2xl bg-[#13161f] border border-white/6 p-4 flex flex-col sm:flex-row sm:items-center gap-3">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="h-9 w-9 rounded-xl bg-gold/10 flex items-center justify-center shrink-0">
                        <span className="text-sm font-bold text-gold">{(v.name ?? v.email)[0]?.toUpperCase()}</span>
                      </div>
                      <div className="min-w-0">
                        {v.name && <p className="text-sm font-medium text-white truncate">{v.name}</p>}
                        <p className="text-xs text-white/50 truncate">{v.email}</p>
                        <p className="text-[10px] font-mono text-white/25 truncate">{v.userId}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <CopyButton text={dashboardUrl} label="Copy link" />
                      <a href={dashboardUrl} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 px-2.5 py-1.5 text-xs text-white/60 hover:text-white transition-colors">
                        <Link2 className="h-3.5 w-3.5" /> Open
                      </a>
                      <button onClick={() => handleRemoveVolunteer(v.userId)} disabled={removingVol === v.userId}
                        className="flex items-center gap-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 px-2.5 py-1.5 text-xs text-red-400 disabled:opacity-50 transition-colors">
                        {removingVol === v.userId ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                        Remove
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="rounded-2xl bg-[#13161f] border border-white/6 p-4">
            <p className="text-xs font-medium text-white/40 mb-2 flex items-center gap-1.5">
              <Link2 className="h-3.5 w-3.5" /> Volunteer Dashboard URL
            </p>
            <div className="flex items-center gap-2 flex-wrap">
              <code className="flex-1 text-xs text-gold/80 font-mono bg-white/4 rounded-lg px-3 py-2 break-all">
                {APP_URL}/volunteer/{id}
              </code>
              <CopyButton text={`${APP_URL}/volunteer/${id}`} label="Copy URL" />
            </div>
            <p className="text-xs text-white/30 mt-2">
              Share this URL with volunteers. They must be signed in with the registered email.
            </p>
          </div>
        </div>
      )}

      {/* ── Records ── */}
      {tab === "records" && (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-3 items-center justify-between">
            <div className="flex flex-wrap gap-3">
              <input placeholder="Filter by department…" value={deptFilter}
                onChange={(e) => { setDeptFilter(e.target.value); setRecPage(1); }}
                className="rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-white/30"
              />
              <select value={semFilter}
                onChange={(e) => { setSemFilter(e.target.value); setRecPage(1); }}
                className="rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-sm text-white focus:outline-none focus:border-white/30"
              >
                <option value="">All semesters</option>
                {Array.from({ length: 12 }, (_, i) => (
                  <option key={i + 1} value={i + 1}>Semester {i + 1}</option>
                ))}
              </select>
              <button onClick={() => void loadRecords()}
                className="flex items-center gap-1.5 rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-sm text-white/60 hover:text-white transition-colors">
                <RefreshCw className="h-4 w-4" /> Refresh
              </button>
            </div>
            {/* Quick PDF from records tab too */}
            <button onClick={handleDownloadPdf} disabled={downloading}
              className="flex items-center gap-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 px-3 py-2 text-sm text-emerald-400 hover:bg-emerald-500/20 disabled:opacity-50 transition-colors">
              {downloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileDown className="h-4 w-4" />}
              {downloading ? "Generating…" : "Download PDF"}
            </button>
          </div>

          <div className="rounded-2xl bg-[#13161f] border border-white/6 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/6">
                  {["Department", "Semester", "Roll Number", "Volunteer", "Submitted At"].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-white/30">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {records.length === 0 ? (
                  <tr><td colSpan={5} className="text-center py-10 text-white/30">No records found</td></tr>
                ) : records.map((r) => {
                  const vol = volunteers.find((v) => v.userId === r.volunteerId);
                  return (
                    <tr key={r._id} className="border-b border-white/4 hover:bg-white/2 transition-colors">
                      <td className="px-4 py-3 text-white">{r.department}</td>
                      <td className="px-4 py-3 text-white/70">{r.semester}</td>
                      <td className="px-4 py-3 font-mono text-white">{r.rollNumber}</td>
                      <td className="px-4 py-3 text-white/40 text-xs">
                        {vol ? <span title={vol.userId}>{vol.name ?? vol.email}</span>
                          : <span className="font-mono">{r.volunteerId.slice(-8)}</span>}
                      </td>
                      <td className="px-4 py-3 text-white/40 text-xs">{new Date(r.submittedAt).toLocaleString()}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {recTotal > 20 && (
            <div className="flex items-center justify-between text-sm text-white/40">
              <span>Total: {recTotal}</span>
              <div className="flex gap-2">
                <button disabled={recPage === 1} onClick={() => setRecPage((p) => p - 1)}
                  className="px-3 py-1 rounded-lg bg-white/5 disabled:opacity-30 hover:bg-white/10">Prev</button>
                <span className="px-3 py-1">Page {recPage}</span>
                <button disabled={recPage * 20 >= recTotal} onClick={() => setRecPage((p) => p + 1)}
                  className="px-3 py-1 rounded-lg bg-white/5 disabled:opacity-30 hover:bg-white/10">Next</button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Live Activity ── */}
      {tab === "activity" && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button onClick={() => void loadActivity()}
              className="flex items-center gap-1.5 rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-sm text-white/60 hover:text-white transition-colors">
              <RefreshCw className="h-4 w-4" /> Refresh
            </button>
          </div>
          {activity.length === 0 ? (
            <div className="flex flex-col items-center py-16 text-white/30">
              <QrCode className="h-12 w-12 mb-3 opacity-30" />
              <p>No active QR allocations</p>
            </div>
          ) : (
            <div className="rounded-2xl bg-[#13161f] border border-white/6 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/6">
                    {["Volunteer", "Current Token", "Allocated At", "Submissions"].map((h) => (
                      <th key={h} className="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-white/30">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {activity.map((v) => {
                    const vol = volunteers.find((sv) => sv.userId === v.volunteerId);
                    return (
                      <tr key={v.volunteerId} className="border-b border-white/4 hover:bg-white/2 transition-colors">
                        <td className="px-4 py-3">
                          {vol ? (
                            <div>
                              <p className="text-white text-sm font-medium">{vol.name ?? vol.email}</p>
                              <p className="text-white/30 text-[10px] font-mono">{vol.userId.slice(-8)}</p>
                            </div>
                          ) : (
                            <span className="font-mono text-xs text-white/70">{v.volunteerId}</span>
                          )}
                        </td>
                        <td className="px-4 py-3 font-mono text-xs text-gold">
                          {v.currentToken ? `…${v.currentToken.slice(-10)}` : "—"}
                        </td>
                        <td className="px-4 py-3 text-white/40 text-xs">
                          {v.allocatedAt ? new Date(v.allocatedAt).toLocaleTimeString() : "—"}
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-400">
                            <CheckCircle2 className="h-3 w-3" /> {v.submissions}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
