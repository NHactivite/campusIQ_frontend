"use client";
import { useState, useEffect, useCallback, use } from "react";
import { useAuth, useUser } from "@clerk/nextjs";
import { QrCode, Loader2, AlertTriangle, ChevronRight, XCircle, Circle, RefreshCw } from "lucide-react";
import QRCode from "qrcode";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

type SessionInfo = {
  _id: string;
  title: string;
  description?: string;
  status: "open" | "closed";
  totalGenerated: number;
  pool?: { available: number; allocated: number; used: number };
};

type CurrentState = {
  current: { token: string; allocatedAt: number } | null;
  poolAvailable: number;
};

export default function VolunteerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { getToken } = useAuth();
  const { user } = useUser();

  const [session, setSession] = useState<SessionInfo | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [allocatedAt, setAllocatedAt] = useState<number | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [allocating, setAllocating] = useState(false);
  const [error, setError] = useState("");
  const [poolEmpty, setPoolEmpty] = useState(false);

  // ── Authenticated request helper ─────────────────────────────────────────
  const authFetch = useCallback(
    async (path: string, init: RequestInit = {}) => {
      const t = await getToken();
      const res = await fetch(`${API_URL}${path}`, {
        ...init,
        headers: {
          "Content-Type": "application/json",
          ...(t ? { Authorization: `Bearer ${t}` } : {}),
          ...(init.headers as Record<string, string> ?? {}),
        },
        cache: "no-store",
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { message?: string }).message ?? "Request failed");
      }
      return res.json();
    },
    [getToken]
  );

  // ── Generate QR image ────────────────────────────────────────────────────
  const generateQR = useCallback(async (tok: string) => {
    const url = `${APP_URL}/attend/${id}/${tok}`;
    try {
      const dataUrl = await QRCode.toDataURL(url, {
        width: 320,
        margin: 2,
        color: { dark: "#000000", light: "#ffffff" },
      });
      setQrDataUrl(dataUrl);
    } catch {
      setQrDataUrl(null);
    }
  }, [id]);

  // ── Load current state on mount ───────────────────────────────────────────
  const loadCurrent = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await authFetch(`/api/attendance/sessions/${id}/volunteer/current`);
      const data: CurrentState & { session?: SessionInfo } = res;
      if (data.session) setSession(data.session);
      if (data.current?.token) {
        setToken(data.current.token);
        setAllocatedAt(data.current.allocatedAt);
        await generateQR(data.current.token);
      }
      // Fallback: also load session info directly
      if (!data.session) {
        const sesRes = await authFetch(`/api/attendance/sessions/${id}`);
        if (sesRes?.data) setSession(sesRes.data as SessionInfo);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load session");
    } finally {
      setLoading(false);
    }
  }, [authFetch, id, generateQR]);

  useEffect(() => { void loadCurrent(); }, [loadCurrent]);

  // ── Allocate next QR ──────────────────────────────────────────────────────
  async function handleNext() {
    setAllocating(true);
    setError("");
    setPoolEmpty(false);
    try {
      const res = await authFetch(`/api/attendance/sessions/${id}/volunteer/next`, {
        method: "POST",
      });
      const newToken: string = res.data?.token;
      setToken(newToken);
      setAllocatedAt(Date.now());
      await generateQR(newToken);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to allocate QR";
      if (msg.toLowerCase().includes("pool") || msg.toLowerCase().includes("empty") || msg.toLowerCase().includes("no qr")) {
        setPoolEmpty(true);
      } else {
        setError(msg);
      }
    } finally {
      setAllocating(false);
    }
  }

  // ── UI ────────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f1117] flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-white/40 animate-spin" />
      </div>
    );
  }

  if (!session && error) {
    return (
      <div className="min-h-screen bg-[#0f1117] flex flex-col items-center justify-center gap-3 text-white/40">
        <AlertTriangle className="h-8 w-8 text-red-400" />
        <p className="text-red-400">{error}</p>
      </div>
    );
  }

  const attendUrl = token ? `${APP_URL}/attend/${id}/${token}` : null;

  return (
    <div className="min-h-screen bg-[#0f1117] flex flex-col items-center px-4 py-10">
      <div className="w-full max-w-sm">
        {/* Header */}
        <div className="mb-6 text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gold/10 mb-4">
            <QrCode className="h-7 w-7 text-gold" />
          </div>
          <h1 className="text-xl font-bold text-white">{session?.title ?? "Attendance Session"}</h1>
          {session?.description && (
            <p className="text-sm text-white/40 mt-1">{session.description}</p>
          )}

          {/* Status badge */}
          <div className="mt-3 flex items-center justify-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-0.5 text-xs font-medium ${
                session?.status === "open"
                  ? "bg-emerald-500/15 text-emerald-400"
                  : "bg-red-500/15 text-red-400"
              }`}
            >
              {session?.status === "open" ? (
                <Circle className="h-2 w-2 fill-current" />
              ) : (
                <XCircle className="h-3 w-3" />
              )}
              Session {session?.status ?? "unknown"}
            </span>
          </div>

          {/* Pool indicator */}
          {session?.pool && (
            <p className="text-xs text-white/30 mt-2">
              {session.pool.available} QR codes available in pool
            </p>
          )}
        </div>

        {/* Session closed banner */}
        {session?.status === "closed" && (
          <div className="rounded-2xl bg-red-500/10 border border-red-500/20 p-5 mb-6 text-center">
            <XCircle className="h-8 w-8 text-red-400 mx-auto mb-2" />
            <p className="text-red-400 font-medium">Session Closed</p>
            <p className="text-sm text-white/40 mt-1">
              This session has ended. No more QR codes can be allocated.
            </p>
          </div>
        )}

        {/* QR Code display */}
        {token && qrDataUrl ? (
          <div className="rounded-2xl bg-white p-4 shadow-2xl mb-5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qrDataUrl} alt="QR Code" className="w-full rounded-xl" />
          </div>
        ) : token && !qrDataUrl ? (
          <div className="rounded-2xl bg-[#13161f] border border-white/6 p-8 mb-5 text-center">
            <QrCode className="h-16 w-16 text-white/20 mx-auto mb-3" />
            <p className="text-sm text-white/40">QR display unavailable</p>
          </div>
        ) : (
          <div className="rounded-2xl bg-[#13161f] border border-dashed border-white/10 p-12 mb-5 text-center">
            <QrCode className="h-16 w-16 text-white/10 mx-auto mb-3" />
            <p className="text-sm text-white/30">No QR code allocated yet</p>
            <p className="text-xs text-white/20 mt-1">Click "Next QR" to get started</p>
          </div>
        )}

        {/* Token info */}
        {token && (
          <div className="rounded-2xl bg-[#13161f] border border-white/6 p-4 mb-5 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-white/40">Token (last 10 chars)</span>
              <span className="font-mono text-gold">…{token.slice(-10)}</span>
            </div>
            {allocatedAt && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-white/40">Allocated at</span>
                <span className="text-white/60">{new Date(allocatedAt).toLocaleTimeString()}</span>
              </div>
            )}
            {attendUrl && (
              <div className="text-xs">
                <span className="text-white/40">Scan URL: </span>
                <span className="text-white/60 break-all font-mono text-[10px]">{attendUrl}</span>
              </div>
            )}
          </div>
        )}

        {/* Pool empty notice */}
        {poolEmpty && (
          <div className="rounded-2xl bg-amber-500/10 border border-amber-500/20 p-4 mb-5 text-center">
            <p className="text-amber-400 font-medium text-sm">Pool is empty</p>
            <p className="text-xs text-white/40 mt-1">
              No QR codes available. Ask admin to mint more tokens.
            </p>
            <button
              onClick={() => { setPoolEmpty(false); void loadCurrent(); }}
              className="mt-3 flex items-center gap-1.5 mx-auto text-xs text-white/50 hover:text-white transition-colors"
            >
              <RefreshCw className="h-3.5 w-3.5" /> Check again
            </button>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-3 mb-4 text-sm text-red-400 text-center">
            {error}
          </div>
        )}

        {/* Next QR button */}
        {session?.status === "open" && (
          <button
            onClick={handleNext}
            disabled={allocating}
            className="w-full flex items-center justify-center gap-2 rounded-2xl bg-gold/90 hover:bg-gold py-4 text-base font-bold text-black transition-colors disabled:opacity-60"
          >
            {allocating ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <ChevronRight className="h-5 w-5" />
            )}
            {token ? "Next QR" : "Get First QR"}
          </button>
        )}

        {/* Volunteer info */}
        {user && (
          <p className="text-center text-xs text-white/20 mt-4">
            Signed in as {user.primaryEmailAddress?.emailAddress ?? user.id}
          </p>
        )}
      </div>
    </div>
  );
}
