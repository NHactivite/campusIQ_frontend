export default function Section({ id, title, intro, children, className = "" }: {
  id?: string; title?: string; intro?: string; children: React.ReactNode; className?: string;
}) {
  return (
    <section id={id} className={`mx-auto max-w-7xl scroll-mt-24 px-6 py-12 md:py-16 ${className}`}>
      {title && (
        <div className="mb-8 max-w-2xl">
          <h2 className="text-3xl font-extrabold text-primary">{title}</h2>
          {intro && <p className="mt-2 text-muted-foreground">{intro}</p>}
        </div>
      )}
      {children}
    </section>
  );
}