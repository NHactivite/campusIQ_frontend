import { notFound } from "next/navigation";
import Link from "next/link";
import {
  GraduationCap, BookOpen, Clock3, Users, ChevronRight, ArrowLeft,
  FileText, Download, CheckCircle, ClipboardList,
} from "lucide-react";
import { getProgramme } from "@/lib/api";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const programme = await getProgramme(slug).catch(() => null);
  if (!programme) return { title: "Programme Not Found | CampusIQ" };
  return {
    title: `${programme.name} | Academic Programmes | CampusIQ`,
    description: programme.courseOverview ?? `${programme.degreeLevel} programme in ${programme.department} — ${programme.duration}`,
  };
}

const levelColors: Record<string, { bg: string; text: string; border: string; accent: string; accentBg: string }> = {
  undergraduate: { bg: "bg-blue-50",    text: "text-blue-700",    border: "border-blue-200",   accent: "text-blue-600",   accentBg: "bg-blue-500"   },
  postgraduate:  { bg: "bg-purple-50",  text: "text-purple-700",  border: "border-purple-200", accent: "text-purple-600", accentBg: "bg-purple-500" },
  doctoral:      { bg: "bg-rose-50",    text: "text-rose-700",    border: "border-rose-200",   accent: "text-rose-600",   accentBg: "bg-rose-500"   },
  diploma:       { bg: "bg-amber-50",   text: "text-amber-700",   border: "border-amber-200",  accent: "text-amber-600",  accentBg: "bg-amber-500"  },
  certificate:   { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200",accent: "text-emerald-600",accentBg: "bg-emerald-500"},
};

const size = (b?: number) =>
  b ? (b > 1e6 ? `${(b / 1e6).toFixed(1)} MB` : `${Math.round(b / 1e3)} KB`) : "";

export default async function ProgrammeDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const programme = await getProgramme(slug).catch(() => null);
  if (!programme) notFound();

  const color = levelColors[programme.degreeLevel] ?? {
    bg: "bg-slate-50", text: "text-slate-700", border: "border-slate-200",
    accent: "text-slate-600", accentBg: "bg-slate-500"
  };

  return (
    <div className="pb-20">
      {/* Accent bar */}
      <div className={`h-1.5 w-full ${color.accentBg}`} />

      {/* Breadcrumb */}
      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-5xl px-4 py-3 sm:px-6">
          <nav className="flex items-center gap-2 text-sm text-slate-500">
            <Link href="/" className="hover:text-slate-800 transition-colors">Home</Link>
            <ChevronRight className="h-3.5 w-3.5" />
            <Link href="/programmes" className="hover:text-slate-800 transition-colors">Programmes</Link>
            <ChevronRight className="h-3.5 w-3.5" />
            <span className="text-slate-800 font-medium truncate">{programme.name}</span>
          </nav>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <Link href="/programmes"
          className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors">
          <ArrowLeft className="h-4 w-4" />
          Back to Programmes
        </Link>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Title section */}
            <div>
              <div className="flex flex-wrap items-center gap-3 mb-4">
                <span className={`rounded-full border px-3.5 py-1 text-xs font-semibold capitalize ${color.bg} ${color.text} ${color.border}`}>
                  {programme.degreeLevel}
                </span>
              </div>
              <h1 className="text-3xl font-bold text-slate-900 sm:text-4xl">{programme.name}</h1>
              <div className="mt-2 flex items-center gap-2 text-base text-slate-600">
                <BookOpen className="h-4.5 w-4.5 shrink-0 text-amber-600" />
                <span>{programme.department}</span>
              </div>
            </div>

            {/* Course overview */}
            {programme.courseOverview && (
              <section>
                <h2 className="mb-3 text-xl font-bold text-slate-900 flex items-center gap-2">
                  <GraduationCap className={`h-5 w-5 ${color.accent}`} />
                  Course Overview
                </h2>
                <div className="rounded-2xl bg-slate-50 border border-slate-200 p-5">
                  <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">{programme.courseOverview}</p>
                </div>
              </section>
            )}

            {/* Eligibility */}
            {programme.eligibilityCriteria && (
              <section>
                <h2 className="mb-3 text-xl font-bold text-slate-900 flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-emerald-600" />
                  Eligibility Criteria
                </h2>
                <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-5">
                  <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">{programme.eligibilityCriteria}</p>
                </div>
              </section>
            )}

            {/* Admission Requirements */}
            {programme.admissionRequirements && (
              <section>
                <h2 className="mb-3 text-xl font-bold text-slate-900 flex items-center gap-2">
                  <ClipboardList className="h-5 w-5 text-blue-600" />
                  Admission Requirements
                </h2>
                <div className="rounded-2xl border border-blue-100 bg-blue-50 p-5">
                  <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">{programme.admissionRequirements}</p>
                </div>
              </section>
            )}

            {/* Syllabus / Documents */}
            {programme.syllabus?.length > 0 && (
              <section>
                <h2 className="mb-3 text-xl font-bold text-slate-900">Syllabus & Documents</h2>
                <div className="flex flex-wrap gap-3">
                  {programme.syllabus.map((doc) => (
                    <a key={doc._id} href={doc.url} target="_blank" rel="noreferrer"
                      className="group inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition-all hover:border-amber-400 hover:bg-amber-50">
                      <FileText className="h-4 w-4 text-amber-600 shrink-0" />
                      <span className="truncate max-w-[180px]">{doc.originalName ?? "Document"}</span>
                      {size(doc.bytes) && <span className="text-slate-400 text-xs">{size(doc.bytes)}</span>}
                      <Download className="h-3.5 w-3.5 text-slate-400 group-hover:text-amber-600 transition-colors" />
                    </a>
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* Sidebar */}
          <aside className="space-y-4">
            {/* Quick info card */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sticky top-4">
              <h2 className="mb-5 text-base font-bold text-slate-900">Programme Details</h2>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className={`rounded-xl p-2 shrink-0 ${color.bg}`}>
                    <GraduationCap className={`h-4.5 w-4.5 ${color.text}`} />
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-0.5">Degree Level</p>
                    <p className="text-sm font-medium text-slate-700 capitalize">{programme.degreeLevel}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="rounded-xl p-2 shrink-0 bg-amber-50">
                    <Clock3 className="h-4.5 w-4.5 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-0.5">Duration</p>
                    <p className="text-sm font-medium text-slate-700">{programme.duration}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="rounded-xl p-2 shrink-0 bg-blue-50">
                    <BookOpen className="h-4.5 w-4.5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-0.5">Department</p>
                    <p className="text-sm font-medium text-slate-700">{programme.department}</p>
                  </div>
                </div>

                {programme.availableSeats !== undefined && (
                  <div className="flex items-start gap-3">
                    <div className="rounded-xl p-2 shrink-0 bg-green-50">
                      <Users className="h-4.5 w-4.5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-0.5">Available Seats</p>
                      <p className="text-sm font-medium text-slate-700">{programme.availableSeats}</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-6 border-t border-slate-100 pt-4">
                <Link href="/programmes"
                  className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors w-full">
                  <GraduationCap className="h-4 w-4" />
                  All Programmes
                </Link>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
