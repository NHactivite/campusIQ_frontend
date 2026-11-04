"use client";
import { useState, useEffect, useCallback } from "react";
import { Search, Eye } from "lucide-react";
import {
  adminChatStats, adminChatThreads, adminChatMessages, adminUnanswered,
  type ChatStats, type ChatThreadRow, type ChatMsg, type UnansweredRow,
} from "@/lib/adminApi";
import Modal from "@/components/admin/Modal";
import { PageHeader, EmptyState, AdminTable } from "@/components/admin/AdminUI";

const when = (ms: number) =>
  new Date(ms).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

export default function AdminChatsPage() {
  const [tab, setTab] = useState<"chats" | "unanswered">("chats");
  const [stats, setStats] = useState<ChatStats | null>(null);
  const [threads, setThreads] = useState<ChatThreadRow[]>([]);
  const [unanswered, setUnanswered] = useState<UnansweredRow[]>([]);
  const [pages, setPages] = useState(1);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [lang, setLang] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<ChatThreadRow | null>(null);
  const [msgs, setMsgs] = useState<ChatMsg[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (tab === "chats") {
        const r = await adminChatThreads({ page, search, lang });
        setThreads(r.data);
        setPages(r.pagination.pages);
      } else {
        const r = await adminUnanswered(page);
        setUnanswered(r.data);
        setPages(r.pagination.pages);
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [tab, page, search, lang]);

  useEffect(() => { adminChatStats().then(setStats).catch(() => {}); }, []);
  useEffect(() => { load(); }, [load]);
  useEffect(() => { setPage(1); }, [tab, search, lang]);

  const open = async (t: ChatThreadRow) => {
    setView(t);
    setMsgs([]);
    try { setMsgs(await adminChatMessages(t.userId, t.threadId)); } catch { /* shown empty */ }
  };

  const cards = stats && [
    ["Conversations", stats.conversations], ["Questions", stats.questions],
    ["Answered", stats.answered], ["Not answered", stats.unanswered],
    ["Assamese", stats.assamese], ["English", stats.english],
  ];

  const pager = pages > 1 && (
    <div className="mt-4 flex items-center justify-center gap-3 text-sm text-white/60">
      <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="rounded-lg border border-white/10 px-3 py-1.5 disabled:opacity-30">Previous</button>
      <span>Page {page} of {pages}</span>
      <button disabled={page >= pages} onClick={() => setPage((p) => p + 1)} className="rounded-lg border border-white/10 px-3 py-1.5 disabled:opacity-30">Next</button>
    </div>
  );

  return (
    <div>
      <div className="ml-6">
        <PageHeader title="Chat History" subtitle="Every question students ask the CampusIQ assistant" />
      </div>

      {cards && (
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {cards.map(([label, n]) => (
            <div key={label as string} className="rounded-2xl border border-white/6 bg-[#13161f] p-4">
              <p className="text-[10px] font-medium uppercase tracking-wider text-white/40">{label}</p>
              <p className="mt-1 text-2xl font-bold text-white">{n}</p>
            </div>
          ))}
        </div>
      )}

      <div className="mb-5 flex flex-wrap items-center gap-2">
        {([["chats", "Conversations"], ["unanswered", "Unanswered questions"]] as const).map(([k, l]) => (
          <button key={k} onClick={() => setTab(k)}
            className={`rounded-xl px-4 py-2 text-sm font-medium ${tab === k
              ? "border border-gold/30 bg-gold/20 text-gold"
              : "border border-white/6 bg-white/3 text-white/40 hover:text-white"}`}>
            {l}
          </button>
        ))}
        {tab === "chats" && (
          <>
            <div className="relative ml-auto">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search chats…"
                className="rounded-xl border border-white/10 bg-[#13161f] py-2 pl-9 pr-3 text-sm text-white placeholder-white/30 focus:border-gold/60 focus:outline-none" />
            </div>
            <select value={lang} onChange={(e) => setLang(e.target.value)}
              className="rounded-xl border border-white/10 bg-[#13161f] px-3 py-2 text-sm text-white">
              <option value="">All languages</option>
              <option value="en">English</option>
              <option value="as">অসমীয়া</option>
            </select>
          </>
        )}
      </div>

      {error && <p className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">{error}</p>}

      {tab === "chats" ? (
        !loading && threads.length === 0 ? <EmptyState message="No conversations yet." /> : (
          <AdminTable headers={["First question", "User", "Messages", "Language", "Last active", ""]} loading={loading} cols={6}>
            {threads.map((t) => (
              <tr key={`${t.userId}:${t.threadId}`} className="hover:bg-white/2">
                <td className="max-w-xs truncate px-4 py-4 font-medium text-white">{t.title}</td>
                <td className="px-4 py-4 text-xs text-white/60">{t.email}</td>
                <td className="px-4 py-4 text-xs text-white/60">{t.count * 2}</td>
                <td className="px-4 py-4 text-xs text-white/60">{t.lang === "as" ? "অসমীয়া" : "English"}</td>
                <td className="whitespace-nowrap px-4 py-4 text-xs text-white/60">{when(t.updatedAt)}</td>
                <td className="px-4 py-4">
                  <button onClick={() => open(t)} title="View" className="rounded-lg p-1.5 text-white/40 hover:bg-gold/10 hover:text-gold">
                    <Eye className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </AdminTable>
        )
      ) : (
        !loading && unanswered.length === 0 ? <EmptyState message="Every question was answered from the documents." /> : (
          <AdminTable headers={["Question", "User", "Language", "Asked"]} loading={loading} cols={4}>
            {unanswered.map((u, i) => (
              <tr key={i} className="hover:bg-white/2">
                <td className="max-w-md px-4 py-4 text-white">{u.question}</td>
                <td className="px-4 py-4 text-xs text-white/60">{u.email}</td>
                <td className="px-4 py-4 text-xs text-white/60">{u.lang === "as" ? "অসমীয়া" : "English"}</td>
                <td className="whitespace-nowrap px-4 py-4 text-xs text-white/60">{when(u.ts)}</td>
              </tr>
            ))}
          </AdminTable>
        )
      )}
      {pager}

      <Modal open={!!view} onClose={() => setView(null)} title={view ? `${view.email}: ${view.title}` : ""}>
        <div className="space-y-3">
          {msgs.length === 0 && <p className="text-sm text-white/40">Loading…</p>}
          {msgs.map((m, i) => (
            <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${m.role === "user" ? "bg-gold/20 text-white" : "bg-white/6 text-white/80"}`}>
                <p className="whitespace-pre-wrap">{m.text}</p>
                {m.sources?.length > 0 && (
                  <p className="mt-2 text-[11px] text-white/40">
                    Sources: {m.sources.map((s) => s.source).join(", ")}
                  </p>
                )}
                <p className="mt-1 text-[10px] text-white/30">{when(m.ts)}</p>
              </div>
            </div>
          ))}
        </div>
      </Modal>
    </div>
  );
}