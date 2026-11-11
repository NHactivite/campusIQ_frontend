export type Media = {
  _id: string;
  url: string;
  publicId: string;
  resourceType: "image" | "video" | "raw";
  format?: string;
  bytes?: number;
  originalName?: string;
};

export type EventItem = {
  _id: string;
  title: string;
  slug: string;
  description: string;
  category: string;
  eventDate: string;
  endDate?: string;
  venue?: string;
  organiser?: string;
  participants?: number;
  outcome?: string;
  images: Media[];
  videos: Media[];
  documents: Media[];
  coverImage: string | null;
};

export type EventsPagination = {
  page: number;
  limit: number;
  total: number;
  pages: number;
};

export type EventsResponse = {
  data: EventItem[];
  pagination: EventsPagination;
};

export const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

/**
 * Get paginated events
 *
 * Dashboard uses this function.
 */
export async function getEvents(
  category = "All",
  page = 1,
  limit = 5,
): Promise<EventsResponse> {
  const q = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });

  if (category !== "All") {
    q.set("category", category);
  }

  const res = await fetch(`${API_URL}/api/events?${q.toString()}`, {
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error("Could not load events");
  }

  const result = await res.json();
  console.log(result,"tajikgggg");

  return {
    data: result.data,
    pagination: result.pagination,
  };
}

export async function getEvent(
  slug: string,
): Promise<EventItem | null> {
  const res = await fetch(`${API_URL}/api/events/${slug}`, {
    cache: "no-store",
  });

  if (res.status === 404) {
    return null;
  }

  if (!res.ok) {
    throw new Error("Could not load event");
  }

  return (await res.json()).data;
}

export type FeatureItem = {
  _id: string;
  icon: string;
  title: string;
  text: string;
  tags: string[];
};

export async function getFeatures(
  section = "rdc",
): Promise<FeatureItem[]> {
  const res = await fetch(
    `${API_URL}/api/features?section=${section}`,
    {
      next: { revalidate: 60 },
    },
  );

  if (!res.ok) {
    throw new Error("Could not load features");
  }

  return (await res.json()).data;
}

export type GlanceItem = {
  _id: string;
  value: string;
  label: string;
  text: string;
  category?: string;
  footnote?: string;
  highlight?: boolean;
};

export async function getGlance(): Promise<GlanceItem[]> {
  const res = await fetch(`${API_URL}/api/glance`, {
    next: { revalidate: 60 },
  });

  if (!res.ok) {
    throw new Error("Could not load glance cards");
  }

  return (await res.json()).data;
}

export type LinkageItem = {
  _id: string;
  title: string;
  status: "Completed" | "Initiated" | "Linked" | "Planned";
  text: string;
};

export async function getLinkages(): Promise<LinkageItem[]> {
  const res = await fetch(`${API_URL}/api/linkages`, {
    next: { revalidate: 60 },
  });

  if (!res.ok) {
    throw new Error("Could not load linkages");
  }

  return (await res.json()).data;
}

export type PublicNotice = {
  _id: string;
  title: string;
  category: string;
  noticeDate?: string;
  text: string;
  files: Media[];
  createdAt: string;
};

export async function getNotices(
  opts: { category?: string; search?: string; page?: number; limit?: number } = {},
): Promise<{ data: PublicNotice[]; pagination: EventsPagination }> {
  const q = new URLSearchParams({
    page: String(opts.page ?? 1),
    limit: String(opts.limit ?? 10),
  });
  if (opts.category && opts.category !== "all") q.set("category", opts.category);
  if (opts.search) q.set("search", opts.search);

  const res = await fetch(`${API_URL}/api/notices?${q}`, { next: { revalidate: 30 } });
  if (!res.ok) throw new Error("Could not load notices");
  const json = await res.json();
  return { data: json.data, pagination: json.pagination };
}

// ─── Facilities ───────────────────────────────────────────────────────────────
export type FacilityItem = {
  _id: string;
  name: string;
  slug: string;
  description: string;
  category: string;
  location?: string;
  operatingHours?: string;
  contactDetails?: string;
  amenities: string[];
  images: Media[];
  documents: Media[];
  coverImage?: string | null;
  isPublished: boolean;
  createdAt?: string;
};

export async function getFacilities(
  opts: { category?: string; search?: string; page?: number; limit?: number } = {},
): Promise<{ data: FacilityItem[]; pagination: EventsPagination }> {
  const q = new URLSearchParams({ page: String(opts.page ?? 1), limit: String(opts.limit ?? 12) });
  if (opts.category && opts.category !== "all") q.set("category", opts.category);
  if (opts.search) q.set("search", opts.search);
  const res = await fetch(`${API_URL}/api/facilities?${q}`, { next: { revalidate: 30 } });
  if (!res.ok) throw new Error("Could not load facilities");
  const json = await res.json();
  return { data: json.data, pagination: json.pagination };
}

export async function getFacility(slug: string): Promise<FacilityItem | null> {
  const res = await fetch(`${API_URL}/api/facilities/${slug}`, { next: { revalidate: 30 } });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error("Could not load facility");
  return (await res.json()).data;
}



