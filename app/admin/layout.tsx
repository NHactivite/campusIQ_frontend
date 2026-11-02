import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { currentUser } from "@clerk/nextjs/server";
import { SignOutButton } from "@clerk/nextjs";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminAuthGate from "@/components/admin/AdminAuthGate";

export const metadata: Metadata = {
  title: "Admin Panel | RDC & IIC",
  description: "Admin dashboard for RDC & IIC – Sibsagar University",
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await currentUser();
  if (!user) redirect("/sign-in");

  const role = (user.publicMetadata as { role?: string })?.role;
  if (role !== "admin") {
    return (
      <div className="grid min-h-screen place-items-center bg-[#0f1117] p-6 text-center">
        <div className="max-w-sm">
          <h1 className="text-xl font-bold text-white">No admin access</h1>
          <p className="mt-2 text-sm text-white/50">
            Signed in as {user.primaryEmailAddress?.emailAddress}. This account isn&apos;t an admin. Ask the site owner to grant access.
          </p>
          <div className="mt-6 flex items-center justify-center gap-3">
            <Link href="/" className="rounded-xl bg-white/10 px-4 py-2 text-sm text-white hover:bg-white/15">
              Back to site
            </Link>
            <SignOutButton redirectUrl="/sign-in">
              <button className="rounded-xl border border-white/15 px-4 py-2 text-sm text-white/70 hover:text-white">
                Sign out
              </button>
            </SignOutButton>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#0f1117]">
      <AdminSidebar />
      <div className="flex min-w-0 flex-1 flex-col md:ml-64">
        <main className="flex-1 p-6 md:p-8">
          <AdminAuthGate>{children}</AdminAuthGate>
        </main>
      </div>
    </div>
  );
}