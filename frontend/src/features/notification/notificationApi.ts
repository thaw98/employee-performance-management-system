import { baseApi } from '../../app/baseApi';
import type { NotificationItem } from './notificationSlice';

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

export const notificationApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getNotifications: builder.query<ApiResponse<PageResponse<NotificationItem>>, void>({
      query: () => '/notifications?page=0&size=10',
      providesTags: ['Notification'],
    }),
    getUnreadCount: builder.query<ApiResponse<number>, void>({
      query: () => '/notifications/unread-count',
      providesTags: ['Notification'],
    }),
    markNotificationAsRead: builder.mutation<ApiResponse<NotificationItem>, number>({
      query: (id) => ({
        url: `/notifications/${id}/read`,
        method: 'PUT',
      }),
      invalidatesTags: ['Notification'],
    }),
    markAllNotificationsAsRead: builder.mutation<ApiResponse<void>, void>({
      query: () => ({
        url: '/notifications/read-all',
        method: 'PUT',
      }),
      invalidatesTags: ['Notification'],
    }),
  }),
});

export const {
  useGetNotificationsQuery,
  useGetUnreadCountQuery,
  useMarkNotificationAsReadMutation,
  useMarkAllNotificationsAsReadMutation,
} = notificationApi;
