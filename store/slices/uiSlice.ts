import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface UiState { mobileMenuOpen: boolean }
const initialState: UiState = { mobileMenuOpen: false };

const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    toggleMobileMenu: (s) => { s.mobileMenuOpen = !s.mobileMenuOpen; },
    setMobileMenu: (s, a: PayloadAction<boolean>) => { s.mobileMenuOpen = a.payload; },
  },
});
export const { toggleMobileMenu, setMobileMenu } = uiSlice.actions;
export default uiSlice.reducer;
