// src/components/auth/AuthBootstrap.tsx
import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useLazyGetMeQuery } from '../../features/auth/authApi';
import { updateUser, logout } from '../../features/auth/authSlice';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { websocketService } from '../../services/websocketService';
import { resetNotifications } from '../../features/notification/notificationSlice';

export function AuthBootstrap() {
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const { token, user, expiresAt, isAuthenticated } = useAppSelector((state) => state.auth);
    const [getMe] = useLazyGetMeQuery();
    const attempted = useRef(false);

    useEffect(() => {
        if (isAuthenticated && token) {
            websocketService.connect(token, dispatch);
        } else {
            websocketService.disconnect();
            dispatch(resetNotifications());
        }

        return () => {
            if (!isAuthenticated || !token) {
                websocketService.disconnect();
            }
        };
    }, [dispatch, isAuthenticated, token]);

    useEffect(() => {
        if (token && !expiresAt) {
            dispatch(logout());
            navigate('/login', { replace: true });
            return;
        }

        if (!isAuthenticated || !expiresAt) {
            return;
        }

        const expiryMs = Date.parse(expiresAt);
        if (Number.isNaN(expiryMs)) {
            dispatch(logout());
            navigate('/login', { replace: true });
            return;
        }

        const msRemaining = expiryMs - Date.now();
        if (msRemaining <= 0) {
            dispatch(logout());
            toast.error('Session expired. Please login again.');
            navigate('/login', { replace: true });
            return;
        }

        const timer = window.setTimeout(() => {
            dispatch(logout());
            toast.error('Session expired. Please login again.');
            navigate('/login', { replace: true });
        }, msRemaining);

        return () => window.clearTimeout(timer);
    }, [dispatch, expiresAt, isAuthenticated, navigate, token]);

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
