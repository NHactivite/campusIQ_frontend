// URL of the separately hosted chatbot service (FastAPI + socket.io).
export const CHAT_URL = process.env.NEXT_PUBLIC_CHAT_URL ?? "http://localhost:8000";

// Socket event names. These MUST match server/main.py.
// If your backend uses different names, change them here only.
export const EVENTS = {
  send: "human_message",       // frontend -> backend: { message, threadId, language }
  token: "ai_message",         // backend -> frontend: streamed answer text
  sources: "sources",          // backend -> frontend: list of source documents
  tool: "tool_start",          // backend -> frontend: "searching documents" signal (optional)
  done: "done",                // backend -> frontend: answer finished
  error: "chat_error",         // backend -> frontend: error message (optional)
  history: "get_history",      // frontend -> backend: { threadId }
  historyResult: "history",    // backend -> frontend: [{ role, content }]
  listThreads: "list_threads",   // frontend -> backend
  threads: "threads",            // backend -> frontend: [{ id, title, updatedAt }]
  deleteThread: "delete_thread",
} as const;

export type Lang = "auto" | "en" | "as";

export type Source = { source: string; page: number | null; url?: string };

export type ChatMessage = {
  id: string;
  role: "user" | "ai";
  text: string;
  sources?: Source[];
  pending?: boolean;
  ts?: number;
};

export type ThreadInfo = { id: string; title: string; updatedAt: number };