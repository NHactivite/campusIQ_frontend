export default function Timeline({ items }: { items: { date: string; title: string; text: string }[] }) {
  return (
    <ol className="relative space-y-8 border-l-2 border-border pl-8 ">
      {items.map((i) => ( 
        <li key={i.title} className="relative ">
          <span className="absolute -left-[41px] top-1 h-4 w-4 rounded-full border-4 border-background bg-black" />
          <p className="text-sm font-bold ">{i.date}</p>
          <h3 className="text-lg font-bold text-primary">{i.title}</h3>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{i.text}</p>
        </li>
      ))}
    </ol>
  );
}
