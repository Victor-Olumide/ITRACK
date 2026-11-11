import { useDispatch, useSelector } from "react-redux";
import type { RootState, AppDispatch } from "./store";

export type { AppDispatch, RootState };

export const useAppDispatch = (): AppDispatch => useDispatch<AppDispatch>();
export const useAppSelector = useSelector.withTypes<RootState>();
