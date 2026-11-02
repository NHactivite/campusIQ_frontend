import Link from "next/link";
import Image from "next/image";
import { CalendarDays, MapPin, Users, ImageIcon, Video, FileText } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { EventItem } from "@/lib/api";

const fmt = (d: string) =>
  new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

export default function EventCard({ e }: { e: EventItem }) {
  return (
    <Link href={`/dashboard/${e.slug}`} className="group">
      <Card className="h-full overflow-hidden pt-0 transition-shadow group-hover:shadow-lg">
        <div className="relative aspect-video bg-linear-to-br from-[#0d2b40] to-[#1d6387]">
          {e.coverImage && (
            <Image src={e.coverImage} alt={e.title} fill sizes="(min-width:1024px) 33vw, 100vw" className="object-cover" />
          )}
          <Badge className="absolute left-3 top-3 bg-gold text-primary">{e.category}</Badge>
        </div>
        <CardContent className="p-5">
          <h3 className="line-clamp-2 text-lg font-bold text-primary">{e.title}</h3>
          <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{e.description}</p>

          <div className="mt-4 space-y-1 text-xs text-muted-foreground">
            <p className="flex items-center gap-2"><CalendarDays className="h-3.5 w-3.5" />{fmt(e.eventDate)}</p>
            {e.venue && <p className="flex items-center gap-2"><MapPin className="h-3.5 w-3.5" />{e.venue}</p>}
            {e.participants ? <p className="flex items-center gap-2"><Users className="h-3.5 w-3.5" />{e.participants} participants</p> : null}
          </div>

          <div className="mt-4 flex gap-4 border-t pt-3 text-xs font-medium text-secondary">
            <span className="flex items-center gap-1"><ImageIcon className="h-3.5 w-3.5" />{e.images.length}</span>
            <span className="flex items-center gap-1"><Video className="h-3.5 w-3.5" />{e.videos.length}</span>
            <span className="flex items-center gap-1"><FileText className="h-3.5 w-3.5" />{e.documents.length}</span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}