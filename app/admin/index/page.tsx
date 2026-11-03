"use client";
import { useState, useEffect, useCallback, Fragment } from "react";
import { RefreshCw, ChevronDown, ChevronRight, CheckCircle2, AlertTriangle, XCircle, MinusCircle } from "lucide-react";
import {
  adminGetIndexStatus,
  adminResyncItem,
  adminResyncMissing,
  type IndexStatus,
  type IndexRow,
} from "@/lib/adminApi";
import { Toast, PageHeader, EmptyState, AdminTable } from "@/components/admin/AdminUI";

type ToastState = { message: string; type: "success" | "error" } | null;
type Filter = "all" | IndexRow["status"];

const statusStyle: Record<IndexRow["status"], { label: string; cls: string }> = {
  indexed: { label: "Indexed", cls: "bg-emerald-500/20 text-emerald-300" },
  partial: { label: "Partly indexed", cls: "bg-amber-500/20 text-amber-300" },
  missing: { label: "Not indexed", cls: "bg-red-500/20 text-red-300" },
  draft: { label: "Draft (hidden)", cls: "bg-slate-500/20 text-slate-300" },
};

const kindLabel: Record<IndexRow["kind"], string> = {
  event: "Event",
  notice: "Notice",
  feature: "Feature",
  glance: "At a glance",
  linkage: "Linkage",
  facility: "Facility",
  programme: "Programme",
};

const editLink: Record<IndexRow["kind"], string> = {
  event: "/admin/events",
  notice: "/admin/notices",
  feature: "/admin/features",
  glance: "/admin/glance",
  linkage: "/admin/linkages",
  facility: "/admin/facilities",
  programme: "/admin/programmes",
};

const partIcon = {
  ok: <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />,
  missing: <XCircle className="h-3.5 w-3.5 text-red-400" />,
  skipped: <MinusCircle className="h-3.5 w-3.5 text-white/30" />,
  no_text: <MinusCircle className="h-3.5 w-3.5 text-white/30" />,
};

export default function AdminIndexPage() {
  const [data, setData] = useState<IndexStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("all");
  const [open, setOpen] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null); // "kind:id" or "all"
  const [toast, setToast] = useState<ToastState>(null);

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await adminGetIndexStatus());
    } catch (e: any) {
      setError(e.message ?? "Failed to load index status");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const resync = async (r: IndexRow) => {
    setBusy(`${r.kind}:${r.id}`);
    try {
      await adminResyncItem(r.kind, r.id);
      showToast("Re-sync queued. Click Refresh in a minute to see the result.", "success");
    } catch (e: any) {
      showToast(e.message, "error");
    } finally {
      setBusy(null);
    }
  };

  const resyncAll = async () => {
    setBusy("all");
    try {
      const { queued } = await adminResyncMissing();
      showToast(
        queued ? `${queued} item(s) queued. The chatbot works through them one by one.` : "Nothing to re-sync.",
        "success",
      );
    } catch (e: any) {
      showToast(e.message, "error");
    } finally {
      setBusy(null);
    }
  };

  const items = (data?.items ?? []).filter((r) => filter === "all" || r.status === filter);
  const s = data?.summary;
  const needsWork = (s?.missing ?? 0) + (s?.partial ?? 0);

  const tabs: { key: Filter; label: string; n?: number }[] = [
    { key: "all", label: "All", n: s?.total },
    { key: "missing", label: "Not indexed", n: s?.missing },
    { key: "partial", label: "Partly indexed", n: s?.partial },
    { key: "indexed", label: "Indexed", n: s?.indexed },
    { key: "draft", label: "Drafts", n: s?.draft },
  ];

  return (
    <div>
      <div className="ml-6">
        <PageHeader
          title="Chatbot Index"
          subtitle="What the CampusIQ chatbot has learned, compared with what is saved on the website"
          action={
            <div className="flex items-center gap-2">
              <button
                onClick={load}
                disabled={loading}
                className="flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm font-medium text-white/70 transition-colors hover:bg-white/5 hover:text-white disabled:opacity-50"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                Refresh
              </button>
              <button
                onClick={resyncAll}
                disabled={busy !== null || needsWork === 0}
                className="flex items-center gap-2 rounded-xl bg-linear-to-r from-gold to-[#e8b84b] px-4 py-2.5 text-sm font-semibold text-[#0f1117] transition-opacity hover:opacity-90 disabled:opacity-40"
              >
                Re-sync all missing{needsWork > 0 ? ` (${needsWork})` : ""}
              </button>
            </div>
          }
        />
      </div>

      {error && (
        <div className="mb-5 flex items-start gap-3 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <div>
            {error}
            <p className="mt-1 text-xs text-red-300/70">
              Check that the chatbot is running and that CHATBOT_URL and INGEST_SECRET match on both sides.
            </p>
          </div>
        </div>
      )}

      {/* filter tabs */}
      <div className="mb-5 flex flex-wrap gap-2">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setFilter(t.key)}
            className={`rounded-xl px-4 py-2 text-sm font-medium transition-colors ${
              filter === t.key
                ? "border border-[#c69a36]/30 bg-[#c69a36]/20 text-[#c69a36]"
                : "border border-white/[0.06] bg-white/[0.03] text-white/40 hover:bg-white/[0.06] hover:text-white"
            }`}
          >
            {t.label}
            {t.n !== undefined && <span className="ml-2 text-xs opacity-70">{t.n}</span>}
          </button>
        ))}
      </div>

      {!loading && !error && items.length === 0 ? (
        <EmptyState message="Nothing in this view." />
      ) : (
        <AdminTable headers={["", "Title", "Type", "Status", "Parts", "Actions"]} loading={loading} cols={6}>
          {items.map((r) => {
            const key = `${r.kind}:${r.id}`;
            const isOpen = open === key;
            const st = statusStyle[r.status];
            const bad = r.parts.filter((p) => p.status === "missing").length;
            return (
              <Fragment key={key}>
                <tr className="transition-colors hover:bg-white/2">
                  <td className="w-8 px-4 py-4">
                    <button
                      onClick={() => setOpen(isOpen ? null : key)}
                      className="text-white/40 hover:text-white"
                      title="Show parts"
                    >
                      {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    </button>
                  </td>
                  <td className="max-w-xs px-4 py-4">
                    <p className="truncate font-medium text-white">{r.title}</p>
                    {r.category && <p className="mt-0.5 text-xs text-white/40">{r.category}</p>}
                  </td>
                  <td className="px-4 py-4 text-xs text-white/60">{kindLabel[r.kind]}</td>
                  <td className="px-4 py-4">
                    <span className={`rounded-lg px-2.5 py-0.5 text-xs font-semibold ${st.cls}`}>{st.label}</span>
                  </td>
                  <td className="px-4 py-4 text-xs text-white/50">
                    {r.parts.length} part{r.parts.length === 1 ? "" : "s"}
                    {bad > 0 && <span className="ml-2 text-red-400">{bad} missing</span>}
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => resync(r)}
                        disabled={busy !== null || r.status === "draft"}
                        title={r.status === "draft" ? "Drafts are not indexed. Publish it first." : "Re-index this item"}
                        className="flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-1.5 text-xs font-medium text-white/70 transition-colors hover:border-gold/50 hover:text-gold disabled:opacity-40"
                      >
                        <RefreshCw className={`h-3 w-3 ${busy === key ? "animate-spin" : ""}`} />
                        Re-sync
                      </button>
                      <a href={editLink[r.kind]} className="text-xs text-white/40 hover:text-gold">
                        Edit →
                      </a>
                    </div>
                  </td>
                </tr>

                {isOpen && (
                  <tr className="bg-white/[0.02]">
                    <td />
                    <td colSpan={5} className="px-4 pb-4">
                      <ul className="space-y-1.5">
                        {r.parts.length === 0 && (
                          <li className="text-xs text-white/40">
                            No text and no files, so there is nothing to index.
                          </li>
                        )}
                        {r.parts.map((p, i) => (
                          <li key={i} className="flex items-center gap-2 text-xs text-white/70">
                            {partIcon[p.status]}
                            <span className="truncate">{p.label}</span>
                            {p.note && <span className="text-white/30">· {p.note}</span>}
                          </li>
                        ))}
                      </ul>
                    </td>
                  </tr>
                )}
              </Fragment>
            );
          })}
        </AdminTable>
      )}

      {toast && <Toast message={toast.message} type={toast.type} />}
    </div>
  );
}