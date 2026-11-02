import Link from "next/link";

import Section from "@/components/sections/Section";
import PathwayStepper from "@/components/sections/PathwayStepper";
import HeroMosaic from "@/components/sections/HeroMosaic";
import MandateSection from "@/components/sections/MandateSection";
import GlanceSlider from "@/components/sections/GlanceSlider";
import RdcOfferings from "@/components/sections/RdcOfferings";
import LinkagesSection from "@/components/sections/LinkagesSection";

import { getLinkages, getEvents, getGlance, getFeatures } from "@/lib/api";
import { getIcon } from "@/lib/icons";
// removed: import { rdcFeatures } from "@/data/content";   (no longer static)

export default async function Home() {
  const [linkages, eventsResult, glance, rdcFeatures, iicFeatures] = await Promise.all([
    getLinkages().catch(() => []),

    // first 24 events, for the homepage photos
    getEvents("All", 1, 24).catch(() => ({
      data: [],
      pagination: { page: 1, limit: 24, total: 0, pages: 0 },
    })),

    getGlance().catch(() => []),

    getFeatures("rdc").catch(() => []), // RDC cards from the database
    getFeatures("iic").catch(() => []), // IIC cards from the database
  ]);

  const events = eventsResult.data;

  // Photos from event data: cover first, then the other photos. Deduped, max 24.
  const heroImages = [
    ...new Set(
      events
        .flatMap((e) => [e.coverImage, ...e.images.map((m) => m.url)])
        .filter((u): u is string => Boolean(u)),
    ),
  ].slice(0, 24);

  // database card -> the shape RdcOfferings expects
  const toItems = (list: typeof rdcFeatures) =>
    list.map((f) => ({
      icon: getIcon(f.icon),
      title: f.title,
      text: f.text,
      tags: f.tags,
    }));

  const rdcItems = toItems(rdcFeatures);
  const iicItems = toItems(iicFeatures);

  return (
    <>
      {/* HERO */}
      <section className="overflow-hidden bg-linear-to-br from-white via-[#f4f7f9] to-[#e3eef4]">
        <div className="mx-auto grid w-full items-center gap-10 px-2 py-5 lg:grid-cols-2 lg:py-3">
          <div>
            <h1 className="text-4xl font-extrabold leading-[1.05] tracking-tight text-primary lg:text-7xl">
              Research. Innovate. <span className="text-gold">Incubate.</span>
            </h1>

            <p className="mt-6 max-w-xl text-md sm:text-lg text-foreground/80">
              Sibsagar University is building a structured ecosystem connecting research, experiential learning,
              innovation, entrepreneurship, IPR, incubation and regional needs.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/#glance"
                className="inline-flex h-12 items-center justify-center rounded-full bg-primary px-8 text-sm font-semibold text-white transition-colors hover:bg-primary/90"
              >
                Milestones
              </Link>
              <Link
                href="/#incubation"
                className="inline-flex h-12 items-center justify-center rounded-full border-2 border-primary px-8 text-sm font-semibold text-primary transition-colors hover:bg-primary hover:text-white"
              >
                See the pathway
              </Link>
            </div>
          </div>

          <HeroMosaic images={heroImages} />
        </div>

        <MandateSection />
      </section>

      {/* FROM RESEARCH TO IMPACT */}
      <Section id="incubation">
        <h2 className="mb-2 flex flex-wrap items-center gap-x-3 text-3xl font-bold tracking-tight lg:text-4xl">
          <span className="text-5xl text-[#0d1c2f]">From research</span>
          <span className="bg-linear-to-r from-amber-600 via-amber-500 to-amber-600 bg-clip-text font-serif text-4xl font-normal italic text-transparent">
            to impact
          </span>
        </h2>
        <PathwayStepper />
      </Section>

      {/* GLANCE */}
      <GlanceSlider cards={glance} />

      {/* RDC OFFERINGS (from the database) */}
      {rdcItems.length > 0 && <RdcOfferings id="rdc-offerings" items={rdcItems} />}

      {/* LINKAGES */}
      <LinkagesSection linkages={linkages} />

      {/* IIC OFFERINGS (from the database) */}
      {iicItems.length > 0 && (
        <RdcOfferings
          id="iic-offerings"
          items={iicItems}
          title="Innovation &"
          accent="entrepreneurship"
          subtitle="What the Institution's Innovation Council offers."
          pillLabel="Innovation Support Pillars"
        />
      )}
    </>
  );
}