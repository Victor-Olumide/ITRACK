import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { AuthenticatedUser } from "../api/auth/types";

export interface AuthState {
  user: AuthenticatedUser | null;
  isAuthenticated: boolean;
  sessionExpired: boolean;
}

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  sessionExpired: false,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setAuthenticatedUser: (
      state,
      action: PayloadAction<AuthenticatedUser>,
    ) => {
      state.user = action.payload;
      state.isAuthenticated = true;
      state.sessionExpired = false;
    },

    clearAuth: (state) => {
      state.user = null;
      state.isAuthenticated = false;
      state.sessionExpired = false;
    },

    markSessionExpired: (state) => {
      state.user = null;
      state.isAuthenticated = false;
      state.sessionExpired = true;
    },
  },
});

export const {
  setAuthenticatedUser,
  clearAuth,
  markSessionExpired,
} = authSlice.actions;

export default authSlice.reducer;
