"use client";
import Link from "next/link";
import { UserButton, useUser } from "@clerk/nextjs";
import { LayoutDashboard } from "lucide-react";
import { cn } from "@/lib/utils";

export default function AuthButtons({
  stacked = false,
  onNavigate,
}: {
  stacked?: boolean; // full-width buttons for the mobile menu
  onNavigate?: () => void;
}) {
  const { isLoaded, isSignedIn, user } = useUser();
  const isAdmin = (user?.publicMetadata as { role?: string } | undefined)?.role === "admin";

  const base =
    "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-all";

  // render nothing until Clerk has loaded, so the wrong buttons never flash
  if (!isLoaded) return <div className="h-9 w-24" aria-hidden />;

  return (
    <div className={cn("flex items-center gap-2", stacked && "flex-col items-stretch")}>
      {!isSignedIn ? (
        <>
          <Link
            href="/sign-in"
            onClick={onNavigate}
            className={cn(base, "border border-slate-200 bg-white text-[#0b1e36] hover:border-amber-400 hover:text-amber-700")}
          >
            Sign in
          </Link>
          <Link
            href="/sign-up"
            onClick={onNavigate}
            className={cn(base, "bg-linear-to-r from-amber-500 to-amber-600 text-slate-950 shadow-sm shadow-amber-500/30 hover:from-amber-400 hover:to-amber-500")}
          >
            Sign up
          </Link>
        </>
      ) : (
        <>
          {isAdmin && (
            <Link
              href="/admin"
              onClick={onNavigate}
              className={cn(base, "bg-[#0b1e36] text-white hover:bg-[#0b1e36]/90")}
            >
              <LayoutDashboard className="h-4 w-4" />
              Admin
            </Link>
          )}
          <div className={cn("flex items-center", stacked && "justify-center py-1")}>
            <UserButton />
          </div>
        </>
      )}
    </div>
  );
}