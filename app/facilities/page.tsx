import Link from "next/link";
import Image from "next/image";
import {
  MapPin, Clock, Phone, Search, ChevronRight, Building2, Wifi,
} from "lucide-react";
import { getFacilities, type FacilityItem, type EventsPagination } from "@/lib/api";

export const metadata = {
  title: "Campus Facilities | CampusIQ",
  description: "Explore all campus facilities — libraries, labs, sports, hostels, and more at Sibsagar University.",
};

const CATEGORIES = [
  "all", "library", "sports", "laboratory", "canteen", "hostel",
  "medical", "transport", "it", "auditorium", "other",
];

const LIMIT = 12;

const categoryColors: Record<string, { bg: string; text: string; border: string }> = {
  library: { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200" },
  sports: { bg: "bg-green-50", text: "text-green-700", border: "border-green-200" },
  laboratory: { bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-200" },
  canteen: { bg: "bg-orange-50", text: "text-orange-700", border: "border-orange-200" },
  hostel: { bg: "bg-rose-50", text: "text-rose-700", border: "border-rose-200" },
  medical: { bg: "bg-red-50", text: "text-red-700", border: "border-red-200" },
  transport: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200" },
  it: { bg: "bg-cyan-50", text: "text-cyan-700", border: "border-cyan-200" },
  auditorium: { bg: "bg-indigo-50", text: "text-indigo-700", border: "border-indigo-200" },
  other: { bg: "bg-slate-50", text: "text-slate-600", border: "border-slate-200" },
};

const href = (p: { category?: string; q?: string; page?: number }) => {
  const s = new URLSearchParams();
  if (p.category && p.category !== "all") s.set("category", p.category);
  if (p.q) s.set("q", p.q);
  if (p.page && p.page > 1) s.set("page", String(p.page));
  const qs = s.toString();
  return qs ? `/facilities?${qs}` : "/facilities";
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

function FacilityCard({ f }: { f: FacilityItem }) {
  const color = categoryColors[f.category] ?? categoryColors.other;
  const cover = f.images?.[0]?.url;

  return (
    <Link
      href={`/facilities/${f.slug}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all hover:shadow-lg hover:-translate-y-0.5"
    >
      {/* Image */}
      <div className="relative h-44 w-full overflow-hidden bg-slate-100">
        {cover ? (
          <Image
            src={cover}
            alt={f.name}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <Building2 className="h-12 w-12 text-slate-300" />
          </div>
        )}
        {/* Category badge */}
        <span className={`absolute top-3 left-3 rounded-full border px-3 py-0.5 text-[11px] font-semibold capitalize ${color.bg} ${color.text} ${color.border}`}>
          {f.category}
        </span>
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col gap-3 p-5">
        <h2 className="font-bold text-slate-900 group-hover:text-primary transition-colors line-clamp-2">{f.name}</h2>
        <p className="text-sm text-slate-500 line-clamp-2 flex-1">{f.description}</p>

        {/* Meta */}
        <div className="space-y-1.5">
          {f.location && (
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <MapPin className="h-3.5 w-3.5 shrink-0 text-amber-600" />
              <span className="truncate">{f.location}</span>
            </div>
          )}
          {f.operatingHours && (
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <Clock className="h-3.5 w-3.5 shrink-0 text-amber-600" />
              <span className="truncate">{f.operatingHours}</span>
            </div>
          )}
        </div>

        {/* Amenities pills */}
        {f.amenities?.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {f.amenities.slice(0, 3).map((a) => (
              <span key={a} className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] text-slate-600 font-medium">
                {a}
              </span>
            ))}
            {f.amenities.length > 3 && (
              <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] text-slate-500">
                +{f.amenities.length - 3} more
              </span>
            )}
          </div>
        )}

        <div className="mt-auto flex items-center gap-1 text-xs font-semibold text-amber-700 transition-colors group-hover:text-amber-800">
          View details <ChevronRight className="h-3.5 w-3.5" />
        </div>
      </div>
    </Link>
  );
}

export default async function FacilitiesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; category?: string; q?: string }>;
}) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const category = CATEGORIES.includes(sp.category ?? "") ? sp.category! : "all";
  const q = (sp.q ?? "").trim().slice(0, 100);

  let facilities: FacilityItem[] = [];
  let pagination: EventsPagination = { page: 1, limit: LIMIT, total: 0, pages: 0 };
  let failed = false;
  try {
    const res = await getFacilities({ category, search: q, page, limit: LIMIT });
    facilities = res.data;
    pagination = res.pagination;
  } catch {
    failed = true;
  }

  const { pages, total } = pagination;
  const from = total === 0 ? 0 : (pagination.page - 1) * LIMIT + 1;
  const to = Math.min(pagination.page * LIMIT, total);

  return (
    <div className="pb-20">
      {/* Header banner */}
      <div className="bg-gradient-to-br from-amber-50 to-orange-50 border-b border-amber-100">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="rounded-xl bg-amber-100 p-2.5">
              <Building2 className="h-6 w-6 text-amber-700" />
            </div>
            <span className="text-sm font-semibold uppercase tracking-widest text-amber-700">Campus Facilities</span>
          </div>
          <h1 className="text-3xl font-bold text-slate-900 sm:text-3xl">Explore Our Campus</h1>
          <p className="mt-3 max-w-2xl text-slate-600 text-xs">
            Discover world-class facilities at Sibsagar University — from cutting-edge laboratories to comfortable
            hostels and vibrant sports complexes.
          </p>
        </div>
      </div>

      <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        {/* Search */}
        <form action="/facilities" className="relative mb-6">
          {category !== "all" && <input type="hidden" name="category" value={category} />}
          <Search className="absolute left-4 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-slate-400" />
          <input
            name="q"
            defaultValue={q}
            placeholder="Search facilities…"
            className="w-full rounded-2xl border border-slate-200 bg-white py-3.5 pl-12 pr-4 text-sm shadow-sm outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-200 transition-all"
          />
        </form>

        {/* Category filter */}
        <div className="mb-8 flex flex-wrap gap-2">
          {CATEGORIES.map((c) => (
            <Link
              key={c}
              href={href({ category: c, q })}
              aria-current={c === category ? "page" : undefined}
              className={`rounded-full border px-4 py-1.5 text-sm font-medium capitalize transition-all ${c === category
                ? "border-amber-400 bg-amber-400 text-white shadow-sm"
                : "border-slate-200 bg-white text-slate-600 hover:border-amber-300 hover:bg-amber-50"
                }`}
            >
              {c}
            </Link>
          ))}
        </div>

        {/* Results count */}
        {total > 0 && (
          <p className="mb-5 text-sm text-slate-500">
            Showing {from}–{to} of {total} facilit{total === 1 ? "y" : "ies"}
            {q ? ` for "${q}"` : ""}
          </p>
        )}

        {/* Grid */}
        {failed ? (
          <p className="rounded-2xl bg-red-50 p-6 text-center text-sm text-red-700 border border-red-100">
            Could not load facilities. Please try again later.
          </p>
        ) : facilities.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 py-20 text-center">
            <Building2 className="mx-auto h-10 w-10 text-slate-300 mb-3" />
            <p className="text-slate-500">No facilities found{q ? ` for "${q}"` : ""}.</p>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {facilities.map((f) => <FacilityCard key={f._id} f={f} />)}
          </div>
        )}

        {/* Pagination */}
        {pages > 1 && (
          <nav aria-label="Pagination" className="mt-12 flex flex-col items-center gap-4">
            <div className="flex flex-wrap items-center justify-center gap-1.5">
              {pagination.page > 1 ? (
                <Link href={href({ category, q, page: pagination.page - 1 })}
                  className="rounded-xl border bg-white px-4 py-2 text-sm font-medium hover:bg-amber-50 transition-colors">
                  Previous
                </Link>
              ) : (
                <span className="rounded-xl border bg-white px-4 py-2 text-sm font-medium opacity-40">Previous</span>
              )}
              {pageList(pagination.page, pages).map((p, i) =>
                p === "…" ? (
                  <span key={`gap-${i}`} className="px-1 text-slate-400">…</span>
                ) : (
                  <Link key={p} href={href({ category, q, page: p })}
                    aria-current={p === pagination.page ? "page" : undefined}
                    className={`h-9 min-w-9 rounded-xl px-3 py-2 text-center text-sm font-medium transition-colors ${p === pagination.page ? "bg-amber-500 text-white" : "border bg-white hover:bg-amber-50"
                      }`}>
                    {p}
                  </Link>
                ),
              )}
              {pagination.page < pages ? (
                <Link href={href({ category, q, page: pagination.page + 1 })}
                  className="rounded-xl border bg-white px-4 py-2 text-sm font-medium hover:bg-amber-50 transition-colors">
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
