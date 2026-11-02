import { ChevronRight } from "lucide-react";
export default function Flow({ steps }: { steps: string[] }) {
  return (
    <div className="flex bg-gold flex-wrap items-center justify-center gap-2 rounded-xl  p-5">
      {steps.map((s, i) => (
        <span key={s} className="flex items-center gap-2">
          <span className="rounded-full border bg-white px-4 py-2 text-sm font-semibold text-primary">{s}</span>
          {i < steps.length - 1 && <ChevronRight className="h-4 w-4 text-accent" />}
        </span>
      ))}
    </div>
  );
}
