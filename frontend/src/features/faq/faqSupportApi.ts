import { baseApi } from '../../app/baseApi';

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

export type FaqCategory = 'KPI' | 'PIP' | 'FEEDBACK' | 'ASSESSMENT' | 'APPRAISAL';
export type FaqSupportStatus = 'OPEN' | 'ANSWERED';

export interface FaqSupportQuestion {
  id: number;
  submitterUserId: number;
  submitterName: string;
  submitterEmail?: string | null;
  departmentName?: string | null;
  category: FaqCategory;
  subject: string;
  question: string;
  answer?: string | null;
  answeredByUserId?: number | null;
  answeredByName?: string | null;
  status: FaqSupportStatus;
  published: boolean;
  createdAt: string;
  answeredAt?: string | null;
  publishedAt?: string | null;
  updatedAt?: string | null;
}

export interface SubmitFaqQuestionRequest {
  category: FaqCategory;
  subject: string;
  question: string;
}

export interface ReplyFaqQuestionRequest {
  id: number;
  answer: string;
}

export const faqSupportApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getMyFaqQuestions: builder.query<ApiResponse<PageResponse<FaqSupportQuestion>>, { page?: number; size?: number } | void>({
      query: (params) => {
        const queryParams = (params ?? {}) as { page?: number; size?: number };
        const searchParams = new URLSearchParams({
          page: String(queryParams.page ?? 0),
          size: String(queryParams.size ?? 5),
        });
        return `/faq-support/questions/my?${searchParams.toString()}`;
      },
      providesTags: ['FaqSupport'],
    }),
    getPublishedFaqQuestions: builder.query<ApiResponse<PageResponse<FaqSupportQuestion>>, { page?: number; size?: number } | void>({
      query: (params) => {
        const queryParams = (params ?? {}) as { page?: number; size?: number };
        const searchParams = new URLSearchParams({
          page: String(queryParams.page ?? 0),
          size: String(queryParams.size ?? 20),
        });
        return `/faq-support/questions/published?${searchParams.toString()}`;
      },
      providesTags: ['FaqSupport'],
    }),
    submitFaqQuestion: builder.mutation<ApiResponse<FaqSupportQuestion>, SubmitFaqQuestionRequest>({
      query: (body) => ({
        url: '/faq-support/questions',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['FaqSupport', 'Notification'],
    }),
    getHrFaqQuestions: builder.query<ApiResponse<PageResponse<FaqSupportQuestion>>, { status?: 'all' | FaqSupportStatus; page?: number; size?: number }>({
      query: (params) => {
        const searchParams = new URLSearchParams({
          status: params.status ?? 'all',
          page: String(params.page ?? 0),
          size: String(params.size ?? 10),
        });
        return `/faq-support/hr/questions?${searchParams.toString()}`;
      },
      providesTags: ['FaqSupport'],
    }),
    replyFaqQuestion: builder.mutation<ApiResponse<FaqSupportQuestion>, ReplyFaqQuestionRequest>({
      query: ({ id, answer }) => ({
        url: `/faq-support/hr/questions/${id}/reply`,
        method: 'PUT',
        body: { answer },
      }),
      invalidatesTags: ['FaqSupport', 'Notification'],
    }),
    publishFaqQuestion: builder.mutation<ApiResponse<FaqSupportQuestion>, number>({
      query: (id) => ({
        url: `/faq-support/hr/questions/${id}/publish`,
        method: 'PUT',
      }),
      invalidatesTags: ['FaqSupport'],
    }),
  }),
});

export const {
  useGetMyFaqQuestionsQuery,
  useGetPublishedFaqQuestionsQuery,
  useSubmitFaqQuestionMutation,
  useGetHrFaqQuestionsQuery,
  useReplyFaqQuestionMutation,
  usePublishFaqQuestionMutation,
} = faqSupportApi;
