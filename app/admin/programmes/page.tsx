// "use client";
// import { useState, useEffect, useCallback, useRef } from "react";
// import {
//   Plus, Pencil, Trash2, X, Undo2, Search, Eye, EyeOff,
//   FileText, Loader2, CheckCircle2, AlertTriangle, GraduationCap,
// } from "lucide-react";
// import {
//   adminGetProgrammes, adminCreateProgramme, adminUpdateProgramme, adminDeleteProgramme,
//   adminGetIndexStatus, adminResyncItem, type ProgrammeItem,
// } from "@/lib/adminApi";
// import Modal from "@/components/admin/Modal";
// import {
//   Field, FormActions, DeleteConfirm, Toast, PageHeader, EmptyState, AdminTable,
// } from "@/components/admin/AdminUI";

// type ToastState = { message: string; type: "success" | "error" } | null;

// const DEGREE_LEVELS = ["undergraduate", "postgraduate", "doctoral", "diploma", "certificate"];
// const ACCEPT_SYLLABUS = ["application/pdf", "image/jpeg", "image/png", "image/webp"];
// const MAX_FILES = 5;
// const MAX_MB = 50;

// const levelColors: Record<string, string> = {
//   undergraduate: "bg-blue-500/20 text-blue-300",
//   postgraduate: "bg-purple-500/20 text-purple-300",
//   doctoral: "bg-rose-500/20 text-rose-300",
//   diploma: "bg-amber-500/20 text-amber-300",
//   certificate: "bg-emerald-500/20 text-emerald-300",
// };

// const emptyForm = {
//   name: "",
//   degreeLevel: "undergraduate",
//   department: "",
//   duration: "",
//   eligibilityCriteria: "",
//   admissionRequirements: "",
//   courseOverview: "",
//   availableSeats: "",
//   isPublished: "false",
// };

// type IdxInfo = { status: string; updatedAt?: string };
// type Badge = "ready" | "processing" | "failed" | "draft" | "unknown";
// const PROCESSING_WINDOW_MS = 5 * 60_000;
// const EDIT_GRACE_MS = 10_000;

// const sizeLabel = (b: number) =>
//   b > 1e6 ? `${(b / 1e6).toFixed(1)} MB` : `${Math.round(b / 1e3)} KB`;

// export default function AdminProgrammesPage() {
//   const [items, setItems] = useState<ProgrammeItem[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [search, setSearch] = useState("");
//   const [toast, setToast] = useState<ToastState>(null);
//   const [createOpen, setCreateOpen] = useState(false);
//   const [editTarget, setEditTarget] = useState<ProgrammeItem | null>(null);
//   const [deleteTarget, setDeleteTarget] = useState<ProgrammeItem | null>(null);
//   const [saving, setSaving] = useState(false);
//   const [deleting, setDeleting] = useState(false);
//   const [form, setForm] = useState({ ...emptyForm });
//   const [newFiles, setNewFiles] = useState<File[]>([]);
//   const [removedIds, setRemovedIds] = useState<string[]>([]);
//   const [idx, setIdx] = useState<Record<string, IdxInfo>>({});
//   const [idxLoaded, setIdxLoaded] = useState(false);
//   const [pending, setPending] = useState<Record<string, number>>({});
//   const lastCreateAt = useRef(0);

//   const showToast = (message: string, type: "success" | "error") => {
//     setToast({ message, type });
//     setTimeout(() => setToast(null), 3500);
//   };

//   const refreshIndex = useCallback(async () => {
//     try {
//       const s = await adminGetIndexStatus();
//       const map: Record<string, IdxInfo> = {};
//       for (const r of s.items)
//         if (r.kind === ("programme" as any))
//           map[r.id] = { status: r.status, updatedAt: r.updatedAt };
//       setIdx(map);
//       setIdxLoaded(true);
//     } catch { /* chatbot unreachable */ }
//   }, []);

//   const badgeOf = (p: ProgrammeItem): Badge => {
//     if (!p.isPublished) return "draft";
//     if (!idxLoaded) return "unknown";
//     if (pending[p._id] && Date.now() - pending[p._id] < EDIT_GRACE_MS) return "processing";
//     const r = idx[p._id];
//     if (!r) {
//       const created = (p as any).createdAt ? new Date((p as any).createdAt).getTime() : lastCreateAt.current;
//       return Date.now() - created < PROCESSING_WINDOW_MS ? "processing" : "failed";
//     }
//     if (r.status === "indexed") return "ready";
//     const age = Date.now() - new Date(r.updatedAt ?? 0).getTime();
//     return age < PROCESSING_WINDOW_MS ? "processing" : "failed";
//   };

//   const anyProcessing = items.some((p) => badgeOf(p) === "processing");
//   useEffect(() => { refreshIndex(); }, [items, refreshIndex]);
//   useEffect(() => {
//     if (!anyProcessing) return;
//     const t = setInterval(refreshIndex, 5000);
//     return () => clearInterval(t);
//   }, [anyProcessing, refreshIndex]);

//   const retry = async (p: ProgrammeItem) => {
//     try {
//       await adminResyncItem("programme", p._id);
//       setPending((prev) => ({ ...prev, [p._id]: Date.now() }));
//       showToast("Re-sync queued", "success");
//       refreshIndex();
//     } catch (e: any) { showToast(e.message ?? "Could not queue re-sync", "error"); }
//   };

//   const load = useCallback(async () => {
//     setLoading(true);
//     try { setItems(await adminGetProgrammes()); }
//     catch { showToast("Failed to load programmes", "error"); }
//     finally { setLoading(false); }
//   }, []);

//   useEffect(() => { load(); }, [load]);

//   const resetFiles = () => { setNewFiles([]); setRemovedIds([]); };
//   const closeForms = () => { setCreateOpen(false); setEditTarget(null); resetFiles(); };

//   const openCreate = () => { setForm({ ...emptyForm }); resetFiles(); setCreateOpen(true); };
//   const openEdit = (p: ProgrammeItem) => {
//     setForm({
//       name: p.name,
//       degreeLevel: p.degreeLevel,
//       department: p.department,
//       duration: p.duration,
//       eligibilityCriteria: p.eligibilityCriteria ?? "",
//       admissionRequirements: p.admissionRequirements ?? "",
//       courseOverview: p.courseOverview ?? "",
//       availableSeats: p.availableSeats !== undefined ? String(p.availableSeats) : "",
//       isPublished: p.isPublished ? "true" : "false",
//     });
//     resetFiles();
//     setEditTarget(p);
//   };

//   const setField = (k: keyof typeof form) =>
//     (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
//       setForm((f) => ({ ...f, [k]: e.target.value }));

//   const addFiles = (list: FileList | null) => {
//     if (!list) return;
//     const accepted: File[] = [];
//     for (const f of Array.from(list)) {
//       if (!ACCEPT_SYLLABUS.includes(f.type)) { showToast(`"${f.name}" must be a PDF or image.`, "error"); continue; }
//       if (f.size > MAX_MB * 1024 * 1024) { showToast(`"${f.name}" exceeds ${MAX_MB} MB.`, "error"); continue; }
//       accepted.push(f);
//     }
//     setNewFiles((prev) => {
//       const merged = [...prev, ...accepted];
//       if (merged.length > MAX_FILES) showToast(`At most ${MAX_FILES} files.`, "error");
//       return merged.slice(0, MAX_FILES);
//     });
//   };

//   const toggleExisting = (id: string) =>
//     setRemovedIds((ids) => ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]);

//   const buildFormData = () => {
//     const fd = new FormData();
//     Object.entries(form).forEach(([k, v]) => fd.append(k, v));
//     newFiles.forEach((f) => fd.append("syllabus", f));
//     if (removedIds.length > 0) fd.append("removeMedia", JSON.stringify(removedIds));
//     return fd;
//   };

//   const handleSave = (mode: "create" | "update") => async (e: React.FormEvent) => {
//     e.preventDefault();
//     if (!form.name.trim()) { showToast("Programme name is required.", "error"); return; }
//     if (!form.department.trim()) { showToast("Department is required.", "error"); return; }
//     if (!form.duration.trim()) { showToast("Duration is required.", "error"); return; }
//     setSaving(true);
//     try {
//       if (mode === "create") {
//         await adminCreateProgramme(buildFormData());
//         lastCreateAt.current = Date.now();
//       } else if (editTarget) {
//         await adminUpdateProgramme(editTarget._id, buildFormData());
//         setPending((p) => ({ ...p, [editTarget._id]: Date.now() }));
//       }
//       closeForms();
//       showToast(mode === "create" ? "Programme created." : "Programme updated.", "success");
//       load();
//     } catch (err: any) { showToast(err.message ?? "Failed to save", "error"); }
//     finally { setSaving(false); }
//   };

//   const handleDelete = async () => {
//     if (!deleteTarget) return;
//     setDeleting(true);
//     try {
//       await adminDeleteProgramme(deleteTarget._id);
//       setDeleteTarget(null);
//       showToast("Programme deleted", "success");
//       load();
//     } catch (err: any) { showToast(err.message ?? "Failed to delete", "error"); }
//     finally { setDeleting(false); }
//   };

//   const filtered = items.filter(
//     (p) =>
//       p.name.toLowerCase().includes(search.toLowerCase()) ||
//       p.department.toLowerCase().includes(search.toLowerCase()) ||
//       p.degreeLevel.toLowerCase().includes(search.toLowerCase()),
//   );

//   const renderBadge = (p: ProgrammeItem) => {
//     const b = badgeOf(p);
//     if (b === "processing") return <span className="flex items-center gap-1.5 text-xs text-amber-300"><Loader2 className="h-3.5 w-3.5 animate-spin" />Processing…</span>;
//     if (b === "ready") return <span className="flex items-center gap-1.5 text-xs text-emerald-400"><CheckCircle2 className="h-3.5 w-3.5" />Ready</span>;
//     if (b === "failed") return (
//       <span className="flex items-center gap-1.5 text-xs text-red-400">
//         <AlertTriangle className="h-3.5 w-3.5" />Failed
//         <button onClick={() => retry(p)} className="underline hover:text-red-300">Retry</button>
//       </span>
//     );
//     if (b === "draft") return <span className="text-xs text-white/30">Draft</span>;
//     return <span className="text-xs text-white/30">…</span>;
//   };

//   const row = "flex items-center gap-3 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2";

//   const renderForm = (onSubmit: (e: React.FormEvent) => void) => (
//     <form onSubmit={onSubmit} className="space-y-4">
//       <Field label="Programme Name *" value={form.name} onChange={setField("name")} required placeholder="e.g. B.Sc. Computer Science" />
//       <div className="grid grid-cols-2 gap-4">
//         <Field label="Degree Level *" as="select" value={form.degreeLevel} onChange={setField("degreeLevel")}>
//           {DEGREE_LEVELS.map((l) => <option key={l} value={l}>{l.charAt(0).toUpperCase() + l.slice(1)}</option>)}
//         </Field>
//         <Field label="Status" as="select" value={form.isPublished} onChange={setField("isPublished")}>
//           <option value="false">Draft (hidden)</option>
//           <option value="true">Published (visible)</option>
//         </Field>
//       </div>
//       <div className="grid grid-cols-2 gap-4">
//         <Field label="Department *" value={form.department} onChange={setField("department")} required placeholder="e.g. Computer Science" />
//         <Field label="Duration *" value={form.duration} onChange={setField("duration")} required placeholder="e.g. 3 Years / 6 Semesters" />
//       </div>
//       <Field label="Available Seats (optional)" type="number" value={form.availableSeats} onChange={setField("availableSeats")} placeholder="e.g. 60" min="0" />
//       <Field label="Eligibility Criteria" as="textarea" value={form.eligibilityCriteria} onChange={setField("eligibilityCriteria")} placeholder="Minimum qualifications required…" />
//       <Field label="Admission Requirements" as="textarea" value={form.admissionRequirements} onChange={setField("admissionRequirements")} placeholder="Documents, entrance exams, process…" />
//       <Field label="Course Overview" as="textarea" value={form.courseOverview} onChange={setField("courseOverview")} placeholder="What students will learn, subjects, highlights…" />

//       {/* Syllabus Documents */}
//       <div>
//         <div className="mb-2 flex items-center justify-between">
//           <p className="text-xs font-medium uppercase tracking-wider text-white/50">Syllabus / Documents</p>
//           <span className="text-[11px] text-white/30">PDF or image · max {MAX_FILES}, {MAX_MB} MB each</span>
//         </div>
//         <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-white/15 bg-white/2 px-4 py-4 text-sm text-white/50 transition-colors hover:border-gold/50 hover:text-gold">
//           <FileText className="h-4 w-4" />
//           Choose syllabus files
//           <input type="file" multiple accept={ACCEPT_SYLLABUS.join(",")} className="hidden"
//             onChange={(e) => { addFiles(e.target.files); e.target.value = ""; }} />
//         </label>

//         {editTarget && editTarget.syllabus.length > 0 && (
//           <div className="mt-3 space-y-2">
//             <p className="text-[11px] text-white/30">Already uploaded</p>
//             {editTarget.syllabus.map((m) => {
//               const removed = removedIds.includes(m._id);
//               return (
//                 <div key={m._id} className={`${row} ${removed ? "opacity-40" : ""}`}>
//                   <FileText className="h-4 w-4 shrink-0 text-gold" />
//                   <a href={m.url} target="_blank" rel="noreferrer" className="min-w-0 flex-1 truncate text-sm text-white/80 hover:text-gold">
//                     {m.originalName ?? "File"}
//                   </a>
//                   <span className="shrink-0 text-[11px] text-white/30">
//                     {m.format?.toUpperCase()}{m.bytes ? ` · ${sizeLabel(m.bytes)}` : ""}
//                   </span>
//                   {removed && <span className="shrink-0 text-[10px] text-red-400">Will be deleted</span>}
//                   <button type="button" onClick={() => toggleExisting(m._id)} title={removed ? "Keep" : "Remove"}
//                     className="rounded-md p-1 text-white/50 hover:bg-white/10 hover:text-white">
//                     {removed ? <Undo2 className="h-3 w-3" /> : <X className="h-3 w-3" />}
//                   </button>
//                 </div>
//               );
//             })}
//           </div>
//         )}

//         {newFiles.length > 0 && (
//           <div className="mt-3 space-y-2">
//             <p className="text-[11px] text-white/30">New ({newFiles.length})</p>
//             {newFiles.map((f, i) => (
//               <div key={`${f.name}-${i}`} className={row}>
//                 <FileText className="h-4 w-4 shrink-0 text-gold" />
//                 <span className="min-w-0 flex-1 truncate text-sm text-white/80">{f.name}</span>
//                 <button type="button" onClick={() => setNewFiles((p) => p.filter((_, j) => j !== i))}
//                   className="rounded-md p-1 text-white/50 hover:bg-white/10 hover:text-white">
//                   <X className="h-3 w-3" />
//                 </button>
//               </div>
//             ))}
//           </div>
//         )}
//       </div>

//       {saving && newFiles.length > 0 && <p className="text-xs text-gold">Uploading. Please keep this window open.</p>}
//       <FormActions onCancel={closeForms} loading={saving} />
//     </form>
//   );

//   return (
//     <div>
//       <div className="ml-6">
//         <PageHeader
//           title="Academic Programmes"
//           subtitle={`${items.length} programmes · published programmes appear publicly and in the CampusIQ chatbot`}
//           action={
//             <button onClick={openCreate}
//               className="flex items-center gap-2 rounded-xl bg-linear-to-r from-gold to-[#e8b84b] px-5 py-2.5 text-sm font-semibold text-[#0f1117] transition-opacity hover:opacity-90">
//               <Plus className="h-4 w-4" />
//               Add Programme
//             </button>
//           }
//         />
//       </div>

//       <div className="relative mb-5">
//         <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
//         <input value={search} onChange={(e) => setSearch(e.target.value)}
//           placeholder="Search programmes by name, department or level…"
//           className="w-full rounded-xl border border-white/10 bg-[#13161f] py-2.5 pl-11 pr-4 text-sm text-white placeholder-white/30 transition-all focus:border-gold/60 focus:outline-none focus:ring-2 focus:ring-gold/20" />
//       </div>

//       {filtered.length === 0 && !loading ? (
//         <EmptyState message="No programmes found. Add your first academic programme." />
//       ) : (
//         <AdminTable headers={["Programme", "Level", "Department", "Duration", "Seats", "Status", "Chatbot", "Actions"]} loading={loading} cols={8}>
//           {filtered.map((p) => (
//             <tr key={p._id} className="transition-colors hover:bg-white/2">
//               <td className="max-w-xs px-4 py-4">
//                 <p className="truncate font-medium text-white">{p.name}</p>
//               </td>
//               <td className="px-4 py-4">
//                 <span className={`rounded-lg px-2.5 py-0.5 text-xs font-semibold ${levelColors[p.degreeLevel] ?? "bg-slate-500/20 text-slate-300"}`}>
//                   {p.degreeLevel}
//                 </span>
//               </td>
//               <td className="whitespace-nowrap px-4 py-4 text-xs text-white/60">{p.department}</td>
//               <td className="whitespace-nowrap px-4 py-4 text-xs text-white/60">{p.duration}</td>
//               <td className="whitespace-nowrap px-4 py-4 text-xs text-white/60">{p.availableSeats ?? "—"}</td>
//               <td className="px-4 py-4">
//                 {p.isPublished ? (
//                   <span className="flex items-center gap-1.5 text-xs text-emerald-400"><Eye className="h-3.5 w-3.5" />Published</span>
//                 ) : (
//                   <span className="flex items-center gap-1.5 text-xs text-white/30"><EyeOff className="h-3.5 w-3.5" />Draft</span>
//                 )}
//               </td>
//               <td className="px-4 py-4">{renderBadge(p)}</td>
//               <td className="px-4 py-4">
//                 <div className="flex items-center gap-2">
//                   <button onClick={() => openEdit(p)} title="Edit"
//                     className="rounded-lg p-1.5 text-white/40 transition-colors hover:bg-gold/10 hover:text-gold">
//                     <Pencil className="h-3.5 w-3.5" />
//                   </button>
//                   <button onClick={() => setDeleteTarget(p)} title="Delete"
//                     className="rounded-lg p-1.5 text-white/40 transition-colors hover:bg-red-500/10 hover:text-red-400">
//                     <Trash2 className="h-3.5 w-3.5" />
//                   </button>
//                 </div>
//               </td>
//             </tr>
//           ))}
//         </AdminTable>
//       )}

//       <Modal open={createOpen} onClose={closeForms} title="Add Academic Programme">
//         {renderForm(handleSave("create"))}
//       </Modal>
//       <Modal open={!!editTarget} onClose={closeForms} title="Edit Academic Programme">
//         {renderForm(handleSave("update"))}
//       </Modal>
//       <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete Programme" size="md">
//         <DeleteConfirm name={deleteTarget?.name ?? ""} onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} loading={deleting} />
//       </Modal>

//       {toast && <Toast message={toast.message} type={toast.type} />}
//     </div>
//   );
// }
