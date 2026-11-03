import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

import {
  getEvents,
  EventItem,
  EventsPagination,
} from "@/lib/api";

type FetchEventsArgs = {
  category: string;
  page?: number;
};

export const fetchEvents = createAsyncThunk<
  {
    data: EventItem[];
    pagination: EventsPagination;
    category: string;
  },
  FetchEventsArgs
>(
  "events/fetch",
  async (
    { category, page = 1 },
    { rejectWithValue },
  ) => {
    try {
      const result = await getEvents(
        category,
        page,
        5,
      );

      return {
        ...result,
        category,
      };
    } catch (e) {
      return rejectWithValue(
        (e as Error).message ||
          "Could not load events",
      );
    }
  },
);

interface EventsState {
  items: EventItem[];

  status:
    | "idle"
    | "loading"
    | "succeeded"
    | "failed";

  error: string | null;

  loadedFor: string | null;

  pagination: EventsPagination;
}

const initialState: EventsState = {
  items: [],

  status: "idle",

  error: null,

  loadedFor: null,

  pagination: {
    page: 1,
    limit: 5,
    total: 0,
    pages: 0,
  },
};

const eventsSlice = createSlice({
  name: "events",

  initialState,

  reducers: {},

  extraReducers: (b) => {

    // -----------------------------
    // LOADING
    // -----------------------------

    b.addCase(
      fetchEvents.pending,
      (s) => {
        s.status = "loading";
        s.error = null;
      },
    );

    // -----------------------------
    // SUCCESS
    // -----------------------------

    b.addCase(
      fetchEvents.fulfilled,
      (s, a) => {
        s.status = "succeeded";

        s.items = a.payload.data;

        s.pagination =
          a.payload.pagination;

        s.loadedFor =
          a.payload.category;
      },
    );

    // -----------------------------
    // ERROR
    // -----------------------------

    b.addCase(
      fetchEvents.rejected,
      (s, a) => {
        s.status = "failed";

        s.error =
          (a.payload as string) ??
          "Something went wrong";
      },
    );
  },
});

export default eventsSlice.reducer;