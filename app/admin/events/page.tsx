"use client";
import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  Eye,
  EyeOff,
  Search,
  Image as ImageIcon,
  ImagePlus,
  Video as VideoIcon,
  FileText,
  FileUp,
  X,
  Undo2,
  Loader2,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import {
  adminGetEvents,
  adminCreateEvent,
  adminUpdateEvent,
  adminDeleteEvent,
  adminGetIndexStatus,
  adminResyncItem,
} from "@/lib/adminApi";
import Modal from "@/components/admin/Modal";
import {
  Field,
  FormActions,
  DeleteConfirm,
  Toast,
  PageHeader,
  EmptyState,
  AdminTable,
} from "@/components/admin/AdminUI";
import type { EventItem, Media } from "@/lib/api";

const CATEGORIES = [
  "RDC",
  "IIC",
  "Learning",
  "Incubation",
  "Linkages",
  "IPR",
  "Other",
] as const;
const fmt = (d: string) =>
  new Date(d).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
const toDateInput = (d: string) =>
  d ? new Date(d).toISOString().split("T")[0] : "";
const sizeLabel = (b: number) =>
  b > 1e6 ? `${(b / 1e6).toFixed(1)} MB` : `${Math.round(b / 1e3)} KB`;

type Toast = { message: string; type: "success" | "error" } | null;

const categoryColors: Record<string, string> = {
  RDC: "bg-blue-500/20 text-blue-300",
  IIC: "bg-purple-500/20 text-purple-300",
  Learning: "bg-amber-500/20 text-amber-300",
  Incubation: "bg-emerald-500/20 text-emerald-300",
  Linkages: "bg-rose-500/20 text-rose-300",
  IPR: "bg-orange-500/20 text-orange-300",
  Other: "bg-slate-500/20 text-slate-300",
};

const emptyForm = {
  title: "",
  description: "",
  category: "RDC",
  eventDate: "",
  endDate: "",
  venue: "",
  organiser: "",
  participants: "",
  outcome: "",
  isPublished: "true",
};

/* ------------------------------------------------------------------ */
/* Upload config. The keys ("images", "videos", "documents") MUST      */
/* match the field names in the backend multer config.                 */
/* ------------------------------------------------------------------ */
type Kind = "images" | "videos" | "documents";

const KINDS: Record<
  Kind,
  {
    title: string;
    button: string;
    label: string;
    max: number;
    maxMB: number;
    types: string[];
    exts: string[];
    icon: typeof ImagePlus;
  }
> = {
  images: {
    title: "Photos",
    button: "Choose photos",
    label: "JPG, PNG, WEBP or GIF",
    max: 10,
    maxMB: 10,
    types: ["image/jpeg", "image/png", "image/webp", "image/gif"],
    exts: [],
    icon: ImagePlus,
  },
  videos: {
    title: "Videos",
    button: "Choose videos",
    label: "MP4, WEBM or MOV",
    max: 3,
    maxMB: 100,
    types: ["video/mp4", "video/webm", "video/quicktime"],
    exts: [],
    icon: VideoIcon,
  },
  documents: {
    title: "Documents",
    button: "Choose documents",
    label: "PDF, Word, Excel or PowerPoint",
    max: 10,
    maxMB: 10,
    types: [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-powerpoint",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    ],
    exts: [".pdf", ".doc", ".docx", ".xls", ".xlsx", ".ppt", ".pptx"],
    icon: FileUp,
  },
};
const KIND_LIST: Kind[] = ["images", "videos", "documents"];

/* ------------------------------------------------------------------ */
/* MediaPicker: defined at TOP LEVEL on purpose (not inside the page)  */
/* ------------------------------------------------------------------ */
function MediaPicker({
  kind,
  files,
  existing,
  removedIds,
  onAdd,
  onRemoveNew,
  onToggleExisting,
}: {
  kind: Kind;
  files: File[];
  existing: Media[];
  removedIds: string[];
  onAdd: (kind: Kind, list: FileList | null) => void;
  onRemoveNew: (kind: Kind, index: number) => void;
  onToggleExisting: (id: string) => void;
}) {
  const cfg = KINDS[kind];
  const Icon = cfg.icon;
  const isImage = kind === "images";
  const isDoc = kind === "documents";

  // preview URLs only for photos and videos
  const urls = useMemo(
    () => (isDoc ? [] : files.map((f) => URL.createObjectURL(f))),
    [files, isDoc],
  );
  useEffect(() => () => urls.forEach((u) => URL.revokeObjectURL(u)), [urls]);

  const thumb =
    "relative aspect-video overflow-hidden rounded-lg border border-white/10 bg-black";
  const iconBtn = "rounded-full bg-black/70 p-1 text-white hover:bg-black";
  const row =
    "flex items-center gap-3 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2";

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-wider text-white/50">
          {cfg.title}
        </p>
        <span className="text-[11px] text-white/30">
          {cfg.label} · max {cfg.max}, {cfg.maxMB} MB each
        </span>
      </div>

      <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-white/15 bg-white/2 px-4 py-5 text-sm text-white/50 transition-colors hover:border-gold/50 hover:text-gold">
        <Icon className="h-4 w-4" />
        {cfg.button}
        <input
          type="file"
          multiple
          accept={[...cfg.types, ...cfg.exts].join(",")}
          className="hidden"
          onChange={(e) => {
            onAdd(kind, e.target.files);
            e.target.value = ""; // allows picking the same file again
          }}
        />
      </label>

      {/* already uploaded (edit mode) */}
      {existing.length > 0 && (
        <div className="mt-3">
          <p className="mb-2 text-[11px] text-white/30">Already uploaded</p>
          <div className={isDoc ? "space-y-2" : "grid grid-cols-3 gap-2"}>
            {existing.map((m) => {
              const removed = removedIds.includes(m._id);
              const toggle = (
                <button
                  type="button"
                  onClick={() => onToggleExisting(m._id)}
                  title={removed ? "Keep this file" : "Remove this file"}
                  className={
                    isDoc
                      ? "rounded-md p-1 text-white/50 hover:bg-white/10 hover:text-white"
                      : `absolute right-1 top-1 ${iconBtn}`
                  }
                >
                  {removed ? (
                    <Undo2 className="h-3 w-3" />
                  ) : (
                    <X className="h-3 w-3" />
                  )}
                </button>
              );

              if (isDoc)
                return (
                  <div
                    key={m._id}
                    className={`${row} ${removed ? "opacity-40" : ""}`}
                  >
                    <FileText className="h-4 w-4 shrink-0 text-gold" />
                    <a
                      href={m.url}
                      target="_blank"
                      rel="noreferrer"
                      className="min-w-0 flex-1 truncate text-sm text-white/80 hover:text-gold"
                    >
                      {m.originalName ?? "Document"}
                    </a>
                    <span className="shrink-0 text-[11px] text-white/30">
                      {m.format?.toUpperCase()}{" "}
                      {m.bytes ? `· ${sizeLabel(m.bytes)}` : ""}
                    </span>
                    {removed && (
                      <span className="shrink-0 text-[10px] text-red-400">
                        Will be deleted
                      </span>
                    )}
                    {toggle}
                  </div>
                );

              return (
                <div
                  key={m._id}
                  className={`${thumb} ${removed ? "opacity-30" : ""}`}
                >
                  {isImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={m.url}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <video
                      src={m.url}
                      muted
                      preload="metadata"
                      className="h-full w-full object-cover"
                    />
                  )}
                  {toggle}
                  {removed && (
                    <span className="absolute inset-x-0 bottom-0 bg-red-600/80 py-0.5 text-center text-[10px] text-white">
                      Will be deleted
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* newly selected */}
      {files.length > 0 && (
        <div className="mt-3">
          <p className="mb-2 text-[11px] text-white/30">New ({files.length})</p>
          <div className={isDoc ? "space-y-2" : "grid grid-cols-3 gap-2"}>
            {files.map((f, i) =>
              isDoc ? (
                <div key={`${f.name}-${i}`} className={row}>
                  <FileText className="h-4 w-4 shrink-0 text-gold" />
                  <span className="min-w-0 flex-1 truncate text-sm text-white/80">
                    {f.name}
                  </span>
                  <span className="shrink-0 text-[11px] text-white/30">
                    {sizeLabel(f.size)}
                  </span>
                  <button
                    type="button"
                    onClick={() => onRemoveNew(kind, i)}
                    title="Remove"
                    className="rounded-md p-1 text-white/50 hover:bg-white/10 hover:text-white"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ) : (
                <div key={`${f.name}-${i}`} className={thumb}>
                  {isImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={urls[i]}
                      alt={f.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <video
                      src={urls[i]}
                      muted
                      preload="metadata"
                      className="h-full w-full object-cover"
                    />
                  )}
                  <button
                    type="button"
                    onClick={() => onRemoveNew(kind, i)}
                    title="Remove"
                    className={`absolute right-1 top-1 ${iconBtn}`}
                  >
                    <X className="h-3 w-3" />
                  </button>
                  <span className="absolute inset-x-0 bottom-0 truncate bg-black/70 px-1.5 py-0.5 text-[10px] text-white/80">
                    {f.name} · {sizeLabel(f.size)}
                  </span>
                </div>
              ),
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */
const noFiles = (): Record<Kind, File[]> => ({
  images: [],
  videos: [],
  documents: [],
});

export default function AdminEventsPage() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState<Toast>(null);

  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<EventItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<EventItem | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [form, setForm] = useState({ ...emptyForm });

  // media state: new files per kind, plus ids of existing files marked for deletion
  const [newFiles, setNewFiles] = useState<Record<Kind, File[]>>(noFiles());
  const [removedIds, setRemovedIds] = useState<string[]>([]);

  type IdxInfo = { status: string; updatedAt?: string };
  const [idx, setIdx] = useState<Record<string, IdxInfo>>({});
  const [pending, setPending] = useState<Record<string, number>>({}); // event id -> time of last save

  const refreshIndex = useCallback(async () => {
    try {
      const s = await adminGetIndexStatus();
      const map: Record<string, IdxInfo> = {};
      for (const r of s.items)
        if (r.kind === "event")
          map[r.id] = { status: r.status, updatedAt: r.updatedAt };
      setIdx(map);
    } catch {
      /* chatbot unreachable: badges stay as they were */
    }
  }, []);

  type Badge = "ready" | "processing" | "failed" | "draft" | "unknown";
  const badgeOf = (e: EventItem): Badge => {
    if ((e as any).isPublished === false) return "draft";
    const r = idx[e._id];
    if (!r) return "unknown";
    // an edit is re-indexed from scratch, so give it a few seconds before trusting "indexed"
    if (pending[e._id] && Date.now() - pending[e._id] < 10_000)
      return "processing";
    if (r.status === "indexed" || r.status === "partial") return "ready";
    const age = Date.now() - new Date(r.updatedAt ?? 0).getTime();
    return age < 5 * 60_000 ? "processing" : "failed";
  };

  const anyProcessing = events.some((e) => badgeOf(e) === "processing");

  useEffect(() => {
    refreshIndex();
  }, [events, refreshIndex]);

  useEffect(() => {
    // poll only while something is processing
    if (!anyProcessing) return;
    const t = setInterval(refreshIndex, 5000);
    return () => clearInterval(t);
  }, [anyProcessing, refreshIndex]);

  const retry = async (e: EventItem) => {
    try {
      await adminResyncItem("event", e._id);
      setPending((p) => ({ ...p, [e._id]: Date.now() }));
      showToast("Re-sync queued", "success");
    } catch (err: any) {
      showToast(err.message ?? "Could not queue re-sync", "error");
    }
  };

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const resetMedia = () => {
    setNewFiles(noFiles());
    setRemovedIds([]);
  };

  const loadEvents = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminGetEvents();
      setEvents(data);
    } catch {
      showToast("Failed to load events", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadEvents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const closeForms = () => {
    setCreateOpen(false);
    setEditTarget(null);
    resetMedia();
  };

  const openCreate = () => {
    setForm({ ...emptyForm });
    resetMedia();
    setCreateOpen(true);
  };

  const openEdit = (e: EventItem) => {
    setForm({
      title: e.title,
      description: e.description,
      category: e.category,
      eventDate: toDateInput(e.eventDate),
      endDate: e.endDate ? toDateInput(e.endDate) : "",
      venue: e.venue ?? "",
      organiser: e.organiser ?? "",
      participants: e.participants?.toString() ?? "",
      outcome: e.outcome ?? "",
      isPublished: (e as any).isPublished !== false ? "true" : "false",
    });
    resetMedia();
    setEditTarget(e);
  };

  /* ---- media handlers ---- */
  const addFiles = (kind: Kind, list: FileList | null) => {
    if (!list) return;
    const cfg = KINDS[kind];
    const accepted: File[] = [];

    for (const f of Array.from(list)) {
      if (!cfg.types.includes(f.type)) {
        showToast(
          `"${f.name}" is not a valid file. Use ${cfg.label}.`,
          "error",
        );
        continue;
      }
      if (f.size > cfg.maxMB * 1024 * 1024) {
        showToast(`"${f.name}" is larger than ${cfg.maxMB} MB.`, "error");
        continue;
      }
      accepted.push(f);
    }

    const merged = [...newFiles[kind], ...accepted];
    if (merged.length > cfg.max) {
      showToast(
        `You can upload at most ${cfg.max} ${cfg.title.toLowerCase()} at a time.`,
        "error",
      );
    }
    setNewFiles((prev) => ({ ...prev, [kind]: merged.slice(0, cfg.max) }));
  };

  const removeNew = (kind: Kind, index: number) =>
    setNewFiles((prev) => ({
      ...prev,
      [kind]: prev[kind].filter((_, i) => i !== index),
    }));

  const toggleExisting = (id: string) =>
    setRemovedIds((ids) =>
      ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id],
    );

  /* ---- submit: builds the multipart request ---- */
  const buildFormData = () => {
    const fd = new FormData();
    // 1) text fields
    Object.entries(form).forEach(([k, v]) => {
      if (v !== "") fd.append(k, v);
    });
    // 2) files: one entry per file, under the field name the backend expects
    KIND_LIST.forEach((kind) =>
      newFiles[kind].forEach((f) => fd.append(kind, f)),
    );
    // 3) ids of existing files to delete (edit only)
    if (removedIds.length > 0)
      fd.append("removeMedia", JSON.stringify(removedIds));
    return fd;
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await adminCreateEvent(buildFormData());
      closeForms();
      showToast("Event created successfully", "success");
      loadEvents();
    } catch (err: any) {
      showToast(err.message ?? "Failed to create event", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTarget) return;
    setSaving(true);
    try {
      await adminUpdateEvent(editTarget._id, buildFormData());
      setPending((p) => ({ ...p, [editTarget._id]: Date.now() }));
      closeForms();
      showToast("Updated. The chatbot is re-reading it.", "success");
      loadEvents();
    } catch (err: any) {
      showToast(err.message ?? "Failed to update event", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await adminDeleteEvent(deleteTarget._id);
      setDeleteTarget(null);
      showToast("Event deleted", "success");
      loadEvents();
    } catch (err: any) {
      showToast(err.message ?? "Failed to delete event", "error");
    } finally {
      setDeleting(false);
    }
  };

  const filtered = events.filter(
    (e) =>
      e.title.toLowerCase().includes(search.toLowerCase()) ||
      e.category.toLowerCase().includes(search.toLowerCase()),
  );

  const setField =
    (k: keyof typeof form) =>
    (
      e: React.ChangeEvent<
        HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
      >,
    ) =>
      setForm((f) => ({ ...f, [k]: e.target.value }));

  const hasNewFiles = KIND_LIST.some((k) => newFiles[k].length > 0);

  // Plain function returning JSX (NOT a component), so inputs keep focus.
  const renderEventForm = (onSubmit: (e: React.FormEvent) => void) => (
    <form onSubmit={onSubmit} className="space-y-4">
      <Field
        label="Title *"
        value={form.title}
        onChange={setField("title")}
        required
      />
      <Field
        label="Description *"
        as="textarea"
        value={form.description}
        onChange={setField("description")}
        required
      />
      <div className="grid grid-cols-2 gap-4">
        <Field
          label="Category"
          as="select"
          value={form.category}
          onChange={setField("category")}
        >
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </Field>
        <Field
          label="Published"
          as="select"
          value={form.isPublished}
          onChange={setField("isPublished")}
        >
          <option value="true">Published</option>
          <option value="false">Draft</option>
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Field
          label="Event Date *"
          type="date"
          value={form.eventDate}
          onChange={setField("eventDate")}
          required
        />
        <Field
          label="End Date"
          type="date"
          value={form.endDate}
          onChange={setField("endDate")}
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Field
          label="Venue"
          value={form.venue}
          onChange={setField("venue")}
          placeholder="e.g. Seminar Hall"
        />
        <Field
          label="Organiser"
          value={form.organiser}
          onChange={setField("organiser")}
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Field
          label="Participants"
          type="number"
          value={form.participants}
          onChange={setField("participants")}
          min="0"
        />
        <Field
          label="Outcome"
          value={form.outcome}
          onChange={setField("outcome")}
        />
      </div>

      {/* Photos, videos, documents */}
      {KIND_LIST.map((kind) => (
        <MediaPicker
          key={kind}
          kind={kind}
          files={newFiles[kind]}
          existing={editTarget?.[kind] ?? []}
          removedIds={removedIds}
          onAdd={addFiles}
          onRemoveNew={removeNew}
          onToggleExisting={toggleExisting}
        />
      ))}

      {saving && hasNewFiles && (
        <p className="text-xs text-gold">
          Uploading files, large videos can take a minute. Please keep this
          window open.
        </p>
      )}

      <FormActions onCancel={closeForms} loading={saving} />
    </form>
  );

  return (
    <div>
      <div className="ml-6">
        <PageHeader
          title="Events"
          subtitle={`${events.length} total events`}
          action={
            <button
              onClick={openCreate}
              className="flex items-center gap-2 rounded-xl bg-linear-to-r from-gold to-[#e8b84b] px-5 py-2.5 text-sm font-semibold text-[#0f1117] hover:opacity-90 transition-opacity"
            >
              <Plus className="h-4 w-4" />
              Add Event
            </button>
          }
        />
      </div>

      {/* Search */}
      <div className="relative mb-5">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search events…"
          className="w-full rounded-xl border border-white/10 bg-[#13161f] pl-11 pr-4 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-gold/60 focus:ring-2 focus:ring-gold/20 transition-all"
        />
      </div>

      {filtered.length === 0 && !loading ? (
        <EmptyState message="No events found. Add your first event." />
      ) : (
        <AdminTable
          headers={[
            "Title",
            "Category",
            "Date",
            "Participants",
            "Status",
            "Media",
            "Chatbot",
            "Actions",
          ]}
          loading={loading}
          cols={8}
        >
          {filtered.map((e) => (
            <tr key={e._id} className="hover:bg-white/2 transition-colors">
              <td className="px-4 py-4 max-w-xs">
                <p className="font-medium text-white truncate">{e.title}</p>
                {e.venue && (
                  <p className="text-xs text-white/40 mt-0.5 truncate">
                    {e.venue}
                  </p>
                )}
              </td>
              <td className="px-4 py-4">
                <span
                  className={`rounded-lg px-2.5 py-0.5 text-xs font-semibold ${categoryColors[e.category] ?? categoryColors.Other}`}
                >
                  {e.category}
                </span>
              </td>
              <td className="px-4 py-4 text-white/60 text-xs whitespace-nowrap">
                {fmt(e.eventDate)}
              </td>
              <td className="px-4 py-4 text-white/60 text-xs">
                {e.participants ?? "—"}
              </td>
              <td className="px-4 py-4">
                {(e as any).isPublished !== false ? (
                  <span className="flex items-center gap-1.5 text-xs text-emerald-400">
                    <Eye className="h-3.5 w-3.5" /> Published
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 text-xs text-white/30">
                    <EyeOff className="h-3.5 w-3.5" /> Draft
                  </span>
                )}
              </td>
              <td className="px-4 py-4">
                <span className="flex items-center gap-3 text-xs text-white/40">
                  <span className="flex items-center gap-1" title="Photos">
                    <ImageIcon className="h-3.5 w-3.5" />
                    {e.images?.length ?? 0}
                  </span>
                  <span className="flex items-center gap-1" title="Videos">
                    <VideoIcon className="h-3.5 w-3.5" />
                    {e.videos?.length ?? 0}
                  </span>
                  <span className="flex items-center gap-1" title="Documents">
                    <FileText className="h-3.5 w-3.5" />
                    {e.documents?.length ?? 0}
                  </span>
                </span>
              </td>
              <td className="px-4 py-4">
                {(() => {
                  const b = badgeOf(e);
                  if (b === "processing")
                    return (
                      <span className="flex items-center gap-1.5 text-xs text-amber-300">
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />{" "}
                        Processing…
                      </span>
                    );
                  if (b === "ready")
                    return (
                      <span className="flex items-center gap-1.5 text-xs text-emerald-400">
                        <CheckCircle2 className="h-3.5 w-3.5" /> Ready
                      </span>
                    );
                  if (b === "failed")
                    return (
                      <span className="flex items-center gap-1.5 text-xs text-red-400">
                        <AlertTriangle className="h-3.5 w-3.5" /> Failed
                        <button
                          onClick={() => retry(e)}
                          className="underline hover:text-red-300"
                        >
                          Retry
                        </button>
                      </span>
                    );
                  if (b === "draft")
                    return <span className="text-xs text-white/30">Draft</span>;
                  return <span className="text-xs text-white/30">…</span>;
                })()}
              </td>
              <td className="px-4 py-4">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openEdit(e)}
                    className="rounded-lg p-1.5 text-white/40 hover:text-gold hover:bg-gold/10 transition-colors"
                    title="Edit"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => setDeleteTarget(e)}
                    className="rounded-lg p-1.5 text-white/40 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </AdminTable>
      )}

      {/* Create Modal */}
      <Modal open={createOpen} onClose={closeForms} title="Add New Event">
        {renderEventForm(handleCreate)}
      </Modal>

      {/* Edit Modal */}
      <Modal open={!!editTarget} onClose={closeForms} title="Edit Event">
        {renderEventForm(handleUpdate)}
      </Modal>

      {/* Delete Modal */}
      <Modal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Delete Event"
        size="md"
      >
        <DeleteConfirm
          name={deleteTarget?.title ?? ""}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
          loading={deleting}
        />
      </Modal>

      {toast && <Toast message={toast.message} type={toast.type} />}
    </div>
  );
}
