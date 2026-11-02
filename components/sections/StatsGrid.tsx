import { Card, CardContent } from "@/components/ui/card";
import { getGlance } from "@/lib/api";

export default async function StatsGrid() {
  const cards = await getGlance().catch(() => []);

  if (cards.length === 0)
    return (
      <p className="rounded-xl border border-dashed bg-white p-10 text-center text-muted-foreground">
        Figures will be published soon.
      </p>
    );

  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((c) => (
        <Card key={c._id}>
          <CardContent className="p-6">
            <span className="text-4xl font-extrabold ">{c.value}</span>
            <h3 className="mt-3 font-bold text-primary">{c.label}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{c.text}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}