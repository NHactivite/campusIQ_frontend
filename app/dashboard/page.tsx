import PageHero from "@/components/sections/PageHero";
import Section from "@/components/sections/Section";
import FilterChips from "@/components/sections/FilterChips";
import EventsGrid from "@/components/sections/EventsGrid";

export const metadata = { title: "Dashboard | RDC & IIC" };

export default function Page() {
  return (
    <section className="w-full px-2 py-8 lg:px-10">
      <FilterChips />
      <div className="mt-6">
        <EventsGrid />
      </div>
    </section>
  );
}