"use client";

import { Fragment, useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useAuth } from "@clerk/nextjs";
import { io, type Socket } from "socket.io-client";

import {
  Bot,
  Check,
  Copy,
  FileText,
  GraduationCap,
  Loader2,
  Menu,
  MessageSquare,
  Plus,
  Send,
  Square,
  Trash2,
  Volume2,
  X,
} from "lucide-react";
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
    title: "RDC & IIC Assistant",
    subtitle:
      "Ask about research, innovation, incubation, entrepreneurship, IPR and institutional notices.",
    online: "Online",
    connectingShort: "Connecting…",
    placeholder: "Ask about research or innovation…",
    send: "Send",
    newChat: "New chat",
    sources: "Sources",
    page: "page",
    history: "Your chats",
    noChats: "No chats yet",
    welcome: "How can I help you today?",
    welcomeSub:
      "Ask in English or Assamese. Get information from official university documents.",
    tryAsking: "Try asking",
    signIn: "Please sign in to use the assistant.",
    signInBtn: "Sign in",
    connecting: "Connecting to the assistant…",
    searching: "Searching university documents…",
    thinking: "Typing",
    failed: "Could not reach the assistant. Please try again.",
    privacy:
      "Conversations are saved and may be reviewed by administrators to improve answers.",
    deleteChat: "Delete chat",
    copy: "Copy",
    copied: "Copied",
    today: "Today",
    yesterday: "Yesterday",
    earlier: "Earlier",
    close: "Close",
    listen: "Listen",
    stop: "Stop",
    speechFailed: "Voice is unavailable right now.",
  },

  as: {
    title: "RDC & IIC সহায়ক",
    subtitle:
      "গৱেষণা, উদ্ভাৱন, ইনকিউবেচন, উদ্যোগশীলতা, বৌদ্ধিক সম্পত্তিৰ অধিকাৰ আৰু জাননীৰ বিষয়ে সোধক।",
    online: "অনলাইন",
    connectingShort: "সংযোগ হৈ আছে…",
    placeholder: "গৱেষণা বা উদ্ভাৱনৰ বিষয়ে প্ৰশ্ন লিখক…",
    send: "পঠিয়াওক",
    newChat: "নতুন কথোপকথন",
    sources: "উৎস",
    page: "পৃষ্ঠা",
    history: "আপোনাৰ কথোপকথন",
    noChats: "এতিয়াও কোনো কথোপকথন নাই",
    welcome: "আজি মই আপোনাক কেনেকৈ সহায় কৰিব পাৰোঁ?",
    welcomeSub:
      "অসমীয়া বা ইংৰাজীত প্ৰশ্ন সোধক। উত্তৰসমূহ বিশ্ববিদ্যালয়ৰ চৰকাৰী নথিপত্ৰৰ পৰা প্ৰদান কৰা হয়।",
    tryAsking: "এনে প্ৰশ্ন সুধি চাওক",
    signIn: "সহায়ক ব্যৱহাৰ কৰিবলৈ অনুগ্ৰহ কৰি ছাইন ইন কৰক।",
    signInBtn: "ছাইন ইন",
    connecting: "সহায়কৰ সৈতে সংযোগ কৰি আছে…",
    searching: "বিশ্ববিদ্যালয়ৰ নথিপত্ৰ বিচাৰি আছে…",
    thinking: "লিখি আছে",
    failed: "সহায়কৰ সৈতে সংযোগ কৰিব পৰা নগ'ল। অনুগ্ৰহ কৰি পুনৰ চেষ্টা কৰক।",
    privacy:
      "কথোপকথনসমূহ সংৰক্ষিত হয় আৰু উত্তৰ উন্নত কৰাৰ বাবে প্ৰশাসকে পৰ্যালোচনা কৰিব পাৰে।",
    deleteChat: "কথোপকথন মচক",
    copy: "কপি",
    copied: "কপি হ'ল",
    today: "আজি",
    yesterday: "কালি",
    earlier: "আগৰ",
    close: "বন্ধ",
    listen: "শুনক",
    stop: "বন্ধ কৰক",
    speechFailed: "এই মুহূৰ্তত কণ্ঠস্বৰ উপলব্ধ নহয়।",
  },
} as const;

const EXAMPLES = {
  en: [
    "What research facilities are available at Sibsagar University?",
    "How can I participate in IIC innovation activities?",
    "What incubation support is available for startups?",
    "How can researchers apply for research funding?",
    "What are the procedures for intellectual property rights (IPR)?",
  ],

  as: [
    "শিৱসাগৰ বিশ্ববিদ্যালয়ত কি কি গৱেষণাৰ সুবিধা উপলব্ধ?",
    "IIC-ৰ উদ্ভাৱনীমূলক কাৰ্যসূচীত কেনেকৈ অংশগ্ৰহণ কৰিব পাৰোঁ?",
    "নতুন ষ্টাৰ্টআপৰ বাবে কি কি ইনকিউবেচন সুবিধা আছে?",
    "গৱেষণাৰ বাবে পুঁজি কেনেকৈ লাভ কৰিব পাৰি?",
    "বৌদ্ধিক সম্পত্তিৰ অধিকাৰ (IPR) সম্পৰ্কীয় নিয়মসমূহ কি?",
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

const clock = (ts?: number) =>
  ts
    ? new Date(ts).toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";

// "**bold**" inside one line -> <strong>
function Inline({ text }: { text: string }) {
  return (
    <>
      {text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
        part.startsWith("**") && part.endsWith("**") && part.length > 4 ? (
          <strong key={i} className="font-semibold">
            {part.slice(2, -2)}
          </strong>
        ) : (
          <Fragment key={i}>{part}</Fragment>
        ),
      )}
    </>
  );
}

// tiny, safe markdown: paragraphs, bullet lists and **bold** (no HTML injection)
function RichText({ text }: { text: string }) {
  const blocks: (
    | { type: "p"; text: string }
    | { type: "ul"; items: string[] }
  )[] = [];
  for (const line of text.split("\n")) {
    const bullet = line.match(/^\s*[*\-•]\s+(.*)$/);
    if (bullet) {
      const last = blocks[blocks.length - 1];
      if (last?.type === "ul") last.items.push(bullet[1]);
      else blocks.push({ type: "ul", items: [bullet[1]] });
    } else if (line.trim() === "") {
      continue;
    } else {
      blocks.push({ type: "p", text: line });
    }
  }
  return (
    <div className="space-y-2">
      {blocks.map((b, i) =>
        b.type === "ul" ? (
          <ul key={i} className="space-y-1 pl-1">
            {b.items.map((it, j) => (
              <li key={j} className="flex gap-2">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-gold" />
                <span>
                  <Inline text={it} />
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p key={i}>
            <Inline text={b.text} />
          </p>
        ),
      )}
    </div>
  );
}

function groupThreads(
  list: ThreadInfo[],
  labels: { today: string; yesterday: string; earlier: string },
) {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const today = start.getTime();
  const yesterday = today - 86_400_000;
  const groups: { label: string; items: ThreadInfo[] }[] = [
    { label: labels.today, items: [] },
    { label: labels.yesterday, items: [] },
    { label: labels.earlier, items: [] },
  ];
  for (const th of list) {
    const g = th.updatedAt >= today ? 0 : th.updatedAt >= yesterday ? 1 : 2;
    groups[g].items.push(th);
  }
  return groups.filter((g) => g.items.length > 0);
}

function TypingDots() {
  return (
    <span className="inline-flex items-center gap-1" aria-hidden>
      {[0, 150, 300].map((d) => (
        <span
          key={d}
          className="h-2 w-2 animate-bounce rounded-full bg-slate-400"
          style={{ animationDelay: `${d}ms` }}
        />
      ))}
    </span>
  );
}

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
  const [drawer, setDrawer] = useState(false); // mobile chat list
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [threadId, setThreadId] = useState<string>(() => uid());
  const [threads, setThreads] = useState<ThreadInfo[]>([]);
  const [playing, setPlaying] = useState<string | null>(null); // message id being spoken
  const [loadingAudio, setLoadingAudio] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const stopAudio = useCallback(() => {
    audioRef.current?.pause();
    audioRef.current = null;
    setPlaying(null);
    setLoadingAudio(null);
  }, []);
  useEffect(() => () => stopAudio(), [stopAudio]);

  const socketRef = useRef<Socket | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null); // the scrolling message list
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const threadRef = useRef(threadId); // latest thread id, readable inside socket handlers
  const busyRef = useRef(false); // true while an answer is streaming
  const initRef = useRef(false); // true once the first chat list has arrived

  useEffect(() => {
    threadRef.current = threadId;
  }, [threadId]);
  useEffect(() => {
    busyRef.current = busy;
  }, [busy]);

  // the box grows with the text, up to a limit
  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 128)}px`;
  }, [input]);

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
    socket.on(
      EVENTS.speech,
      (p: { id?: string; audio?: string; error?: boolean }) => {
        setLoadingAudio(null);
        if (!p?.audio || !p.id) {
          setError("speech");
          setTimeout(() => setError(null), 3000);
          return;
        }
        audioRef.current?.pause();
        const a = new Audio(`data:audio/mpeg;base64,${p.audio}`);
        audioRef.current = a;
        setPlaying(p.id);
        a.onended = () => setPlaying(null);
        a.onerror = () => setPlaying(null);
        a.play().catch(() => setPlaying(null));
      },
    );
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
    setDrawer(false);
    inputRef.current?.focus();
  };

  const openThread = (id: string) => {
    setDrawer(false);
    if (id === threadId) return;
    threadRef.current = id;
    setThreadId(id);
    setMessages([]);
    setBusy(false);
    socketRef.current?.emit(EVENTS.history, { threadId: id });
  };

  const deleteThread = (id: string) => {
    socketRef.current?.emit(EVENTS.deleteThread, { threadId: id });
    setThreads((prev) => prev.filter((x) => x.id !== id));
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

    const now = Date.now();
    setMessages((prev) => [
      ...prev,
      { id: uid(), role: "user", text, ts: now },
      { id: uid(), role: "ai", text: "", pending: true, ts: now },
    ]);
    setInput("");
    setBusy(true);
    setError(null);
    rememberThread(text);

    socket.emit(EVENTS.send, { message: text, threadId, language: lang });
  };

  const copy = async (m: ChatMessage) => {
    try {
      await navigator.clipboard.writeText(m.text);
      setCopiedId(m.id);
      setTimeout(() => setCopiedId(null), 1500);
    } catch {
      /* clipboard unavailable */
    }
  };
  const speak = (m: ChatMessage) => {
    if (playing === m.id || loadingAudio === m.id) return stopAudio();
    stopAudio();
    setLoadingAudio(m.id);
    socketRef.current?.emit(EVENTS.speak, {
      id: m.id,
      text: m.text,
      language: lang,
    });
  };

  /* ---------------- render ---------------- */
  if (isLoaded && !isSignedIn) {
    return (
      <div className="mx-auto grid min-h-[60vh] max-w-md place-items-center px-4 text-center">
        <div className="rounded-3xl border border-primary/10 bg-white p-8 shadow-xl">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-linear-to-br from-[#0b1e36] to-[#1d6387] text-white">
            <Bot className="h-7 w-7" />
          </span>
          <h1 className="mt-4 text-2xl font-bold text-primary">{T.en.title}</h1>
          <p className="mt-2 text-sm text-foreground/70">{T.en.signIn}</p>
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

  const groups = groupThreads(threads, t);

  // the chat list, shared by the desktop sidebar and the mobile drawer
  const sidebar = (
    <>
      <div className="p-3">
        <button
          onClick={newChat}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-3 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          {t.newChat}
        </button>
      </div>

      <p className="px-4 pb-1 text-[11px] font-semibold uppercase tracking-wider text-foreground/45">
        {t.history}
      </p>

      <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-3">
        {threads.length === 0 && (
          <p className="px-2 py-3 text-sm text-foreground/40">{t.noChats}</p>
        )}
        {groups.map((g) => (
          <div key={g.label} className="mb-2">
            <p className="px-2 pb-1 pt-2 text-[10px] font-medium uppercase tracking-wider text-foreground/35">
              {g.label}
            </p>
            {g.items.map((th) => {
              const active = th.id === threadId;
              return (
                <div
                  key={th.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => openThread(th.id)}
                  onKeyDown={(e) => e.key === "Enter" && openThread(th.id)}
                  className={`group flex cursor-pointer items-center gap-2.5 rounded-xl px-2.5 py-2.5 text-sm transition-colors ${
                    active
                      ? "bg-primary/10 text-primary"
                      : "text-foreground/70 hover:bg-primary/5"
                  }`}
                >
                  <span
                    className={`grid h-8 w-8 shrink-0 place-items-center rounded-full ${
                      active
                        ? "bg-primary text-white"
                        : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    <MessageSquare className="h-3.5 w-3.5" />
                  </span>
                  <span
                    className={`min-w-0 flex-1 truncate ${active ? "font-semibold" : ""}`}
                  >
                    {th.title}
                  </span>
                  <button
                    type="button"
                    title={t.deleteChat}
                    aria-label={t.deleteChat}
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteThread(th.id);
                    }}
                    className="shrink-0 rounded-md p-1 text-foreground/30 opacity-0 transition hover:bg-red-50 hover:text-red-500 focus:opacity-100 group-hover:opacity-100 max-md:opacity-100"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </>
  );

  return (
    <div className="mx-auto w-full max-w-6xl px-2 py-3 sm:px-4 sm:py-4">
      <div className="relative flex h-[calc(100dvh-8rem)] min-h-130 overflow-hidden rounded-3xl border border-primary/10 bg-white shadow-xl shadow-slate-300/30">
        {/* desktop sidebar */}
        <aside className="hidden w-72 shrink-0 flex-col border-r border-primary/10 bg-[#fafbfc] md:flex">
          {sidebar}
        </aside>

        {/* mobile drawer */}
        {drawer && (
          <div className="absolute inset-0 z-30 md:hidden">
            <div
              className="absolute inset-0 bg-black/40"
              onClick={() => setDrawer(false)}
            />
            <aside className="absolute inset-y-0 left-0 flex w-72 max-w-[85%] flex-col bg-[#fafbfc] shadow-2xl">
              <button
                onClick={() => setDrawer(false)}
                aria-label={t.close}
                className="absolute right-2 top-2 rounded-lg p-1.5 text-foreground/50 hover:bg-slate-100"
              >
                <X className="h-4 w-4" />
              </button>
              {sidebar}
            </aside>
          </div>
        )}

        {/* conversation */}
        <section className="flex min-w-0 flex-1 flex-col">
          {/* header */}
          <header className="flex items-center gap-3 border-b border-primary/10 bg-white px-3 py-3 sm:px-4">
            <button
              onClick={() => setDrawer(true)}
              aria-label={t.history}
              className="rounded-lg p-2 text-primary hover:bg-primary/5 md:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>

            <span className="relative grid h-11 w-11 shrink-0 place-items-center rounded-full bg-linear-to-br from-[#0b1e36] via-[#0d2b40] to-[#1d6387] text-white shadow-sm">
              <GraduationCap className="h-5 w-5" />
              <span
                className={`absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-white ${
                  connected ? "bg-emerald-500" : "animate-pulse bg-amber-400"
                }`}
              />
            </span>

            <div className="min-w-0 flex-1">
              <h1 className="truncate text-base font-bold leading-tight text-primary">
                {t.title}
              </h1>
              <p className="truncate text-xs text-foreground/55">
                {connected ? t.online : t.connectingShort}
                <span className="hidden mt-1 sm:inline "> · {t.subtitle}</span>
              </p>
            </div>

            <div className="flex shrink-0 overflow-hidden rounded-full border border-primary/15 bg-slate-50 p-0.5 text-xs">
              {LANGS.map((l) => (
                <button
                  key={l.value}
                  onClick={() => setLang(l.value)}
                  className={`rounded-full px-2.5 py-1.5 font-medium transition-colors ${
                    lang === l.value
                      ? "bg-primary text-white shadow-sm"
                      : "text-primary hover:bg-primary/5"
                  }`}
                >
                  {l.label}
                </button>
              ))}
            </div>
          </header>

          {/* messages */}
          <div
            ref={listRef}
            className="min-h-0 flex-1 overflow-y-auto bg-linear-to-b from-[#f1f5f9] to-[#e8eef4] px-3 py-5 sm:px-6"
          >
            <div className="mx-auto max-w-3xl space-y-4">
              {messages.length === 0 && (
                <div className="flex flex-col items-center pt-6 text-center sm:pt-12">
                  <span className="grid h-16 w-16 place-items-center rounded-2xl bg-linear-to-br from-[#0b1e36] via-[#0d2b40] to-[#1d6387] text-white shadow-lg">
                    <GraduationCap className="h-8 w-8" />
                  </span>
                  <h2 className="mt-4 text-xl font-bold text-primary sm:text-2xl">
                    {t.welcome}
                  </h2>
                  <p className="mt-1.5 max-w-md text-sm text-foreground/60">
                    {t.welcomeSub}
                  </p>

                  <p className="mt-8 text-xs font-semibold uppercase tracking-wider text-foreground/45">
                    {t.tryAsking}
                  </p>
                  <div className="mt-3 grid w-full max-w-xl gap-2">
                    {examples.map((q) => (
                      <button
                        key={q}
                        onClick={() => send(q)}
                        disabled={!connected}
                        className="flex items-center gap-3 rounded-2xl border border-primary/10 bg-white px-4 py-3 text-left text-sm text-primary shadow-sm transition-all hover:-translate-y-0.5 hover:border-gold hover:shadow-md disabled:opacity-50 disabled:hover:translate-y-0"
                      >
                        <MessageSquare className="h-4 w-4 shrink-0 text-gold" />
                        <span>{q}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map((m) => {
                const mine = m.role === "user";
                return (
                  <div
                    key={m.id}
                    className={`flex items-end gap-2 ${mine ? "justify-end" : "justify-start"}`}
                  >
                    {!mine && (
                      <span className="mb-5 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-linear-to-br from-[#0b1e36] to-[#1d6387] text-white shadow-sm">
                        <Bot className="h-4 w-4" />
                      </span>
                    )}

                    <div
                      className={`flex max-w-[88%] flex-col sm:max-w-[78%] ${mine ? "items-end" : "items-start"}`}
                    >
                      <div
                        className={`px-4 py-2.5 text-[14.5px] leading-relaxed shadow-sm ${
                          mine
                            ? "rounded-2xl rounded-br-md bg-primary text-white"
                            : "rounded-2xl rounded-bl-md border border-slate-200/80 bg-white text-foreground"
                        }`}
                      >
                        {m.pending && !m.text ? (
                          <span className="flex items-center gap-2.5 py-0.5 text-sm text-foreground/55">
                            <TypingDots />
                            <span>{searching ? t.searching : t.thinking}</span>
                          </span>
                        ) : mine ? (
                          <p className="whitespace-pre-wrap">{m.text}</p>
                        ) : (
                          <RichText text={m.text} />
                        )}

                        {!mine && m.sources && m.sources.length > 0 && (
                          <div className="mt-3 border-t border-slate-100 pt-2.5">
                            <p className="text-[10px] font-semibold uppercase tracking-wider text-foreground/45">
                              {t.sources}
                            </p>
                            <div className="mt-1.5 flex flex-wrap gap-1.5">
                              {m.sources.map((s, i) => {
                                const label = s.source;
                                const pageNo = s.page
                                  ? `${t.page} ${s.page}`
                                  : "";
                                const chip =
                                  "group inline-flex max-w-full items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs text-primary transition-colors";
                                const body = (
                                  <>
                                    <span className="grid h-6 w-6 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                                      <FileText className="h-3.5 w-3.5" />
                                    </span>
                                    <span className="min-w-0">
                                      <span className="block truncate font-medium">
                                        {label}
                                      </span>
                                      {pageNo && (
                                        <span className="block text-[10px] text-foreground/45">
                                          {pageNo}
                                        </span>
                                      )}
                                    </span>
                                  </>
                                );
                                return s.url ? (
                                  <a
                                    key={i}
                                    href={s.url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className={`${chip} hover:border-gold hover:bg-amber-50`}
                                  >
                                    {body}
                                  </a>
                                ) : (
                                  <span key={i} className={chip}>
                                    {body}
                                  </span>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                      {!mine && m.text && !m.pending && (
                        <button
                          onClick={() => speak(m)}
                          className="inline-flex items-center gap-1 rounded-md px-1 py-0.5 hover:bg-white hover:text-primary"
                        >
                          {loadingAudio === m.id ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : playing === m.id ? (
                            <Square className="h-3 w-3" />
                          ) : (
                            <Volume2 className="h-3 w-3" />
                          )}
                          {playing === m.id || loadingAudio === m.id
                            ? t.stop
                            : t.listen}
                        </button>
                      )}

                      {/* time + copy */}
                      {!(m.pending && !m.text) && (
                        <div className="mt-1 flex items-center gap-2 px-1 text-[10px] text-foreground/40">
                          {clock(m.ts) && <span>{clock(m.ts)}</span>}
                          {!mine && m.text && !m.pending && (
                            <button
                              onClick={() => copy(m)}
                              className="inline-flex items-center gap-1 rounded-md px-1 py-0.5 hover:bg-white hover:text-primary"
                            >
                              {copiedId === m.id ? (
                                <Check className="h-3 w-3" />
                              ) : (
                                <Copy className="h-3 w-3" />
                              )}
                              {copiedId === m.id ? t.copied : t.copy}
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* status */}
          {error && (
            <p className="border-t border-red-100 bg-red-50 px-4 py-1.5 text-xs text-red-600">
              {error === "speech" ? t.speechFailed : t.failed}
            </p>
          )}
          {!connected && !error && isLoaded && (
            <p className="border-t border-amber-100 bg-amber-50 px-4 py-1.5 text-xs text-amber-700">
              {t.connecting}
            </p>
          )}

          {/* composer */}
          <div className="border-t border-primary/10 bg-white px-3 pb-3 pt-3 sm:px-5">
            <div className="mx-auto flex max-w-3xl items-end gap-2 rounded-3xl border border-primary/15 bg-slate-50 py-1.5 pl-4 pr-1.5 transition focus-within:border-gold focus-within:bg-white focus-within:ring-2 focus-within:ring-gold/20">
              <textarea
                ref={inputRef}
                rows={1}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (
                    e.key === "Enter" &&
                    !e.shiftKey &&
                    !e.nativeEvent.isComposing
                  ) {
                    e.preventDefault();
                    send();
                  }
                }}
                placeholder={t.placeholder}
                className="max-h-32 min-h-9 flex-1 resize-none bg-transparent py-2 text-sm outline-none placeholder:text-foreground/40"
              />
              <button
                onClick={() => send()}
                disabled={busy || !connected || !input.trim()}
                aria-label={t.send}
                title={t.send}
                className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary text-white shadow-sm transition-all hover:bg-primary/90 disabled:bg-slate-300 disabled:shadow-none"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
            <p className="mx-auto mt-2 max-w-3xl text-center text-[11px] text-foreground/40">
              {t.privacy}
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
