"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";

import {
  CalendarDays,
  MapPin,
  Users,
  ImageIcon,
  Video,
  FileText,
} from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchEvents } from "@/store/slices/eventsSlice";

const fmt = (d: string) =>
  new Date(d).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

export default function EventsGrid() {
  const dispatch = useAppDispatch();

  // --------------------------------
  // FILTER
  // --------------------------------

  const filter = useAppSelector(
    (s) => s.dashboard.filter,
  );

  // --------------------------------
  // EVENTS STATE
  // --------------------------------

  const {
    items,
    status,
    error,
    loadedFor,
    pagination,
  } = useAppSelector(
    (s) => s.events,
  );

  // --------------------------------
  // CURRENT PAGE
  // --------------------------------

  const [page, setPage] = useState(1);

  // --------------------------------
  // FETCHING STATE
  // --------------------------------

  const isFetching = status === "loading";

  const loading =
    isFetching ||
    status === "idle" ||
    loadedFor !== filter;

  // --------------------------------
  // RESET PAGE WHEN FILTER CHANGES
  // --------------------------------

  useEffect(() => {
    setPage(1);
  }, [filter]);

  // --------------------------------
  // FETCH EVENTS
  // --------------------------------

  useEffect(() => {
    dispatch(
      fetchEvents({
        category: filter,
        page,
      }),
    );
  }, [filter, page, dispatch]);

  // --------------------------------
  // ERROR
  // --------------------------------

  if (status === "failed") {
    return (
      <p className="rounded-lg bg-red-50 p-4 text-sm text-red-700">
        {error || "Could not load events"}
      </p>
    );
  }

  // --------------------------------
  // LOADING
  // --------------------------------

  if (loading) {
    return (
      <div className="grid w-full gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
        {Array.from({ length: 24 }).map((_, i) => (
          <div
            key={i}
            className="h-80 animate-pulse rounded-xl bg-muted"
          />
        ))}
      </div>
    );
  }

  // --------------------------------
  // EMPTY
  // --------------------------------

  if (items.length === 0) {
    return (
      <p className="rounded-xl border border-dashed bg-white p-10 text-center text-muted-foreground">
        No {filter === "All" ? "" : filter} events yet.
      </p>
    );
  }

  // --------------------------------
  // EVENTS + PAGINATION
  // --------------------------------

  return (
    <>
      {/* ========================================= */}
      {/* EVENTS GRID */}
      {/* ========================================= */}

      <div className="grid w-full grid-cols-2 gap-5 md:grid-cols-3 lg:grid-cols-5 2xl:grid-cols-6">
        {items.map((e) => (
          <Link
            key={e._id}
            href={`/dashboard/${e.slug}`}
            className="group"
          >
            <Card className="h-full overflow-hidden pt-0 transition-shadow group-hover:shadow-lg">

              {/* -------------------------------- */}
              {/* COVER IMAGE */}
              {/* -------------------------------- */}

              <div className="relative aspect-video bg-linear-to-br from-[#0d2b40] to-[#1d6387]">
                {e.coverImage && (
                  <Image
                    src={e.coverImage}
                    alt={e.title}
                    fill
                    sizes="
                      (min-width:1536px) 16vw,
                      (min-width:1280px) 20vw,
                      (min-width:1024px) 25vw,
                      100vw
                    "
                    className="object-cover"
                  />
                )}

                {/* Category */}
                <Badge className="absolute left-3 top-3 bg-gold text-primary">
                  {e.category}
                </Badge>
              </div>

              {/* -------------------------------- */}
              {/* CARD CONTENT */}
              {/* -------------------------------- */}

              <CardContent>

                {/* Title */}
                <h3 className="line-clamp-2 text-md font-bold text-primary">
                  {e.title}
                </h3>

                {/* Organiser */}
                {e.organiser && (
                  <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">
                    <span className="text-black">
                      organise:-
                    </span>{" "}
                    {e.organiser}
                  </p>
                )}

                {/* -------------------------------- */}
                {/* EVENT INFORMATION */}
                {/* -------------------------------- */}

                <div className="mt-4 space-y-1 text-xs text-muted-foreground">

                  {/* Date */}
                  <p className="flex items-center gap-2">
                    <CalendarDays className="h-3.5 w-3.5" />
                    {fmt(e.eventDate)}
                  </p>

                  {/* Venue */}
                  {e.venue && (
                    <p className="flex items-center gap-2">
                      <MapPin className="h-3.5 w-3.5" />
                      {e.venue}
                    </p>
                  )}

                  {/* Participants */}
                  {e.participants ? (
                    <p className="flex items-center gap-2">
                      <Users className="h-3.5 w-3.5" />
                      {e.participants} participants
                    </p>
                  ) : null}

                </div>

                {/* -------------------------------- */}
                {/* MEDIA COUNTS */}
                {/* -------------------------------- */}

                <div className="mt-4 flex gap-4 border-t pt-3 text-xs font-medium">

                  {/* Images */}
                  <span className="flex items-center gap-1">
                    <ImageIcon className="h-3.5 w-3.5" />
                    {e.images.length}
                  </span>

                  {/* Videos */}
                  <span className="flex items-center gap-1">
                    <Video className="h-3.5 w-3.5" />
                    {e.videos.length}
                  </span>

                  {/* Documents */}
                  <span className="flex items-center gap-1">
                    <FileText className="h-3.5 w-3.5" />
                    {e.documents.length}
                  </span>

                </div>

              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* ========================================= */}
      {/* PAGINATION */}
      {/* ========================================= */}

      {pagination.pages > 1 && (
        <div className="mt-10 flex flex-col items-center gap-4">

          {/* -------------------------------- */}
          {/* PAGINATION BUTTONS */}
          {/* -------------------------------- */}

          <div className="flex items-center gap-2">

            {/* PREVIOUS */}
            <button
              type="button"
              disabled={
                page === 1 ||
                isFetching
              }
              onClick={() =>
                setPage((p) =>
                  Math.max(1, p - 1),
                )
              }
              className="rounded-lg border bg-white px-4 py-2 text-sm font-medium transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
            >
              Previous
            </button>

            {/* -------------------------------- */}
            {/* PAGE NUMBERS */}
            {/* -------------------------------- */}

            <div className="flex items-center gap-1">

              {Array.from(
                {
                  length: pagination.pages,
                },
                (_, i) => i + 1,
              ).map((pageNumber) => (

                <button
                  key={pageNumber}
                  type="button"
                  disabled={isFetching}
                  onClick={() =>
                    setPage(pageNumber)
                  }
                  className={`h-9 min-w-9 rounded-lg px-3 text-sm font-medium transition ${
                    pageNumber === page
                      ? "bg-primary text-white"
                      : "border bg-white hover:bg-muted"
                  }`}
                >
                  {pageNumber}
                </button>

              ))}

            </div>

            {/* -------------------------------- */}
            {/* NEXT */}
            {/* -------------------------------- */}

            <button
              type="button"
              disabled={
                page === pagination.pages ||
                isFetching
              }
              onClick={() =>
                setPage((p) =>
                  Math.min(
                    pagination.pages,
                    p + 1,
                  ),
                )
              }
              className="rounded-lg border bg-white px-4 py-2 text-sm font-medium transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next
            </button>

          </div>

          {/* -------------------------------- */}
          {/* RESULT COUNT */}
          {/* -------------------------------- */}

          <p className="text-sm text-muted-foreground">
            Showing{" "}
            {(pagination.page - 1) *
              pagination.limit +
              1}
            {" – "}
            {Math.min(
              pagination.page *
                pagination.limit,
              pagination.total,
            )}{" "}
            of{" "}
            {pagination.total} events
          </p>

        </div>
      )}
    </>
  );
}