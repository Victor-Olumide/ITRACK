import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/lib/stores/hooks";
import { setAuthenticatedUser, clearAuth } from "../lib/stores/auth-slice";
import { useGetMeQuery } from "../lib/api/auth-api-slice";

const SESSION_RECHECK_INTERVAL_SECONDS = 5 * 60;

export function useAuthSession() {
  const dispatch = useAppDispatch();
  const { user, isAuthenticated } = useAppSelector((state) => state.auth);

  const meQuery = useGetMeQuery(undefined, {
    refetchOnMountOrArgChange: SESSION_RECHECK_INTERVAL_SECONDS,
  });

  const { data, isSuccess, isError, error } = meQuery;

  useEffect(() => {
    if (isSuccess && data?.user) {
      dispatch(setAuthenticatedUser(data.user));
    } else if (isError) {
      dispatch(clearAuth());
    }
  }, [data, isSuccess, isError, error, dispatch]);

  return {
    user,
    isAuthenticated,
    ...meQuery,
  };
}
