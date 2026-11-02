"use client";
import { useState, useEffect, useCallback } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import {
  adminGetLinkages,
  adminCreateLinkage,
  adminUpdateLinkage,
  adminDeleteLinkage,
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
import type { LinkageItem } from "@/lib/api";

const STATUSES = ["Completed", "Initiated", "Linked", "Planned"] as const;

type Toast = { message: string; type: "success" | "error" } | null;

const emptyForm = { title: "", status: "Initiated", text: "", order: "0", isPublished: "true" };

const statusColors: Record<string, string> = {
  Completed: "bg-emerald-500/20 text-emerald-300",
  Initiated: "bg-blue-500/20 text-blue-300",
  Linked: "bg-purple-500/20 text-purple-300",
  Planned: "bg-amber-500/20 text-amber-300",
};

export default function AdminLinkagesPage() {
  const [items, setItems] = useState<(LinkageItem & { order?: number; isPublished?: boolean })[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<Toast>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<any>(null);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [form, setForm] = useState({ ...emptyForm });

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminGetLinkages();
      setItems(data);
    } catch {
      showToast("Failed to load linkages", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => { setForm({ ...emptyForm }); setCreateOpen(true); };
  const openEdit = (item: any) => {
    setForm({
      title: item.title,
      status: item.status,
      text: item.text,
      order: item.order?.toString() ?? "0",
      isPublished: item.isPublished !== false ? "true" : "false",
    });
    setEditTarget(item);
  };

  const payload = () => ({
    title: form.title,
    status: form.status,
    text: form.text,
    order: Number(form.order) || 0,
    isPublished: form.isPublished === "true",
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await adminCreateLinkage(payload());
      setCreateOpen(false);
      showToast("Linkage created", "success");
      load();
    } catch (err: any) {
      showToast(err.message, "error");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTarget) return;
    setSaving(true);
    try {
      await adminUpdateLinkage(editTarget._id, payload());
      setEditTarget(null);
      showToast("Linkage updated", "success");
      load();
    } catch (err: any) {
      showToast(err.message, "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await adminDeleteLinkage(deleteTarget._id);
      setDeleteTarget(null);
      showToast("Linkage deleted", "success");
      load();
    } catch (err: any) {
      showToast(err.message, "error");
    } finally {
      setDeleting(false);
    }
  };

  const setField = (k: keyof typeof form) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => setForm((f) => ({ ...f, [k]: e.target.value }));
// AFTER
const renderLinkageForm = (onSubmit: (e: React.FormEvent) => void) => (
    <form onSubmit={onSubmit} className="space-y-4">
      <Field label="Partner / Title *" value={form.title} onChange={setField("title")} required placeholder="e.g. RFRI, TIFAC" />
      <Field label="Description *" as="textarea" value={form.text} onChange={setField("text")} required placeholder="One-line description of the collaboration" />
      <div className="grid grid-cols-2 gap-4">
        <Field label="Status" as="select" value={form.status} onChange={setField("status")}>
          {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </Field>
        <Field label="Published" as="select" value={form.isPublished} onChange={setField("isPublished")}>
          <option value="true">Published</option>
          <option value="false">Draft</option>
        </Field>
      </div>
      <Field label="Display Order" type="number" value={form.order} onChange={setField("order")} min="0" />
      <FormActions onCancel={() => { setCreateOpen(false); setEditTarget(null); }} loading={saving} />
    </form>
  );

  return (
    <div>
      <div className="ml-6">
        <PageHeader
        title="Linkages"
        subtitle={`${items.length} industry & academic linkages`}
        action={
          <button
            onClick={openCreate}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#c69a36] to-[#e8b84b] px-5 py-2.5 text-sm font-semibold text-[#0f1117] hover:opacity-90 transition-opacity"
          >
            <Plus className="h-4 w-4" />
            Add Linkage
          </button>
        }
      />
      </div>

      {items.length === 0 && !loading ? (
        <EmptyState message="No linkages yet. Add your first linkage." />
      ) : (
        <AdminTable headers={["Partner", "Description", "Status", "Order", "Published", "Actions"]} loading={loading} cols={6}>
          {items.map((item) => (
            <tr key={item._id} className="hover:bg-white/[0.02] transition-colors">
              <td className="px-4 py-4 font-medium text-white">{item.title}</td>
              <td className="px-4 py-4 text-white/60 text-xs max-w-xs truncate">{item.text}</td>
              <td className="px-4 py-4">
                <span className={`rounded-lg px-2.5 py-0.5 text-xs font-semibold ${statusColors[item.status] ?? "bg-slate-500/20 text-slate-300"}`}>
                  {item.status}
                </span>
              </td>
              <td className="px-4 py-4 text-white/40 text-xs">{(item as any).order ?? 0}</td>
              <td className="px-4 py-4 text-xs">
                {item.isPublished !== false
                  ? <span className="text-emerald-400">Yes</span>
                  : <span className="text-white/30">No</span>}
              </td>
              <td className="px-4 py-4">
                <div className="flex items-center gap-2">
                  <button onClick={() => openEdit(item)} className="rounded-lg p-1.5 text-white/40 hover:text-[#c69a36] hover:bg-[#c69a36]/10 transition-colors">
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button onClick={() => setDeleteTarget(item)} className="rounded-lg p-1.5 text-white/40 hover:text-red-400 hover:bg-red-500/10 transition-colors">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </AdminTable>
      )}

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Add Linkage">
  {renderLinkageForm(handleCreate)}
</Modal>
<Modal open={!!editTarget} onClose={() => setEditTarget(null)} title="Edit Linkage">
  {renderLinkageForm(handleUpdate)}
</Modal>
      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete Linkage" size="md">
        <DeleteConfirm name={deleteTarget?.title ?? ""} onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} loading={deleting} />
      </Modal>
      {toast && <Toast message={toast.message} type={toast.type} />}
    </div>
  );
}
