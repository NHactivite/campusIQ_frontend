import {
  CalendarDays,
  Link2,
  Sparkles,
  BarChart3,
  TrendingUp,
  CheckCircle,
  Clock,
} from "lucide-react";
import { auth } from "@clerk/nextjs/server";
import {
  adminGetEventStats,
  adminGetLinkages,
  adminGetFeatures,
  adminGetGlance,
} from "@/lib/adminApi";

import Link from "next/link";

async function getStats(token: string | null) {
  const [events, linkages, featuresRDC, featuresIIC, glance] = await Promise.allSettled([
    adminGetEventStats(token), // exact counts from the database
    adminGetLinkages(token),
    adminGetFeatures("rdc", token),
    adminGetFeatures("iic", token),
    adminGetGlance(token),
  ]);

  const ev = events.status === "fulfilled" ? events.value : null;
  const linkagesData = linkages.status === "fulfilled" ? linkages.value : [];
  const rdcData = featuresRDC.status === "fulfilled" ? featuresRDC.value : [];
  const iicData = featuresIIC.status === "fulfilled" ? featuresIIC.value : [];
  const glanceData = glance.status === "fulfilled" ? glance.value : [];

  return {
    totalEvents: ev?.total ?? 0,
    upcoming: ev?.upcoming ?? 0,
    past: ev?.past ?? 0,
    linkages: linkagesData.length,
    features: rdcData.length + iicData.length,
    glance: glanceData.length,
    categoryCount: ev?.byCategory ?? {},
    recentEvents: ev?.recent ?? [],
  };
}

export default async function AdminOverviewPage() {
  const { getToken } = await auth();
  const stats = await getStats(await getToken());

  /*
   * --------------------------------
   * Statistic cards
   * --------------------------------
   */

  const statCards = [
    {
      label: "Total Events",
      value: stats.totalEvents,
      icon: CalendarDays,
      href: "/admin/events",
      color: "from-blue-500/20 to-blue-600/10",
      iconColor: "text-blue-400",
      borderColor: "border-blue-500/20",
    },

    {
      label: "Upcoming Events",
      value: stats.upcoming,
      icon: Clock,
      href: "/admin/events",
      color: "from-amber-500/20 to-amber-600/10",
      iconColor: "text-amber-400",
      borderColor: "border-amber-500/20",
    },

    {
      label: "Linkages",
      value: stats.linkages,
      icon: Link2,
      href: "/admin/linkages",
      color: "from-emerald-500/20 to-emerald-600/10",
      iconColor: "text-emerald-400",
      borderColor: "border-emerald-500/20",
    },

    {
      label: "Feature Cards",
      value: stats.features,
      icon: Sparkles,
      href: "/admin/features",
      color: "from-purple-500/20 to-purple-600/10",
      iconColor: "text-purple-400",
      borderColor: "border-purple-500/20",
    },

    {
      label: "Glance Stats",
      value: stats.glance,
      icon: BarChart3,
      href: "/admin/glance",
      color: "from-rose-500/20 to-rose-600/10",
      iconColor: "text-rose-400",
      borderColor: "border-rose-500/20",
    },

    {
      label: "Past Events",
      value: stats.past,
      icon: CheckCircle,
      href: "/admin/events",
      color: "from-slate-500/20 to-slate-600/10",
      iconColor: "text-slate-400",
      borderColor: "border-slate-500/20",
    },
  ];

  /*
   * --------------------------------
   * Category colors
   * --------------------------------
   */

  const categoryColors: Record<string, string> = {
    RDC: "bg-blue-500/20 text-blue-300",
    IIC: "bg-purple-500/20 text-purple-300",
    Learning: "bg-amber-500/20 text-amber-300",
    Incubation: "bg-emerald-500/20 text-emerald-300",
    Linkages: "bg-rose-500/20 text-rose-300",
    IPR: "bg-orange-500/20 text-orange-300",
    Other: "bg-slate-500/20 text-slate-300",
  };

  /*
   * --------------------------------
   * Quick actions
   * --------------------------------
   */

  const quickActions = [
    {
      label: "Add Event",
      href: "/admin/events?new=1",
      icon: CalendarDays,
    },

    {
      label: "Add Linkage",
      href: "/admin/linkages?new=1",
      icon: Link2,
    },

    {
      label: "Add Feature",
      href: "/admin/features?new=1",
      icon: Sparkles,
    },

    {
      label: "Add Stat",
      href: "/admin/glance?new=1",
      icon: BarChart3,
    },
  ];

  return (
    <div className="min-w-0 space-y-6 sm:space-y-8">
      {/* --------------------------------
          Header
      -------------------------------- */}

      <div>
        <h1 className="text-xl font-bold text-white  sm:text-2xl mt-8 sm:mt-0">
          Dashboard Overview
        </h1>

        <p className="mt-1 text-xs text-white/40 sm:text-sm">
          Welcome back — here&apos;s what&apos;s happening at RDC &amp; IIC.
        </p>
      </div>

      {/* --------------------------------
          Stat Cards
          2 cols on phones, 2 on tablets, 3 on desktop
      -------------------------------- */}

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
        {statCards.map(
          ({
            label,
            value,
            icon: Icon,
            href,
            color,
            iconColor,
            borderColor,
          }) => (
            <Link
              key={label}
              href={href}
              className={`group relative min-w-0 overflow-hidden rounded-2xl border ${borderColor} bg-linear-to-br ${color} p-3.5 transition-all hover:shadow-lg hover:shadow-black/30 sm:p-5 sm:hover:scale-[1.02]`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-[10px] font-medium uppercase tracking-wider text-white/50 sm:text-xs">
                    {label}
                  </p>

                  <p className="mt-1.5 text-2xl font-bold text-white sm:mt-2 sm:text-3xl">
                    {value}
                  </p>
                </div>

                <div
                  className={`shrink-0 rounded-xl bg-white/5 p-2 sm:p-2.5 ${iconColor}`}
                >
                  <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
                </div>
              </div>

              <div className="mt-2.5 flex items-center gap-1 text-[11px] text-white/30 transition-colors group-hover:text-white/50 sm:mt-3 sm:text-xs">
                <TrendingUp className="h-3 w-3" />

                <span>Manage →</span>
              </div>
            </Link>
          ),
        )}
      </div>

      {/* --------------------------------
          Main dashboard
          1 col on mobile/tablet, 3 col grid on desktop
      -------------------------------- */}

      <div className="grid gap-4 sm:gap-6 lg:grid-cols-3">
        {/* --------------------------------
            Recent Events
        -------------------------------- */}

        <div className="min-w-0 rounded-2xl border border-white/6 bg-[#13161f] p-4 sm:p-6 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between gap-3 sm:mb-5">
            <h2 className="text-sm font-semibold text-white sm:text-base">
              Recent Events
            </h2>

            <Link
              href="/admin/events"
              className="shrink-0 text-xs text-gold transition-colors hover:text-gold/80"
            >
              View all →
            </Link>
          </div>

          {stats.recentEvents.length === 0 ? (
            <p className="py-8 text-center text-sm text-white/30">
              No events yet.
            </p>
          ) : (
            <div className="space-y-2.5 sm:space-y-3">
              {stats.recentEvents.map((event) => (
                <div
                  key={event._id}
                  className="flex items-start gap-3 rounded-xl bg-white/3 px-3 py-3 transition-colors hover:bg-white/6 sm:items-center sm:gap-4 sm:px-4"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-white">
                      {event.title}
                    </p>

                    <p className="mt-0.5 line-clamp-2 text-xs text-white/40 sm:line-clamp-1">
                      {new Date(
                        event.eventDate,
                      ).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}

                      {event.venue
                        ? ` · ${event.venue}`
                        : ""}
                    </p>
                  </div>

                  <span
                    className={`shrink-0 rounded-lg px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                      categoryColors[event.category] ??
                      categoryColors.Other
                    }`}
                  >
                    {event.category}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* --------------------------------
            Right column
            stacked on mobile, side by side on tablet, stacked on desktop
        -------------------------------- */}

        <div className="grid min-w-0 gap-4 sm:gap-6 md:grid-cols-2 md:items-start lg:grid-cols-1">
          {/* --------------------------------
              Category Breakdown
          -------------------------------- */}

          <div className="min-w-0 rounded-2xl border border-white/6 bg-[#13161f] p-4 sm:p-6">
            <h2 className="mb-4 text-sm font-semibold text-white sm:text-base">
              Events by Category
            </h2>

            {Object.keys(stats.categoryCount).length === 0 ? (
              <p className="py-4 text-center text-sm text-white/30">
                No data yet.
              </p>
            ) : (
              <div className="space-y-3">
                {Object.entries(stats.categoryCount)
                  .sort((a, b) => b[1] - a[1])
                  .map(([category, count]) => {
                    const percentage =
                      stats.totalEvents > 0
                        ? Math.round(
                            (count / stats.totalEvents) * 100,
                          )
                        : 0;

                    return (
                      <div
                        key={category}
                        className="flex items-center gap-2 sm:gap-3"
                      >
                        <span className="w-18 shrink-0 truncate text-xs text-white/50 sm:w-20">
                          {category}
                        </span>

                        <div className="h-1.5 min-w-0 flex-1 rounded-full bg-white/6">
                          <div
                            className="h-full rounded-full bg-linear-to-r from-gold to-[#e8b84b]"
                            style={{
                              width: `${percentage}%`,
                            }}
                          />
                        </div>

                        <span className="w-6 shrink-0 text-right text-xs font-semibold text-white/60">
                          {count}
                        </span>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>

          {/* --------------------------------
              Quick Actions
          -------------------------------- */}

          <div className="min-w-0 rounded-2xl border border-white/6 bg-[#13161f] p-4 sm:p-6">
            <h2 className="mb-4 text-sm font-semibold text-white sm:text-base">
              Quick Add
            </h2>

            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 md:grid-cols-2">
              {quickActions.map(
                ({ label, href, icon: Icon }) => (
                  <Link
                    key={label}
                    href={href}
                    className="group flex flex-col items-center gap-2 rounded-xl bg-white/3 p-3 text-center transition-all hover:bg-white/8 hover:text-gold"
                  >
                    <Icon className="h-4 w-4 text-white/40 transition-colors group-hover:text-gold" />

                    <span className="text-xs font-medium text-white/50 transition-colors group-hover:text-gold">
                      {label}
                    </span>
                  </Link>
                ),
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}