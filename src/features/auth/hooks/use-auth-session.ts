import { useEffect } from 'react';
import { useLocation } from 'react-router';
import { useAppDispatch, useAppSelector } from '@/lib/stores/hooks';
import { setAuthenticatedUser, clearAuth } from '@/lib/stores/auth-slice';
import { useGetMeQuery } from '@/lib/api/auth';

const SESSION_RECHECK_INTERVAL_SECONDS = 5 * 60;
const PUBLIC_PATHS = new Set(['/login', '/forgot-password']);

export function useAuthSession() {
  const { pathname } = useLocation();
  const dispatch = useAppDispatch();
  const { user, isAuthenticated } = useAppSelector((state) => state.auth);
  const shouldCheckSession = !isAuthenticated && !PUBLIC_PATHS.has(pathname);

  const meQuery = useGetMeQuery(undefined, {
    skip: !shouldCheckSession,
    refetchOnMountOrArgChange: SESSION_RECHECK_INTERVAL_SECONDS,
  });

  const { data, isSuccess, isError, error } = meQuery;

  useEffect(() => {
    if (!shouldCheckSession) return;

    if (isSuccess && data?.user) {
      dispatch(setAuthenticatedUser(data.user));
    } else if (isError) {
      dispatch(clearAuth());
    }
  }, [shouldCheckSession, data, isSuccess, isError, error, dispatch]);

  return {
    user,
    isAuthenticated,
    isLoading: shouldCheckSession && meQuery.isLoading,
  };
}
