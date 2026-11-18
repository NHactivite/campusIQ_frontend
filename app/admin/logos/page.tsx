"use client";
import { useState, useEffect, useCallback } from "react";
import { Plus, Trash2, ImagePlus } from "lucide-react";
import {
  adminGetLogos,
  adminUploadLogo,
  adminDeleteLogo,
  type LogoItem,
} from "@/lib/adminApi";
import Modal from "@/components/admin/Modal";
import {
  Field,
  FormActions,
  DeleteConfirm,
  Toast,
  PageHeader,
  EmptyState,
} from "@/components/admin/AdminUI";

type ToastState = { message: string; type: "success" | "error" } | null;

export default function AdminLogosPage() {
  const [logos, setLogos] = useState<LogoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<ToastState>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [name, setName] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<LogoItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setLogos(await adminGetLogos());
    } catch {
      showToast("Failed to load logos", "error");
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  const close = () => {
    setAddOpen(false);
    setName("");
    setFile(null);
  };

  const pick = (f: File | undefined) => {
    if (!f) return;
    if (!["image/png", "image/jpeg", "image/webp"].includes(f.type))
      return showToast("Use a PNG, JPG or WEBP image", "error");
    if (f.size > 3 * 1024 * 1024)
      return showToast("Logo must be under 3 MB", "error");
    setFile(f);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return showToast("Choose an image", "error");
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append("name", name.trim());
      fd.append("logo", file);
      await adminUploadLogo(fd);
      close();
      showToast("Logo uploaded", "success");
      load();
    } catch (err: any) {
      showToast(err.message ?? "Upload failed", "error");
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await adminDeleteLogo(deleteTarget._id);
      setDeleteTarget(null);
      showToast("Logo deleted", "success");
      load();
    } catch (err: any) {
      showToast(err.message ?? "Delete failed", "error");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div>
      <div className="ml-6">
        <PageHeader
          title="Logos"
          subtitle="Logos you can add to the header of generated reports"
          action={
            <button
              onClick={() => setAddOpen(true)}
              className="flex items-center gap-2 rounded-xl bg-linear-to-r from-gold to-[#e8b84b] px-5 py-2.5 text-sm font-semibold text-[#0f1117] hover:opacity-90"
            >
              <Plus className="h-4 w-4" /> Add Logo
            </button>
          }
        />
      </div>

      {!loading && logos.length === 0 ? (
        <EmptyState message="No logos yet. Add the university, RDC and IIC logos." />
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {logos.map((l) => (
            <div
              key={l._id}
              className="rounded-2xl border border-white/[0.06] bg-[#13161f] p-3"
            >
              <div className="h-28 w-full overflow-hidden rounded-xl bg-white p-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={l.url}
                  alt={l.name}
                  className="block h-full w-full object-contain"
                />
              </div>
              <div className="mt-3 flex items-center justify-between gap-2">
                <p className="truncate text-sm font-medium text-white">
                  {l.name}
                </p>
                <button
                  onClick={() => setDeleteTarget(l)}
                  title="Delete"
                  className="rounded-lg p-1.5 text-white/40 hover:bg-red-500/10 hover:text-red-400"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={addOpen} onClose={close} title="Add Logo" size="md">
        <form onSubmit={save} className="space-y-4">
          <Field
            label="Name *"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            placeholder="e.g. Sibsagar University, IIC, RDC"
          />
          <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-white/15 bg-white/[0.02] px-4 py-6 text-sm text-white/50 hover:border-gold/50 hover:text-gold">
            <ImagePlus className="h-5 w-5" />
            {file ? file.name : "Choose image (PNG, JPG or WEBP, max 3 MB)"}
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={(e) => {
                pick(e.target.files?.[0]);
                e.target.value = "";
              }}
            />
          </label>
          <FormActions onCancel={close} loading={saving} />
        </form>
      </Modal>

      <Modal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Delete Logo"
        size="md"
      >
        <DeleteConfirm
          name={deleteTarget?.name ?? ""}
          onConfirm={remove}
          onCancel={() => setDeleteTarget(null)}
          loading={deleting}
        />
      </Modal>

      {toast && <Toast message={toast.message} type={toast.type} />}
    </div>
  );
}
