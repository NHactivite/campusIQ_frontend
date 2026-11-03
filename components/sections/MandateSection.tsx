import Link from "next/link";
import {
  Compass,
  Rocket,
  FlaskConical,
  Download,
  ArrowRight,
} from "lucide-react";

// TODO: set this to the approved charter PDF (e.g. a Cloudinary link). The "Download Charter" button stays hidden until it is set.
const CHARTER_URL = "";

// Full class strings per tone, so Tailwind can detect them
const tones = {
  sky: {
    label: "text-sky-700",
    icon: "border-sky-200 bg-sky-100 text-sky-700 group-hover:bg-sky-200/80",
    title: "group-hover:text-sky-700",
    tag: "border-sky-200 bg-sky-50 text-sky-800 hover:border-sky-400",
    corner: "bg-sky-100/40 group-hover:bg-sky-200/40",
    card: "border-[#c4c6ce] bg-white hover:border-sky-400 hover:shadow-slate-200/60",
  },
  darkSky: {
    label: "text-slate-700",
    icon: "border-sky-300 bg-sky-200/70 text-sky-700 group-hover:bg-sky-200",
    title: "group-hover:text-sky-700",
    tag: "border-sky-300 bg-sky-100/70 text-sky-900 hover:border-sky-500",
    corner: "bg-sky-200/30 group-hover:bg-sky-300/30",
    card: "border-sky-300 bg-sky-50/70 hover:border-sky-500 hover:shadow-sky-100/80",
  },
  indigo: {
    label: "text-indigo-700",
    icon: "border-indigo-200 bg-indigo-100 text-indigo-700 group-hover:bg-indigo-200/80",
    title: "group-hover:text-indigo-700",
    tag: "border-indigo-200 bg-indigo-50 text-indigo-800 hover:border-indigo-400",
    corner: "bg-indigo-100/40 group-hover:bg-indigo-200/40",
    card: "border-[#c4c6ce] bg-white hover:border-indigo-400 hover:shadow-slate-200/60",
  },
} as const;

const pillars = [
  {
    tone: "sky",
    label: "Pillar 01 // Strategic Horizon",
    title: "Vision",
    icon: Compass,
    text: "To foster a vibrant culture of research, innovation and entrepreneurship that connects knowledge with regional needs, sustainable development and societal impact.",
    tags: ["Regional Impact", "Sustainable Tech", "Societal Value"],
  },
  {
    tone: "darkSky",
    label: "Pillar 02 // Core Objective",
    title: "Mission",
    icon: Rocket,
    featured: true,
    text: "To strengthen research capacity, promote interdisciplinary and applied research, enable experiential and skill-based learning, nurture innovation and entrepreneurship, and create pathways from ideas and prototypes to incubation and impact.",
    tags: ["Applied Research", "Experiential Learning", "Prototype to Market"],
  },
  {
    tone: "indigo",
    label: "Pillar 03 // Execution Framework",
    title: "Core Approach",
    icon: FlaskConical,
    text: "Research, experiential learning, innovation, IPR, entrepreneurship, incubation, industry–academia linkages and Indian Knowledge Systems (IKS).",
    tags: ["NEP 2020 Aligned", "IPR & Patenting", "Industry MoUs"],
  },
] as const;

// same grid as the Glance slider
// const gridPattern = {
//   backgroundImage:
//     "linear-gradient(to right, rgba(13,28,47,0.04) 1px, transparent 1px), linear-gradient(rgba(13,28,47,0.04) 1px, transparent 1px)",
//   backgroundSize: "40px 40px",
// };

export default function MandateSection() {
  return (
    <section
      id="vision"
      className="relative scroll-mt-4 overflow-hidden  px-4 py-5 text-[#0d1c2f] selection:bg-amber-500/30 selection:text-amber-900 sm:px-6 lg:px-8 lg:py-8"
    >
      <div className="relative mx-auto ">
        {/* header */}
        <header className="mb-8 max-w-3xl mt-10 lg:mb-8">
          <h2 className="text-4xl leading-[1.12] font-extrabold tracking-tight text-[#0d1c2f] sm:text-5xl lg:text-5xl">
            Why{" "}
            <span className="bg-linear-to-r from-blue-600 via-sky-500 to-indigo-500 bg-clip-text text-transparent">
              Sibsagar
            </span>{" "}
            University{" "}
            <span className="bg-linear-to-r from-amber-600 via-amber-500 to-orange-500 bg-clip-text text-transparent">
              Matters
            </span>
          </h2>

          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-[#44474d] sm:text-xl">
            One university ecosystem, two engines:{" "}
            <span className="font-semibold text-[#0d1c2f]">
              research capacity
            </span>{" "}
            and{" "}
            <span className="font-semibold text-[#0d1c2f]">
              innovation culture
            </span>
            .
          </p>

          <div className="flex items-center mt-2 gap-3">
            <div className="h-1 w-12 rounded-full bg-blue-500" />
            <div className="h-1 w-5 rounded-full bg-amber-400" />
            <div className="h-1 w-2 rounded-full bg-slate-300" />
          </div>
        </header>

        {/* three pillars */}
        <div className="mb-14 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 lg:gap-2">
          {pillars.map((p) => {
            const t = tones[p.tone];
            const Icon = p.icon;
            return (
              <article
                key={p.title}
                className={`group relative flex flex-col justify-between overflow-hidden rounded-2xl  p-7 shadow-md transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl lg:p-8 ${t.card} ${
                  p.title === "Core Approach"
                    ? "md:col-span-2 lg:col-span-1"
                    : ""
                }`}
              >
                {/* corner accent */}
                <div className="relative">
                  <div className="flex items-center justify-between gap-4">
                    <div className="inline-flex flex-wrap items-center gap-1.5">
                      <span
                        className={`font-mono text-[11px] font-bold tracking-widest uppercase ${t.label}`}
                      >
                        {p.label}
                      </span>
                      {"featured" in p && p.featured && (
                        <span className="rounded border border-amber-300 bg-amber-200/80 px-1.5 py-0.5 text-[10px] font-bold tracking-wider text-amber-900 uppercase">
                          Core Hub
                        </span>
                      )}
                    </div>
                    <div
                      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border transition-all group-hover:scale-105 ${t.icon}`}
                    >
                      <Icon className="h-5 w-5" strokeWidth={1.8} />
                    </div>
                  </div>
                  <h3
                    className={`mb-4 text-2xl font-bold tracking-tight text-[#0d1c2f] transition-colors ${t.title}`}
                  >
                    {p.title}
                  </h3>
                  <p className="text-sm leading-relaxed text-slate-600 sm:text-base">
                    {p.text}
                  </p>
                </div>

                <div className="relative  border-t border-slate-100 pt-6">
                  <p className="mb-2.5 text-[11px] font-semibold tracking-wider text-slate-500 uppercase">
                    Key Thrust Areas
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {p.tags.map((tag) => (
                      <span
                        key={tag}
                        className={`rounded-md border px-2.5 py-1 text-xs font-medium transition-colors ${t.tag}`}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        {/* ribbon (navy, like the Glance action bar) */}
        {/* <div className="flex flex-col items-center justify-between gap-6 rounded-2xl border border-[#2e486b] bg-linear-to-br from-[#0b1e36] to-[#0d1c2f] p-6 shadow-[0_10px_25px_-5px_rgba(13,28,47,0.15)] lg:flex-row lg:p-7">
          <div className="flex w-full items-center gap-4 lg:w-auto">
            <div className="flex -space-x-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-blue-400/40 bg-blue-600/30 text-xs font-bold text-blue-300 ring-2 ring-[#0b1e36]">
                RDC
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-amber-400/40 bg-amber-500/30 text-xs font-bold text-amber-300 ring-2 ring-[#0b1e36]">
                IIC
              </div>
            </div>
            <div>
              <p className="text-sm font-semibold tracking-wide text-white">
                Research Development Cell <span className="mx-1 text-slate-400">×</span> Institution&apos;s Innovation Council
              </p>
              <p className="text-xs text-slate-400">
                Dual institutional catalyst for research capacity and innovation culture at Sibsagar University.
              </p>
            </div>
          </div>

          <div className="flex w-full flex-wrap items-center justify-start gap-3 lg:w-auto lg:justify-end">
            {CHARTER_URL && (
              <a
                href={CHARTER_URL}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-xs font-semibold text-slate-200 transition-colors hover:bg-white/10"
              >
                <Download className="h-4 w-4 text-slate-400" />
                Download Charter
              </a>
            )}
            <Link
              href="/#pathway"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-linear-to-r from-amber-500 to-amber-600 px-4 py-2.5 text-xs font-bold text-slate-950 shadow-lg shadow-amber-500/20 transition-all hover:from-amber-400 hover:to-amber-500"
            >
              Explore Strategic Roadmap
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div> */}
      </div>
    </section>
  );
}
