import Link from "next/link";
import {
  CalendarDays,
  Download,
  FileText,
  Search,
  ImageIcon,
} from "lucide-react";
import { getNotices, type PublicNotice } from "@/lib/api";

export const metadata = { title: "Notices | RDC & IIC" };

const CATEGORIES = [
  "all",
  "notices",
  "regulations",
  "exams",
  "scholarships",
  "admission",
  "facilities",
  "other",
];
const LIMIT = 10;

const fmt = (d?: string) =>
  d
    ? new Date(d).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "";
const size = (b?: number) =>
  b
    ? b > 1e6
      ? `${(b / 1e6).toFixed(1)} MB`
      : `${Math.round(b / 1e3)} KB`
    : "";

const href = (p: { category?: string; q?: string; page?: number }) => {
  const s = new URLSearchParams();
  if (p.category && p.category !== "all") s.set("category", p.category);
  if (p.q) s.set("q", p.q);
  if (p.page && p.page > 1) s.set("page", String(p.page));
  const qs = s.toString();
  return qs ? `/notices?${qs}` : "/notices";
};

// 1 … 4 5 [6] 7 8 … 20
function pageList(current: number, total: number): (number | "…")[] {
  const set = new Set([1, total, current - 1, current, current + 1]);
  const nums = [...set]
    .filter((n) => n >= 1 && n <= total)
    .sort((a, b) => a - b);
  const out: (number | "…")[] = [];
  nums.forEach((n, i) => {
    if (i > 0 && n - nums[i - 1] > 1) out.push("…");
    out.push(n);
  });
  return out;
}

function NoticeCard({ n }: { n: PublicNotice }) {
  const long = n.text.length > 220;
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex flex-wrap items-center gap-3 text-xs">
        <span className="rounded-full bg-amber-100 px-3 py-1 font-semibold capitalize text-amber-800">
          {n.category}
        </span>
        <span className="flex items-center gap-1.5 text-slate-500">
          <CalendarDays className="h-3.5 w-3.5" />
          {fmt(n.noticeDate ?? n.createdAt)}
        </span>
      </div>

      <h2 className="mt-3 text-lg font-bold text-primary">{n.title}</h2>

      {n.text &&
        (long ? (
          <details className="group mt-2">
            <summary className="cursor-pointer list-none text-sm leading-relaxed text-foreground/75 group-open:hidden">
              <span className="line-clamp-3 whitespace-pre-wrap">{n.text}</span>
              <span className="mt-1 inline-block font-semibold text-amber-700">
                Read more
              </span>
            </summary>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/75">
              {n.text}
            </p>
            <span className="mt-1 hidden cursor-pointer font-semibold text-amber-700 group-open:inline-block">
              Show less
            </span>
          </details>
        ) : (
          <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-foreground/75">
            {n.text}
          </p>
        ))}

      {n.files.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2 border-t pt-4">
          {n.files.map((f) => (
            <a
              key={f._id}
              href={f.url}
              target="_blank"
              rel="noreferrer"
              className="group inline-flex max-w-full items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-700 transition-colors hover:border-amber-400 hover:bg-amber-50"
            >
              {f.resourceType === "image" ? (
                <ImageIcon className="h-4 w-4 shrink-0 text-sky-700" />
              ) : (
                <FileText className="h-4 w-4 shrink-0 text-sky-700" />
              )}
              <span className="truncate">{f.originalName ?? "Attachment"}</span>
              {size(f.bytes) && (
                <span className="shrink-0 text-slate-400">{size(f.bytes)}</span>
              )}
              <Download className="h-3.5 w-3.5 shrink-0 text-slate-400 group-hover:text-amber-700" />
            </a>
          ))}
        </div>
      )}
    </article>
  );
}

export default async function NoticesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; category?: string; q?: string }>;
}) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const category = CATEGORIES.includes(sp.category ?? "")
    ? sp.category!
    : "all";
  const q = (sp.q ?? "").trim().slice(0, 100);

  let notices: PublicNotice[] = [];
  let pagination = { page: 1, limit: LIMIT, total: 0, pages: 0 };
  let failed = false;
  try {
    const res = await getNotices({ category, search: q, page, limit: LIMIT });
    notices = res.data;
    pagination = res.pagination;
  } catch {
    failed = true;
  }

  const { pages, total } = pagination;
  const from = total === 0 ? 0 : (pagination.page - 1) * LIMIT + 1;
  const to = Math.min(pagination.page * LIMIT, total);

  return (
    <div className="pb-16">
      <section className="mx-auto max-w-5xl px-4 py-3 sm:px-6">
        <main >
          <section className="mx-auto max-w-5xl px-4 py-3 sm:px-6">
            {/* search */}
            <form action="/notices" className="relative">
              {category !== "all" && (
                <input type="hidden" name="category" value={category} />
              )}
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                name="q"
                defaultValue={q}
                placeholder="Search notices…"
                className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm outline-none focus:border-gold focus:ring-2 focus:ring-gold/20"
              />
            </form>

            {/* categories */}
            <div className="mt-4 flex flex-wrap gap-2">
              {CATEGORIES.map((c) => (
                <Link
                  key={c}
                  href={href({ category: c, q })}
                  aria-current={c === category ? "page" : undefined}
                  className={`rounded-full border px-3.5 py-1.5 text-xs font-medium capitalize transition-colors ${
                    c === category
                      ? "border-primary bg-primary text-white"
                      : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {c}
                </Link>
              ))}
            </div>

            {/* list */}
            <div className="mt-6 space-y-4">
              {failed ? (
                <p className="rounded-lg bg-red-50 p-4 text-sm text-red-700">
                  Could not load notices. Please try again later.
                </p>
              ) : notices.length === 0 ? (
                <p className="rounded-xl border border-dashed bg-white p-10 text-center text-muted-foreground">
                  No notices found{q ? ` for “${q}”` : ""}.
                </p>
              ) : (
                notices.map((n) => <NoticeCard key={n._id} n={n} />)
              )}
            </div>

            {/* pagination */}
            {pages > 1 && (
              <nav
                aria-label="Pagination"
                className="mt-10 flex flex-col items-center gap-4"
              >
                <div className="flex flex-wrap items-center justify-center gap-1.5">
                  {pagination.page > 1 ? (
                    <Link
                      href={href({ category, q, page: pagination.page - 1 })}
                      className="rounded-lg border bg-white px-4 py-2 text-sm font-medium hover:bg-muted"
                    >
                      Previous
                    </Link>
                  ) : (
                    <span className="rounded-lg border bg-white px-4 py-2 text-sm font-medium opacity-40">
                      Previous
                    </span>
                  )}

                  {pageList(pagination.page, pages).map((p, i) =>
                    p === "…" ? (
                      <span key={`gap-${i}`} className="px-1 text-slate-400">
                        …
                      </span>
                    ) : (
                      <Link
                        key={p}
                        href={href({ category, q, page: p })}
                        aria-current={
                          p === pagination.page ? "page" : undefined
                        }
                        className={`h-9 min-w-9 rounded-lg px-3 py-2 text-center text-sm font-medium ${
                          p === pagination.page
                            ? "bg-primary text-white"
                            : "border bg-white hover:bg-muted"
                        }`}
                      >
                        {p}
                      </Link>
                    ),
                  )}

                  {pagination.page < pages ? (
                    <Link
                      href={href({ category, q, page: pagination.page + 1 })}
                      className="rounded-lg border bg-white px-4 py-2 text-sm font-medium hover:bg-muted"
                    >
                      Next
                    </Link>
                  ) : (
                    <span className="rounded-lg border bg-white px-4 py-2 text-sm font-medium opacity-40">
                      Next
                    </span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  Showing {from}–{to} of {total} notices
                </p>
              </nav>
            )}
          </section>
        </main>
      </section>
    </div>
  );
}
