"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  FileText,
  X,
  Undo2,
  Search,
  Eye,
  EyeOff,
  Paperclip,
  Loader2,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import {
  adminGetNotices,
  adminCreateNotice,
  adminUpdateNotice,
  adminDeleteNotice,
  adminGetIndexStatus,
  adminResyncItem,
  type NoticeItem,
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

type ToastState = { message: string; type: "success" | "error" } | null;

const CATEGORIES = [
  "notices",
  "regulations",
  "exams",
  "scholarships",
  "admission",
  "facilities",
  "other",
];
const ACCEPT = ["application/pdf", "image/jpeg", "image/png", "image/webp"];
const MAX_FILES = 10;
const MAX_MB = 15;

const categoryColors: Record<string, string> = {
  notices: "bg-blue-500/20 text-blue-300",
  regulations: "bg-purple-500/20 text-purple-300",
  exams: "bg-amber-500/20 text-amber-300",
  scholarships: "bg-emerald-500/20 text-emerald-300",
  admission: "bg-rose-500/20 text-rose-300",
  facilities: "bg-orange-500/20 text-orange-300",
  other: "bg-slate-500/20 text-slate-300",
};

const fmt = (d?: string) =>
  d
    ? new Date(d).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "—";
const toDateInput = (d?: string) =>
  d ? new Date(d).toISOString().split("T")[0] : "";
const sizeLabel = (b: number) =>
  b > 1e6 ? `${(b / 1e6).toFixed(1)} MB` : `${Math.round(b / 1e3)} KB`;

const emptyForm = {
  title: "",
  category: "notices",
  noticeDate: "",
  text: "",
  isPublished: "true",
};

type IdxInfo = { status: string; updatedAt?: string };
type Badge = "ready" | "processing" | "failed" | "draft" | "unknown";

const PROCESSING_WINDOW_MS = 5 * 60_000; // after this, "still missing" means Failed
const EDIT_GRACE_MS = 10_000; // an edit is re-indexed from scratch

export default function AdminNoticesPage() {
  const [items, setItems] = useState<NoticeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState<ToastState>(null);

  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<NoticeItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<NoticeItem | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [form, setForm] = useState({ ...emptyForm });
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [removedIds, setRemovedIds] = useState<string[]>([]);

  const [idx, setIdx] = useState<Record<string, IdxInfo>>({});
  const [idxLoaded, setIdxLoaded] = useState(false); // false until the status endpoint answered once
  const [pending, setPending] = useState<Record<string, number>>({}); // id -> time of last save/retry
  const lastCreateAt = useRef(0); // when the admin last created a notice in this page

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const refreshIndex = useCallback(async () => {
    try {
      const s = await adminGetIndexStatus();
      const map: Record<string, IdxInfo> = {};
      for (const r of s.items)
        if (r.kind === "notice")
          map[r.id] = { status: r.status, updatedAt: r.updatedAt };
      setIdx(map);
      setIdxLoaded(true);
    } catch {
      /* chatbot unreachable: badges stay as they were */
    }
  }, []);

  const badgeOf = (n: NoticeItem): Badge => {
    if (n.isPublished === false) return "draft";
    if (!idxLoaded) return "unknown"; // status endpoint not reachable (yet)

    // edited or retried a moment ago: trust nothing until the re-index has started
    if (pending[n._id] && Date.now() - pending[n._id] < EDIT_GRACE_MS)
      return "processing";

    const r = idx[n._id];
    if (!r) {
      // not in the chatbot index (yet). A notice just created is still being read;
      // anything older that never appeared has failed.
      const created = (n as any).createdAt
        ? new Date((n as any).createdAt).getTime()
        : lastCreateAt.current;
      return Date.now() - created < PROCESSING_WINDOW_MS
        ? "processing"
        : "failed";
    }
    if (r.status === "indexed") return "ready";
    const age = Date.now() - new Date(r.updatedAt ?? 0).getTime();
    return age < PROCESSING_WINDOW_MS ? "processing" : "failed";
  };

  const anyProcessing = items.some((n) => badgeOf(n) === "processing");

  useEffect(() => {
    refreshIndex();
  }, [items, refreshIndex]); // after every list load

  useEffect(() => {
    // poll only while something is processing
    if (!anyProcessing) return;
    const t = setInterval(refreshIndex, 5000);
    return () => clearInterval(t);
  }, [anyProcessing, refreshIndex]);

  const retry = async (n: NoticeItem) => {
    try {
      await adminResyncItem("notice", n._id);
      setPending((p) => ({ ...p, [n._id]: Date.now() }));
      lastCreateAt.current = Math.max(lastCreateAt.current, Date.now());
      showToast("Re-sync queued", "success");
      refreshIndex();
    } catch (e: any) {
      showToast(e.message ?? "Could not queue re-sync", "error");
    }
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setItems(await adminGetNotices());
    } catch {
      showToast("Failed to load notices", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const resetFiles = () => {
    setNewFiles([]);
    setRemovedIds([]);
  };

  const closeForms = () => {
    setCreateOpen(false);
    setEditTarget(null);
    resetFiles();
  };

  const openCreate = () => {
    setForm({ ...emptyForm });
    resetFiles();
    setCreateOpen(true);
  };

  const openEdit = (n: NoticeItem) => {
    setForm({
      title: n.title,
      category: n.category,
      noticeDate: toDateInput(n.noticeDate),
      text: n.text ?? "",
      isPublished: n.isPublished !== false ? "true" : "false",
    });
    resetFiles();
    setEditTarget(n);
  };

  const setField =
    (k: keyof typeof form) =>
    (
      e: React.ChangeEvent<
        HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
      >,
    ) =>
      setForm((f) => ({ ...f, [k]: e.target.value }));

  /* ---- files ---- */
  const addFiles = (list: FileList | null) => {
    if (!list) return;
    const accepted: File[] = [];
    for (const f of Array.from(list)) {
      if (!ACCEPT.includes(f.type)) {
        showToast(
          `"${f.name}" must be a PDF or a photo (JPG, PNG, WEBP).`,
          "error",
        );
        continue;
      }
      if (f.size > MAX_MB * 1024 * 1024) {
        showToast(`"${f.name}" is larger than ${MAX_MB} MB.`, "error");
        continue;
      }
      accepted.push(f);
    }
    setNewFiles((prev) => {
      const merged = [...prev, ...accepted];
      if (merged.length > MAX_FILES)
        showToast(`At most ${MAX_FILES} files at a time.`, "error");
      return merged.slice(0, MAX_FILES);
    });
  };

  const toggleExisting = (id: string) =>
    setRemovedIds((ids) =>
      ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id],
    );

  /* ---- submit ---- */
  const buildFormData = () => {
    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => fd.append(k, v));
    newFiles.forEach((f) => fd.append("files", f)); // field name must match the backend multer config
    if (removedIds.length > 0)
      fd.append("removeMedia", JSON.stringify(removedIds));
    return fd;
  };

  const handleSave =
    (mode: "create" | "update") => async (e: React.FormEvent) => {
      e.preventDefault();

      const keptExisting = (editTarget?.files ?? []).filter(
        (m) => !removedIds.includes(m._id),
      ).length;
      if (!form.text.trim() && newFiles.length + keptExisting === 0) {
        showToast("Add some text or at least one file.", "error");
        return;
      }

      setSaving(true);
      try {
        if (mode === "create") {
          await adminCreateNotice(buildFormData());
          lastCreateAt.current = Date.now(); // the new notice shows "Processing" from now on
        } else if (editTarget) {
          await adminUpdateNotice(editTarget._id, buildFormData());
          setPending((p) => ({ ...p, [editTarget._id]: Date.now() }));
        }
        closeForms();
        showToast(
          mode === "create"
            ? "Saved. The chatbot is reading it. Wait for the Ready badge before asking."
            : "Updated. The chatbot is re-reading it.",
          "success",
        );
        load();
      } catch (err: any) {
        showToast(err.message ?? "Failed to save notice", "error");
      } finally {
        setSaving(false);
      }
    };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await adminDeleteNotice(deleteTarget._id);
      setDeleteTarget(null);
      showToast("Notice deleted", "success");
      load();
    } catch (err: any) {
      showToast(err.message ?? "Failed to delete notice", "error");
    } finally {
      setDeleting(false);
    }
  };

  const filtered = items.filter(
    (n) =>
      n.title.toLowerCase().includes(search.toLowerCase()) ||
      n.category.toLowerCase().includes(search.toLowerCase()),
  );

  const row =
    "flex items-center gap-3 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2";

  const renderBadge = (n: NoticeItem) => {
    const b = badgeOf(n);
    if (b === "processing")
      return (
        <span className="flex items-center gap-1.5 text-xs text-amber-300">
          <Loader2 className="h-3.5 w-3.5 animate-spin" /> Processing…
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
            onClick={() => retry(n)}
            className="underline hover:text-red-300"
          >
            Retry
          </button>
        </span>
      );
    if (b === "draft")
      return <span className="text-xs text-white/30">Draft</span>;
    return <span className="text-xs text-white/30">…</span>;
  };

  // plain function returning JSX (not a component), so inputs keep focus while typing
  const renderForm = (onSubmit: (e: React.FormEvent) => void) => (
    <form onSubmit={onSubmit} className="space-y-4">
      <Field
        label="Title *"
        value={form.title}
        onChange={setField("title")}
        required
        placeholder="e.g. Exam schedule, 4th semester"
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
          label="Notice date"
          type="date"
          value={form.noticeDate}
          onChange={setField("noticeDate")}
        />
      </div>

      <Field
        label="Text (optional if you attach a file)"
        as="textarea"
        value={form.text}
        onChange={setField("text")}
        placeholder="Type or paste the notice text in English or Assamese. The chatbot answers from this."
      />

      <Field
        label="Status"
        as="select"
        value={form.isPublished}
        onChange={setField("isPublished")}
      >
        <option value="true">Published (chatbot can use it)</option>
        <option value="false">Draft (hidden from the chatbot)</option>
      </Field>

      {/* files */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <p className="text-xs font-medium uppercase tracking-wider text-white/50">
            Files
          </p>
          <span className="text-[11px] text-white/30">
            PDF or photo · max {MAX_FILES}, {MAX_MB} MB each
          </span>
        </div>

        <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-white/15 bg-white/2 px-4 py-5 text-sm text-white/50 transition-colors hover:border-gold/50 hover:text-gold">
          <Paperclip className="h-4 w-4" />
          Choose files
          <input
            type="file"
            multiple
            accept={ACCEPT.join(",")}
            className="hidden"
            onChange={(e) => {
              addFiles(e.target.files);
              e.target.value = ""; // allows picking the same file again
            }}
          />
        </label>

        {editTarget && editTarget.files.length > 0 && (
          <div className="mt-3 space-y-2">
            <p className="text-[11px] text-white/30">Already uploaded</p>
            {editTarget.files.map((m) => {
              const removed = removedIds.includes(m._id);
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
                    {m.originalName ?? "File"}
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
                  <button
                    type="button"
                    onClick={() => toggleExisting(m._id)}
                    title={removed ? "Keep this file" : "Remove this file"}
                    className="rounded-md p-1 text-white/50 hover:bg-white/10 hover:text-white"
                  >
                    {removed ? (
                      <Undo2 className="h-3 w-3" />
                    ) : (
                      <X className="h-3 w-3" />
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {newFiles.length > 0 && (
          <div className="mt-3 space-y-2">
            <p className="text-[11px] text-white/30">New ({newFiles.length})</p>
            {newFiles.map((f, i) => (
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
                  onClick={() =>
                    setNewFiles((p) => p.filter((_, j) => j !== i))
                  }
                  title="Remove"
                  className="rounded-md p-1 text-white/50 hover:bg-white/10 hover:text-white"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {saving && newFiles.length > 0 && (
        <p className="text-xs text-gold">
          Uploading files. Please keep this window open.
        </p>
      )}

      <FormActions onCancel={closeForms} loading={saving} />
    </form>
  );

  return (
    <div>
      <div className="ml-6">
        <PageHeader
          title="Notices & Documents"
          subtitle={`${items.length} items · everything published here is learned by the CampusIQ chatbot`}
          action={
            <button
              onClick={openCreate}
              className="flex items-center gap-2 rounded-xl bg-linear-to-r from-gold to-[#e8b84b] px-5 py-2.5 text-sm font-semibold text-[#0f1117] transition-opacity hover:opacity-90"
            >
              <Plus className="h-4 w-4" />
              Add Notice
            </button>
          }
        />
      </div>

      {/* search */}
      <div className="relative mb-5">
        <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search notices by title or category…"
          className="w-full rounded-xl border border-white/10 bg-[#13161f] py-2.5 pl-11 pr-4 text-sm text-white placeholder-white/30 transition-all focus:border-gold/60 focus:outline-none focus:ring-2 focus:ring-gold/20"
        />
      </div>

      {filtered.length === 0 && !loading ? (
        <EmptyState message="No notices found. Add your first notice, circular or regulation." />
      ) : (
        <AdminTable
          headers={[
            "Title",
            "Category",
            "Date",
            "Files",
            "Status",
            "Chatbot",
            "Actions",
          ]}
          loading={loading}
          cols={7}
        >
          {filtered.map((n) => (
            <tr key={n._id} className="transition-colors hover:bg-white/2">
              <td className="max-w-xs px-4 py-4">
                <p className="truncate font-medium text-white">{n.title}</p>
                {n.text && (
                  <p className="mt-0.5 truncate text-xs text-white/40">
                    {n.text}
                  </p>
                )}
              </td>
              <td className="px-4 py-4">
                <span
                  className={`rounded-lg px-2.5 py-0.5 text-xs font-semibold ${
                    categoryColors[n.category] ?? categoryColors.other
                  }`}
                >
                  {n.category}
                </span>
              </td>
              <td className="whitespace-nowrap px-4 py-4 text-xs text-white/60">
                {fmt(n.noticeDate)}
              </td>
              <td className="px-4 py-4">
                <span className="flex items-center gap-1 text-xs text-white/40">
                  <FileText className="h-3.5 w-3.5" />
                  {n.files?.length ?? 0}
                </span>
              </td>
              <td className="px-4 py-4">
                {n.isPublished !== false ? (
                  <span className="flex items-center gap-1.5 text-xs text-emerald-400">
                    <Eye className="h-3.5 w-3.5" /> Published
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 text-xs text-white/30">
                    <EyeOff className="h-3.5 w-3.5" /> Draft
                  </span>
                )}
              </td>
              <td className="px-4 py-4">{renderBadge(n)}</td>
              <td className="px-4 py-4">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openEdit(n)}
                    title="Edit"
                    className="rounded-lg p-1.5 text-white/40 transition-colors hover:bg-gold/10 hover:text-gold"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => setDeleteTarget(n)}
                    title="Delete"
                    className="rounded-lg p-1.5 text-white/40 transition-colors hover:bg-red-500/10 hover:text-red-400"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </AdminTable>
      )}

      <Modal
        open={createOpen}
        onClose={closeForms}
        title="Add Notice / Document"
      >
        {renderForm(handleSave("create"))}
      </Modal>

      <Modal
        open={!!editTarget}
        onClose={closeForms}
        title="Edit Notice / Document"
      >
        {renderForm(handleSave("update"))}
      </Modal>

      <Modal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Delete Notice"
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