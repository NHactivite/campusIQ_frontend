import { Network, type LucideIcon } from "lucide-react";

export type Offering = {
  icon: LucideIcon;
  title: string;
  text: string;
  tags?: string[];
};

// Full class strings per accent, so Tailwind can detect them
const accents = {
  navy: {
    bar: "bg-linear-to-r from-[#0b1e36] to-[#d5e3fd]",
    icon: "group-hover:bg-[#0b1e36] group-hover:text-white",
  },
  amber: {
    bar: "bg-linear-to-r from-[#904d00] to-[#fe932c]",
    icon: "group-hover:bg-[#904d00] group-hover:text-white",
  },
} as const;
type Props = {
  items: Offering[];
  id?: string;
  title?: string; // plain part of the heading
  accent?: string; // italic gold part of the heading
  subtitle?: string;
  pillLabel?: string; // text under "N Integrated"
};

export default function RdcOfferings({
  items,
  id ,
  title = "Everything a researcher or",
  accent = "founder needs",
  subtitle = "What the Research Development Cell offers.",
  pillLabel = "Institutional Support Pillars",
}: Props) {
  return (
    <section
      id={id}
      className="relative w-full scroll-mt-24 overflow-hidden px-4 py-3 lg:px-12 mt-16"
    >
      {/* ambient glows */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 overflow-hidden select-none"
      >
        <div className="absolute -bottom-24 left-1/3 h-100 w-150 rounded-full bg-[#d5e3fd]/70 blur-[100px]" />
      </div>

      <div className="relative mx-auto flex w-full flex-col gap-2">
        {/* header */}
        <div className="flex flex-col justify-between gap-6 pb-2 md:flex-row md:items-end">
          <div className="flex max-w-2xl flex-col gap-3">
            <h2 className="flex flex-wrap items-center gap-x-3 text-3xl font-bold tracking-tight lg:text-4xl">
              <span className="text-[#0d1c2f]">{title}</span>
              <span className="bg-linear-to-r from-amber-600 via-amber-500 to-amber-600 bg-clip-text font-serif font-normal text-transparent italic">
                {accent}
              </span>
            </h2>
            <p className="text-lg leading-7 text-[#44474d]">{subtitle}</p>
          </div>

          {/* snapshot pill */}
          <div className="flex items-center gap-4 self-start rounded-2xl bg-white p-3.5 px-5 shadow-sm md:self-auto">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#e6eeff] text-[#0b1e36]">
              <Network className="h-6 w-6" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-[#0b1e36]">
                  {items.length} Integrated
                </span>
                <span className="rounded bg-[#e6eeff] px-1.5 py-0.5 font-mono text-[11px] font-semibold text-[#44474d]">
                  2025–26
                </span>
              </div>
              <span className="text-[13px] text-[#44474d]">
               {pillLabel}
              </span>
            </div>
          </div>
        </div>

        {/* cards */}
        <div className="grid grid-cols-1 px-1 lg:px-16  py-5 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {items.map(({ icon: Icon, title, text, tags }, i) => {
            const a = accents[i % 3 === 1 ? "amber" : "navy"];
            return (
              <article
                key={title}
                className="group relative flex flex-col justify-between overflow-hidden rounded-2xl bg-white p-3.5 shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl"
              >
                <div
                  className={`absolute top-0 right-0 left-0 h-1 opacity-0 transition-opacity duration-300 group-hover:opacity-100 ${a.bar}`}
                />

                <div>
                  <div className="mb-1 flex items-center justify-between">
                    <Icon className="h-4 w-4" />

                    <span className="font-mono text-[11px] font-semibold tracking-wider text-gold uppercase">
                      Pillar {String(i + 1).padStart(2, "0")}
                    </span>
                  </div>

                  <h3 className="mb-3 text-xl leading-8 font-bold tracking-tight text-[#0d1c2f] transition-colors group-hover:text-[#0b1e36]">
                    {title}
                  </h3>
                  <p className="mb-6 text-[15px] leading-6 text-[#44474d]">
                    {text}
                  </p>
                </div>

                {tags && tags.length > 0 && (
                  <div className="flex flex-wrap items-center gap-2">
                    {tags.map((t) => (
                      <span
                        key={t}
                        className="rounded-full bg-[#eff4ff] px-3 py-1 text-[13px] font-semibold text-[#0d1c2f]"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                )}
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
