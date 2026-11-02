"use client";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowRight, BarChart3, ChevronLeft, ChevronRight } from "lucide-react";
import type { GlanceItem } from "@/lib/api";
import { cn } from "@/lib/utils";

const GAP = 24; // matches gap-6


export default function GlanceSlider({ cards }: { cards: GlanceItem[] }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState("All");
  const [view, setView] = useState({ first: 0, perPage: 4, pages: 1, page: 0, atStart: true, atEnd: true });

  const categories = useMemo(
    () => ["All", ...new Set(cards.map((c) => c.category).filter((c): c is string => !!c))],
    [cards]
  );
  const list = useMemo(
    () => (active === "All" ? cards : cards.filter((c) => c.category === active)),
    [cards, active]
  );

  // reads the scroll position and works out which cards are on screen
  const measure = useCallback(() => {
    const el = trackRef.current;
    const firstCard = el?.children[0] as HTMLElement | undefined;
    if (!el || !firstCard) return;

    const step = firstCard.offsetWidth + GAP;
    const perPage = Math.max(1, Math.round((el.clientWidth + GAP) / step));
    const pages = Math.max(1, Math.ceil(list.length / perPage));
    const atStart = el.scrollLeft <= 4;
    const atEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 4;
    const first = Math.round(el.scrollLeft / step);
    const page = atEnd ? pages - 1 : Math.min(pages - 1, Math.floor(first / perPage));

    setView({ first, perPage, pages, page, atStart, atEnd });
  }, [list.length]);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    el.scrollTo({ left: 0 });
    measure();
    el.addEventListener("scroll", measure, { passive: true });
    window.addEventListener("resize", measure);
    return () => {
      el.removeEventListener("scroll", measure);
      window.removeEventListener("resize", measure);
    };
  }, [measure, active]);

  const stepWidth = () => {
    const firstCard = trackRef.current?.children[0] as HTMLElement | undefined;
    return (firstCard?.offsetWidth ?? 0) + GAP;
  };
  const scrollPage = (dir: 1 | -1) =>
    trackRef.current?.scrollBy({ left: dir * stepWidth() * view.perPage, behavior: "smooth" });
  const goTo = (page: number) =>
    trackRef.current?.scrollTo({ left: page * stepWidth() * view.perPage, behavior: "smooth" });

  const from = view.first + 1;
  const to = Math.min(list.length, view.first + view.perPage);

  const arrow =
    "flex h-11 w-11 items-center justify-center rounded-xl border border-[#c4c6ce] bg-white text-[#0d1c2f] shadow-sm transition-all hover:border-amber-500/60 hover:text-amber-600 disabled:cursor-not-allowed disabled:opacity-30";

  return (
    <section id="glance" className="relative scroll-mt-24 overflow-hidden ">
      {/* <div aria-hidden className="pointer-events-none absolute top-0 left-1/4 h-125 w-175 rounded-full bg-[#d5e3fd]/45 blur-[140px]" />
      <div aria-hidden className="pointer-events-none absolute right-1/4 bottom-10 h-125 w-150 rounded-full bg-orange-400/10 blur-[160px]" /> */}

      <div className="relative mx-auto  px-6 py-5 lg:px-12">
        {/* header */}
        <div className="mb-10 flex flex-col justify-between gap-6 border-b border-[#d5e3fd] pb-8 md:flex-row md:items-end">
          <div>
            <h2 className="flex flex-wrap items-center gap-x-3 text-3xl font-bold tracking-tight lg:text-4xl">
              <span className="text-[#0d1c2f]">RDC–IIC</span>
              <span className="bg-linear-to-r from-blue-600 via-blue-500 to-blue-600 bg-clip-text font-serif font-normal text-transparent italic">
                at a glance
              </span>
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#44474d] md:text-base">
              Tangible milestones steering Sibsagar University&apos;s research governance, incubation and regional academic work.
            </p>
          </div>

          {view.pages > 1 && (
            <div className="hidden lg:flex items-center gap-4">
              <div className="hidden text-right sm:block">
                <p className="text-xs font-medium text-slate-500">Viewing Milestones</p>
                <p className="text-sm font-semibold text-[#904d00]">
                  {from} – {to} of {list.length}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => scrollPage(-1)} disabled={view.atStart} aria-label="Previous" className={arrow}>
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button onClick={() => scrollPage(1)} disabled={view.atEnd} aria-label="Next" className={arrow}>
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
            </div>
          )}
        </div>

        {cards.length === 0 ? (
          <p className="rounded-xl border border-dashed border-[#c4c6ce] bg-white p-10 text-center text-muted-foreground">
            Figures will be published soon.
          </p>
        ) : (
          <>
            {/* category tabs (only shown when cards have categories) */}
            {categories.length > 2 && (
              <div className="mb-8 flex items-center gap-2 overflow-x-auto pb-1 [scrollbar-none] [&::-webkit-scrollbar]:hidden">
                {categories.map((c) => (
                  <button
                    key={c}
                    onClick={() => setActive(c)}
                    className={cn(
                      "shrink-0 rounded-lg border px-4 py-2 text-xs transition-all",
                      active === c
                        ? "border-amber-600 bg-amber-500 font-semibold text-white shadow-sm"
                        : "border-slate-200 bg-white font-medium text-slate-700 shadow-sm hover:bg-slate-50 hover:text-slate-900"
                    )}
                  >
                    {c === "All" ? `All ${cards.length} Milestones` : c}
                  </button>
                ))}
              </div>
            )}

            {/* slider */}
            <div
              ref={trackRef}
              className="flex snap-x snap-mandatory gap-6 overflow-x-auto py-3 [scrollbar-none] [&::-webkit-scrollbar]:hidden"
            >
              {list.map((c) => {
                const n = cards.indexOf(c) + 1;
                const hi = !!c.highlight;
                return (
                  <article
                    key={c._id}
                    className={cn(
                      "group relative flex w-full shrink-0 snap-start flex-col justify-between rounded-2xl border p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl sm:w-[calc(50%-12px)] lg:w-[calc(32%-18px)]",
                      hi
                        ? "border-amber-300 bg-amber-50/70 hover:border-amber-500 hover:shadow-amber-100/80"
                        : "border-[#c4c6ce] bg-white hover:border-amber-500/80 hover:shadow-slate-200/60"
                    )}
                  >
                    
                    <div className="relative">
                      <div className="mb-4 flex items-center justify-between gap-2">
                        {c.category ? (
                          <span
                            className={cn(
                              "truncate rounded border px-2 py-0.5 font-mono text-[11px] font-semibold tracking-wider uppercase",
                              hi ? "border-amber-300 bg-amber-200/80 text-amber-900" : "border-sky-200 bg-sky-100 text-sky-800"
                            )}
                          >
                            {c.category}
                          </span>
                        ) : (
                          <span />
                        )}
                        <span className="shrink-0 font-mono text-xs text-slate-500">
                          {String(n).padStart(2, "0")}/{String(cards.length).padStart(2, "0")}
                        </span>
                      </div>

                      <p
                        className={cn(
                          "mb-2 text-4xl font-extrabold tracking-tight transition-colors",
                          hi ? "text-amber-600 group-hover:text-amber-700" : "text-[#0d1c2f] group-hover:text-amber-600"
                        )}
                      >
                        {c.value}
                      </p>
                      <h3 className="mb-2 text-base font-semibold text-[#0d1c2f]">{c.label}</h3>
                      <p className="text-xs leading-relaxed text-slate-600">{c.text}</p>
                    </div>

                    {c.footnote && (
                      <div
                        className={cn(
                          "relative mt-6 flex items-center justify-between border-t pt-4 text-[11px] font-medium",
                          hi ? "border-amber-200/60 text-amber-900" : "border-slate-100 text-slate-500"
                        )}
                      >
                        <span>{c.footnote}</span>
                        <span className={cn("font-bold transition-transform group-hover:translate-x-1", hi ? "text-amber-700" : "text-sky-700")}>→</span>
                      </div>
                    )}
                  </article>
                );
              })}
            </div>

            {/* dots */}
            {view.pages > 1 && (
              <div className="mt-6 flex items-center justify-center gap-2">
                {Array.from({ length: view.pages }, (_, i) => (
                  <button
                    key={i}
                    onClick={() => goTo(i)}
                    aria-label={`Go to page ${i + 1}`}
                    className={cn(
                      "h-2 rounded-full transition-all duration-300",
                      i === view.page ? "w-8 bg-amber-400" : "w-2 bg-[#c4c6ce] hover:bg-slate-400"
                    )}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {/* action bar */}
        {/* <div className="mt-12 flex flex-col items-center justify-between gap-6 rounded-2xl border border-[#2e486b] bg-linear-to-br from-[#0b1e36] to-[#0d1c2f] p-6 shadow-[0_10px_25px_-5px_rgba(13,28,47,0.15)] md:flex-row">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-400">
              <BarChart3 className="h-6 w-6" strokeWidth={1.8} />
            </div>
            <div>
              <h4 className="text-base font-semibold text-white">Want to see the activity behind the numbers?</h4>
              <p className="mt-0.5 text-xs text-slate-400">
                Browse events, photos and documents from RDC and IIC activities on the dashboard.
              </p>
            </div>
          </div>
          <Link
            href="/dashboard"
            className="inline-flex w-full shrink-0 items-center justify-center gap-2 rounded-xl bg-linear-to-r from-amber-500 to-amber-600 px-5 py-2.5 text-xs font-bold tracking-wide text-slate-950 shadow-lg shadow-amber-500/20 transition-all hover:from-amber-400 hover:to-amber-500 md:w-auto"
          >
            Open Full Dashboard
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div> */}
      </div>
    </section>
  );
}