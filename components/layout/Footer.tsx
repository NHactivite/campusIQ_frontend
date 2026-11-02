"use client";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { ArrowUp, Info } from "lucide-react";
import { nav } from "@/data/content";
import logo from "@/logo.jpg";

export default function Footer() {
  const pathname = usePathname();
  if (pathname.startsWith("/admin")) return null;

  return (
    <footer className="relative mt-20 overflow-hidden bg-linear-to-br from-[#0b1e36] via-[#0d2b40] to-[#0d1c2f] text-slate-300">
      {/* brand accent line (same as header) */}
      <div className="h-0.5 w-full bg-linear-to-r from-[#0b1e36] via-sky-500 to-amber-500" />

      {/* decorative background */}
      <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full border border-white/10" />
      <div className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full border border-white/10" />
      <div className="pointer-events-none absolute -bottom-32 left-1/4 h-80 w-80 rounded-full bg-amber-500/10 blur-3xl" />
      <div className="pointer-events-none absolute -left-24 top-1/3 h-72 w-72 rounded-full bg-sky-400/10 blur-3xl" />

      <div className="relative w-full px-4 py-14 sm:px-6 lg:px-12">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-[1.4fr_1.2fr_1fr]">
          {/* Brand */}
          <div>
            <Link href="/" className="inline-flex items-center gap-3">
              <span className="rounded-xl bg-white p-1.5 shadow-lg shadow-black/20">
                <Image
                  src={logo}
                  alt="Sibsagar University"
                  width={44}
                  height={44}
                  className="h-11 w-11 object-contain"
                />
              </span>
              <span className="leading-tight">
                <span className="block text-lg font-extrabold tracking-tight text-white">
                  Sibsagar University
                </span>
                <span className="block font-mono text-[10px] font-semibold uppercase tracking-widest text-amber-400">
                  RDC &amp; IIC
                </span>
              </span>
            </Link>

            <p className="mt-5 max-w-sm text-sm leading-relaxed text-slate-400">
              Research Development Cell &amp; Institution&apos;s Innovation
              Council, connecting research, innovation, entrepreneurship and
              incubation with regional needs.
            </p>

            <div className="mt-6 flex items-center gap-2">
              <div className="h-1 w-12 rounded-full bg-amber-400" />
              <div className="h-1 w-5 rounded-full bg-sky-300" />
              <div className="h-1 w-2 rounded-full bg-white/30" />
            </div>
          </div>

          {/* Explore */}
          <div>
            <p className="font-mono text-[11px] font-bold uppercase tracking-widest text-amber-400">
              Explore
            </p>
            <ul className="mt-5 grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
              {nav.map((n) => (
                <li key={n.href}>
                  <Link
                    href={n.href}
                    className="group inline-flex items-center gap-2 text-slate-300 transition-colors hover:text-white"
                  >
                    <span className="h-px w-3 bg-white/20 transition-all duration-300 group-hover:w-5 group-hover:bg-amber-400" />
                    {n.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Note */}
          <div className="md:col-span-2 lg:col-span-1">
            <p className="font-mono text-[11px] font-bold uppercase tracking-widest text-amber-400">
              Note
            </p>
            <div className="mt-5 flex gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur">
              <Info className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
              <p className="text-xs leading-relaxed text-slate-400">
                Content is based on the Peer Team Visit report and the RDC/IIC
                brief report (Aug 2025 – Aug 2026). Verify all figures and
                statuses before public release.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* bottom bar */}
      <div className="relative border-t border-white/10">
        <div className="flex w-full flex-col items-center justify-between gap-3 px-4 py-5 text-xs text-slate-500 sm:flex-row sm:px-6 lg:px-12">
          <p>© {new Date().getFullYear()} Sibsagar University. All rights reserved.</p>

          <a
            href="#top"
            className="group inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 font-semibold text-slate-300 transition-all hover:border-amber-400/50 hover:bg-amber-500/10 hover:text-amber-300"
          >
            Back to top
            <ArrowUp className="h-3.5 w-3.5 transition-transform group-hover:-translate-y-0.5" />
          </a>
        </div>
      </div>
    </footer>
  );
}