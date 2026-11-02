"use client";
import { useCallback, useEffect, useRef } from "react";
import { pathway } from "@/data/content";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setActiveStage } from "@/store/slices/pathwaySlice";

const HEADER = 80; // px: height of your sticky site header. Adjust if it is taller or shorter.
const N = pathway.length;

const KEYWORDS: string[][] = [
  ["Seed Grants", "RDC Support", "Expert Talks"],
  ["Design Thinking", "Hackathons", "IIC"],
  ["Mentoring", "Prototyping", "Pre-Incubation"],
  ["IP Awareness", "Protection", "IPR Cell"],
  ["Mentoring", "Prototype Development"],
  ["SUCIIE", "Startup Support", "Incubation"],
  ["Start-ups", "Regional Impact", "Sustainable Development"],
];

const PANEL_BG = [
  "from-[#0d2b40] via-[#124d6a] to-[#1d6387]",
  "from-[#12334a] via-[#17658d] to-[#15766d]",
];

const clamp = (v: number, min = 0, max = 1) => Math.min(max, Math.max(min, v));
const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);

/**
 * p = scroll position in "stages" (0 … N-1).
 * Layer i flies in while p goes from i-1 to i.
 * After that it moves to the back (blurred) and stays visible only while it
 * is the layer directly behind the current one. Older layers fade out fully.
 */
function layer(i: number, p: number, startTilt: number, restTilt: number) {
  const enter = i === 0 ? 1 : clamp(p - (i - 1));
  const e = easeOut(enter);

  // 0 = on top, 1 = one behind, 2+ = older
  const buried = Math.max(0, p - i);

  // 1 while buried <= 1, fades to 0 as buried goes 1 -> 2
  const backVisibility = 1 - clamp(buried - 1);
  // 0 -> 1 while the layer moves to the back
  const behindAmount = Math.min(buried, 1);

  const opacity =
    Math.min(1, enter * 6) * (1 - behindAmount * 0.55) * backVisibility;

  return {
    transform: `translate3d(0, ${(1 - e) * 115}%, 0) translateY(${
      -behindAmount * 22
    }px) rotate(${restTilt + (1 - e) * startTilt}deg) scale(${
      1 - behindAmount * 0.05
    })`,
    opacity: String(opacity),
    filter: behindAmount > 0 ? `blur(${behindAmount * 4}px)` : "none",
    pointerEvents: buried > 0.5 ? ("none" as const) : ("auto" as const),
  };
}

const cardTilt = (i: number) => ({ start: i % 2 ? 5 : -5, rest: i % 2 ? 0.7 : -0.7 });
const panelTilt = (i: number) => ({ start: i % 2 ? -10 : 10, rest: i % 2 ? 5 : -5 });

export default function PathwayStepper() {
  const active = useAppSelector((s) => s.pathway.activeStage);
  const dispatch = useAppDispatch();

  const wrapRef = useRef<HTMLDivElement>(null);
  const stickyRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const panelRefs = useRef<(HTMLDivElement | null)[]>([]);
  const lastActive = useRef(0);
  const raf = useRef(0);
  const step = useRef(1);

  const update = useCallback(() => {
    raf.current = 0;
    const wrap = wrapRef.current;
    const sticky = stickyRef.current;
    if (!wrap || !sticky) return;

    const scrollable = wrap.offsetHeight - sticky.offsetHeight;
    if (scrollable <= 0) return;
    step.current = scrollable / (N - 1);

    const top = wrap.getBoundingClientRect().top;
    const p = clamp((HEADER - top) / step.current, 0, N - 1);

    for (let i = 0; i < N; i++) {
      const c = cardRefs.current[i];
      const pn = panelRefs.current[i];
      if (c) {
        const s = layer(i, p, cardTilt(i).start, cardTilt(i).rest);
        c.style.transform = s.transform;
        c.style.opacity = s.opacity;
        c.style.filter = s.filter;
        c.style.pointerEvents = s.pointerEvents;
      }
      if (pn) {
        const s = layer(i, p, panelTilt(i).start, panelTilt(i).rest);
        pn.style.transform = s.transform;
        pn.style.opacity = s.opacity;
        pn.style.filter = s.filter;
        pn.style.pointerEvents = s.pointerEvents;
      }
    }

    const idx = Math.round(p);
    if (idx !== lastActive.current) {
      lastActive.current = idx;
      dispatch(setActiveStage(idx));
    }
  }, [dispatch]);

  useEffect(() => {
    const onScroll = () => {
      if (!raf.current) raf.current = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      cancelAnimationFrame(raf.current);
    };
  }, [update]);

  // jump to a stage from the number rail
  const goTo = (i: number) => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    const y = window.scrollY + wrap.getBoundingClientRect().top - HEADER + i * step.current + 2;
    window.scrollTo({ top: y, behavior: "smooth" });
  };

  // initial (p = 0) styles, so there is no flash before the first scroll event
  const init = (i: number, kind: "card" | "panel") => {
    const t = kind === "card" ? cardTilt(i) : panelTilt(i);
    const s = layer(i, 0, t.start, t.rest);
    return {
      transform: s.transform,
      opacity: Number(s.opacity),
      filter: s.filter,
      pointerEvents: s.pointerEvents,
      zIndex: i,
    };
  };

  return (
    <div
      ref={wrapRef}
      // sticky stage height + (N-1) scroll steps of 70vh each
      style={{ height: `calc(100svh - ${HEADER}px + ${(N - 1) * 70}svh)` }}
      aria-label="Research to impact pathway. Scroll to move through the stages."
    >
      <div
        ref={stickyRef}
        className="sticky flex flex-col gap-4 py-4"
        style={{ top: HEADER, height: `calc(100svh - ${HEADER}px)` }}
      >
        {/* number rail */}
        <div role="tablist" aria-label="Pathway stages" className="flex shrink-0 flex-wrap items-center gap-2 ">
          {pathway.map((p, i) => (
            <button
              key={p.name}
              role="tab"
              aria-selected={i === active}
              onClick={() => goTo(i)}
              className={`flex items-center gap-2 mb-10 rounded-full border px-1.5 sm:px-3 py-1.5 text-xs font-semibold transition-colors  ${
                i === active
                  ? "border-primary bg-primary text-white"
                  : "bg-white text-foreground/70 hover:bg-muted"
              }`}
            >
              <span>{String(i + 1).padStart(2, "0")}</span>
              <span className="hidden sm:inline">{p.name}</span>
            </button>
          ))}
        </div>

        <div className="grid min-h-0 flex-1 content-center gap-12 lg:grid-cols-2 lg:gap-12">
          {/* left: stacking cards */}
          <div className="relative h-[46svh] min-h-72.5 lg:mx-auto lg:h-110 lg:w-full lg:max-w-xl">
            {pathway.map((p, i) => (
              <div
                key={p.name}
                ref={(el) => {
                  cardRefs.current[i] = el;
                }}
                aria-hidden={i !== active}
                className="absolute inset-0 flex flex-col justify-between overflow-hidden rounded-[2rem] border border-white bg-white p-6 shadow-[0_30px_60px_-20px_rgba(13,28,47,0.28)] will-change-[transform,opacity,filter] md:p-9"
                style={init(i, "card")}
              >
                <div>
                  <p className="text-xs font-bold tracking-widest  uppercase">
                    Stage {String(i + 1).padStart(2, "0")} of {String(N).padStart(2, "0")}
                  </p>
                  <h3 className="mt-3 text-3xl font-extrabold tracking-tight text-primary md:text-5xl">
                    {String(i + 1).padStart(2, "0")}. {p.name}
                  </h3>
                  <p className="mt-4 text-sm leading-relaxed text-muted-foreground md:text-lg md:leading-8">{p.text}</p>
                </div>

                <div className="flex flex-wrap gap-2">
                  {KEYWORDS[i]?.map((k) => (
                    <span key={k} className="rounded-full bg-muted px-3 py-1.5 text-xs font-medium">
                      {k}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* right: tilted panels */}
          <div className="relative h-[30svh] min-h-40 lg:mx-auto lg:h-110 lg:w-full lg:max-w-md">
            {pathway.map((p, i) => (
              <div
                key={p.name}
                ref={(el) => {
                  panelRefs.current[i] = el;
                }}
                aria-hidden="true"
                className={`absolute inset-0 overflow-hidden rounded-[2rem] bg-linear-to-br p-6 text-white shadow-[0_30px_60px_-20px_rgba(13,28,47,0.45)] will-change-[transform,opacity,filter] md:p-9 ${PANEL_BG[i % 2]}`}
                style={init(i, "panel")}
              >
                <div className="pointer-events-none absolute -top-16 -right-16 h-52 w-52 rounded-full border border-white/10" />
                <div className="pointer-events-none absolute -top-8 -right-8 h-36 w-36 rounded-full border border-white/10" />
                <span className="pointer-events-none absolute -right-2 -bottom-6 text-[110px] leading-none font-black text-white/10 select-none lg:-bottom-10 lg:text-[220px]">
                  {String(i + 1).padStart(2, "0")}
                </span>

                <div className="relative flex h-full flex-col gap-5 lg:gap-20 ">
                  <span className="w-fit rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium">
                    Research → Impact
                  </span>
                  <div>
                    <p className="text-xl font-extrabold tracking-tight md:text-4xl">{p.name}</p>
                    <div className="mt-4 max-w-xs lg:block">
                      <div className="mb-2 flex justify-between text-xs text-white/60">
                        <span>Innovation journey</span>
                        <span>{Math.round(((i + 1) / N) * 100)}%</span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-white/15">
                        <div className="h-full rounded-full bg-gold" style={{ width: `${((i + 1) / N) * 100}%` }} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}