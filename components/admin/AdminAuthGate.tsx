"use client";
import { useAuth } from "@clerk/nextjs";
import { setTokenGetter } from "@/lib/adminApi";

export default function AdminAuthGate({ children }: { children: React.ReactNode }) {
  const { isLoaded, isSignedIn, getToken } = useAuth();

  // set during render on purpose: child pages fetch in useEffect, which runs before this component's own effects
  setTokenGetter(() => getToken());

  if (!isLoaded || !isSignedIn)
    return <div className="grid min-h-[60vh] place-items-center text-sm text-white/40">Loading…</div>;

  return <>{children}</>;
}