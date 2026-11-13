import { useEffect, useState } from 'react';
import { useLocation } from 'react-router';
import { useAppDispatch, useAppSelector } from '@/lib/stores/hooks';
import {
	completeSessionRestore,
	setAuthenticatedUser,
} from '@/lib/stores/auth-slice';
import { useGetMeQuery } from '@/lib/api/auth/auth-api';

const PUBLIC_PATHS = new Set(['/login']);

export function useAuthSession() {
	const { pathname } = useLocation();
	const dispatch = useAppDispatch();
	const { user, isAuthenticated, sessionChecked } = useAppSelector((state) => state.auth);
	const [shouldRestoreSession] = useState(() => !PUBLIC_PATHS.has(pathname));

	const meQuery = useGetMeQuery(undefined, {
		skip: !shouldRestoreSession || sessionChecked,
	});

	const { data, isSuccess, isError, isLoading } = meQuery;

	useEffect(() => {
		if (!shouldRestoreSession || sessionChecked) return;

		if (isSuccess && data?.user) {
			dispatch(setAuthenticatedUser(data.user));
		}
		if (isSuccess || isError) {
			dispatch(completeSessionRestore());
		}
	}, [shouldRestoreSession, sessionChecked, data, isSuccess, isError, dispatch]);

	return {
		user,
		isAuthenticated,
		isLoading: shouldRestoreSession && !sessionChecked && isLoading,
	};
}
