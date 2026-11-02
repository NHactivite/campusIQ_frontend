import { configureStore } from "@reduxjs/toolkit";
import ui from "./slices/uiSlice";
import pathway from "./slices/pathwaySlice";
import dashboard from "./slices/dashboardSlice";
import events from "./slices/eventsSlice";

export const makeStore = () => configureStore({ reducer: { ui, pathway, dashboard, events } });

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore["getState"]>;
export type AppDispatch = AppStore["dispatch"];