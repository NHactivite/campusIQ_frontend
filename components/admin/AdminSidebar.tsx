"use client";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, CalendarDays, Link2, Sparkles, BarChart3,
  ChevronRight, Settings, LogOut, Menu, X, FileText, DatabaseZap,
  MessagesSquare, Building2, GraduationCap
} from "lucide-react";
import { useState } from "react";
import logo from "@/logo.jpg";

const nav = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/events", label: "Events", icon: CalendarDays },
  { href: "/admin/notices", label: "Notices & Docs", icon: FileText },
  { href: "/admin/facilities", label: "Facilities", icon: Building2 },
  { href: "/admin/programmes", label: "Programmes", icon: GraduationCap },
  { href: "/admin/linkages", label: "Linkages", icon: Link2 },
  { href: "/admin/features", label: "Features", icon: Sparkles },
  { href: "/admin/glance", label: "At a Glance", icon: BarChart3 },
  { href: "/admin/index", label: "Chatbot Index", icon: DatabaseZap },
  { href: "/admin/chats", label: "Chat History", icon: MessagesSquare },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Mobile toggle */}
      <button
        className="fixed top-4 left-1 z-50  md:hidden rounded-xl bg-white/10 backdrop-blur p-2 text-white"
        onClick={() => setOpen((v) => !v)}
        aria-label="Toggle sidebar"
      > 
        {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {/* Overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/60 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-[#13161f] border-r border-white/6 transition-transform duration-300 md:translate-x-0 ${open ? "translate-x-0" : "-translate-x-full"
          }`}
      >

        {/* Logo */}
        <div className="flex mx-10  items-center gap-3 px-5 py-5 border-b border-white/6 ">
          <Image
            src={logo}
            alt="Sibsagar University"
            width={38}
            height={38}
            className="rounded-lg object-contain"
            style={{ width: 38, height: "auto" }}
          />
          <div>
            <p className="text-sm font-bold text-white leading-tight">CampusIQ</p>
            <p className="text-[10px] text-white/40 leading-tight mt-0.5">Admin Panel</p>
          </div>
        </div>
        <div className="px-3 py-4 border-t border-white/6 space-y-1">
          <Link
            href="/"
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-white/40 hover:text-white hover:bg-white/5 transition-all"
          >
            <LogOut className="h-4 w-4" />
            Back to site
          </Link>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-white/30 px-3 mb-3">
            Management
          </p>
          {nav.map(({ href, label, icon: Icon }) => {
            const isActive =
              href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${isActive
                  ? "bg-linear-to-r from-gold/20 to-gold/5 text-gold border border-gold/20"
                  : "text-white/50 hover:text-white hover:bg-white/5"
                  }`}
              >
                <Icon
                  className={`h-4.5 w-4.5 shrink-0 ${isActive ? "text-gold" : "text-white/30 group-hover:text-white/70"
                    }`}
                />
                <span className="flex-1">{label}</span>
                {isActive && <ChevronRight className="h-3.5 w-3.5 text-gold/60" />}
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
