import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { clearNotifications } from '../features/notification/notificationSlice';
import { NotificationPage } from './NotificationPage';

const mocks = vi.hoisted(() => ({
  dispatch: vi.fn(),
  getNotifications: vi.fn(),
  getUnreadCount: vi.fn(),
  markRead: vi.fn(),
  markAllRead: vi.fn(),
  clearAllNotifications: vi.fn(),
  notificationsResponse: {
    data: {
      content: [
        {
          id: 1,
          userId: 3,
          title: 'Template assigned',
          message: 'Please complete your form',
          source: 'SELF_ASSESSMENT_FORM',
          read: false,
          createdAt: '2026-05-06T10:00:00',
        },
      ],
      totalElements: 12,
      totalPages: 3,
      number: 0,
      size: 10,
    },
  },
}));

vi.mock('../app/hooks', () => ({
  useAppDispatch: () => mocks.dispatch,
  useAppSelector: () => ({ unreadCount: 4 }),
}));

vi.mock('../features/notification/notificationApi', () => ({
  useGetNotificationsQuery: (params: unknown) => mocks.getNotifications(params),
  useGetUnreadCountQuery: () => mocks.getUnreadCount(),
  useMarkNotificationAsReadMutation: () => [mocks.markRead],
  useMarkAllNotificationsAsReadMutation: () => [mocks.markAllRead, { isLoading: false }],
  useClearAllNotificationsMutation: () => [mocks.clearAllNotifications, { isLoading: false }],
}));

describe('NotificationPage filters', () => {
  beforeEach(() => {
    mocks.dispatch.mockReset();
    mocks.getNotifications.mockReset();
    mocks.getUnreadCount.mockReset();
    mocks.markRead.mockReset();
    mocks.markAllRead.mockReset();
    mocks.clearAllNotifications.mockReset();
    mocks.getNotifications.mockReturnValue({
      data: mocks.notificationsResponse,
      isLoading: false,
      isFetching: false,
    });
    mocks.getUnreadCount.mockReturnValue({ data: { data: 4 } });
    mocks.markRead.mockReturnValue({ unwrap: () => Promise.resolve({}) });
    mocks.markAllRead.mockReturnValue({ unwrap: () => Promise.resolve({}) });
    mocks.clearAllNotifications.mockReturnValue({ unwrap: () => Promise.resolve({}) });
  });

  afterEach(() => {
    cleanup();
  });

  it('passes status and category filters to the notifications query', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={['/hr/notifications']}>
        <NotificationPage />
      </MemoryRouter>,
    );

    expect(mocks.getNotifications).toHaveBeenLastCalledWith({
      page: 0,
      size: 10,
      status: 'all',
      source: undefined,
    });

    await user.click(screen.getByRole('button', { name: 'Unread' }));
    expect(mocks.getNotifications).toHaveBeenLastCalledWith({
      page: 0,
      size: 10,
      status: 'unread',
      source: undefined,
    });

    await user.selectOptions(screen.getByLabelText('Notification category'), 'PIP');
    expect(mocks.getNotifications).toHaveBeenLastCalledWith({
      page: 0,
      size: 10,
      status: 'unread',
      source: 'PIP',
    });
  });

  it('resets the page to zero when status or category changes', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={['/manager/notifications']}>
        <NotificationPage />
      </MemoryRouter>,
    );

    await user.click(screen.getByRole('button', { name: '2' }));
    expect(mocks.getNotifications).toHaveBeenLastCalledWith(
      expect.objectContaining({
        page: 1,
      }),
    );

    await user.click(screen.getByRole('button', { name: 'Read' }));
    expect(mocks.getNotifications).toHaveBeenLastCalledWith(
      expect.objectContaining({
        page: 0,
        status: 'read',
      }),
    );

    await user.click(screen.getByRole('button', { name: '3' }));
    expect(mocks.getNotifications).toHaveBeenLastCalledWith(
      expect.objectContaining({
        page: 2,
      }),
    );

    await user.selectOptions(screen.getByLabelText('Notification category'), 'KPI');
    expect(mocks.getNotifications).toHaveBeenLastCalledWith(
      expect.objectContaining({
        page: 0,
        source: 'KPI',
      }),
    );
  });

  it('shows friendly category labels and filtered empty-state text', async () => {
    const user = userEvent.setup();
    mocks.getNotifications.mockReturnValue({
      data: {
        data: {
          content: [],
          totalElements: 0,
          totalPages: 0,
          number: 0,
          size: 10,
        },
      },
      isLoading: false,
      isFetching: false,
    });

    render(
      <MemoryRouter initialEntries={['/employee/notifications']}>
        <NotificationPage />
      </MemoryRouter>,
    );

    expect(screen.getByRole('option', { name: 'All Categories' })).toBeTruthy();
    expect(screen.getByRole('option', { name: '360 Feedback' })).toBeTruthy();
    expect(screen.getByRole('option', { name: 'One-on-one Meeting' })).toBeTruthy();
    expect(screen.getByRole('option', { name: 'Self-Assessment' })).toBeTruthy();

    await user.selectOptions(screen.getByLabelText('Notification category'), 'SELF_ASSESSMENT_FORM');

    expect(screen.getByText('No Self-Assessment notifications')).toBeTruthy();
  });

  it('renders clear all, confirms, dispatches local clear, and shows empty state after success', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={['/hr/notifications']}>
        <NotificationPage />
      </MemoryRouter>,
    );

    await user.click(screen.getByRole('button', { name: 'Clear all' }));

    expect(screen.getByText('Clear all notifications?')).toBeTruthy();
    expect(screen.getByText('This action cannot be undone.')).toBeTruthy();

    const clearButtons = screen.getAllByRole('button', { name: 'Clear all' });
    await user.click(clearButtons[clearButtons.length - 1]);

    expect(mocks.clearAllNotifications).toHaveBeenCalledTimes(1);
    expect(mocks.dispatch).toHaveBeenCalledWith(clearNotifications());
    expect(await screen.findByText('No notifications yet')).toBeTruthy();
  });
});
