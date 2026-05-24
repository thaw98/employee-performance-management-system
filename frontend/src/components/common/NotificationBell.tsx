import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone';
import {
  Badge,
  Box,
  Button,
  CircularProgress,
  Alert,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  List,
  ListItemButton,
  Popover,
} from '@mui/material';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import {
  clearNotifications,
  markAllAsRead,
  markAsRead,
  setNotifications,
  setUnreadCount,
  type NotificationItem,
} from '../../features/notification/notificationSlice';
import {
  useGetNotificationsQuery,
  useGetUnreadCountQuery,
  useClearAllNotificationsMutation,
  useMarkAllNotificationsAsReadMutation,
  useMarkNotificationAsReadMutation,
} from '../../features/notification/notificationApi';
import {
  getNotificationDestinationPath,
  getNotificationsPath,
} from '../../features/notification/notificationNavigation';

function appendMeridiemToPipDateTime(message: string): string {
  return message.replace(
    /(Date\/time:\s*\d{1,2}\s+[A-Za-z]{3}\s+\d{4}\s+)(\d{1,2}):(\d{2})(?!\s*[AP]M)/u,
    (_match, prefix, hourText, minute) => {
      const hour = Number(hourText);
      if (!Number.isFinite(hour) || hour < 0 || hour > 23) return `${prefix}${hourText}:${minute}`;
      const hour12 = hour % 12 || 12;
      const meridiem = hour >= 12 ? 'PM' : 'AM';
      return `${prefix}${String(hour12).padStart(2, '0')}:${minute} ${meridiem}`;
    },
  );
}

/** Legacy notifications stored the deadline as yyyy-mm-dd; normalize to dd-mm-yyyy for display. */
function formatSelfAssessmentNotificationMessage(message: string): string {
  return message.replace(
    /Deadline:\s*(\d{4})-(\d{2})-(\d{2})\s*$/u,
    (_match, year, month, day) => `Deadline: ${day}-${month}-${year}`,
  );
}

function formatNotificationMessage(notification: NotificationItem): string {
  const message = formatSelfAssessmentNotificationMessage(notification.message);
  return notification.source === 'PIP' ? appendMeridiemToPipDateTime(message) : message;
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

interface NotificationBellProps {
  variant?: 'default' | 'dash'
}

export function NotificationBell({ variant = 'default' }: NotificationBellProps) {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
  const [selectedTab, setSelectedTab] = useState<NotificationTab>(getInitialNotificationTab);
  const [isClearConfirmOpen, setIsClearConfirmOpen] = useState(false);
  const [clearError, setClearError] = useState('');
  const { notifications, unreadCount } = useAppSelector((state) => state.notification);
  const { data: notificationsResponse, isFetching } = useGetNotificationsQuery();
  const { data: unreadCountResponse } = useGetUnreadCountQuery();
  const [markRead] = useMarkNotificationAsReadMutation();
  const [markAllRead, { isLoading: isMarkingAll }] = useMarkAllNotificationsAsReadMutation();
  const [clearAllNotifications, { isLoading: isClearing }] = useClearAllNotificationsMutation();

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
    navigate(destinationPath, {
      replace: isSameDestination,
      state: { notificationRefreshToken: Date.now() },
    });
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

  const handleClearAll = async () => {
    setClearError('');
    try {
      await clearAllNotifications().unwrap();
      dispatch(clearNotifications());
      setIsClearConfirmOpen(false);
    } catch {
      setClearError('Unable to clear notifications. Please try again.');
    }
  };

  const handleViewAll = () => {
    setAnchorEl(null);
    navigate(getNotificationsPath(location.pathname));
  };

  const open = Boolean(anchorEl);
  const [dashOpen, setDashOpen] = useState(false);
  const dashWrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (variant !== 'dash') return;
    function handleClickOutside(event: MouseEvent) {
      if (dashWrapRef.current && !dashWrapRef.current.contains(event.target as Node)) {
        setDashOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [variant]);

  if (variant === 'dash') {
    const emptyLabel =
      notifications.length === 0
        ? 'No notifications yet'
        : selectedTab === 'unread'
          ? 'No unread notifications'
          : selectedTab === 'read'
            ? 'No read notifications'
            : 'No notifications';

    return (
      <>
        <div className={`top-bar-notify-wrap${dashOpen ? ' is-open' : ''}`} ref={dashWrapRef}>
          <button
            type="button"
            className="top-bar-notify-btn"
            aria-label="Notifications"
            aria-expanded={dashOpen}
            aria-haspopup="true"
            onClick={() => setDashOpen(!dashOpen)}
          >
            <i className="bi bi-bell" />
            {unreadCount > 0 && <span className="top-bar-notify-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>}
          </button>

          {dashOpen && (
            <div className="notify-dropdown" role="dialog" aria-label="Notifications">
              <div className="notify-dropdown-header">
                <div className="notify-dropdown-title-block">
                  <span className="notify-dropdown-icon-wrap">
                    <i className="bi bi-bell-fill" />
                  </span>
                  <div>
                    <h2 className="notify-dropdown-title">Notifications</h2>
                    <p className="notify-dropdown-subtitle">
                      {unreadCount === 1 ? '1 unread' : `${unreadCount} unread`}
                    </p>
                  </div>
                </div>
                <div className="notify-dropdown-actions">
                  <button
                    type="button"
                    className="notify-action-btn"
                    title="Mark all as read"
                    disabled={unreadCount === 0 || isMarkingAll}
                    onClick={(e) => {
                      e.stopPropagation();
                      void handleReadAll();
                    }}
                  >
                    <i className="bi bi-check2-all" />
                  </button>
                  <button
                    type="button"
                    className="notify-action-btn notify-action-btn--danger"
                    title="Clear all"
                    disabled={notifications.length === 0 || isFetching || isClearing}
                    onClick={(e) => {
                      e.stopPropagation();
                      setClearError('');
                      setIsClearConfirmOpen(true);
                    }}
                  >
                    <i className="bi bi-trash3" />
                  </button>
                </div>
              </div>
              <div className="notify-tabs" role="tablist">
                {(['all', 'unread', 'read'] as const).map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    className={`notify-tab${selectedTab === tab ? ' active' : ''}`}
                    role="tab"
                    aria-selected={selectedTab === tab}
                    onClick={() => setSelectedTab(tab)}
                  >
                    {tab === 'all' ? 'All' : tab === 'unread' ? 'Unread' : 'Read'}
                  </button>
                ))}
              </div>
              <div className="notify-list" role="tabpanel">
                {isFetching && notifications.length === 0 ? (
                  <div className="notify-empty">
                    <CircularProgress size={24} />
                  </div>
                ) : filteredNotifications.length === 0 ? (
                  <div className="notify-empty">
                    <div className="notify-empty-icon">
                      <i className="bi bi-bell-slash" />
                    </div>
                    <p>{emptyLabel}</p>
                  </div>
                ) : (
                  filteredNotifications.map((notification) => (
                    <button
                      key={notification.id}
                      type="button"
                      className={`notify-item${notification.read ? '' : ' unread'}`}
                      onClick={() => {
                        setDashOpen(false);
                        void handleNotificationClick(notification);
                      }}
                    >
                      <div className="notify-item-content">
                        <h3 className="notify-item-title">{getNotificationTitle(notification)}</h3>
                        <p className="notify-item-body">{formatNotificationMessage(notification)}</p>
                        <time className="notify-item-time">{formatCreatedAt(notification.createdAt)}</time>
                      </div>
                    </button>
                  ))
                )}
              </div>
              <div className="notify-dropdown-footer">
                <button type="button" className="notify-view-all" onClick={handleViewAll}>
                  <span>View All Notifications</span>
                  <i className="bi bi-arrow-right" />
                </button>
              </div>
            </div>
          )}
        </div>

        <Dialog
          open={isClearConfirmOpen}
          onClose={() => {
            if (!isClearing) setIsClearConfirmOpen(false);
          }}
          maxWidth="xs"
          fullWidth
        >
          <DialogTitle sx={{ fontSize: 18, fontWeight: 900 }}>Clear all notifications?</DialogTitle>
          <DialogContent sx={{ color: 'rgb(71 85 105)', fontSize: 14, fontWeight: 600 }}>
            This action cannot be undone.
            {clearError ? (
              <Alert severity="error" sx={{ mt: 2, fontSize: 12, fontWeight: 700 }}>
                {clearError}
              </Alert>
            ) : null}
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button disabled={isClearing} onClick={() => setIsClearConfirmOpen(false)} sx={{ textTransform: 'none', fontWeight: 800 }}>
              Cancel
            </Button>
            <Button
              disabled={isClearing}
              onClick={() => void handleClearAll()}
              variant="contained"
              color="error"
              sx={{ textTransform: 'none', fontWeight: 900 }}
            >
              {isClearing ? 'Clearing...' : 'Clear All'}
            </Button>
          </DialogActions>
        </Dialog>
      </>
    );
  }

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
          <Button
            size="small"
            disabled={notifications.length === 0 || isFetching || isClearing}
            onClick={() => {
              setClearError('');
              setIsClearConfirmOpen(true);
            }}
            sx={{ fontSize: 11, fontWeight: 800, textTransform: 'none', color: 'rgb(225 29 72)' }}
          >
            Clear All
          </Button>
        </Box>
        <Divider />
        {clearError ? (
          <Box sx={{ px: 2, py: 1 }}>
            <Alert severity="error" sx={{ fontSize: 12, fontWeight: 700 }}>
              {clearError}
            </Alert>
          </Box>
        ) : null}
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
            {filteredNotifications.map((notification, index) => (
              <ListItemButton
                key={notification.id}
                divider={index < filteredNotifications.length - 1}
                onClick={() => handleNotificationClick(notification)}
                sx={{
                  alignItems: 'flex-start',
                  gap: 1,
                  px: 2,
                  py: 1.5,
                  backgroundColor: notification.read ? 'white' : 'rgb(225 252 248)',
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
                    {formatNotificationMessage(notification)}
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

      <Dialog
        open={isClearConfirmOpen}
        onClose={() => {
          if (!isClearing) setIsClearConfirmOpen(false);
        }}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ fontSize: 18, fontWeight: 900 }}>Clear all notifications?</DialogTitle>
        <DialogContent sx={{ color: 'rgb(71 85 105)', fontSize: 14, fontWeight: 600 }}>
          This action cannot be undone.
          {clearError ? (
            <Alert severity="error" sx={{ mt: 2, fontSize: 12, fontWeight: 700 }}>
              {clearError}
            </Alert>
          ) : null}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button disabled={isClearing} onClick={() => setIsClearConfirmOpen(false)} sx={{ textTransform: 'none', fontWeight: 800 }}>
            Cancel
          </Button>
          <Button
            disabled={isClearing}
            onClick={handleClearAll}
            variant="contained"
            color="error"
            sx={{ textTransform: 'none', fontWeight: 900 }}
          >
            {isClearing ? 'Clearing...' : 'Clear All'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
