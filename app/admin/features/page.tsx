"use client";
import { useState, useEffect, useCallback } from "react";
import { Plus, Pencil, Trash2, Tag } from "lucide-react";
import {
  adminGetFeatures,
  adminCreateFeature,
  adminUpdateFeature,
  adminDeleteFeature,
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
type FeatureItem = {
  _id: string;
  section: string;
  icon: string;
  title: string;
  text: string;
  tags: string[];
  order: number;
  isPublished: boolean;
};

const emptyForm = {
  section: "rdc",
  icon: "Landmark",
  title: "",
  text: "",
  tags: "",
  order: "0",
  isPublished: "true",
};

const sectionColors: Record<string, string> = {
  rdc: "bg-blue-500/20 text-blue-300",
  iic: "bg-purple-500/20 text-purple-300",
};

export default function AdminFeaturesPage() {
  const [items, setItems] = useState<FeatureItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<Toast>(null);
  const [activeSection, setActiveSection] = useState<"all" | "rdc" | "iic">("all");
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<FeatureItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<FeatureItem | null>(null);
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
      const [rdc, iic] = await Promise.all([adminGetFeatures("rdc"), adminGetFeatures("iic")]);
      setItems([...rdc, ...iic]);
    } catch {
      showToast("Failed to load features", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => { setForm({ ...emptyForm }); setCreateOpen(true); };
  const openEdit = (item: FeatureItem) => {
    setForm({
      section: item.section,
      icon: item.icon,
      title: item.title,
      text: item.text,
      tags: item.tags.join(", "),
      order: item.order.toString(),
      isPublished: item.isPublished !== false ? "true" : "false",
    });
    setEditTarget(item);
  };

  const payload = () => ({
    section: form.section,
    icon: form.icon,
    title: form.title,
    text: form.text,
    tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
    order: Number(form.order) || 0,
    isPublished: form.isPublished === "true",
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await adminCreateFeature(payload());
      setCreateOpen(false);
      showToast("Feature created", "success");
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
      await adminUpdateFeature(editTarget._id, payload());
      setEditTarget(null);
      showToast("Feature updated", "success");
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
      await adminDeleteFeature(deleteTarget._id);
      setDeleteTarget(null);
      showToast("Feature deleted", "success");
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

  const filtered = activeSection === "all" ? items : items.filter((i) => i.section === activeSection);

  // AFTER
const renderFeatureForm = (onSubmit: (e: React.FormEvent) => void) => (
  <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Field label="Section" as="select" value={form.section} onChange={setField("section")}>
          <option value="rdc">RDC</option>
          <option value="iic">IIC</option>
        </Field>
        <Field label="Icon (Lucide name)" value={form.icon} onChange={setField("icon")} placeholder="e.g. Landmark" />
      </div>
      <Field label="Title *" value={form.title} onChange={setField("title")} required />
      <Field label="Description *" as="textarea" value={form.text} onChange={setField("text")} required />
      <Field label="Tags (comma-separated)" value={form.tags} onChange={setField("tags")} placeholder="research, innovation, grant" />
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
      <div className="mt-8">
        <PageHeader
        title="Feature Cards"
        subtitle="Manage RDC & IIC feature highlights"
        action={
          <button
            onClick={openCreate}
            className="flex items-center gap-2 rounded-xl bg-linear-to-r from-[#c69a36] to-[#e8b84b] px-2 py-2.5 text-sm font-semibold text-[#0f1117] hover:opacity-90 transition-opacity"
          >
            <Plus className="h-4 w-4" />
            Add Feature
          </button>
        }
      />
      </div>

      {/* Section tabs */}
      <div className="flex gap-2 mb-5">
        {(["all", "rdc", "iic"] as const).map((s) => (
          <button
            key={s}
            onClick={() => setActiveSection(s)}
            className={`rounded-xl px-4 py-2 text-sm font-medium transition-colors ${
              activeSection === s
                ? "bg-[#c69a36]/20 text-[#c69a36] border border-[#c69a36]/30"
                : "bg-white/[0.03] text-white/40 border border-white/[0.06] hover:text-white hover:bg-white/[0.06]"
            }`}
          >
            {s === "all" ? "All" : s.toUpperCase()}
          </button>
        ))}
      </div>

      {filtered.length === 0 && !loading ? (
        <EmptyState message="No feature cards found." />
      ) : (
        <AdminTable headers={["Section", "Icon", "Title", "Description", "Tags", "Order", "Actions"]} loading={loading} cols={7}>
          {filtered.map((item) => (
            <tr key={item._id} className="hover:bg-white/[0.02] transition-colors">
              <td className="px-4 py-4">
                <span className={`rounded-lg px-2.5 py-0.5 text-xs font-semibold uppercase ${sectionColors[item.section] ?? "bg-slate-500/20 text-slate-300"}`}>
                  {item.section}
                </span>
              </td>
              <td className="px-4 py-4 text-white/60 text-xs font-mono">{item.icon}</td>
              <td className="px-4 py-4 font-medium text-white">{item.title}</td>
              <td className="px-4 py-4 text-white/50 text-xs max-w-xs truncate">{item.text}</td>
              <td className="px-4 py-4">
                <div className="flex flex-wrap gap-1">
                  {item.tags.slice(0, 3).map((t) => (
                    <span key={t} className="flex items-center gap-1 rounded-md bg-white/[0.05] px-2 py-0.5 text-[10px] text-white/40">
                      <Tag className="h-2.5 w-2.5" />{t}
                    </span>
                  ))}
                  {item.tags.length > 3 && <span className="text-[10px] text-white/30">+{item.tags.length - 3}</span>}
                </div>
              </td>
              <td className="px-4 py-4 text-white/40 text-xs">{item.order}</td>
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

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Add Feature Card">
  {renderFeatureForm(handleCreate)}
</Modal>
<Modal open={!!editTarget} onClose={() => setEditTarget(null)} title="Edit Feature Card">
  {renderFeatureForm(handleUpdate)}
</Modal>
      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete Feature Card" size="md">
        <DeleteConfirm name={deleteTarget?.title ?? ""} onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} loading={deleting} />
      </Modal>
      {toast && <Toast message={toast.message} type={toast.type} />}
    </div>
  );
}
