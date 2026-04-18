// src/components/auth/AuthBootstrap.tsx
import { useEffect, useRef } from 'react';
import { useDispatch } from 'react-redux';
import { useLazyGetMeQuery } from '../../features/auth/authApi';
import { updateUser, logout } from '../../features/auth/authSlice';
import { useAppSelector } from '../../app/hooks';

export function AuthBootstrap() {
    const dispatch = useDispatch();
    const { token, user, isAuthenticated } = useAppSelector((state) => state.auth);
    const [getMe] = useLazyGetMeQuery();
    const attempted = useRef(false);

    useEffect(() => {
        if (!isAuthenticated || !token || attempted.current) {
            return;
        }
        attempted.current = true;

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