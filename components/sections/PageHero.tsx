export default function PageHero({ title, subtitle, children }: { title: string; subtitle?: string; children?: React.ReactNode }) {
  return (
    <section className="bg-gradient-to-br from-[#0d2b40] to-[#1d6387] text-white">
      <div className="mx-auto max-w-7xl px-6 py-10 md:py-20">
        <h1 className="max-w-3xl text-4xl font-extrabold leading-tight md:text-5xl">{title}</h1>
        {subtitle && <p className="mt-4 max-w-2xl text-lg text-white/80">{subtitle}</p>}
        {children && <div className="mt-8 flex flex-wrap gap-3">{children}</div>}
      </div>
    </section>
  );
}
