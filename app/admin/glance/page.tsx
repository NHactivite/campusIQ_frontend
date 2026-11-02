"use client";
import { useState, useEffect, useCallback } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import {
  adminGetGlance,
  adminCreateGlance,
  adminUpdateGlance,
  adminDeleteGlance,
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

type Toast = { message: string; type: "success" | "error" } | null;
type GlanceItem = {
  _id: string;
  value: string;
  label: string;
  text: string;
  order: number;
  isPublished: boolean;
};

const emptyForm = { value: "", label: "", text: "", order: "0", isPublished: "true" };

export default function AdminGlancePage() {
  const [items, setItems] = useState<GlanceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<Toast>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<GlanceItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<GlanceItem | null>(null);
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
      const data = await adminGetGlance();
      setItems(data);
    } catch {
      showToast("Failed to load glance stats", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => { setForm({ ...emptyForm }); setCreateOpen(true); };
  const openEdit = (item: GlanceItem) => {
    setForm({
      value: item.value,
      label: item.label,
      text: item.text,
      order: item.order.toString(),
      isPublished: item.isPublished !== false ? "true" : "false",
    });
    setEditTarget(item);
  };

  const payload = () => ({
    value: form.value,
    label: form.label,
    text: form.text,
    order: Number(form.order) || 0,
    isPublished: form.isPublished === "true",
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await adminCreateGlance(payload());
      setCreateOpen(false);
      showToast("Stat card created", "success");
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
      await adminUpdateGlance(editTarget._id, payload());
      setEditTarget(null);
      showToast("Stat card updated", "success");
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
      await adminDeleteGlance(deleteTarget._id);
      setDeleteTarget(null);
      showToast("Stat card deleted", "success");
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
const renderGlanceForm = (onSubmit: (e: React.FormEvent) => void) => (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Field
          label="Value *"
          value={form.value}
          onChange={setField("value")}
          required
          placeholder="e.g. 2025, 10+3, 6th"
        />
        <Field
          label="Label *"
          value={form.label}
          onChange={setField("label")}
          required
          placeholder="e.g. Established, Patents filed"
        />
      </div>
      <Field
        label="Description *"
        as="textarea"
        value={form.text}
        onChange={setField("text")}
        required
        placeholder="Short descriptive text shown below the stat"
      />
      <div className="grid grid-cols-2 gap-4">
        <Field label="Display Order" type="number" value={form.order} onChange={setField("order")} min="0" />
        <Field label="Published" as="select" value={form.isPublished} onChange={setField("isPublished")}>
          <option value="true">Published</option>
          <option value="false">Draft</option>
        </Field>
      </div>
      <FormActions onCancel={() => { setCreateOpen(false); setEditTarget(null); }} loading={saving} />
    </form>
  );

  return (
    <div>
     <div className="ml-6">
       <PageHeader
        title="At a Glance Stats"
        subtitle="Key metrics shown on the home page"
        action={
          <button
            onClick={openCreate}
            className="flex items-center gap-2 rounded-xl bg-linear-to-r from-[#c69a36] to-[#e8b84b] px-3 py-2.5 text-sm font-semibold text-[#0f1117] hover:opacity-90 transition-opacity"
          >
            <Plus className="h-4 w-4" />
            Add Stat
          </button>
        }
      />
     </div>

      {/* Preview cards */}
      {items.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-6">
          {items.map((item) => (
            <div
              key={item._id}
              className="rounded-2xl border border-white/[0.06] bg-[#13161f] p-4 text-center"
            >
              <p className="text-2xl font-bold text-[#c69a36]">{item.value}</p>
              <p className="text-xs font-semibold text-white mt-1">{item.label}</p>
              <p className="text-[10px] text-white/40 mt-1 leading-relaxed line-clamp-2">{item.text}</p>
            </div>
          ))}
        </div>
      )}

      {items.length === 0 && !loading ? (
        <EmptyState message="No stat cards yet. Add your first." />
      ) : (
        <AdminTable headers={["Value", "Label", "Description", "Order", "Published", "Actions"]} loading={loading} cols={6}>
          {items.map((item) => (
            <tr key={item._id} className="hover:bg-white/[0.02] transition-colors">
              <td className="px-4 py-4 text-[#c69a36] font-bold text-lg">{item.value}</td>
              <td className="px-4 py-4 font-medium text-white">{item.label}</td>
              <td className="px-4 py-4 text-white/50 text-xs max-w-xs truncate">{item.text}</td>
              <td className="px-4 py-4 text-white/40 text-xs">{item.order}</td>
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

    <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Add Stat Card">
  {renderGlanceForm(handleCreate)}
</Modal>
<Modal open={!!editTarget} onClose={() => setEditTarget(null)} title="Edit Stat Card">
  {renderGlanceForm(handleUpdate)}
</Modal>
      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete Stat Card" size="md">
        <DeleteConfirm name={deleteTarget?.label ?? ""} onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} loading={deleting} />
      </Modal>
      {toast && <Toast message={toast.message} type={toast.type} />}
    </div>
  );
}
