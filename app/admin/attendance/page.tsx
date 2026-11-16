"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Plus, QrCode, Loader2, AlertTriangle, ChevronRight,
  Users, Circle, XCircle, Trash2, FileDown,
} from "lucide-react";
import {
  adminListSessions, adminCreateSession,
  adminDeleteAttendanceSession, adminDownloadAttendanceReport,
  type AttendanceSession,
} from "@/lib/adminApi";

// ─── Create-session modal ─────────────────────────────────────────────────────
function CreateModal({
  onClose,
  onCreate,
}: {
  onClose: () => void;
  onCreate: (s: AttendanceSession) => void;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [initialCount, setInitialCount] = useState(50);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return setError("Title is required");
    setLoading(true);
    setError("");
    try {
      const res = await adminCreateSession({
        title: title.trim(),
        description: description.trim() || undefined,
        initialCount,
      });
      onCreate(res.data as AttendanceSession);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create session");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-md rounded-2xl bg-[#13161f] border border-white/10 p-6 shadow-2xl">
        <h2 className="text-lg font-bold text-white mb-5">Create Attendance Session</h2>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-white/60 mb-1">Session Title *</label>
            <input
              className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-white/30"
              placeholder="e.g. Annual Tech Fest 2026"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-white/60 mb-1">Description</label>
            <textarea
              className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-white/30 resize-none"
              placeholder="Optional description…"
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-white/60 mb-1">
              Initial QR Token Count
            </label>
            <input
              type="number"
              min={1}
              max={5000}
              className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-sm text-white focus:outline-none focus:border-white/30"
              value={initialCount}
              onChange={(e) => setInitialCount(Number(e.target.value))}
            />
          </div>
          {error && (
            <p className="flex items-center gap-2 text-sm text-red-400">
              <AlertTriangle className="h-4 w-4" /> {error}
            </p>
          )}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl bg-white/5 border border-white/10 py-2 text-sm text-white/70 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-gold/90 hover:bg-gold py-2 text-sm font-semibold text-black transition-colors disabled:opacity-60"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              Create Session
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Pool badges ──────────────────────────────────────────────────────────────
function PoolBadge({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 ${color}`}>
      <span className="text-[11px] font-medium opacity-80">{label}</span>
      <span className="text-xs font-bold">{value}</span>
    </div>
  );
}

// ─── Session card (with Download PDF + Delete) ────────────────────────────────
function SessionCard({
  session,
  onOpen,
  onDelete,
}: {
  session: AttendanceSession;
  onOpen: () => void;
  onDelete: (id: string) => void;
}) {
  const [downloading, setDownloading] = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleDownload(e: React.MouseEvent) {
    e.stopPropagation();
    setDownloading(true);
    try {
      await adminDownloadAttendanceReport(session._id, session.title);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Download failed");
    } finally {
      setDownloading(false);
    }
  }

  async function handleDelete(e: React.MouseEvent) {
    e.stopPropagation();
    setDeleting(true);
    try {
      await adminDeleteAttendanceSession(session._id);
      onDelete(session._id);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Delete failed");
      setDeleting(false);
      setConfirmDel(false);
    }
  }

  return (
    <div className="rounded-2xl bg-[#13161f] border border-white/6 hover:border-white/20 transition-all overflow-hidden">
      {/* Clickable body */}
      <button className="w-full text-left p-5 group" onClick={onOpen}>
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-white truncate">{session.title}</p>
            {session.description && (
              <p className="text-xs text-white/40 mt-0.5 truncate">{session.description}</p>
            )}
          </div>
          <span
            className={`ml-3 shrink-0 inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-medium ${
              session.status === "open"
                ? "bg-emerald-500/15 text-emerald-400"
                : "bg-red-500/15 text-red-400"
            }`}
          >
            {session.status === "open" ? (
              <Circle className="h-2 w-2 fill-current" />
            ) : (
              <XCircle className="h-3 w-3" />
            )}
            {session.status}
          </span>
        </div>

        {session.pool && (
          <div className="flex flex-wrap gap-2 mb-3">
            <PoolBadge label="Available" value={session.pool.available} color="bg-blue-500/10 text-blue-300" />
            <PoolBadge label="Allocated" value={session.pool.allocated} color="bg-amber-500/10 text-amber-300" />
            <PoolBadge label="Used" value={session.pool.used} color="bg-emerald-500/10 text-emerald-300" />
          </div>
        )}

        <div className="flex items-center justify-between text-xs text-white/30">
          <span className="flex items-center gap-1">
            <Users className="h-3 w-3" />
            {session.submittedCount ?? 0} submitted
          </span>
          <span className="flex items-center gap-1">
            {new Date(session.createdAt).toLocaleDateString()}
            <ChevronRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
          </span>
        </div>
      </button>

      {/* Action bar */}
      <div className="flex items-center gap-2 px-5 pb-4 pt-0">
        {/* Download PDF */}
        <button
          onClick={handleDownload}
          disabled={downloading}
          className="flex items-center gap-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 px-3 py-1.5 text-xs font-medium text-emerald-400 transition-colors disabled:opacity-50"
        >
          {downloading
            ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
            : <FileDown className="h-3.5 w-3.5" />}
          {downloading ? "Generating…" : "Download PDF"}
        </button>

        {/* Delete */}
        {!confirmDel ? (
          <button
            onClick={(e) => { e.stopPropagation(); setConfirmDel(true); }}
            className="flex items-center gap-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 px-3 py-1.5 text-xs font-medium text-red-400 transition-colors"
          >
            <Trash2 className="h-3.5 w-3.5" /> Delete
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <span className="text-xs text-white/50">Sure?</span>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="flex items-center gap-1 rounded-lg bg-red-500 hover:bg-red-600 px-2.5 py-1.5 text-xs font-semibold text-white transition-colors disabled:opacity-60"
            >
              {deleting && <Loader2 className="h-3 w-3 animate-spin" />}
              Yes
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); setConfirmDel(false); }}
              className="text-xs text-white/40 hover:text-white transition-colors"
            >
              No
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function AttendancePage() {
  const router = useRouter();
  const [sessions, setSessions] = useState<AttendanceSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showCreate, setShowCreate] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await adminListSessions();
      setSessions(res.data ?? []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load sessions");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  return (
    <div className="min-h-screen bg-[#0f1117] p-6 md:p-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <QrCode className="h-6 w-6 text-gold" /> Attendance Sessions
          </h1>
          <p className="text-sm text-white/40 mt-1">
            Manage QR-based event attendance sessions
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 rounded-xl bg-gold/90 hover:bg-gold px-4 py-2.5 text-sm font-semibold text-black transition-colors"
        >
          <Plus className="h-4 w-4" /> New Session
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center gap-3 text-white/40">
          <Loader2 className="h-5 w-5 animate-spin" /> Loading sessions…
        </div>
      ) : error ? (
        <div className="flex items-center gap-3 text-red-400">
          <AlertTriangle className="h-5 w-5" /> {error}
        </div>
      ) : sessions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-white/30">
          <QrCode className="h-16 w-16 mb-4 opacity-30" />
          <p className="text-lg font-medium">No sessions yet</p>
          <p className="text-sm mt-1">Create your first attendance session to get started</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {sessions.map((s) => (
            <SessionCard
              key={s._id}
              session={s}
              onOpen={() => router.push(`/admin/attendance/${s._id}`)}
              onDelete={(id) => setSessions((prev) => prev.filter((x) => x._id !== id))}
            />
          ))}
        </div>
      )}

      {showCreate && (
        <CreateModal
          onClose={() => setShowCreate(false)}
          onCreate={(s) => setSessions((prev) => [s, ...prev])}
        />
      )}
    </div>
  );
}
