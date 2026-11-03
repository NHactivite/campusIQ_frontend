import Link from "next/link";
import Section from "@/components/sections/Section";

export type Linkage = {
  _id: string;
  title: string;
  status?: string;
  subtitle?: string; // full name / partner description (rename to match your schema)
  shortName?: string; // optional badge text
};

type Tone = {
  glow: string;
  badge: string;
  title: string;
  pill: string;
  dot: string;
};

// Full class strings so Tailwind can detect them at build time.
const tones: Record<string, Tone> = {
  emerald: {
    glow: "bg-emerald-100/40 group-hover:bg-emerald-100/70",
    badge:
      "bg-emerald-50/70 border-emerald-100/80 text-emerald-800 group-hover:bg-emerald-100/80",
    title: "group-hover:text-emerald-800",
    pill: "bg-emerald-50/80 text-emerald-700 border-emerald-200/50",
    dot: "bg-emerald-500",
  },
  amber: {
    glow: "bg-amber-100/30 group-hover:bg-amber-100/60",
    badge:
      "bg-amber-50/70 border-amber-100/80 text-amber-800 group-hover:bg-amber-100/80",
    title: "group-hover:text-amber-800",
    pill: "bg-amber-50/80 text-amber-700 border-amber-200/50",
    dot: "bg-amber-500",
  },
  blue: {
    glow: "bg-blue-100/35 group-hover:bg-blue-100/70",
    badge:
      "bg-blue-50/70 border-blue-100/80 text-blue-800 group-hover:bg-blue-100/80",
    title: "group-hover:text-blue-800",
    pill: "bg-blue-50/80 text-blue-700 border-blue-200/50",
    dot: "bg-blue-500",
  },
  slate: {
    glow: "bg-slate-100/50 group-hover:bg-slate-200/40",
    badge:
      "bg-slate-100/70 border-slate-200/70 text-slate-700 group-hover:bg-slate-200/70",
    title: "group-hover:text-slate-800",
    pill: "bg-slate-100/80 text-slate-600 border-slate-200/60",
    dot: "bg-slate-400",
  },
};

function toneFor(status?: string): Tone {
  const s = (status ?? "").toLowerCase();
  if (s.includes("complete")) return tones.emerald;
  if (s.includes("initiat") || s.includes("progress") || s.includes("ongoing"))
    return tones.amber;
  if (s.includes("link") || s.includes("active")) return tones.blue;
  return tones.slate; // Planned / unknown
}

// "RFRI" -> "RFRI", "Assam Start-up" -> "ASU"
function abbreviate(title: string) {
  const words = title.split(/[\s-]+/).filter(Boolean);
  if (words.length === 0) return "";
  if (words.length === 1) return words[0].slice(0, 5).toUpperCase();
  return words
    .map((w) => w[0])
    .join("")
    .slice(0, 4)
    .toUpperCase();
}

function LinkageCard({ linkage }: { linkage: Linkage }) {
  const t = toneFor(linkage.status);

  return (
    <Link
      href="/linkages"
      className="group w-full relative flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 text-center shadow-[0_1px_3px_rgba(11,30,54,0.04)] transition-all duration-300 hover:-translate-y-1 hover:border-slate-300 hover:shadow-[0_12px_24px_-6px_rgba(11,30,54,0.08)] sm:p-6"
    >
      <div
        className={`pointer-events-none absolute -right-12 -top-12 h-24 w-24 rounded-full blur-xl transition-all duration-300 ${t.glow}`}
      />

      <div className="relative z-10 pt-1">
        <div
          className={`mx-auto mb-3.5 flex h-11 w-11 items-center justify-center rounded-2xl border text-xs font-bold shadow-xs transition-all duration-300 group-hover:scale-105 ${t.badge}`}
        >
          {linkage.shortName ?? abbreviate(linkage.title)}
        </div>
        <div
          className={`text-sm font-bold leading-tight tracking-tight text-[#0b1e36] transition-colors duration-200 sm:text-base ${t.title}`}
        >
          {linkage.title}
        </div>
        {linkage.subtitle && (
          <div className="mt-1 line-clamp-1 text-[11px] text-slate-400">
            {linkage.subtitle}
          </div>
        )}
      </div>

      {linkage.status && (
        <div className="relative z-10 mt-5 flex items-center justify-center border-t border-slate-100/80 pt-3.5">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-semibold ${t.pill}`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${t.dot}`} />
            {linkage.status}
          </span>
        </div>
      )}
    </Link>
  );
}

export default function LinkagesSection({
  linkages,
}: {
  linkages: Linkage[];
}) {
  return (
    <section
      id="linkages"
      className="relative w-full overflow-hidden px-4 py-6 sm:px-6 lg:px-12 mt-10"
    >
      <h2 className="text-3xl font-bold tracking-tight text-[#0d1c2f] lg:text-5xl">
        Academic &amp; Industry Partnerships
      </h2>

      {linkages.length > 0 ? (
        <div className="relative w-full overflow-hidden rounded-3xl bg-white/80 p-6  sm:p-10">
          {/* Ambient glows */}
          <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-blue-100/40 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 -left-24 h-80 w-80 rounded-full bg-amber-50/50 blur-3xl" />

          <p className="relative z-10 mb-8 max-w-3xl border-b border-slate-100 pb-6 text-sm leading-relaxed text-slate-500">
            Institutional alliances, collaborative R&amp;D consortia, and
            strategic MoUs empowering faculty research, venture incubation, and
            technology transfer.
          </p>

          {/* auto-fit: cards stretch to fill the full row */}
          <div className="relative z-10 grid w-full grid-cols-[repeat(auto-fit,minmax(11rem,1fr))] gap-4">
            {linkages.map((l) => (
              <LinkageCard key={l._id} linkage={l} />
            ))}
          </div>
        </div>
      ) : (
        <div className="flex w-full flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-slate-300 bg-slate-50/60 px-6 py-14 text-center">
          <p className="text-base font-semibold text-slate-800">
            No linkages yet
          </p>
          <p className="max-w-sm text-sm text-muted-foreground">
            Our industry and academic partnerships will be published here soon.
          </p>
        </div>
      )}
    </section>
  );
}