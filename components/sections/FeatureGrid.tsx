import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export type Feature = { icon?: LucideIcon; title: string; text: string; tags?: string[]; status?: string };

export default function FeatureGrid({ items, cols = 3 }: { items: Feature[]; cols?: 2 | 3 }) {
  return (
    <div className={`grid gap-5 sm:grid-cols-2 ${cols === 3 ? "lg:grid-cols-3" : ""}`}>
      {items.map(({ icon: Icon, title, text, tags, status }) => (
        <Card key={title} className="transition-shadow hover:shadow-md">
          <CardContent className="p-6">
            <div className="flex items-start justify-between gap-3">
              {Icon && <span className="grid h-11 w-11 place-items-center rounded-xl "><Icon className="h-5 w-5" /></span>}
              {status && <Badge className="bg-accent text-accent-foreground">{status}</Badge>}
            </div>
            <h3 className="mt-4 text-lg font-bold text-primary">{title}</h3>
            <p className="mt-2 text-sm leading-relaxed ">{text}</p>
            {tags && <div className="mt-4 flex flex-wrap gap-2">{tags.map((t) => <Badge key={t} variant="secondary" >{t}</Badge>)}</div>}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
