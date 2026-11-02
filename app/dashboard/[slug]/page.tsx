import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Building2,
  CalendarDays,
  Download,
  ExternalLink,
  FileText,
  ImageIcon,
  MapPin,
  Play,
  Sparkles,
  Users,
} from "lucide-react";

import { getEvent } from "@/lib/api";

const fmt = (d: string) =>
  new Date(d).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

const size = (b?: number) =>
  b ? (b > 1e6 ? `${(b / 1e6).toFixed(1)} MB` : `${Math.round(b / 1e3)} KB`) : "";

// Reusable section heading
function Eyebrow({
  children,
  icon: Icon,
}: {
  children: React.ReactNode;
  icon?: typeof Sparkles;
}) {
  return (
    <p className="flex items-center gap-2 font-mono text-[11px] font-bold uppercase tracking-widest text-amber-600">
      {Icon && <Icon className="h-4 w-4" />}
      {children}
    </p>
  );
}

export default async function EventPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const e = await getEvent(slug);
  if (!e) notFound();

  const meta = [
    {
      icon: CalendarDays,
      label: "Date",
      text: e.endDate ? `${fmt(e.eventDate)} – ${fmt(e.endDate)}` : fmt(e.eventDate),
    },
    e.venue && { icon: MapPin, label: "Venue", text: e.venue },
    e.organiser && { icon: Building2, label: "Organised by", text: e.organiser },
    e.participants && {
      icon: Users,
      label: "Participants",
      text: `${e.participants} participants`,
    },
  ].filter(Boolean) as { icon: typeof Users; label: string; text: string }[];

  return (
    <main className="min-h-screen bg-linear-to-br from-white via-[#f4f7f9] to-[#e3eef4] text-[#0d1c2f]">
      {/* ================= HERO ================= */}
      <section className="relative overflow-hidden bg-linear-to-br from-[#0b1e36] via-[#0d2b40] to-[#1d6387] text-white">
        {e.coverImage && (
          <div className="absolute inset-0">
            <Image
              src={e.coverImage}
              alt=""
              fill
              priority
              sizes="100vw"
              className="object-cover opacity-20 mix-blend-luminosity"
            />
            <div className="absolute inset-0 bg-linear-to-r from-[#0b1e36] via-[#0b1e36]/80 to-transparent" />
          </div>
        )}

        {/* Decorative rings (same as PathwayStepper) */}
        <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full border border-white/10" />
        <div className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full border border-white/10" />
        <div className="pointer-events-none absolute -bottom-32 left-1/4 h-80 w-80 rounded-full bg-amber-500/10 blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-6 pb-36 pt-8 lg:px-8">
          <Link
            href="/dashboard"
            className="group mb-6 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-semibold text-white/80 backdrop-blur transition-all hover:bg-white/20 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
            Back to events
          </Link>

          <div className="max-w-4xl">
            <span className="mb-2 inline-flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-400/10 px-4 py-1.5 font-mono text-[11px] font-bold uppercase tracking-widest text-amber-300">
              <Sparkles className="h-3.5 w-3.5" />
              {e.category}
            </span>

            <h1 className="text-4xl font-extrabold leading-[1.08] tracking-tight sm:text-5xl lg:text-4xl">
              {e.title}
            </h1>

            <p className="mt-6 max-w-3xl text-base leading-relaxed text-white/75 sm:text-lg">
              {e.description.length > 240
                ? `${e.description.slice(0, 240)}…`
                : e.description}
            </p>
             <p className="relative whitespace-pre-line text-sm font-medium leading-7 ">
                <span className="text-amber-400 pr-2">Key-OutComes: </span> {e.outcome}
              </p>
            

            <div className="mt-8 flex items-center gap-2">
              <div className="h-1 w-12 rounded-full bg-amber-400" />
              <div className="h-1 w-5 rounded-full bg-sky-300" />
              <div className="h-1 w-2 rounded-full bg-white/40" />
            </div>
          </div>
        </div>
      </section>

      {/* ================= META BAR (overlaps hero) ================= */}
      <section className="relative z-10 mx-auto -mt-20 max-w-7xl px-6 lg:px-8">
        <div className="grid gap-px overflow-hidden rounded-2xl border border-slate-200 bg-slate-200 shadow-xl shadow-slate-300/30 sm:grid-cols-2 lg:grid-cols-4">
          {meta.map(({ icon: Icon, label, text }) => (
            <div
              key={`${label}-${text}`}
              className="group flex items-start gap-3.5 bg-white p-5 transition-colors hover:bg-amber-50/50"
            >
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-sky-200 bg-sky-100 text-sky-700 transition-all group-hover:scale-105 group-hover:border-amber-300 group-hover:bg-amber-100 group-hover:text-amber-700">
                <Icon className="h-5 w-5" strokeWidth={1.8} />
              </div>
              <div className="min-w-0">
                <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  {label}
                </p>
                <p className="mt-1 text-sm font-semibold leading-snug text-[#0d1c2f]">
                  {text}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>


      {/* ================= GALLERY ================= */}
      {e.images.length > 0 && (
        <section className="mx-auto px-6 pt-20 lg:px-8">
          <div className="mb-8 flex flex-wrap items-end justify-between gap-4 border-b border-[#d5e3fd] pb-6">
            <div>
              <Eyebrow icon={ImageIcon}>Event gallery</Eyebrow>
              <h2 className="mt-2 text-3xl font-bold tracking-tight lg:text-4xl">
                Moments{" "}
                <span className="bg-linear-to-r from-amber-600 via-amber-500 to-amber-600 bg-clip-text font-serif font-normal italic text-transparent">
                  from the event
                </span>
              </h2>
            </div>
            <span className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-500">
              {e.images.length} {e.images.length === 1 ? "photo" : "photos"}
            </span>
          </div>

          <div className="grid auto-rows-55 grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-6">
            {e.images.map((m, index) => (
              <a
                key={m._id}
                href={m.url}
                target="_blank"
                rel="noreferrer"
                className={`group relative overflow-hidden rounded-3xl border border-slate-200 bg-slate-100 shadow-sm transition-all duration-500 hover:-translate-y-1 hover:shadow-xl ${
                  index === 0 ? "sm:col-span-2 sm:row-span-2" : ""
                }`}
              >
                <Image
                  src={m.url}
                  alt={m.originalName ?? e.title}
                  fill
                  sizes={
                    index === 0
                      ? "(min-width:1024px) 66vw, 100vw"
                      : "(min-width:1024px) 33vw, 100vw"
                  }
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-linear-to-t from-[#0b1e36]/80 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                <div className="absolute inset-x-5 bottom-5 flex translate-y-3 items-center justify-between opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                  <span className="max-w-[80%] truncate text-sm font-semibold text-white">
                    {m.originalName ?? "View photo"}
                  </span>
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-amber-500 text-white">
                    <ArrowUpRight className="h-4 w-4" />
                  </span>
                </div>
              </a>
            ))}
          </div>
        </section>
      )}

      {/* ================= VIDEOS ================= */}
      {e.videos.length > 0 && (
        <section className="mx-auto mt-20 px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-3xl p-8 sm:p-12">
            <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full border border-white/10" />
            <div className="pointer-events-none absolute -bottom-24 -left-16 h-72 w-72 rounded-full bg-amber-500/10 blur-3xl" />

            <div className="relative mb-8 flex items-center gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-xl border border-amber-400/30 bg-amber-400/10 text-amber-300">
                <Play className="h-5 w-5 fill-current" />
              </div>
              <div>
                <p className="font-mono text-[11px] font-bold uppercase tracking-widest text-amber-600">
                  Media
                </p>
                <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
                  Event videos
                </h2>
              </div>
            </div>

            <div className="relative grid gap-6 md:grid-cols-4  p-3">
              {e.videos.map((m) => (
                <div
                  key={m._id}
                  className="overflow-hidden rounded-2xl border border-white/10 bg-white/5 transition hover:border-amber-400/40"
                >
                  <video
                    controls
                    preload="metadata"
                    src={m.url}
                    className="aspect-video w-full bg-black object-cover"
                  />
                  <div className="flex items-center justify-between gap-3 px-5 py-4">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">
                        {m.originalName ?? "Event video"}
                      </p>
                      {m.format && (
                        <p className="mt-0.5 text-xs font-semibold uppercase tracking-wider ">
                          {m.format}
                        </p>
                      )}
                    </div>
                    <a
                      href={m.url}
                      target="_blank"
                      rel="noreferrer"
                      title="Open video"
                      className="grid h-10 w-10 shrink-0 place-items-center rounded-full  transition hover:bg-amber-500"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ================= DOCUMENTS ================= */}
      {e.documents.length > 0 && (
        <section className="mx-auto max-w-7xl px-6 pt-20 lg:px-8">
          <div className="mb-8 border-b border-[#d5e3fd] pb-6">
            <Eyebrow icon={FileText}>Resources</Eyebrow>
            <h2 className="mt-2 text-3xl font-bold tracking-tight lg:text-4xl">
              Documents &amp; resources
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              Download supporting documents related to this event.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {e.documents.map((m) => (
              <a
                key={m._id}
                href={m.url}
                target="_blank"
                rel="noreferrer"
                className="group flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-amber-400/60 hover:shadow-xl"
              >
                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl border border-sky-200 bg-sky-100 text-sky-700 transition group-hover:border-amber-300 group-hover:bg-amber-100 group-hover:text-amber-700">
                  <FileText className="h-6 w-6" strokeWidth={1.8} />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold transition group-hover:text-amber-700">
                    {m.originalName ?? "Event document"}
                  </p>
                  <div className="mt-1 flex items-center gap-2 text-xs font-semibold text-slate-400">
                    <span className="uppercase">{m.format ?? "FILE"}</span>
                    {size(m.bytes) && (
                      <>
                        <span>•</span>
                        <span>{size(m.bytes)}</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-slate-100 text-slate-600 transition group-hover:bg-amber-500 group-hover:text-white">
                  <Download className="h-4 w-4" />
                </div>
              </a>
            ))}
          </div>
        </section>
      )}

      {/* ================= CTA ================= */}
      <section className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
        <div className="relative flex flex-col items-center justify-between gap-6 overflow-hidden rounded-2xl border border-[#2e486b] bg-linear-to-br from-[#0b1e36] to-[#0d1c2f] p-8 shadow-[0_10px_25px_-5px_rgba(13,28,47,0.15)] md:flex-row">
          <div className="flex items-center gap-4">
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-400">
              <CalendarDays className="h-6 w-6" strokeWidth={1.8} />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">
                Discover more events
              </h2>
              <p className="mt-0.5 text-sm text-slate-400">
                Explore workshops, programmes and activities hosted across the
                University.
              </p>
            </div>
          </div>

          <Link
            href="/dashboard"
            className="inline-flex w-full shrink-0 items-center justify-center gap-2 rounded-xl bg-linear-to-r from-amber-500 to-amber-600 px-5 py-3 text-xs font-bold tracking-wide text-slate-950 shadow-lg shadow-amber-500/20 transition-all hover:from-amber-400 hover:to-amber-500 md:w-auto"
          >
            Browse all events
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </main>
  );
}