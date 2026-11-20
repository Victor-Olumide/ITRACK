import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export type ToastTone = "success" | "error" | "info";

export interface Toast {
  id: number;
  tone: ToastTone;
  message: string;
}

interface ToastState {
  items: Toast[];
  nextId: number;
}

// Keep the stack short so a burst of actions never covers the page.
const MAX_TOASTS = 3;

const initialState: ToastState = { items: [], nextId: 1 };

const toastSlice = createSlice({
  name: "toast",
  initialState,
  reducers: {
    showToast(state, action: PayloadAction<{ tone?: ToastTone; message: string }>) {
      state.items.push({ id: state.nextId, tone: action.payload.tone ?? "success", message: action.payload.message });
      state.nextId += 1;
      if (state.items.length > MAX_TOASTS) state.items.shift();
    },
    dismissToast(state, action: PayloadAction<number>) {
      state.items = state.items.filter((toast) => toast.id !== action.payload);
    },
  },
});

export const { showToast, dismissToast } = toastSlice.actions;
export default toastSlice.reducer;
