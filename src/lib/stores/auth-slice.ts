import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { AuthenticatedUser } from "../api/auth";

export interface AuthState {
  user: AuthenticatedUser | null;
  isAuthenticated: boolean;
}

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
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
    },

    clearAuth: (state) => {
      state.user = null;
      state.isAuthenticated = false;
    },
  },
});

export const {
  setAuthenticatedUser,
  clearAuth,
} = authSlice.actions;

export default authSlice.reducer;
