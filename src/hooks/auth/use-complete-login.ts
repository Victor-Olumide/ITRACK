import { useAppDispatch } from '@/lib/stores/hooks';
import { setAuthenticatedUser } from '@/lib/stores/auth-slice';
import type { LoginResponse } from '@/lib/api/auth/types';

export const useCompleteLogin = () => {
	const dispatch = useAppDispatch();

	const completeLogin = ({ user }: LoginResponse) => {
		dispatch(setAuthenticatedUser(user));
	};

	return completeLogin;
};
