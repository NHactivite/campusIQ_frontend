import { createSlice, PayloadAction } from "@reduxjs/toolkit";

// Which stage of the Research-to-Impact pathway is open
const pathwaySlice = createSlice({
  name: "pathway",
  initialState: { activeStage: 0 },
  reducers: {
    setActiveStage: (s, a: PayloadAction<number>) => { s.activeStage = a.payload; },
  },
});
export const { setActiveStage } = pathwaySlice.actions;
export default pathwaySlice.reducer;
