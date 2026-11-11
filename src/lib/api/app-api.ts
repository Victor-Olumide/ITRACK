import { createApi } from "@reduxjs/toolkit/query/react";
import { appBaseQuery } from "./base-query";

export const appApi = createApi({
  reducerPath: "appApi",
  baseQuery: appBaseQuery,
  tagTypes: [
    "Auth",
    "User",
    "Ticket",
    "Device",
    "GatePass",
    "Stock",
    "Notification",
    "Audit",
    "Location",
    "Category",
  ],
  endpoints: () => ({}),
});
