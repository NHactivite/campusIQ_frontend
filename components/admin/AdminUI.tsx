interface FieldProps extends React.InputHTMLAttributes<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement> {
  label: string;
  error?: string;
  as?: "input" | "textarea" | "select";
  children?: React.ReactNode;
}

export function Field({ label, error, as = "input", children, className, ...props }: FieldProps & { className?: string }) {
  const base =
    "w-full rounded-xl border border-white/10 bg-white/[0.05] px-4 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#c69a36]/60 focus:ring-2 focus:ring-[#c69a36]/20 transition-all";

  return (
    <div className={`flex flex-col gap-1.5 ${className ?? ""}`}>
      <label className="text-xs font-medium text-white/60 uppercase tracking-wide">{label}</label>
      {as === "textarea" ? (
        <textarea
          rows={3}
          className={`${base} resize-none`}
          {...(props as React.TextareaHTMLAttributes<HTMLTextAreaElement>)}
        />
      ) : as === "select" ? (
        <select
          className={`${base} cursor-pointer [&>option]:bg-[#13161f] [&>option]:text-white`}
          {...(props as React.SelectHTMLAttributes<HTMLSelectElement>)}
        >
          {children}
        </select>
      ) : (
        <input
          className={base}
          {...(props as React.InputHTMLAttributes<HTMLInputElement>)}
        />
      )}
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}

export function FormActions({
  onCancel,
  loading,
  submitLabel = "Save",
}: {
  onCancel: () => void;
  loading?: boolean;
  submitLabel?: string;
}) {
  return (
    <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/[0.06]">
      <button
        type="button"
        onClick={onCancel}
        className="rounded-xl border border-white/10 px-5 py-2 text-sm font-medium text-white/60 hover:text-white hover:bg-white/[0.05] transition-colors"
      >
        Cancel
      </button>
      <button
        type="submit"
        disabled={loading}
        className="rounded-xl bg-gradient-to-r from-[#c69a36] to-[#e8b84b] px-6 py-2 text-sm font-semibold text-[#0f1117] hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
      >
        {loading ? "Saving…" : submitLabel}
      </button>
    </div>
  );
}

export function DeleteConfirm({
  name,
  onConfirm,
  onCancel,
  loading,
}: {
  name: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-white/70">
        Are you sure you want to delete{" "}
        <span className="font-semibold text-white">"{name}"</span>? This action cannot be undone.
      </p>
      <div className="flex items-center justify-end gap-3">
        <button
          onClick={onCancel}
          className="rounded-xl border border-white/10 px-5 py-2 text-sm font-medium text-white/60 hover:text-white hover:bg-white/[0.05] transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          disabled={loading}
          className="rounded-xl bg-red-500 px-6 py-2 text-sm font-semibold text-white hover:bg-red-600 disabled:opacity-50 transition-colors"
        >
          {loading ? "Deleting…" : "Delete"}
        </button>
      </div>
    </div>
  );
}

export function Toast({ message, type }: { message: string; type: "success" | "error" }) {
  return (
    <div
      className={`fixed bottom-6 right-6 z-[100] flex items-center gap-3 rounded-2xl border px-5 py-3.5 text-sm font-medium shadow-2xl ${
        type === "success"
          ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
          : "border-red-500/30 bg-red-500/10 text-red-300"
      }`}
      style={{ animation: "toastIn 0.3s ease-out" }}
    >
      <span>{type === "success" ? "✓" : "✕"}</span>
      {message}
      <style>{`
        @keyframes toastIn {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4 mb-8">
      <div>
        <h1 className="text-2xl font-bold text-white">{title}</h1>
        {subtitle && <p className="text-sm text-white/40 mt-1">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-white/10 py-16 text-center">
      <p className="text-sm text-white/30">{message}</p>
    </div>
  );
}

export function LoadingRows({ cols = 4 }: { cols?: number }) {
  return (
    <>
      {[1, 2, 3, 4, 5].map((i) => (
        <tr key={i}>
          {Array.from({ length: cols }).map((_, j) => (
            <td key={j} className="px-4 py-4">
              <div className="h-4 rounded-lg bg-white/[0.05] animate-pulse" />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

export function AdminTable({
  headers,
  children,
  loading,
  cols,
}: {
  headers: string[];
  children: React.ReactNode;
  loading?: boolean;
  cols?: number;
}) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-white/[0.06] bg-[#13161f]">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-white/[0.06]">
            {headers.map((h) => (
              <th
                key={h}
                className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-white/30"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-white/[0.04]">
          {loading ? <LoadingRows cols={cols ?? headers.length} /> : children}
        </tbody>
      </table>
    </div>
  );
}
