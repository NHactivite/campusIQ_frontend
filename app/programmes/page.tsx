import Link from "next/link";
import {
  GraduationCap, BookOpen, Users, Clock3, Search, ChevronRight,
} from "lucide-react";
import { getProgrammes, type ProgrammeItem, type EventsPagination } from "@/lib/api";

export const metadata = {
  title: "Academic Programmes | CampusIQ",
  description: "Explore undergraduate, postgraduate, doctoral, diploma and certificate programmes at Sibsagar University.",
};

const DEGREE_LEVELS = ["all", "undergraduate", "postgraduate", "doctoral", "diploma", "certificate"];
const LIMIT = 12;

const levelColors: Record<string, { bg: string; text: string; border: string; accent: string }> = {
  undergraduate: { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200", accent: "bg-blue-500" },
  postgraduate: { bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-200", accent: "bg-purple-500" },
  doctoral: { bg: "bg-rose-50", text: "text-rose-700", border: "border-rose-200", accent: "bg-rose-500" },
  diploma: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200", accent: "bg-amber-500" },
  certificate: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200", accent: "bg-emerald-500" },
};

const href = (p: { level?: string; q?: string; page?: number }) => {
  const s = new URLSearchParams();
  if (p.level && p.level !== "all") s.set("degreeLevel", p.level);
  if (p.q) s.set("q", p.q);
  if (p.page && p.page > 1) s.set("page", String(p.page));
  const qs = s.toString();
  return qs ? `/programmes?${qs}` : "/programmes";
};

function pageList(current: number, total: number): (number | "…")[] {
  const set = new Set([1, total, current - 1, current, current + 1]);
  const nums = [...set].filter((n) => n >= 1 && n <= total).sort((a, b) => a - b);
  const out: (number | "…")[] = [];
  nums.forEach((n, i) => {
    if (i > 0 && n - nums[i - 1] > 1) out.push("…");
    out.push(n);
  });
  return out;
}

function ProgrammeCard({ p }: { p: ProgrammeItem }) {
  const color = levelColors[p.degreeLevel] ?? { bg: "bg-slate-50", text: "text-slate-600", border: "border-slate-200", accent: "bg-slate-500" };

  return (
    <Link
      href={`/programmes/${p.slug}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all hover:shadow-lg hover:-translate-y-0.5"
    >
      {/* Accent top bar */}
      <div className={`h-1 w-full ${color.accent}`} />

      <div className="flex flex-1 flex-col gap-4 p-6">
        {/* Badge + icon */}
        <div className="flex items-start justify-between gap-3">
          <div className={`rounded-xl p-2.5 ${color.bg} ${color.border} border`}>
            <GraduationCap className={`h-5 w-5 ${color.text}`} />
          </div>
          <span className={`rounded-full border px-3 py-0.5 text-[11px] font-semibold capitalize ${color.bg} ${color.text} ${color.border}`}>
            {p.degreeLevel}
          </span>
        </div>

        {/* Name */}
        <div>
          <h2 className="font-bold text-slate-900 group-hover:text-primary transition-colors line-clamp-2 text-lg">
            {p.name}
          </h2>
          <div className="mt-1.5 flex items-center gap-1.5 text-sm text-slate-500">
            <BookOpen className="h-3.5 w-3.5 shrink-0 text-amber-600" />
            <span className="truncate">{p.department}</span>
          </div>
        </div>

        {/* Course overview preview */}
        {p.courseOverview && (
          <p className="text-sm text-slate-500 line-clamp-2 flex-1">{p.courseOverview}</p>
        )}

        {/* Meta */}
        <div className="grid grid-cols-2 gap-3 rounded-xl bg-slate-50 p-3">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-slate-400 mb-0.5">Duration</p>
            <div className="flex items-center gap-1.5">
              <Clock3 className="h-3.5 w-3.5 text-amber-600 shrink-0" />
              <span className="text-xs font-semibold text-slate-700 truncate">{p.duration}</span>
            </div>
          </div>
          {p.availableSeats !== undefined && (
            <div>
              <p className="text-[10px] uppercase tracking-wider text-slate-400 mb-0.5">Seats</p>
              <div className="flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                <span className="text-xs font-semibold text-slate-700">{p.availableSeats}</span>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-1 text-xs font-semibold text-amber-700 group-hover:text-amber-800 transition-colors">
          View Programme <ChevronRight className="h-3.5 w-3.5" />
        </div>
      </div>
    </Link>
  );
}

export default async function ProgrammesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; degreeLevel?: string; q?: string }>;
}) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const level = DEGREE_LEVELS.includes(sp.degreeLevel ?? "") ? sp.degreeLevel! : "all";
  const q = (sp.q ?? "").trim().slice(0, 100);

  let programmes: ProgrammeItem[] = [];
  let pagination: EventsPagination = { page: 1, limit: LIMIT, total: 0, pages: 0 };
  let failed = false;
  try {
    const res = await getProgrammes({ degreeLevel: level, search: q, page, limit: LIMIT });
    programmes = res.data;
    pagination = res.pagination;
  } catch {
    failed = true;
  }

  const { pages, total } = pagination;
  const from = total === 0 ? 0 : (pagination.page - 1) * LIMIT + 1;
  const to = Math.min(pagination.page * LIMIT, total);

  return (
    <div className="pb-20">
      {/* Header */}
      <div className="bg-gradient-to-br from-violet-50 to-purple-50 border-b border-violet-100">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="rounded-xl bg-violet-100 p-2.5">
              <GraduationCap className="h-6 w-6 text-violet-700" />
            </div>
            <span className="text-sm font-semibold uppercase tracking-widest text-violet-700">Academic Programmes</span>
          </div>
          <h1 className="text-3xl font-bold text-slate-900 sm:text-3xl">Programmes We Offer</h1>
          <p className="mt-3 max-w-2xl text-slate-600 text-xs">
            From foundational diplomas to advanced doctoral research — explore all academic pathways at Sibsagar University
            and find the programme that fits your aspirations.
          </p>
        </div>
      </div>

      <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        {/* Search */}
        <form action="/programmes" className="relative mb-6">
          {level !== "all" && <input type="hidden" name="degreeLevel" value={level} />}
          <Search className="absolute left-4 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-slate-400" />
          <input
            name="q"
            defaultValue={q}
            placeholder="Search programmes by name, department…"
            className="w-full rounded-2xl border border-slate-200 bg-white py-3.5 pl-12 pr-4 text-sm shadow-sm outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-200 transition-all"
          />
        </form>

        {/* Degree level filter */}
        <div className="mb-8 flex flex-wrap gap-2">
          {DEGREE_LEVELS.map((l) => {
            const c = levelColors[l];
            return (
              <Link
                key={l}
                href={href({ level: l, q })}
                aria-current={l === level ? "page" : undefined}
                className={`rounded-full border px-4 py-1.5 text-sm font-medium capitalize transition-all ${l === level
                  ? (c ? `${c.bg} ${c.text} ${c.border}` : "border-violet-400 bg-violet-400 text-white")
                  : "border-slate-200 bg-white text-slate-600 hover:border-violet-300 hover:bg-violet-50"
                  }`}
              >
                {l}
              </Link>
            );
          })}
        </div>

        {total > 0 && (
          <p className="mb-5 text-sm text-slate-500">
            Showing {from}–{to} of {total} programme{total === 1 ? "" : "s"}
            {q ? ` for "${q}"` : ""}
          </p>
        )}

        {/* Grid */}
        {failed ? (
          <p className="rounded-2xl bg-red-50 p-6 text-center text-sm text-red-700 border border-red-100">
            Could not load programmes. Please try again later.
          </p>
        ) : programmes.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 py-20 text-center">
            <GraduationCap className="mx-auto h-10 w-10 text-slate-300 mb-3" />
            <p className="text-slate-500">No programmes found{q ? ` for "${q}"` : ""}.</p>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {programmes.map((p) => <ProgrammeCard key={p._id} p={p} />)}
          </div>
        )}

        {/* Pagination */}
        {pages > 1 && (
          <nav aria-label="Pagination" className="mt-12 flex flex-col items-center gap-4">
            <div className="flex flex-wrap items-center justify-center gap-1.5">
              {pagination.page > 1 ? (
                <Link href={href({ level, q, page: pagination.page - 1 })}
                  className="rounded-xl border bg-white px-4 py-2 text-sm font-medium hover:bg-violet-50 transition-colors">
                  Previous
                </Link>
              ) : (
                <span className="rounded-xl border bg-white px-4 py-2 text-sm font-medium opacity-40">Previous</span>
              )}
              {pageList(pagination.page, pages).map((p, i) =>
                p === "…" ? (
                  <span key={`gap-${i}`} className="px-1 text-slate-400">…</span>
                ) : (
                  <Link key={p} href={href({ level, q, page: p })}
                    aria-current={p === pagination.page ? "page" : undefined}
                    className={`h-9 min-w-9 rounded-xl px-3 py-2 text-center text-sm font-medium transition-colors ${p === pagination.page ? "bg-violet-500 text-white" : "border bg-white hover:bg-violet-50"
                      }`}>
                    {p}
                  </Link>
                ),
              )}
              {pagination.page < pages ? (
                <Link href={href({ level, q, page: pagination.page + 1 })}
                  className="rounded-xl border bg-white px-4 py-2 text-sm font-medium hover:bg-violet-50 transition-colors">
                  Next
                </Link>
              ) : (
                <span className="rounded-xl border bg-white px-4 py-2 text-sm font-medium opacity-40">Next</span>
              )}
            </div>
          </nav>
        )}
      </section>
    </div>
  );
}
