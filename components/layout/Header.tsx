"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Menu, X, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { nav } from "@/data/content";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { toggleMobileMenu, setMobileMenu } from "@/store/slices/uiSlice";
import AuthButtons from "./AuthButtons";
import logo from "@/logo.jpg";

export default function Header() {
  const pathname = usePathname();
  const open = useAppSelector((s) => s.ui.mobileMenuOpen);
  const dispatch = useAppDispatch();
  const [scrolled, setScrolled] = useState(false);

  // shadow + tighter height once the page is scrolled
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // close the mobile menu after navigating
  useEffect(() => {
    dispatch(setMobileMenu(false));
  }, [pathname, dispatch]);

  if (pathname.startsWith("/admin")) return null;

  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    <header
      className={cn(
        "sticky top-0 z-40 w-full border-b transition-all duration-300",
        scrolled
          ? "border-slate-200 bg-white/90 shadow-[0_8px_24px_-12px_rgba(11,30,54,0.18)] backdrop-blur-xl"
          : "border-transparent bg-white/70 backdrop-blur-md"
      )}
    >
      {/* thin brand accent line */}
      <div className="h-0.5 w-full bg-linear-to-r from-[#0b1e36] via-sky-500 to-amber-500" />

      <div
        className={cn(
          "flex w-full items-center justify-between gap-6 px-4 transition-all duration-300 sm:px-6 lg:px-12",
          scrolled ? "py-2" : "py-3"
        )}
      >
        {/* Brand */}
        <Link href="/" className="group flex items-center gap-3" onClick={() => dispatch(setMobileMenu(false))}>
          <span className="rounded-xl border border-slate-200 bg-white p-1 shadow-sm transition-all group-hover:border-amber-400 group-hover:shadow-md">
            <Image
              src={logo}
              alt="Sibsagar University"
              width={44}
              height={44}
              priority
              className={cn("object-contain transition-all duration-300", scrolled ? "h-9 w-9" : "h-11 w-11")}
            />
          </span>
          <span className="leading-tight">
            {/* <span className="block text-base font-extrabold tracking-tight text-[#0b1e36]">
              RDC{" "}
              <span className="bg-linear-to-r from-amber-600 to-amber-500 bg-clip-text text-transparent">&amp; IIC</span>
            </span> */}
            <span className="block font-mono text-[10px] font-semibold uppercase tracking-widest text-slate-500">
              Sibsagar University
            </span>
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-1 xl:flex" aria-label="Main">
          {nav.map((n) => {
            const active = isActive(n.href);
            return (
              <Link
                key={n.href}
                href={n.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "group relative rounded-lg px-3 py-2 text-sm font-semibold transition-colors",
                  active ? "text-[#0b1e36]" : "text-slate-600 hover:text-[#0b1e36]"
                )}
              >
                {n.label}
                {/* animated underline */}
                <span
                  className={cn(
                    "absolute inset-x-3 -bottom-0.5 h-0.5 origin-left rounded-full bg-linear-to-r from-amber-500 to-amber-400 transition-transform duration-300",
                    active ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"
                  )}
                />
              </Link>
            );
          })}
        </nav>

        {/* Right side: auth (desktop) + mobile toggle */}
        <div className="flex items-center gap-3">
          <div className="hidden xl:block">
            <AuthButtons />
          </div>

          <button
            type="button"
            onClick={() => dispatch(toggleMobileMenu())}
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            className="grid h-11 w-11 place-items-center rounded-xl border border-slate-200 bg-white text-[#0b1e36] shadow-sm transition-all hover:border-amber-400 hover:text-amber-600 xl:hidden"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu (animated height) */}
      <div
        className={cn(
          "grid transition-all duration-300 ease-out xl:hidden",
          open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        )}
      >
        <div className="overflow-hidden">
          <nav className="border-t border-slate-100 bg-white/95 px-4 py-3 sm:px-6" aria-label="Mobile">
            {nav.map((n) => {
              const active = isActive(n.href);
              return (
                <Link
                  key={n.href}
                  href={n.href}
                  onClick={() => dispatch(setMobileMenu(false))}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex items-center justify-between rounded-xl px-4 py-3 text-sm font-semibold transition-colors",
                    active ? "bg-amber-50 text-amber-700" : "text-slate-700 hover:bg-slate-50"
                  )}
                >
                  {n.label}
                  <ChevronRight className={cn("h-4 w-4", active ? "text-amber-500" : "text-slate-300")} />
                </Link>
              );
            })}

            {/* auth buttons inside the mobile menu */}
            <div className="mt-3 border-t border-slate-100 pt-4">
              <AuthButtons stacked onNavigate={() => dispatch(setMobileMenu(false))} />
            </div>
          </nav>
        </div>
      </div>
    </header>
  );
}