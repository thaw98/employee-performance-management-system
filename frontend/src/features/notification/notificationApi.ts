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

interface GetNotificationsParams {
  page?: number;
  size?: number;
  status?: 'all' | 'unread' | 'read';
  source?: string;
}

export const notificationApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getNotifications: builder.query<ApiResponse<PageResponse<NotificationItem>>, GetNotificationsParams | void>({
      query: (params) => {
        const page = params?.page ?? 0;
        const size = params?.size ?? 10;
        const searchParams = new URLSearchParams({
          page: String(page),
          size: String(size),
        });

        if (params?.status) {
          searchParams.set('status', params.status);
        }

        if (params?.source) {
          searchParams.set('source', params.source);
        }

        return `/notifications?${searchParams.toString()}`;
      },
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
    clearAllNotifications: builder.mutation<ApiResponse<void>, void>({
      query: () => ({
        url: '/notifications',
        method: 'DELETE',
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
  useClearAllNotificationsMutation,
} = notificationApi;
