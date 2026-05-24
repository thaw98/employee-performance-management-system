import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AlertTriangle, BellRing, CheckCheck, ChevronLeft, ChevronRight, Inbox, Trash2 } from 'lucide-react';
import {
  clearNotifications,
  markAllAsRead,
  markAsRead,
  setUnreadCount,
  type NotificationItem,
} from '../features/notification/notificationSlice';
import {
  useGetNotificationsQuery,
  useGetUnreadCountQuery,
  useClearAllNotificationsMutation,
  useMarkAllNotificationsAsReadMutation,
  useMarkNotificationAsReadMutation,
} from '../features/notification/notificationApi';
import { getNotificationDestinationPath } from '../features/notification/notificationNavigation';
import { useAppDispatch, useAppSelector } from '../app/hooks';

type NotificationTab = 'all' | 'unread' | 'read';
type NotificationSourceFilter =
  | 'all'
  | 'APPRAISAL'
  | 'KPI'
  | '360_FEEDBACK'
  | 'MEETING'
  | 'PIP'
  | 'SELF_ASSESSMENT_FORM'
  | 'FAQ_SUPPORT';

const PAGE_SIZE = 10;
const CATEGORY_OPTIONS: { value: NotificationSourceFilter; label: string }[] = [
  { value: 'all', label: 'All Categories' },
  { value: 'APPRAISAL', label: 'Appraisal' },
  { value: 'KPI', label: 'KPI' },
  { value: '360_FEEDBACK', label: '360 Feedback' },
  { value: 'MEETING', label: 'One-on-one Meeting' },
  { value: 'PIP', label: 'PIP' },
  { value: 'SELF_ASSESSMENT_FORM', label: 'Self-Assessment' },
  { value: 'FAQ_SUPPORT', label: 'FAQ Support' },
];

const SOURCE_LABELS = CATEGORY_OPTIONS.reduce<Record<string, string>>((labels, option) => {
  if (option.value !== 'all') {
    labels[option.value] = option.label;
  }
  return labels;
}, {});

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

function getSourceLabel(source: string) {
  return SOURCE_LABELS[source] ?? source;
}

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

function formatMessage(notification: NotificationItem): string {
  const normalizedDeadline = notification.message.replace(
    /Deadline:\s*(\d{4})-(\d{2})-(\d{2})\s*$/u,
    (_match, year, month, day) => `Deadline: ${day}-${month}-${year}`,
  );
  return notification.source === 'PIP' ? appendMeridiemToPipDateTime(normalizedDeadline) : normalizedDeadline;
}

function formatCreatedAt(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return date.toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getPageItems(totalPages: number, page: number): (number | 'ellipsis')[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index);
  }

  const candidates = new Set([0, 1, totalPages - 2, totalPages - 1, page - 1, page, page + 1]);
  const pages = [...candidates].filter((item) => item >= 0 && item < totalPages).sort((a, b) => a - b);
  const items: (number | 'ellipsis')[] = [];
  let previous: number | null = null;

  for (const pageNumber of pages) {
    if (previous !== null && pageNumber - previous > 1) {
      items.push('ellipsis');
    }
    items.push(pageNumber);
    previous = pageNumber;
  }

  return items;
}

export function NotificationPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState<NotificationTab>('all');
  const [activeCategory, setActiveCategory] = useState<NotificationSourceFilter>('all');
  const [page, setPage] = useState(0);
  const [isClearConfirmOpen, setIsClearConfirmOpen] = useState(false);
  const [clearError, setClearError] = useState('');
  const [clearedLocally, setClearedLocally] = useState(false);
  const { unreadCount } = useAppSelector((state) => state.notification);
  const { data, isLoading, isFetching } = useGetNotificationsQuery({
    page,
    size: PAGE_SIZE,
    status: activeTab,
    source: activeCategory === 'all' ? undefined : activeCategory,
  });
  const { data: unreadCountResponse } = useGetUnreadCountQuery();
  const [markRead] = useMarkNotificationAsReadMutation();
  const [markAllRead, { isLoading: isMarkingAll }] = useMarkAllNotificationsAsReadMutation();
  const [clearAllNotifications, { isLoading: isClearing }] = useClearAllNotificationsMutation();

  const notifications = clearedLocally ? [] : data?.data?.content ?? [];
  const totalPages = clearedLocally ? 0 : data?.data?.totalPages ?? 0;
  const totalElements = clearedLocally ? 0 : data?.data?.totalElements ?? 0;
  const hasNotifications = totalElements > 0;

  const emptyText =
    totalElements === 0
      ? activeCategory === 'all'
        ? 'No notifications yet'
        : `No ${getSourceLabel(activeCategory)} notifications`
      : activeTab === 'unread'
        ? 'No unread notifications'
        : activeTab === 'read'
          ? 'No read notifications'
          : 'No notifications yet';

  useEffect(() => {
    if (typeof unreadCountResponse?.data === 'number') {
      dispatch(setUnreadCount(unreadCountResponse.data));
    }
  }, [dispatch, unreadCountResponse]);

  const handleTabChange = (nextTab: NotificationTab) => {
    setActiveTab(nextTab);
    setPage(0);
  };

  const handleCategoryChange = (nextCategory: NotificationSourceFilter) => {
    setActiveCategory(nextCategory);
    setPage(0);
  };

  const handleNotificationClick = async (notification: NotificationItem) => {
    if (!notification.read) {
      dispatch(markAsRead(notification.id));
      try {
        await markRead(notification.id).unwrap();
      } catch {
        if (typeof unreadCountResponse?.data === 'number') {
          dispatch(setUnreadCount(unreadCountResponse.data));
        } else {
          dispatch(setUnreadCount(unreadCount));
        }
      }
    }

    const destinationPath = getNotificationDestinationPath(notification, location.pathname);
    const isSameDestination = destinationPath === location.pathname;
    navigate(destinationPath, {
      replace: isSameDestination,
      state: { notificationRefreshToken: notification.id },
    });
  };

  const handleMarkAllRead = async () => {
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
      setClearedLocally(true);
      setPage(0);
      setIsClearConfirmOpen(false);
    } catch {
      setClearError('Unable to clear notifications. Please try again.');
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
            <BellRing size={22} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-800 tracking-tight">Notifications</h1>
            <p className="text-sm font-bold text-slate-400">{unreadCount} unread notifications</p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <button
            type="button"
            disabled={unreadCount === 0 || isMarkingAll}
            onClick={handleMarkAllRead}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-teal-600 text-white text-sm font-black disabled:opacity-40 disabled:cursor-not-allowed hover:bg-teal-700 transition-colors"
          >
            <CheckCheck size={18} />
            Mark all read
          </button>
          <button
            type="button"
            disabled={!hasNotifications || isLoading || isFetching || isClearing}
            onClick={() => {
              setClearError('');
              setIsClearConfirmOpen(true);
            }}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl border border-rose-200 bg-white text-rose-600 text-sm font-black disabled:opacity-40 disabled:cursor-not-allowed hover:bg-rose-50 transition-colors"
          >
            <Trash2 size={18} />
            Clear all
          </button>
        </div>
      </div>
      {clearError && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">
          {clearError}
        </div>
      )}

      <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
        <div className="flex border-b border-slate-100 bg-slate-50/60">
          {[
            ['all', 'All'],
            ['unread', 'Unread'],
            ['read', 'Read'],
          ].map(([value, label]) => {
            const isActive = activeTab === value;
            return (
              <button
                key={value}
                type="button"
                onClick={() => handleTabChange(value as NotificationTab)}
                className={`flex-1 px-4 py-3 text-sm font-black transition-colors border-b-2 ${
                  isActive
                    ? 'border-teal-600 text-teal-700 bg-white'
                    : 'border-transparent text-slate-500 hover:bg-white hover:text-slate-700'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
        <div className="px-6 py-4 border-b border-slate-100 bg-white flex items-center justify-between gap-3 flex-wrap">
          <span className="text-xs font-black uppercase tracking-widest text-slate-400">Category</span>
          <select
            value={activeCategory}
            onChange={(event) => handleCategoryChange(event.target.value as NotificationSourceFilter)}
            className="min-w-56 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 outline-none transition-colors focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
            aria-label="Notification category"
          >
            {CATEGORY_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {isLoading ? (
          <div className="p-10 space-y-4">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="h-20 rounded-xl bg-slate-100 animate-pulse" />
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-16 text-center text-slate-400">
            <Inbox size={46} className="mx-auto mb-4 opacity-40" />
            <p className="text-base font-black text-slate-500">{emptyText}</p>
          </div>
        ) : (
          <div className={isFetching ? 'opacity-70 transition-opacity' : 'transition-opacity'}>
            {notifications.map((notification) => (
              <button
                key={notification.id}
                type="button"
                onClick={() => handleNotificationClick(notification)}
                className={`w-full text-left px-6 py-5 border-b border-slate-100 last:border-b-0 flex gap-4 transition-colors hover:bg-teal-50/70 ${
                  notification.read ? 'bg-white' : 'bg-teal-50/55'
                }`}
              >
                <span
                  className={`mt-2 w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                    notification.read ? 'bg-transparent' : 'bg-teal-500'
                  }`}
                />
                <span className="min-w-0 flex-1">
                  <span className="flex flex-col gap-1 md:flex-row md:items-start md:justify-between">
                    <span className={`text-sm text-slate-900 ${notification.read ? 'font-bold' : 'font-black'}`}>
                      {getNotificationTitle(notification)}
                    </span>
                    <span className="text-xs font-bold text-slate-400 flex-shrink-0">
                      {formatCreatedAt(notification.createdAt)}
                    </span>
                  </span>
                  <span className="block mt-1 text-sm font-semibold text-slate-600 break-words">
                    {formatMessage(notification)}
                  </span>
                  <span className="block mt-2 text-[11px] font-black uppercase tracking-widest text-slate-400">
                    {getSourceLabel(notification.source)}
                  </span>
                  {getNotificationActionLabel(notification) && (
                    <span className="inline-flex mt-3 px-3 py-1 rounded-lg bg-teal-100 text-teal-700 text-[11px] font-black uppercase tracking-widest">
                      {getNotificationActionLabel(notification)}
                    </span>
                  )}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 flex-wrap">
          <button
            type="button"
            disabled={page === 0}
            onClick={() => setPage((current) => Math.max(0, current - 1))}
            className="p-2 rounded-lg bg-white border border-slate-200 text-slate-600 disabled:opacity-30 disabled:cursor-not-allowed hover:border-teal-200 hover:text-teal-700 transition-colors"
          >
            <ChevronLeft size={20} />
          </button>
          {getPageItems(totalPages, page).map((item, index) =>
            item === 'ellipsis' ? (
              <span key={`ellipsis-${index}`} className="px-1 text-slate-400 text-sm">
                ...
              </span>
            ) : (
              <button
                key={item}
                type="button"
                onClick={() => setPage(item)}
                className={`min-w-10 h-10 px-3 rounded-lg text-sm font-black border transition-colors ${
                  item === page
                    ? 'bg-teal-600 border-teal-600 text-white'
                    : 'bg-white border-slate-200 text-slate-600 hover:border-teal-200 hover:text-teal-700'
                }`}
              >
                {item + 1}
              </button>
            ),
          )}
          <button
            type="button"
            disabled={page >= totalPages - 1}
            onClick={() => setPage((current) => Math.min(totalPages - 1, current + 1))}
            className="p-2 rounded-lg bg-white border border-slate-200 text-slate-600 disabled:opacity-30 disabled:cursor-not-allowed hover:border-teal-200 hover:text-teal-700 transition-colors"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      )}

      {isClearConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-slate-900/45" onClick={() => !isClearing && setIsClearConfirmOpen(false)} />
          <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
                <AlertTriangle size={22} />
              </div>
              <div>
                <h2 className="text-lg font-black text-slate-900">Clear all notifications?</h2>
                <p className="mt-2 text-sm font-semibold text-slate-600">This action cannot be undone.</p>
              </div>
            </div>
            {clearError && (
              <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">
                {clearError}
              </div>
            )}
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                disabled={isClearing}
                onClick={() => setIsClearConfirmOpen(false)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-black text-slate-600 disabled:opacity-50 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isClearing}
                onClick={handleClearAll}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-rose-600 px-4 py-2 text-sm font-black text-white disabled:opacity-50 hover:bg-rose-700"
              >
                <Trash2 size={16} />
                {isClearing ? 'Clearing...' : 'Clear all'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default NotificationPage;
