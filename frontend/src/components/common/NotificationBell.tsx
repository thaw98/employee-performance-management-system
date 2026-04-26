import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone';
import {
  Badge,
  Box,
  Button,
  CircularProgress,
  Divider,
  IconButton,
  List,
  ListItemButton,
  Popover,
} from '@mui/material';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import {
  markAllAsRead,
  markAsRead,
  setNotifications,
  setUnreadCount,
  type NotificationItem,
} from '../../features/notification/notificationSlice';
import {
  useGetNotificationsQuery,
  useGetUnreadCountQuery,
  useMarkAllNotificationsAsReadMutation,
  useMarkNotificationAsReadMutation,
} from '../../features/notification/notificationApi';

function getFeedbackPath(pathname: string) {
  const prefix = pathname.split('/').filter(Boolean)[0] || 'employee';
  return `/${prefix}/360-feedback/received`;
}

function formatCreatedAt(value: string) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value));
}

export function NotificationBell() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
  const { notifications, unreadCount } = useAppSelector((state) => state.notification);
  const { data: notificationsResponse, isFetching } = useGetNotificationsQuery();
  const { data: unreadCountResponse } = useGetUnreadCountQuery();
  const [markRead] = useMarkNotificationAsReadMutation();
  const [markAllRead, { isLoading: isMarkingAll }] = useMarkAllNotificationsAsReadMutation();

  useEffect(() => {
    if (notificationsResponse?.data?.content) {
      dispatch(setNotifications(notificationsResponse.data.content));
    }
  }, [dispatch, notificationsResponse]);

  useEffect(() => {
    if (typeof unreadCountResponse?.data === 'number') {
      dispatch(setUnreadCount(unreadCountResponse.data));
    }
  }, [dispatch, unreadCountResponse]);

  const handleNotificationClick = async (notification: NotificationItem) => {
    setAnchorEl(null);
    if (!notification.read) {
      dispatch(markAsRead(notification.id));
      try {
        await markRead(notification.id).unwrap();
      } catch {
        dispatch(setUnreadCount(unreadCount));
      }
    }
    navigate(getFeedbackPath(location.pathname));
  };

  const handleReadAll = async () => {
    dispatch(markAllAsRead());
    try {
      await markAllRead().unwrap();
    } catch {
      if (typeof unreadCountResponse?.data === 'number') {
        dispatch(setUnreadCount(unreadCountResponse.data));
      }
    }
  };

  const open = Boolean(anchorEl);

  return (
    <>
      <IconButton
        aria-label="Notifications"
        onClick={(event) => setAnchorEl(event.currentTarget)}
        sx={{
          width: 40,
          height: 40,
          color: 'rgb(148 163 184)',
          '&:hover': { color: 'rgb(5 150 105)', backgroundColor: 'rgba(16, 185, 129, 0.08)' },
        }}
      >
        <Badge badgeContent={unreadCount} max={99} color="error">
          <NotificationsNoneIcon fontSize="small" />
        </Badge>
      </IconButton>

      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{
          paper: {
            sx: {
            mt: 1.5,
            width: 360,
            maxWidth: 'calc(100vw - 32px)',
            borderRadius: 2,
            border: '1px solid rgb(226 232 240)',
            boxShadow: '0 20px 45px rgba(15, 23, 42, 0.14)',
            },
          },
        }}
      >
        <Box sx={{ px: 2, py: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Box component="p" sx={{ m: 0, fontSize: 14, fontWeight: 800, color: 'rgb(15 23 42)' }}>
              Notifications
            </Box>
            <Box component="p" sx={{ m: 0, fontSize: 11, fontWeight: 700, color: 'rgb(100 116 139)' }}>
              {unreadCount} unread
            </Box>
          </Box>
          <Button
            size="small"
            disabled={unreadCount === 0 || isMarkingAll}
            onClick={handleReadAll}
            sx={{ fontSize: 11, fontWeight: 800, textTransform: 'none' }}
          >
            Mark all read
          </Button>
        </Box>
        <Divider />

        {isFetching && notifications.length === 0 ? (
          <Box sx={{ py: 5, display: 'flex', justifyContent: 'center' }}>
            <CircularProgress size={24} />
          </Box>
        ) : notifications.length === 0 ? (
          <Box sx={{ px: 3, py: 5, textAlign: 'center' }}>
            <Box component="p" sx={{ m: 0, fontSize: 13, fontWeight: 700, color: 'rgb(100 116 139)' }}>
              No notifications yet
            </Box>
          </Box>
        ) : (
          <List disablePadding sx={{ maxHeight: 420, overflowY: 'auto' }}>
            {notifications.map((notification) => (
              <ListItemButton
                key={notification.id}
                onClick={() => handleNotificationClick(notification)}
                sx={{
                  alignItems: 'flex-start',
                  gap: 1,
                  px: 2,
                  py: 1.5,
                  backgroundColor: notification.read ? 'white' : 'rgb(240 253 250)',
                }}
              >
                <Box
                  sx={{
                    width: 8,
                    height: 8,
                    mt: 1,
                    borderRadius: '50%',
                    backgroundColor: notification.read ? 'transparent' : 'rgb(20 184 166)',
                    flexShrink: 0,
                  }}
                />
                <Box sx={{ minWidth: 0 }}>
                  <Box
                    component="p"
                    sx={{
                      m: 0,
                      fontSize: 13,
                      fontWeight: notification.read ? 700 : 900,
                      color: 'rgb(15 23 42)',
                      overflowWrap: 'anywhere',
                    }}
                  >
                    {notification.message}
                  </Box>
                  <Box
                    component="p"
                    sx={{
                      m: 0,
                      mt: 0.5,
                      fontSize: 11,
                      fontWeight: 700,
                      color: 'rgb(100 116 139)',
                    }}
                  >
                    {formatCreatedAt(notification.createdAt)}
                  </Box>
                </Box>
              </ListItemButton>
            ))}
          </List>
        )}
      </Popover>
    </>
  );
}
