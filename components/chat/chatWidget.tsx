"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { io, type Socket } from "socket.io-client";
import { Bot, ExternalLink, FileText, Send, X } from "lucide-react";
import { CHAT_URL, EVENTS, type ChatMessage, type Source } from "@/lib/chat";

const uid = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

const GREETING = "Hi! I'm CampusIQ. Ask me about notices, exams or admissions, in English or অসমীয়া.";
const SUGGESTIONS = ["What subjects are in MCA 1st semester?", "মোৰ পৰীক্ষাৰ তাৰিখ কেতিয়া?"];

// "**bold**" -> <strong>, "* item" -> bullet, nothing else (safe, no HTML injection)
function Rich({ text }: { text: string }) {
  return (
    <div className="space-y-1.5">
      {text.split("\n").filter((l) => l.trim()).map((line, i) => {
        const bullet = line.match(/^\s*[*\-•]\s+(.*)$/);
        const body = (bullet ? bullet[1] : line).split(/(\*\*[^*]+\*\*)/g).map((p, j) =>
          p.startsWith("**") && p.endsWith("**") && p.length > 4 ? (
            <strong key={j}>{p.slice(2, -2)}</strong>
          ) : (
            <span key={j}>{p}</span>
          ),
        );
        return bullet ? (
          <p key={i} className="flex gap-2">
            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-gold" />
            <span>{body}</span>
          </p>
        ) : (
          <p key={i}>{body}</p>
        );
      })}
    </div>
  );
}

function Dots() {
  return (
    <span className="inline-flex items-center gap-1" aria-label="Typing">
      {[0, 150, 300].map((d) => (
        <span key={d} className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400" style={{ animationDelay: `${d}ms` }} />
      ))}
    </span>
  );
}

export default function ChatWidget() {
  const pathname = usePathname();
  const { isLoaded, isSignedIn, getToken } = useAuth();

  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [connected, setConnected] = useState(false);
  const [failed, setFailed] = useState(false);
  const [searching, setSearching] = useState(false);
  const [hint, setHint] = useState("");        // typed greeting next to the button
  const [hintOn, setHintOn] = useState(false);

  const socketRef = useRef<Socket | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);
  const threadRef = useRef(uid());

  const hidden = pathname.startsWith("/chat") || pathname.startsWith("/sign-");
  const isAdmin = pathname.startsWith("/admin");
const side = isAdmin ? "left-5 md:left-72" : "right-5";
const panelSide = isAdmin ? "sm:left-72" : "sm:right-5";
  const patchPending = useCallback((fn: (m: ChatMessage) => ChatMessage) => {
    setMessages((prev) => {
      let i = -1;
      for (let k = prev.length - 1; k >= 0; k--) if (prev[k].pending) { i = k; break; }
      if (i < 0) return prev;
      const next = [...prev];
      next[i] = fn(next[i]);
      return next;
    });
  }, []);

  /* typed greeting: shown once per visit, 2.5 s after the page loads */
  useEffect(() => {
    if (hidden) return;
    try { if (sessionStorage.getItem("campusiq:hint")) return; } catch { /* ignore */ }
    let typer: ReturnType<typeof setInterval>;
    const start = setTimeout(() => {
      setHintOn(true);
      let n = 0;
      typer = setInterval(() => {
        n++;
        setHint(GREETING.slice(0, n));
        if (n >= GREETING.length) clearInterval(typer);
      }, 28);
      try { sessionStorage.setItem("campusiq:hint", "1"); } catch { /* ignore */ }
    }, 2500);
    const stop = setTimeout(() => setHintOn(false), 12000);
    return () => { clearTimeout(start); clearTimeout(stop); clearInterval(typer); };
  }, [hidden]);

  /* connect only while the panel is open */
  useEffect(() => {
    if (!open || !isLoaded || !isSignedIn) return;

    const socket = io(CHAT_URL, {
      transports: ["websocket"],
      auth: (cb) => { getToken().then((token) => cb({ token })); },
    });
    socketRef.current = socket;

    socket.on("connect", () => { setConnected(true); setFailed(false); });
    socket.on("disconnect", () => setConnected(false));
    socket.on("connect_error", () => { setConnected(false); setFailed(true); });
    socket.on(EVENTS.tool, () => setSearching(true));

    socket.on(EVENTS.token, (p: unknown) => {
      const piece = typeof p === "string" ? p : ((p as { text?: string })?.text ?? "");
      if (!piece) return;
      setSearching(false);
      patchPending((m) => ({ ...m, text: m.text + piece })); // the answer types itself as the model writes
    });
    socket.on(EVENTS.sources, (p: unknown) => {
      const items: Source[] = Array.isArray(p) ? p : ((p as { items?: Source[] })?.items ?? []);
      patchPending((m) => ({ ...m, sources: items }));
    });
    socket.on(EVENTS.done, () => {
      setSearching(false);
      setBusy(false);
      patchPending((m) => ({ ...m, pending: false }));
    });
    socket.on(EVENTS.error, () => {
      setSearching(false);
      setBusy(false);
      setFailed(true);
      patchPending((m) => ({ ...m, pending: false }));
    });

    return () => { socket.disconnect(); socketRef.current = null; };
  }, [open, isLoaded, isSignedIn, getToken, patchPending]);

  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages, searching, open]);

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
    setFailed(false);
    socket.emit(EVENTS.send, { message: text, threadId: threadRef.current, language: "auto" });
  };

  const reset = () => {
    threadRef.current = uid();
    setMessages([]);
    setBusy(false);
  };

  if (hidden) return null;

  return (
    <>
      {/* chat panel */}
      {open && (
         <div
      className={`fixed inset-x-3 bottom-24 z-50 flex h-[min(34rem,calc(100dvh-8rem))] flex-col overflow-hidden rounded-3xl border border-primary/10 bg-white shadow-2xl shadow-slate-900/20 sm:inset-x-auto ${panelSide} sm:w-96`}
    >
          <header className="flex items-center gap-3 bg-linear-to-r from-[#0b1e36] to-[#1d6387] px-4 py-3 text-white">
            <span className="relative grid h-9 w-9 place-items-center rounded-full bg-white/15">
              <Bot className="h-5 w-5" />
              <span className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-[#0d2b40] ${connected ? "bg-emerald-400" : "animate-pulse bg-amber-400"}`} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold leading-tight">CampusIQ Assistant</p>
              <p className="text-[11px] text-white/70">{connected ? "Online" : "Connecting…"}</p>
            </div>
            <Link href="/chat" title="Open full chat" className="rounded-lg p-1.5 text-white/80 hover:bg-white/15">
              <ExternalLink className="h-4 w-4" />
            </Link>
            <button onClick={() => setOpen(false)} aria-label="Close" className="rounded-lg p-1.5 text-white/80 hover:bg-white/15">
              <X className="h-4 w-4" />
            </button>
          </header>

          {isLoaded && !isSignedIn ? (
            <div className="grid flex-1 place-items-center bg-[#f1f5f9] p-6 text-center">
              <div>
                <Bot className="mx-auto h-10 w-10 text-primary" />
                <p className="mt-3 text-sm text-foreground/70">Please sign in to chat with the assistant.</p>
                <Link href="/sign-in" className="mt-4 inline-flex h-10 items-center rounded-full bg-primary px-6 text-sm font-semibold text-white hover:bg-primary/90">
                  Sign in
                </Link>
              </div>
            </div>
          ) : (
            <>
              <div ref={listRef} className="min-h-0 flex-1 space-y-3 overflow-y-auto bg-[#f1f5f9] px-3 py-4">
                {messages.length === 0 && (
                  <div className="space-y-3">
                    <div className="max-w-[85%] rounded-2xl rounded-bl-md border border-slate-200 bg-white px-3.5 py-2.5 text-sm shadow-sm">
                      {GREETING}
                    </div>
                    <div className="flex flex-col gap-2">
                      {SUGGESTIONS.map((q) => (
                        <button
                          key={q}
                          onClick={() => send(q)}
                          disabled={!connected}
                          className="rounded-xl border border-primary/15 bg-white px-3 py-2 text-left text-xs text-primary shadow-sm transition hover:border-gold disabled:opacity-50"
                        >
                          {q}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {messages.map((m) => {
                  const mine = m.role === "user";
                  return (
                    <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[88%] px-3.5 py-2.5 text-[13.5px] leading-relaxed shadow-sm ${mine ? "rounded-2xl rounded-br-md bg-primary text-white" : "rounded-2xl rounded-bl-md border border-slate-200 bg-white text-foreground"}`}>
                        {m.pending && !m.text ? (
                          <span className="flex items-center gap-2 text-xs text-foreground/55">
                            <Dots /> {searching ? "Searching documents…" : "Typing"}
                          </span>
                        ) : mine ? (
                          <p className="whitespace-pre-wrap">{m.text}</p>
                        ) : (
                          <Rich text={m.text} />
                        )}
                        {!mine && m.sources && m.sources.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1.5 border-t border-slate-100 pt-2">
                            {m.sources.map((s, i) => {
                              const chip = "inline-flex max-w-full items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] text-primary";
                              const label = `${s.source}${s.page ? ` · p.${s.page}` : ""}`;
                              return s.url ? (
                                <a key={i} href={s.url} target="_blank" rel="noreferrer" className={`${chip} hover:border-gold`}>
                                  <FileText className="h-3 w-3 shrink-0" /><span className="truncate">{label}</span>
                                </a>
                              ) : (
                                <span key={i} className={chip}><FileText className="h-3 w-3 shrink-0" /><span className="truncate">{label}</span></span>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {failed && <p className="bg-red-50 px-3 py-1.5 text-xs text-red-600">Could not reach the assistant. Please try again.</p>}

              <div className="border-t border-primary/10 bg-white p-2.5">
                <div className="flex items-end gap-2 rounded-2xl border border-primary/15 bg-slate-50 py-1 pl-3 pr-1 focus-within:border-gold focus-within:bg-white">
                  <textarea
                    rows={1}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); send(); }
                    }}
                    placeholder="Type your question…"
                    className="max-h-24 min-h-9 flex-1 resize-none bg-transparent py-2 text-sm outline-none placeholder:text-foreground/40"
                  />
                  <button
                    onClick={() => send()}
                    disabled={busy || !connected || !input.trim()}
                    aria-label="Send"
                    className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary text-white transition hover:bg-primary/90 disabled:bg-slate-300"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </div>
                {messages.length > 0 && (
                  <button onClick={reset} className="mt-1.5 w-full text-center text-[11px] text-foreground/45 hover:text-primary">
                    New conversation
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* typed greeting bubble */}
      {!open && hintOn && hint && (
        <button
          onClick={() => { setOpen(true); setHintOn(false); }}
           className={`fixed bottom-24 ${side} z-40 max-w-[16rem] rounded-2xl rounded-br-md border border-primary/10 bg-white px-3.5 py-2.5 text-left text-[13px] text-foreground shadow-xl`}
        >
          {hint}
          <span className="ml-0.5 inline-block h-3.5 w-0.5 animate-pulse bg-primary align-middle" />
        </button>
      )}

      {/* robot button */}
      <button
        onClick={() => { setOpen((v) => !v); setHintOn(false); }}
        aria-label={open ? "Close assistant" : "Open assistant"}
        className={`fixed bottom-5 ${side} z-50 grid h-14 w-14 place-items-center rounded-full bg-linear-to-br from-[#0b1e36] via-[#0d2b40] to-[#1d6387] text-white shadow-xl shadow-slate-900/30 transition-transform hover:scale-105`}
  >
        {!open && <span className="absolute inset-0 animate-ping rounded-full bg-[#1d6387]/40" />}
        <span className="relative">{open ? <X className="h-6 w-6" /> : <Bot className="h-7 w-7" />}</span>
      </button>
    </>
  );
}