"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import {
  Plus, Pencil, Trash2, X, Undo2, Search, Eye, EyeOff,
  ImageIcon, Loader2, CheckCircle2, AlertTriangle, Building2,
} from "lucide-react";
import {
  adminGetFacilities, adminCreateFacility, adminUpdateFacility, adminDeleteFacility,
  adminGetIndexStatus, adminResyncItem, type FacilityItem,
} from "@/lib/adminApi";
import Modal from "@/components/admin/Modal";
import {
  Field, FormActions, DeleteConfirm, Toast, PageHeader, EmptyState, AdminTable,
} from "@/components/admin/AdminUI";

type ToastState = { message: string; type: "success" | "error" } | null;

const CATEGORIES = [
  "research",
  "innovation",
  "incubation",
  "laboratory",
  "IT",
  "auditorium",
  "other",
];
const ACCEPT_IMAGES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const ACCEPT_DOCS = ["application/pdf"];
const MAX_IMAGES = 10;
const MAX_DOCS = 10;
const MAX_MB = 50;


const categoryColors: Record<string, string> = {
  research: "bg-blue-500/20 text-blue-300",
  innovation: "bg-purple-500/20 text-purple-300",
  incubation: "bg-emerald-500/20 text-emerald-300",
  laboratory: "bg-violet-500/20 text-violet-300",
  it: "bg-cyan-500/20 text-cyan-300",
  auditorium: "bg-indigo-500/20 text-indigo-300",
  other: "bg-slate-500/20 text-slate-300",
};


const emptyForm = {
  name: "",
  category: "other",
  description: "",
  location: "",
  operatingHours: "",
  contactDetails: "",
  amenities: "",
  isPublished: "false",
};

type IdxInfo = { status: string; updatedAt?: string };
type Badge = "ready" | "processing" | "failed" | "draft" | "unknown";
const PROCESSING_WINDOW_MS = 5 * 60_000;
const EDIT_GRACE_MS = 10_000;

export default function AdminFacilitiesPage() {
  const [items, setItems] = useState<FacilityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState<ToastState>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<FacilityItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<FacilityItem | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [form, setForm] = useState({ ...emptyForm });
  const [newImages, setNewImages] = useState<File[]>([]);
  const [newDocs, setNewDocs] = useState<File[]>([]);
  const [removedIds, setRemovedIds] = useState<string[]>([]);
  const [idx, setIdx] = useState<Record<string, IdxInfo>>({});
  const [idxLoaded, setIdxLoaded] = useState(false);
  const [pending, setPending] = useState<Record<string, number>>({});
  const lastCreateAt = useRef(0);

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const refreshIndex = useCallback(async () => {
    try {
      const s = await adminGetIndexStatus();
      const map: Record<string, IdxInfo> = {};
      for (const r of s.items)
        if (r.kind === ("facility" as any))
          map[r.id] = { status: r.status, updatedAt: r.updatedAt };
      setIdx(map);
      setIdxLoaded(true);
    } catch { /* chatbot unreachable */ }
  }, []);

  const badgeOf = (f: FacilityItem): Badge => {
    if (!f.isPublished) return "draft";
    if (!idxLoaded) return "unknown";
    if (pending[f._id] && Date.now() - pending[f._id] < EDIT_GRACE_MS) return "processing";
    const r = idx[f._id];
    if (!r) {
      const created = (f as any).createdAt ? new Date((f as any).createdAt).getTime() : lastCreateAt.current;
      return Date.now() - created < PROCESSING_WINDOW_MS ? "processing" : "failed";
    }
    if (r.status === "indexed") return "ready";
    const age = Date.now() - new Date(r.updatedAt ?? 0).getTime();
    return age < PROCESSING_WINDOW_MS ? "processing" : "failed";
  };

  const anyProcessing = items.some((f) => badgeOf(f) === "processing");
  useEffect(() => { refreshIndex(); }, [items, refreshIndex]);
  useEffect(() => {
    if (!anyProcessing) return;
    const t = setInterval(refreshIndex, 5000);
    return () => clearInterval(t);
  }, [anyProcessing, refreshIndex]);

  const retry = async (f: FacilityItem) => {
    try {
      await adminResyncItem("facility", f._id);
      setPending((p) => ({ ...p, [f._id]: Date.now() }));
      showToast("Re-sync queued", "success");
      refreshIndex();
    } catch (e: any) { showToast(e.message ?? "Could not queue re-sync", "error"); }
  };

  const load = useCallback(async () => {
    setLoading(true);
    try { setItems(await adminGetFacilities()); }
    catch { showToast("Failed to load facilities", "error"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const resetFiles = () => { setNewImages([]); setNewDocs([]); setRemovedIds([]); };
  const closeForms = () => { setCreateOpen(false); setEditTarget(null); resetFiles(); };

  const openCreate = () => { setForm({ ...emptyForm }); resetFiles(); setCreateOpen(true); };
  const openEdit = (f: FacilityItem) => {
    setForm({
      name: f.name,
      category: f.category,
      description: f.description,
      location: f.location ?? "",
      operatingHours: f.operatingHours ?? "",
      contactDetails: f.contactDetails ?? "",
      amenities: f.amenities.join(", "),
      isPublished: f.isPublished ? "true" : "false",
    });
    resetFiles();
    setEditTarget(f);
  };

  const setField = (k: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm((f) => ({ ...f, [k]: e.target.value }));

  const addFiles = (list: FileList | null, type: "images" | "docs") => {
    if (!list) return;
    const accepted: File[] = [];
    const accept = type === "images" ? ACCEPT_IMAGES : ACCEPT_DOCS;
    const max = type === "images" ? MAX_IMAGES : MAX_DOCS;
    for (const f of Array.from(list)) {
      if (!accept.includes(f.type)) { showToast(`"${f.name}" has an unsupported format.`, "error"); continue; }
      if (f.size > MAX_MB * 1024 * 1024) { showToast(`"${f.name}" exceeds ${MAX_MB} MB.`, "error"); continue; }
      accepted.push(f);
    }
    const setter = type === "images" ? setNewImages : setNewDocs;
    setter((prev) => {
      const merged = [...prev, ...accepted];
      if (merged.length > max) showToast(`At most ${max} files.`, "error");
      return merged.slice(0, max);
    });
  };

  const toggleExisting = (id: string) =>
    setRemovedIds((ids) => ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]);

  const buildFormData = () => {
    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => fd.append(k, v));
    newImages.forEach((f) => fd.append("images", f));
    newDocs.forEach((f) => fd.append("documents", f));
    if (removedIds.length > 0) fd.append("removeMedia", JSON.stringify(removedIds));
    return fd;
  };

  const handleSave = (mode: "create" | "update") => async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { showToast("Name is required.", "error"); return; }
    if (!form.description.trim()) { showToast("Description is required.", "error"); return; }
    setSaving(true);
    try {
      if (mode === "create") {
        await adminCreateFacility(buildFormData());
        lastCreateAt.current = Date.now();
      } else if (editTarget) {
        await adminUpdateFacility(editTarget._id, buildFormData());
        setPending((p) => ({ ...p, [editTarget._id]: Date.now() }));
      }
      closeForms();
      showToast(mode === "create" ? "Facility created." : "Facility updated.", "success");
      load();
    } catch (err: any) { showToast(err.message ?? "Failed to save", "error"); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await adminDeleteFacility(deleteTarget._id);
      setDeleteTarget(null);
      showToast("Facility deleted", "success");
      load();
    } catch (err: any) { showToast(err.message ?? "Failed to delete", "error"); }
    finally { setDeleting(false); }
  };

  const filtered = items.filter(
    (f) =>
      f.name.toLowerCase().includes(search.toLowerCase()) ||
      f.category.toLowerCase().includes(search.toLowerCase()) ||
      (f.location ?? "").toLowerCase().includes(search.toLowerCase()),
  );

  const renderBadge = (f: FacilityItem) => {
    const b = badgeOf(f);
    if (b === "processing") return <span className="flex items-center gap-1.5 text-xs text-amber-300"><Loader2 className="h-3.5 w-3.5 animate-spin" />Processing…</span>;
    if (b === "ready") return <span className="flex items-center gap-1.5 text-xs text-emerald-400"><CheckCircle2 className="h-3.5 w-3.5" />Ready</span>;
    if (b === "failed") return (
      <span className="flex items-center gap-1.5 text-xs text-red-400">
        <AlertTriangle className="h-3.5 w-3.5" />Failed
        <button onClick={() => retry(f)} className="underline hover:text-red-300">Retry</button>
      </span>
    );
    if (b === "draft") return <span className="text-xs text-white/30">Draft</span>;
    return <span className="text-xs text-white/30">…</span>;
  };

  const row = "flex items-center gap-3 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2";

  const renderMediaSection = (label: string, accept: string[], max: number, type: "images" | "docs") => (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-wider text-white/50">{label}</p>
        <span className="text-[11px] text-white/30">max {max}, {MAX_MB} MB each</span>
      </div>
      <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-white/15 bg-white/2 px-4 py-4 text-sm text-white/50 transition-colors hover:border-gold/50 hover:text-gold">
        <ImageIcon className="h-4 w-4" />
        Choose {label}
        <input type="file" multiple accept={accept.join(",")} className="hidden"
          onChange={(e) => { addFiles(e.target.files, type); e.target.value = ""; }} />
      </label>

      {/* Existing media in edit mode */}
      {editTarget && (() => {
        const existing = type === "images" ? editTarget.images : editTarget.documents;
        if (!existing.length) return null;
        return (
          <div className="mt-3 space-y-2">
            <p className="text-[11px] text-white/30">Already uploaded</p>
            {existing.map((m) => {
              const removed = removedIds.includes(m._id);
              return (
                <div key={m._id} className={`${row} ${removed ? "opacity-40" : ""}`}>
                  <ImageIcon className="h-4 w-4 shrink-0 text-gold" />
                  <a href={m.url} target="_blank" rel="noreferrer" className="min-w-0 flex-1 truncate text-sm text-white/80 hover:text-gold">
                    {m.originalName ?? "File"}
                  </a>
                  {removed && <span className="shrink-0 text-[10px] text-red-400">Will be deleted</span>}
                  <button type="button" onClick={() => toggleExisting(m._id)} title={removed ? "Keep" : "Remove"}
                    className="rounded-md p-1 text-white/50 hover:bg-white/10 hover:text-white">
                    {removed ? <Undo2 className="h-3 w-3" /> : <X className="h-3 w-3" />}
                  </button>
                </div>
              );
            })}
          </div>
        );
      })()}

      {/* New files */}
      {(type === "images" ? newImages : newDocs).length > 0 && (
        <div className="mt-3 space-y-2">
          <p className="text-[11px] text-white/30">New ({(type === "images" ? newImages : newDocs).length})</p>
          {(type === "images" ? newImages : newDocs).map((f, i) => (
            <div key={`${f.name}-${i}`} className={row}>
              <ImageIcon className="h-4 w-4 shrink-0 text-gold" />
              <span className="min-w-0 flex-1 truncate text-sm text-white/80">{f.name}</span>
              <button type="button"
                onClick={() => (type === "images" ? setNewImages : setNewDocs)((p: File[]) => p.filter((_: File, j: number) => j !== i))}
                className="rounded-md p-1 text-white/50 hover:bg-white/10 hover:text-white">
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderForm = (onSubmit: (e: React.FormEvent) => void) => (
    <form onSubmit={onSubmit} className="space-y-4">
      <Field label="Facility Name *" value={form.name} onChange={setField("name")} required placeholder="e.g. Central Library" />
      <div className="grid grid-cols-2 gap-4">
        <Field label="Category" as="select" value={form.category} onChange={setField("category")}>
          {CATEGORIES.map((c) => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
        </Field>
        <Field label="Status" as="select" value={form.isPublished} onChange={setField("isPublished")}>
          <option value="false">Draft (hidden)</option>
          <option value="true">Published (visible)</option>
        </Field>
      </div>
      <Field label="Description *" as="textarea" value={form.description} onChange={setField("description")} required placeholder="Describe this facility…" />
      <div className="grid grid-cols-2 gap-4">
        <Field label="Location / Building" value={form.location} onChange={setField("location")} placeholder="e.g. Block A, Ground Floor" />
        <Field label="Operating Hours" value={form.operatingHours} onChange={setField("operatingHours")} placeholder="e.g. Mon–Sat, 8 AM – 8 PM" />
      </div>
      <Field label="Contact Details" value={form.contactDetails} onChange={setField("contactDetails")} placeholder="e.g. +91 98765 43210, librarian@university.edu" />
      <Field label="Services / Amenities (comma-separated)" value={form.amenities} onChange={setField("amenities")} placeholder="e.g. Wifi, Reading Room, Printing, Book Issue" />
      {renderMediaSection("Images", ACCEPT_IMAGES, MAX_IMAGES, "images")}
      {renderMediaSection("Documents", ACCEPT_DOCS, MAX_DOCS, "docs")}
      {saving && (newImages.length > 0 || newDocs.length > 0) && (
        <p className="text-xs text-gold">Uploading files. Please keep this window open.</p>
      )}
      <FormActions onCancel={closeForms} loading={saving} />
    </form>
  );

  return (
    <div>
      <div className="ml-6">
        <PageHeader
          title="Campus Facilities"
          subtitle={`${items.length} facilities · published facilities appear on the public site and in the CampusIQ chatbot`}
          action={
            <button onClick={openCreate}
              className="flex items-center gap-2 rounded-xl bg-linear-to-r from-gold to-[#e8b84b] px-5 py-2.5 text-sm font-semibold text-[#0f1117] transition-opacity hover:opacity-90">
              <Plus className="h-4 w-4" />
              Add Facility
            </button>
          }
        />
      </div>

      <div className="relative mb-5">
        <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
        <input value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Search facilities by name, category or location…"
          className="w-full rounded-xl border border-white/10 bg-[#13161f] py-2.5 pl-11 pr-4 text-sm text-white placeholder-white/30 transition-all focus:border-gold/60 focus:outline-none focus:ring-2 focus:ring-gold/20" />
      </div>

      {filtered.length === 0 && !loading ? (
        <EmptyState message="No facilities found. Add your first campus facility." />
      ) : (
        <AdminTable headers={["Name", "Category", "Location", "Images", "Status", "Chatbot", "Actions"]} loading={loading} cols={7}>
          {filtered.map((f) => (
            <tr key={f._id} className="transition-colors hover:bg-white/2">
              <td className="max-w-xs px-4 py-4">
                <p className="truncate font-medium text-white">{f.name}</p>
                <p className="mt-0.5 truncate text-xs text-white/40">{f.description}</p>
              </td>
              <td className="px-4 py-4">
                <span className={`rounded-lg px-2.5 py-0.5 text-xs font-semibold ${categoryColors[f.category] ?? categoryColors.other}`}>
                  {f.category}
                </span>
              </td>
              <td className="whitespace-nowrap px-4 py-4 text-xs text-white/60">{f.location ?? "—"}</td>
              <td className="px-4 py-4">
                <span className="flex items-center gap-1 text-xs text-white/40">
                  <ImageIcon className="h-3.5 w-3.5" />{f.images?.length ?? 0}
                </span>
              </td>
              <td className="px-4 py-4">
                {f.isPublished ? (
                  <span className="flex items-center gap-1.5 text-xs text-emerald-400"><Eye className="h-3.5 w-3.5" />Published</span>
                ) : (
                  <span className="flex items-center gap-1.5 text-xs text-white/30"><EyeOff className="h-3.5 w-3.5" />Draft</span>
                )}
              </td>
              <td className="px-4 py-4">{renderBadge(f)}</td>
              <td className="px-4 py-4">
                <div className="flex items-center gap-2">
                  <button onClick={() => openEdit(f)} title="Edit"
                    className="rounded-lg p-1.5 text-white/40 transition-colors hover:bg-gold/10 hover:text-gold">
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button onClick={() => setDeleteTarget(f)} title="Delete"
                    className="rounded-lg p-1.5 text-white/40 transition-colors hover:bg-red-500/10 hover:text-red-400">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </AdminTable>
      )}

      <Modal open={createOpen} onClose={closeForms} title="Add Campus Facility">
        {renderForm(handleSave("create"))}
      </Modal>
      <Modal open={!!editTarget} onClose={closeForms} title="Edit Campus Facility">
        {renderForm(handleSave("update"))}
      </Modal>
      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete Facility" size="md">
        <DeleteConfirm name={deleteTarget?.name ?? ""} onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} loading={deleting} />
      </Modal>

      {toast && <Toast message={toast.message} type={toast.type} />}
    </div>
  );
}
