import { useAppDispatch } from '@/lib/stores/hooks';
import { appApi } from '@/lib/api/app-api';
import { clearAuth } from '@/lib/stores/auth-slice';
import { useLogoutMutation } from '@/lib/api/auth/auth-api';

export function useLogout() {
	const dispatch = useAppDispatch();
	const [logoutTrigger] = useLogoutMutation();

	return async () => {
		try {
			await logoutTrigger().unwrap();
		} catch (error) {
			console.error('Logout request failed:', error);
		} finally {
			dispatch(clearAuth());
			dispatch(appApi.util.resetApiState());
		}
	};
}
