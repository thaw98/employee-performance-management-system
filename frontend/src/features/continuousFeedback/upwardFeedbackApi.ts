import axiosInstance from '../../app/axiosInstance';
import type {
  ApiResponse,
  UpwardFeedback,
  UpwardFeedbackReply,
  UpwardFeedbackCreateRequest,
  UpwardFeedbackReplyRequest,
} from './types';

const BASE_URL = '/upward-feedback';

export const upwardFeedbackApi = {
  createFeedback: (data: UpwardFeedbackCreateRequest) =>
    axiosInstance.post<ApiResponse<UpwardFeedback>>(`${BASE_URL}`, data).then((r) => r.data),

  addReply: (feedbackId: number, data: UpwardFeedbackReplyRequest) =>
    axiosInstance.post<ApiResponse<UpwardFeedbackReply>>(`${BASE_URL}/${feedbackId}/reply`, data).then((r) => r.data),

  closeFeedback: (feedbackId: number) =>
    axiosInstance.patch<ApiResponse<UpwardFeedback>>(`${BASE_URL}/${feedbackId}/close`).then((r) => r.data),

  getFeedback: (feedbackId: number) =>
    axiosInstance.get<ApiResponse<UpwardFeedback>>(`${BASE_URL}/${feedbackId}`).then((r) => r.data),

  getMySentFeedback: () =>
    axiosInstance.get<ApiResponse<UpwardFeedback[]>>(`${BASE_URL}/my-sent`).then((r) => r.data),

  getMyReceivedFeedback: () =>
    axiosInstance.get<ApiResponse<UpwardFeedback[]>>(`${BASE_URL}/my-received`).then((r) => r.data),

  listAll: () =>
    axiosInstance.get<ApiResponse<UpwardFeedback[]>>(`${BASE_URL}`).then((r) => r.data),
};
