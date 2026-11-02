import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export type DashboardFilter = "All" | "RDC" | "IIC" | "Learning" | "Incubation" ;

const dashboardSlice = createSlice({
  name: "dashboard",
  initialState: { filter: "All" as DashboardFilter },
  reducers: {
    setFilter: (s, a: PayloadAction<DashboardFilter>) => { s.filter = a.payload; },
  },
});
export const { setFilter } = dashboardSlice.actions;
export default dashboardSlice.reducer;
