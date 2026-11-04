import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  MapPin, Clock, Phone, ArrowLeft, ChevronRight, Download,
  FileText, Building2, CheckCircle, Wifi,
} from "lucide-react";
import { getFacility, type FacilityItem } from "@/lib/api";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const facility = await getFacility(slug).catch(() => null);
  if (!facility) return { title: "Facility Not Found | CampusIQ" };
  return {
    title: `${facility.name} | Campus Facilities | CampusIQ`,
    description: facility.description,
  };
}

const categoryColors: Record<string, { bg: string; text: string; border: string }> = {
  library:     { bg: "bg-blue-50",    text: "text-blue-700",    border: "border-blue-200"    },
  sports:      { bg: "bg-green-50",   text: "text-green-700",   border: "border-green-200"   },
  laboratory:  { bg: "bg-purple-50",  text: "text-purple-700",  border: "border-purple-200"  },
  canteen:     { bg: "bg-orange-50",  text: "text-orange-700",  border: "border-orange-200"  },
  hostel:      { bg: "bg-rose-50",    text: "text-rose-700",    border: "border-rose-200"    },
  medical:     { bg: "bg-red-50",     text: "text-red-700",     border: "border-red-200"     },
  transport:   { bg: "bg-amber-50",   text: "text-amber-700",   border: "border-amber-200"   },
  it:          { bg: "bg-cyan-50",    text: "text-cyan-700",    border: "border-cyan-200"    },
  auditorium:  { bg: "bg-indigo-50",  text: "text-indigo-700",  border: "border-indigo-200"  },
  other:       { bg: "bg-slate-50",   text: "text-slate-600",   border: "border-slate-200"   },
};

const size = (b?: number) =>
  b ? (b > 1e6 ? `${(b / 1e6).toFixed(1)} MB` : `${Math.round(b / 1e3)} KB`) : "";

export default async function FacilityDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const facility = await getFacility(slug).catch(() => null);
  if (!facility) notFound();

  const color = categoryColors[facility.category] ?? categoryColors.other;
  const images = facility.images ?? [];
  const docs = facility.documents ?? [];

  return (
    <div className="pb-20">
      {/* Breadcrumb */}
      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-5xl px-4 py-3 sm:px-6">
          <nav className="flex items-center gap-2 text-sm text-slate-500">
            <Link href="/" className="hover:text-slate-800 transition-colors">Home</Link>
            <ChevronRight className="h-3.5 w-3.5" />
            <Link href="/facilities" className="hover:text-slate-800 transition-colors">Facilities</Link>
            <ChevronRight className="h-3.5 w-3.5" />
            <span className="text-slate-800 font-medium truncate">{facility.name}</span>
          </nav>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        {/* Back link */}
        <Link href="/facilities"
          className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors">
          <ArrowLeft className="h-4 w-4" />
          Back to Facilities
        </Link>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Hero image */}
            {images.length > 0 && (
              <div className="relative h-64 w-full overflow-hidden rounded-2xl bg-slate-100 sm:h-80">
                <Image
                  src={images[0].url}
                  alt={facility.name}
                  fill
                  priority
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 66vw"
                />
              </div>
            )}

            {/* Image gallery */}
            {images.length > 1 && (
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                {images.slice(1, 7).map((img) => (
                  <a key={img._id} href={img.url} target="_blank" rel="noreferrer"
                    className="relative h-24 overflow-hidden rounded-xl bg-slate-100 block hover:opacity-90 transition-opacity">
                    <Image src={img.url} alt={img.originalName ?? "Facility photo"} fill className="object-cover" sizes="150px" />
                  </a>
                ))}
                {images.length > 7 && (
                  <div className="relative h-24 overflow-hidden rounded-xl bg-slate-900/80 flex items-center justify-center">
                    <span className="text-white font-bold text-lg">+{images.length - 7}</span>
                  </div>
                )}
              </div>
            )}

            {/* Heading + category */}
            <div>
              <div className="flex flex-wrap items-center gap-3 mb-3">
                <span className={`rounded-full border px-3.5 py-1 text-xs font-semibold capitalize ${color.bg} ${color.text} ${color.border}`}>
                  {facility.category}
                </span>
              </div>
              <h1 className="text-3xl font-bold text-slate-900 sm:text-4xl">{facility.name}</h1>
            </div>

            {/* Description */}
            <div className="prose prose-slate max-w-none">
              <p className="text-base leading-relaxed text-slate-700 whitespace-pre-wrap">{facility.description}</p>
            </div>

            {/* Services / Amenities */}
            {facility.amenities?.length > 0 && (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
                <h2 className="mb-4 text-lg font-bold text-slate-900 flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-amber-600" />
                  Services & Amenities
                </h2>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {facility.amenities.map((a) => (
                    <div key={a} className="flex items-center gap-2 text-sm text-slate-700">
                      <span className="h-1.5 w-1.5 rounded-full bg-amber-500 shrink-0" />
                      {a}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Documents */}
            {docs.length > 0 && (
              <div>
                <h2 className="mb-3 text-lg font-bold text-slate-900">Documents & Brochures</h2>
                <div className="flex flex-wrap gap-3">
                  {docs.map((d) => (
                    <a key={d._id} href={d.url} target="_blank" rel="noreferrer"
                      className="group inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition-all hover:border-amber-400 hover:bg-amber-50">
                      <FileText className="h-4 w-4 text-amber-600 shrink-0" />
                      <span className="truncate max-w-40">{d.originalName ?? "Document"}</span>
                      {size(d.bytes) && <span className="text-slate-400 text-xs">{size(d.bytes)}</span>}
                      <Download className="h-3.5 w-3.5 text-slate-400 group-hover:text-amber-600 transition-colors" />
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <aside className="space-y-4">
            {/* Info card */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sticky top-4">
              <h2 className="mb-5 text-base font-bold text-slate-900">Facility Info</h2>
              <div className="space-y-4">
                {facility.location && (
                  <div className="flex items-start gap-3">
                    <div className="rounded-xl bg-amber-50 p-2 shrink-0">
                      <MapPin className="h-4.5 w-4.5 text-amber-600" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-0.5">Location</p>
                      <p className="text-sm text-slate-700">{facility.location}</p>
                    </div>
                  </div>
                )}
                {facility.operatingHours && (
                  <div className="flex items-start gap-3">
                    <div className="rounded-xl bg-amber-50 p-2 shrink-0">
                      <Clock className="h-4.5 w-4.5 text-amber-600" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-0.5">Operating Hours</p>
                      <p className="text-sm text-slate-700">{facility.operatingHours}</p>
                    </div>
                  </div>
                )}
                {facility.contactDetails && (
                  <div className="flex items-start gap-3">
                    <div className="rounded-xl bg-amber-50 p-2 shrink-0">
                      <Phone className="h-4.5 w-4.5 text-amber-600" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-0.5">Contact</p>
                      <p className="text-sm text-slate-700 whitespace-pre-line">{facility.contactDetails}</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-6 border-t border-slate-100 pt-4">
                <Link href="/facilities"
                  className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors w-full">
                  <Building2 className="h-4 w-4" />
                  All Facilities
                </Link>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
