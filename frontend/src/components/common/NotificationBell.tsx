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
import {
  getNotificationDestinationPath,
  getNotificationsPath,
} from '../../features/notification/notificationNavigation';

/** Legacy notifications stored the deadline as yyyy-mm-dd; normalize to dd-mm-yyyy for display. */
function formatSelfAssessmentNotificationMessage(message: string): string {
  return message.replace(
    /Deadline:\s*(\d{4})-(\d{2})-(\d{2})\s*$/u,
    (_match, year, month, day) => `Deadline: ${day}-${month}-${year}`,
  );
}

function formatCreatedAt(value: string) {
  const elapsedSeconds = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 1000));
  const units = [
    ['year', 31536000],
    ['month', 2592000],
    ['week', 604800],
    ['day', 86400],
    ['hour', 3600],
    ['minute', 60],
  ] as const;

  for (const [unit, seconds] of units) {
    const count = Math.floor(elapsedSeconds / seconds);
    if (count >= 1) {
      return `${count} ${unit}${count === 1 ? '' : 's'} ago`;
    }
  }

  return 'Just now';
}

type NotificationTab = 'all' | 'unread' | 'read';

function getInitialNotificationTab(): NotificationTab {
  const savedTab = localStorage.getItem('notifTab');
  return savedTab === 'unread' || savedTab === 'read' ? savedTab : 'all';
}

function getNotificationTitle(notification: NotificationItem) {
  return notification.source === '360_FEEDBACK' ? '360 Feedback' : notification.title;
}

function getNotificationActionLabel(notification: NotificationItem) {
  const text = `${notification.title ?? ''} ${notification.message ?? ''}`.toUpperCase();
  if (notification.source === '360_FEEDBACK' && (text.includes('NEW REVIEW CYCLE') || text.includes('REVIEW CYCLE HAS STARTED'))) {
    return 'Open Give Feedback';
  }
  return null;
}

export function NotificationBell() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
  const [selectedTab, setSelectedTab] = useState<NotificationTab>(getInitialNotificationTab);
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

  useEffect(() => {
    localStorage.setItem('notifTab', selectedTab);
  }, [selectedTab]);

  const filteredNotifications = notifications.filter((notification) => {
    if (selectedTab === 'unread') return !notification.read;
    if (selectedTab === 'read') return notification.read;
    return true;
  });

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
    const destinationPath = getNotificationDestinationPath(notification, location.pathname);
    const isSameDestination = destinationPath === location.pathname;
    navigate(destinationPath, isSameDestination ? { replace: true, state: { notificationRefreshToken: Date.now() } } : undefined);
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

  const handleViewAll = () => {
    setAnchorEl(null);
    navigate(getNotificationsPath(location.pathname));
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
            sx={{ fontSize: 11, fontWeight: 800, textTransform: 'none', color: 'rgb(13 148 136)' }}
          >
            Read All
          </Button>
        </Box>
        <Divider />
        <Box sx={{ display: 'flex', borderBottom: '1px solid rgb(229 231 235)' }}>
          {[
            ['all', 'All'],
            ['unread', 'Unread'],
            ['read', 'Read'],
          ].map(([value, label]) => {
            const isActive = selectedTab === value;
            return (
              <Button
                key={value}
                onClick={() => setSelectedTab(value as NotificationTab)}
                sx={{
                  flex: 1,
                  py: 1,
                  borderRadius: 0,
                  borderBottom: isActive ? '2px solid rgb(13 148 136)' : '2px solid transparent',
                  color: isActive ? 'rgb(13 148 136)' : 'rgb(107 114 128)',
                  fontSize: 13,
                  fontWeight: 700,
                  textTransform: 'none',
                  '&:hover': { backgroundColor: 'rgb(240 253 250)' },
                }}
              >
                {label}
              </Button>
            );
          })}
        </Box>

        {isFetching && notifications.length === 0 ? (
          <Box sx={{ py: 5, display: 'flex', justifyContent: 'center' }}>
            <CircularProgress size={24} />
          </Box>
        ) : filteredNotifications.length === 0 ? (
          <Box sx={{ px: 3, py: 5, textAlign: 'center' }}>
            <Box component="p" sx={{ m: 0, fontSize: 13, fontWeight: 700, color: 'rgb(100 116 139)' }}>
              {notifications.length === 0 ? 'No notifications yet' : `No ${selectedTab} notifications`}
            </Box>
          </Box>
        ) : (
          <List disablePadding sx={{ maxHeight: 420, overflowY: 'auto' }}>
            {filteredNotifications.map((notification) => (
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
                    {getNotificationTitle(notification)}
                  </Box>
                  <Box
                    component="p"
                    sx={{
                      m: 0,
                      mt: 0.25,
                      fontSize: 12,
                      fontWeight: 600,
                      color: 'rgb(71 85 105)',
                      overflowWrap: 'anywhere',
                    }}
                  >
                    {formatSelfAssessmentNotificationMessage(notification.message)}
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
                  {getNotificationActionLabel(notification) && (
                    <Box
                      component="p"
                      sx={{
                        m: 0,
                        mt: 0.75,
                        fontSize: 11,
                        fontWeight: 900,
                        color: 'rgb(13 148 136)',
                      }}
                    >
                      {getNotificationActionLabel(notification)}
                    </Box>
                  )}
                </Box>
              </ListItemButton>
            ))}
          </List>
        )}
        <Divider />
        <Box sx={{ p: 1.25 }}>
          <Button
            fullWidth
            variant="text"
            onClick={handleViewAll}
            sx={{
              py: 1,
              borderRadius: 1.5,
              fontSize: 13,
              fontWeight: 800,
              textTransform: 'none',
              color: 'rgb(13 148 136)',
              '&:hover': { backgroundColor: 'rgb(240 253 250)' },
            }}
          >
            View All
          </Button>
        </Box>
      </Popover>
    </>
  );
}
