// src/components/auth/AuthBootstrap.tsx
import { useEffect, useRef } from 'react';
import { baseApi } from '../../app/baseApi';
import { useLazyGetMeQuery } from '../../features/auth/authApi';
import { updateUser, logout } from '../../features/auth/authSlice';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { websocketService } from '../../services/websocketService';
import { resetNotifications } from '../../features/notification/notificationSlice';

export function AuthBootstrap() {
    const dispatch = useAppDispatch();
    const { token, user, isAuthenticated } = useAppSelector((state) => state.auth);
    const [getMe] = useLazyGetMeQuery();
    const attemptedTokenRef = useRef<string | null>(null);
    const activeAccountRef = useRef<string | null>(null);

    useEffect(() => {
        const accountKey = isAuthenticated && token && user
            ? `${user.id}:${token}`
            : null;

        if (activeAccountRef.current === accountKey) {
            return;
        }

        activeAccountRef.current = accountKey;
        dispatch(resetNotifications());

        if (accountKey && token) {
            // Ensure notifications are re-fetched for the active account.
            dispatch(baseApi.util.invalidateTags(['Notification']));
            websocketService.connect(token, dispatch);
        } else {
            websocketService.disconnect();
        }

        return () => {
            if (!accountKey) {
                websocketService.disconnect();
            }
        };
    }, [dispatch, isAuthenticated, token, user]);

    useEffect(() => {
        if (!isAuthenticated || !token || attemptedTokenRef.current === token) {
            return;
        }
        attemptedTokenRef.current = token;

        getMe()
            .unwrap()
            .then((response) => {
                if (response.success && response.data) {
                    const freshUser = response.data;

                    // Check if user data changed (especially mustChangePassword)
                    if (user?.mustChangePassword !== freshUser.mustChangePassword) {
                        dispatch(updateUser({ mustChangePassword: freshUser.mustChangePassword }));
                    }

                    // If role changed, need to re-authenticate
                    if (user?.roleId !== freshUser.roleId) {
                        console.warn('User role changed, logging out');
                        dispatch(logout());
                    }
                }
            })
            .catch(() => {
                // Silent fail - token might be invalid but still in storage
                console.debug('Failed to refresh user data');
            });
    }, [dispatch, getMe, isAuthenticated, token, user]);

    return null;
}
