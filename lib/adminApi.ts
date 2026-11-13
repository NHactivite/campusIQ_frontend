import { API_URL, type EventItem } from "./api";

// ─── token handling ──────────────────────────────────────────────────────────
// Client pages: AdminAuthGate registers Clerk's getToken here.
// Server pages (admin overview): pass the token explicitly as the last argument.
type TokenGetter = () => Promise<string | null>;
let tokenGetter: TokenGetter | null = null;
export const setTokenGetter = (fn: TokenGetter) => {
  tokenGetter = fn;
};

type Opts = RequestInit & { token?: string | null };

async function request(path: string, { token, headers: extra, ...init }: Opts = {}, fallback = "Request failed") {
  const headers = new Headers(extra);
  const t = token ?? (await tokenGetter?.());
  if (t) headers.set("Authorization", `Bearer ${t}`);

  // no Content-Type for FormData: the browser adds the multipart boundary itself
  const res = await fetch(`${API_URL}${path}`, { cache: "no-store", ...init, headers });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.message ?? fallback);
  }
  return res.json();
}

const jsonBody = (data: object): RequestInit => ({
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(data),
});

// ─── Events (admin) ──────────────────────────────────────────────────────────
export type Pagination = { page: number; limit: number; total: number; pages: number };

export type EventStats = {
  total: number;
  upcoming: number;
  past: number;
  drafts: number;
  byCategory: Record<string, number>;
  recent: EventItem[];
};

type EventQuery = {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  status?: string;
  published?: string;
};

// one page of events (use this for the Events table)
export async function adminGetEventsPage(params: EventQuery = {}, token?: string | null) {
  const q = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== "" && v !== "All") q.set(k, String(v));
  });
  const json = await request(`/api/events/admin/all?${q}`, { token }, "Failed to fetch events");
  return { data: json.data as EventItem[], pagination: json.pagination as Pagination };
}

// exact totals for the overview, no matter how many events exist
export const adminGetEventStats = async (token?: string | null): Promise<EventStats> =>
  (await request("/api/events/admin/stats", { token }, "Failed to fetch event stats")).data;

// kept for older code: first 50 events only
export const adminGetEvents = async (token?: string | null): Promise<EventItem[]> =>
  (await adminGetEventsPage({ limit: 50 }, token)).data;

export const adminCreateEvent = async (data: FormData) =>
  (await request("/api/events", { method: "POST", body: data }, "Failed to create event")).data;

export const adminUpdateEvent = async (id: string, data: FormData) =>
  (await request(`/api/events/${id}`, { method: "PATCH", body: data }, "Failed to update event")).data;

export const adminDeleteEvent = (id: string) =>
  request(`/api/events/${id}`, { method: "DELETE" }, "Failed to delete event");

// ─── JSON resources: linkages, features, glance ─────────────────────────────
function resource(base: string, name: string) {
  return {
    list: async (query = "", token?: string | null) =>
      (await request(`${base}/admin/all${query}`, { token }, `Failed to fetch ${name}`)).data,
    create: async (data: object) =>
      (await request(base, { method: "POST", ...jsonBody(data) }, `Failed to create ${name}`)).data,
    update: async (id: string, data: object) =>
      (await request(`${base}/${id}`, { method: "PATCH", ...jsonBody(data) }, `Failed to update ${name}`)).data,
    remove: (id: string) => request(`${base}/${id}`, { method: "DELETE" }, `Failed to delete ${name}`),
  };
}

const linkages = resource("/api/linkages", "linkage");
export const adminGetLinkages = (token?: string | null) => linkages.list("", token);
export const adminCreateLinkage = linkages.create;
export const adminUpdateLinkage = linkages.update;
export const adminDeleteLinkage = linkages.remove;

const features = resource("/api/features", "feature");
export const adminGetFeatures = (section?: string, token?: string | null) =>
  features.list(section ? `?section=${section}` : "", token);
export const adminCreateFeature = features.create;
export const adminUpdateFeature = features.update;
export const adminDeleteFeature = features.remove;

const glance = resource("/api/glance", "glance card");
export const adminGetGlance = (token?: string | null) => glance.list("", token);
export const adminCreateGlance = glance.create;
export const adminUpdateGlance = glance.update;
export const adminDeleteGlance = glance.remove;


// ─── Notices & documents (admin) ─────────────────────────────────────────────
export type NoticeFile = {
  _id: string;
  url: string;
  originalName?: string;
  format?: string;
  bytes?: number;
};

export type NoticeItem = {
  _id: string;
  title: string;
  category: string;
  noticeDate?: string;
  text: string;
  isPublished: boolean;
  files: NoticeFile[];
  createdAt?: string;
};

export const adminGetNotices = async (): Promise<NoticeItem[]> =>
  (await request("/api/notices/admin/all", {}, "Failed to fetch notices")).data;

export const adminCreateNotice = async (data: FormData) =>
  (await request("/api/notices", { method: "POST", body: data }, "Failed to create notice")).data;

export const adminUpdateNotice = async (id: string, data: FormData) =>
  (await request(`/api/notices/${id}`, { method: "PATCH", body: data }, "Failed to update notice")).data;

export const adminDeleteNotice = (id: string) =>
  request(`/api/notices/${id}`, { method: "DELETE" }, "Failed to delete notice");

// ─── Facilities (admin) ───────────────────────────────────────────────────────────────
export type FacilityFile = { _id: string; url: string; originalName?: string; format?: string; bytes?: number; resourceType?: string; };
export type FacilityItem = {
  _id: string;
  name: string;
  slug: string;
  description: string;
  category: string;
  location?: string;
  operatingHours?: string;
  contactDetails?: string;
  amenities: string[];
  images: FacilityFile[];
  documents: FacilityFile[];
  isPublished: boolean;
  createdAt?: string;
};

export const adminGetFacilities = async (): Promise<FacilityItem[]> =>
  (await request("/api/facilities/admin/all", {}, "Failed to fetch facilities")).data;

export const adminCreateFacility = async (data: FormData) =>
  (await request("/api/facilities", { method: "POST", body: data }, "Failed to create facility")).data;

export const adminUpdateFacility = async (id: string, data: FormData) =>
  (await request(`/api/facilities/${id}`, { method: "PATCH", body: data }, "Failed to update facility")).data;

export const adminDeleteFacility = (id: string) =>
  request(`/api/facilities/${id}`, { method: "DELETE" }, "Failed to delete facility");

// report----------------

export async function adminDownloadEventReport(id: string, slug: string) {
  const token = await tokenGetter?.();
  const res = await fetch(`${API_URL}/api/events/${id}/report`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    cache: "no-store",
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.message ?? "Failed to generate report");
  }
  const url = URL.createObjectURL(await res.blob());
  const a = document.createElement("a");
  a.href = url;
  a.download = `${slug || "event"}-report.pdf`;
  a.click();
  URL.revokeObjectURL(url);
}

// // ─── Programmes (admin) ───────────────────────────────────────────────────────────────
// export type ProgrammeFile = { _id: string; url: string; originalName?: string; format?: string; bytes?: number; };
// export type ProgrammeItem = {
//   _id: string;
//   name: string;
//   slug: string;
//   degreeLevel: string;
//   department: string;
//   duration: string;
//   eligibilityCriteria?: string;
//   admissionRequirements?: string;
//   courseOverview?: string;
//   availableSeats?: number;
//   syllabus: ProgrammeFile[];
//   isPublished: boolean;
//   createdAt?: string;
// };

// export const adminGetProgrammes = async (): Promise<ProgrammeItem[]> =>
//   (await request("/api/programmes/admin/all", {}, "Failed to fetch programmes")).data;

// export const adminCreateProgramme = async (data: FormData) =>
//   (await request("/api/programmes", { method: "POST", body: data }, "Failed to create programme")).data;

// export const adminUpdateProgramme = async (id: string, data: FormData) =>
//   (await request(`/api/programmes/${id}`, { method: "PATCH", body: data }, "Failed to update programme")).data;

// export const adminDeleteProgramme = (id: string) =>
//   request(`/api/programmes/${id}`, { method: "DELETE" }, "Failed to delete programme");
// ─── Index status (admin) ────────────────────────────────────────────────────
export type IndexPart = { label: string; status: "ok" | "missing" | "skipped" | "no_text"; note?: string };
export type IndexRow = {
  kind: "event" | "notice" | "feature" | "glance" | "linkage" | "facility" | "programme";
  id: string;
  title: string;
  category?: string;
  updatedAt?: string;
  published: boolean;
  status: "indexed" | "partial" | "missing" | "draft";
  parts: IndexPart[];
};
export type IndexStatus = {
  summary: { total: number; indexed: number; partial: number; missing: number; draft: number };
  items: IndexRow[];
};

export const adminGetIndexStatus = async (): Promise<IndexStatus> =>
  (await request("/api/index/status", {}, "Failed to load index status")).data;

export const adminResyncItem = (kind: string, id: string) =>
  request(`/api/index/resync/${kind}/${id}`, { method: "POST" }, "Failed to queue re-sync");

export const adminResyncMissing = (): Promise<{ queued: number }> =>
  request("/api/index/resync-missing", { method: "POST" }, "Failed to queue re-sync");

// ─── Chat history (admin) ────────────────────────────────────────────────────
export type ChatThreadRow = { userId: string; email: string; threadId: string; title: string; count: number; lang?: string; updatedAt: number };
export type ChatMsg = { role: "user" | "ai"; text: string; sources: { source: string; page?: string | number | null; url?: string }[]; ts: number; answered?: boolean };
export type UnansweredRow = { question: string; lang?: string; ts: number; email: string };
export type ChatStats = { conversations: number; questions: number; answered: number; unanswered: number; assamese: number; english: number };
type Pag = { page: number; limit: number; total: number; pages: number };

const full = async (path: string, fallback: string) => request(path, {}, fallback);

export const adminChatStats = async (): Promise<ChatStats> => (await full("/api/chats/admin/stats", "Failed to load stats")).data;
export const adminChatThreads = async (q: { page?: number; search?: string; lang?: string }) => {
  const s = new URLSearchParams();
  Object.entries(q).forEach(([k, v]) => v && s.set(k, String(v)));
  const j = await full(`/api/chats/admin/threads?${s}`, "Failed to load chats");
  return { data: j.data as ChatThreadRow[], pagination: j.pagination as Pag };
};
export const adminChatMessages = async (userId: string, threadId: string): Promise<ChatMsg[]> =>
  (await full(`/api/chats/admin/threads/${encodeURIComponent(userId)}/${encodeURIComponent(threadId)}`, "Failed to load messages")).data;
export const adminUnanswered = async (page = 1) => {
  const j = await full(`/api/chats/admin/unanswered?page=${page}`, "Failed to load questions");
  return { data: j.data as UnansweredRow[], pagination: j.pagination as Pag };
};