"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useAuth } from "@clerk/nextjs";
import { io, type Socket } from "socket.io-client";
import { FileText, MessageSquare, Plus, Send } from "lucide-react";
import {
  CHAT_URL,
  EVENTS,
  type ChatMessage,
  type Lang,
  type Source,
  type ThreadInfo,
} from "@/lib/chat";

/* ---------------- interface text (English / Assamese) ---------------- */
const T = {
  en: {
    title: "CampusIQ Assistant",
    subtitle: "Ask about regulations, exams, scholarships, admissions and notices.",
    placeholder: "Type your question…",
    send: "Send",
    newChat: "New chat",
    sources: "Sources",
    page: "page",
    history: "Your chats",
    noChats: "No chats yet",
    tryAsking: "Try asking",
    signIn: "Please sign in to use the assistant.",
    signInBtn: "Sign in",
    connecting: "Connecting to the assistant…",
    searching: "Searching university documents…",
    failed: "Could not reach the assistant. Please try again.",
    privacy: "Conversations are saved and may be reviewed by administrators to improve answers.",
    deleteChat: "Delete chat",
  },
  as: {
    title: "CampusIQ সহায়ক",
    subtitle: "নিয়ম, পৰীক্ষা, বৃত্তি, নামভৰ্তি আৰু বিজ্ঞপ্তিৰ বিষয়ে সোধক।",
    placeholder: "আপোনাৰ প্ৰশ্ন লিখক…",
    send: "পঠিয়াওক",
    newChat: "নতুন কথোপকথন",
    sources: "উৎস",
    page: "পৃষ্ঠা",
    history: "আপোনাৰ কথোপকথন",
    noChats: "এতিয়াও কোনো কথোপকথন নাই",
    tryAsking: "এনে প্ৰশ্ন সুধি চাওক",
    signIn: "সহায়ক ব্যৱহাৰ কৰিবলৈ অনুগ্ৰহ কৰি ছাইন ইন কৰক।",
    signInBtn: "ছাইন ইন",
    connecting: "সহায়কৰ সৈতে সংযোগ কৰি আছে…",
    searching: "বিশ্ববিদ্যালয়ৰ নথিপত্ৰ বিচাৰি আছে…",
    failed: "সহায়কৰ সৈতে সংযোগ কৰিব পৰা নগ’ল। অনুগ্ৰহ কৰি পুনৰ চেষ্টা কৰক।",
    privacy: "কথোপকথনসমূহ সংৰক্ষিত হয় আৰু উত্তৰ উন্নত কৰিবলৈ প্ৰশাসকে পৰ্যালোচনা কৰিব পাৰে।",
    deleteChat: "কথোপকথন মচক",
  },
} as const;

const EXAMPLES = {
  en: [
    "What is the last date to complete the personal profile for ID cards?",
    "Where is the cheque distribution programme held?",
  ],
  as: [
    "আইডি কাৰ্ডৰ বাবে ব্যক্তিগত প্ৰফাইল সম্পূৰ্ণ কৰাৰ শেষ তাৰিখ কেতিয়া?",
    "চেক বিতৰণ কাৰ্যসূচী ক'ত অনুষ্ঠিত হ'ব?",
  ],
} as const;

const LANGS: { value: Lang; label: string }[] = [
  { value: "auto", label: "Auto" },
  { value: "en", label: "English" },
  { value: "as", label: "অসমীয়া" },
];

/* ---------------- small helpers ---------------- */
const uid = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

/* ---------------- component ---------------- */
export default function ChatClient() {
  const { isLoaded, isSignedIn, getToken } = useAuth();

  const [lang, setLang] = useState<Lang>("auto");
  const t = T[lang === "as" ? "as" : "en"];
  const examples = EXAMPLES[lang === "as" ? "as" : "en"];

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searching, setSearching] = useState(false);

  const [threadId, setThreadId] = useState<string>(() => uid());
  const [threads, setThreads] = useState<ThreadInfo[]>([]);

  const socketRef = useRef<Socket | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null); // the scrolling message list
  const threadRef = useRef(threadId); // latest thread id, readable inside socket handlers
  const busyRef = useRef(false); // true while an answer is streaming
  const initRef = useRef(false); // true once the first chat list has arrived

  useEffect(() => {
    threadRef.current = threadId;
  }, [threadId]);
  useEffect(() => {
    busyRef.current = busy;
  }, [busy]);

  // update the answer that is currently being written
  const patchPending = useCallback((fn: (m: ChatMessage) => ChatMessage) => {
    setMessages((prev) => {
      let i = -1;
      for (let k = prev.length - 1; k >= 0; k--) {
        if (prev[k].pending) {
          i = k;
          break;
        }
      }
      if (i < 0) return prev;
      const next = [...prev];
      next[i] = fn(next[i]);
      return next;
    });
  }, []);

  /* ---- socket connection (token is refreshed on every reconnect) ---- */
  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;

    const socket = io(CHAT_URL, {
      transports: ["websocket"],
      auth: (cb) => {
        getToken().then((token) => cb({ token }));
      },
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      setConnected(true);
      setError(null);
      socket.emit(EVENTS.listThreads); // chat list comes from the server
    });
    socket.on("disconnect", () => setConnected(false));
    socket.on("connect_error", () => {
      setConnected(false);
      setError("failed");
    });

    // chat list from the server (works on any device)
    socket.on(EVENTS.threads, (list: ThreadInfo[]) => {
      setThreads(Array.isArray(list) ? list : []);
      // first time only: reopen the newest chat after a reload
      if (!initRef.current) {
        initRef.current = true;
        if (Array.isArray(list) && list.length > 0 && !busyRef.current) {
          threadRef.current = list[0].id;
          setThreadId(list[0].id);
          socket.emit(EVENTS.history, { threadId: list[0].id });
        }
      }
    });

    socket.on(EVENTS.tool, () => setSearching(true));

    socket.on(EVENTS.token, (p: unknown) => {
      const piece =
        typeof p === "string" ? p : ((p as { text?: string })?.text ?? "");
      if (!piece) return;
      setSearching(false);
      patchPending((m) => ({ ...m, text: m.text + piece }));
    });

    socket.on(EVENTS.sources, (p: unknown) => {
      const items: Source[] = Array.isArray(p)
        ? p
        : ((p as { items?: Source[] })?.items ?? []);
      patchPending((m) => ({ ...m, sources: items }));
    });

    socket.on(EVENTS.done, () => {
      setSearching(false);
      setBusy(false);
      patchPending((m) => ({ ...m, pending: false }));
      socket.emit(EVENTS.listThreads); // refresh the sidebar after each answer
    });

    socket.on(EVENTS.error, () => {
      setSearching(false);
      setBusy(false);
      setError("failed");
      patchPending((m) => ({ ...m, pending: false }));
    });

    socket.on(EVENTS.historyResult, (p: unknown) => {
      if (busyRef.current) return; // never overwrite a live answer
      const list = (Array.isArray(p) ? p : []) as {
        role: string;
        content: string;
        sources?: Source[];
      }[];
      setMessages(
        list.map((m) => ({
          id: uid(),
          role: m.role === "user" || m.role === "human" ? "user" : "ai",
          text: m.content,
          sources: m.sources,
        })),
      );
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [isLoaded, isSignedIn, getToken, patchPending]);

  /* ---- keep the newest message in view (scrolls the chat box only, not the page) ---- */
  useEffect(() => {
    const el = listRef.current;
    if (el && messages.length > 0) {
      el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
    }
  }, [messages, searching]);

  /* ---- actions ---- */
  const newChat = () => {
    const id = uid();
    threadRef.current = id;
    setThreadId(id);
    setMessages([]);
    setBusy(false);
    setError(null);
  };

  const openThread = (id: string) => {
    if (id === threadId) return;
    threadRef.current = id;
    setThreadId(id);
    setMessages([]);
    setBusy(false);
    socketRef.current?.emit(EVENTS.history, { threadId: id });
  };

  const deleteThread = (id: string) => {
    socketRef.current?.emit(EVENTS.deleteThread, { threadId: id });
    if (id === threadId) newChat();
  };

  // shows the chat in the sidebar straight away; the server list replaces it after the answer
  const rememberThread = (text: string) => {
    setThreads((prev) => {
      const existing = prev.find((x) => x.id === threadId);
      const rest = prev.filter((x) => x.id !== threadId);
      const entry: ThreadInfo = {
        id: threadId,
        title: existing?.title ?? text.slice(0, 60),
        updatedAt: Date.now(),
      };
      return [entry, ...rest];
    });
  };

  const send = (raw?: string) => {
    const text = (raw ?? input).trim();
    const socket = socketRef.current;
    if (!text || busy || !socket?.connected) return;

    setMessages((prev) => [
      ...prev,
      { id: uid(), role: "user", text },
      { id: uid(), role: "ai", text: "", pending: true },
    ]);
    setInput("");
    setBusy(true);
    setError(null);
    rememberThread(text);

    socket.emit(EVENTS.send, { message: text, threadId, language: lang });
  };

  /* ---------------- render ---------------- */
  if (isLoaded && !isSignedIn) {
    return (
      <div className="mx-auto grid min-h-[60vh] max-w-md place-items-center px-4 text-center">
        <div>
          <h1 className="text-2xl font-bold text-primary">{T.en.title}</h1>
          <p className="mt-3 text-foreground/70">{T.en.signIn}</p>
          <Link
            href="/sign-in"
            className="mt-6 inline-flex h-11 items-center rounded-full bg-primary px-8 text-sm font-semibold text-white hover:bg-primary/90"
          >
            {T.en.signInBtn}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex h-[78vh] w-full max-w-6xl gap-4 px-3 py-4 sm:px-4">
      {/* chat list */}
      <aside className="hidden w-64 shrink-0 flex-col rounded-2xl border border-primary/15 bg-white p-3 md:flex">
        <button
          onClick={newChat}
          className="flex items-center justify-center gap-2 rounded-xl bg-primary px-3 py-2 text-sm font-semibold text-white hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          {t.newChat}
        </button>
        <p className="mt-4 px-1 text-xs font-medium uppercase tracking-wider text-foreground/50">
          {t.history}
        </p>
        <div className="mt-2 min-h-0 flex-1 space-y-1 overflow-y-auto">
          {threads.length === 0 && (
            <p className="px-1 py-2 text-sm text-foreground/40">{t.noChats}</p>
          )}
          {threads.map((th) => (
            <button
              key={th.id}
              onClick={() => openThread(th.id)}
              className={`group flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm transition-colors hover:bg-primary/5 ${
                th.id === threadId ? "bg-primary/10 font-medium text-primary" : "text-foreground/70"
              }`}
            >
              <MessageSquare className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{th.title}</span>
              <span
                role="button"
                title={t.deleteChat}
                onClick={(e) => {
                  e.stopPropagation();
                  deleteThread(th.id);
                }}
                className="ml-auto shrink-0 rounded px-1 text-foreground/30 hover:text-red-500"
              >
                ✕
              </span>
            </button>
          ))}
        </div>
      </aside>

      {/* conversation */}
      <section className="flex min-w-0 flex-1 flex-col rounded-2xl border border-primary/15 bg-white">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-primary/10 px-4 py-3">
          <div className="min-w-0">
            <h1 className="truncate text-lg font-bold text-primary">{t.title}</h1>
            <p className="truncate text-xs text-foreground/60">{t.subtitle}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={newChat}
              className="rounded-lg border border-primary/20 px-2.5 py-1.5 text-xs text-primary md:hidden"
            >
              {t.newChat}
            </button>
            <div className="flex overflow-hidden rounded-lg border border-primary/20 text-xs">
              {LANGS.map((l) => (
                <button
                  key={l.value}
                  onClick={() => setLang(l.value)}
                  className={`px-2.5 py-1.5 transition-colors ${
                    lang === l.value ? "bg-primary text-white" : "text-primary hover:bg-primary/5"
                  }`}
                >
                  {l.label}
                </button>
              ))}
            </div>
          </div>
        </header>

        <div ref={listRef} className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-4">
          {messages.length === 0 && (
            <div className="mx-auto max-w-md pt-8 text-center">
              <p className="text-sm font-medium text-foreground/60">{t.tryAsking}</p>
              <div className="mt-3 space-y-2">
                {examples.map((q) => (
                  <button
                    key={q}
                    onClick={() => send(q)}
                    disabled={!connected}
                    className="w-full rounded-xl border border-primary/15 px-3 py-2 text-sm text-primary transition-colors hover:bg-primary/5 disabled:opacity-50"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((m) => (
            <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                  m.role === "user" ? "bg-primary text-white" : "bg-[#f4f7f9] text-foreground"
                }`}
              >
                {m.pending && !m.text ? (
                  <span className="text-foreground/50">{searching ? t.searching : "…"}</span>
                ) : (
                  <p className="whitespace-pre-wrap">{m.text}</p>
                )}

                {m.role === "ai" && m.sources && m.sources.length > 0 && (
                  <div className="mt-3 border-t border-primary/10 pt-2">
                    <p className="text-[11px] font-medium uppercase tracking-wider text-foreground/50">
                      {t.sources}
                    </p>
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      {m.sources.map((s, i) => {
                        const label = `${s.source}${s.page ? ` · ${t.page} ${s.page}` : ""}`;
                        const chip =
                          "inline-flex max-w-full items-center gap-1 rounded-md bg-white px-2 py-1 text-xs text-primary ring-1 ring-primary/15";
                        return s.url ? (
                          <a key={i} href={s.url} target="_blank" rel="noreferrer" className={`${chip} hover:ring-gold`}>
                            <FileText className="h-3 w-3 shrink-0" />
                            <span className="truncate">{label}</span>
                          </a>
                        ) : (
                          <span key={i} className={chip}>
                            <FileText className="h-3 w-3 shrink-0" />
                            <span className="truncate">{label}</span>
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {error && <p className="px-4 pb-1 text-xs text-red-600">{t.failed}</p>}
        {!connected && !error && isLoaded && (
          <p className="px-4 pb-1 text-xs text-foreground/50">{t.connecting}</p>
        )}

        <div className="border-t border-primary/10 p-3">
          <div className="flex items-end gap-2">
            <textarea
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
              placeholder={t.placeholder}
              className="max-h-32 min-h-11 flex-1 resize-none rounded-xl border border-primary/20 px-3 py-2.5 text-sm outline-none focus:border-gold focus:ring-2 focus:ring-gold/20"
            />
            <button
              onClick={() => send()}
              disabled={busy || !connected || !input.trim()}
              className="flex h-11 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-white transition-colors hover:bg-primary/90 disabled:opacity-40"
            >
              <Send className="h-4 w-4" />
              <span className="hidden sm:inline">{t.send}</span>
            </button>
          </div>
          <p className="mt-2 text-[11px] text-foreground/40">{t.privacy}</p>
        </div>
      </section>
    </div>
  );
}