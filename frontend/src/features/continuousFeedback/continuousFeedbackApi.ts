import axiosInstance from '../../app/axiosInstance';
import type {
  ApiResponse,
  ContinuousFeedback,
  ContinuousFeedbackActionItem,
  ContinuousFeedbackActionItemRequest,
  ContinuousFeedbackActionItemStatusUpdateRequest,
  ContinuousFeedbackComment,
  ContinuousFeedbackCommentRequest,
  ContinuousFeedbackCreateRequest,
  ContinuousFeedbackDashboard,
  ContinuousFeedbackEvidence,
  ContinuousFeedbackUpdatePrivateNoteRequest,
  PipWarning,
} from './types';

const BASE_URL = '/continuous-feedback';

export const continuousFeedbackApi = {
  createFeedback: (data: ContinuousFeedbackCreateRequest) =>
    axiosInstance.post<ApiResponse<ContinuousFeedback>>(`${BASE_URL}`, data).then((r) => r.data),

  updatePrivateNote: (feedbackId: number, data: ContinuousFeedbackUpdatePrivateNoteRequest) =>
    axiosInstance
      .patch<ApiResponse<ContinuousFeedback>>(`${BASE_URL}/${feedbackId}/private-note`, data)
      .then((r) => r.data),

  shareFeedback: (feedbackId: number) =>
    axiosInstance.post<ApiResponse<ContinuousFeedback>>(`${BASE_URL}/${feedbackId}/share`).then((r) => r.data),

  getFeedback: (feedbackId: number) =>
    axiosInstance.get<ApiResponse<ContinuousFeedback>>(`${BASE_URL}/${feedbackId}`).then((r) => r.data),

  getMyFeedback: () =>
    axiosInstance.get<ApiResponse<ContinuousFeedback[]>>(`${BASE_URL}/my`).then((r) => r.data),

  getTeamFeedback: () =>
    axiosInstance.get<ApiResponse<ContinuousFeedback[]>>(`${BASE_URL}/my-team`).then((r) => r.data),

  getEmployeeFeedback: (employeeId: number) =>
    axiosInstance.get<ApiResponse<ContinuousFeedback[]>>(`${BASE_URL}/employee/${employeeId}`).then((r) => r.data),

  acknowledgeFeedback: (feedbackId: number) =>
    axiosInstance.post<ApiResponse<ContinuousFeedback>>(`${BASE_URL}/${feedbackId}/acknowledge`).then((r) => r.data),

  addActionItem: (feedbackId: number, data: ContinuousFeedbackActionItemRequest) =>
    axiosInstance
      .post<ApiResponse<ContinuousFeedbackActionItem>>(`${BASE_URL}/${feedbackId}/action-items`, data)
      .then((r) => r.data),

  updateActionItemStatus: (actionItemId: number, data: ContinuousFeedbackActionItemStatusUpdateRequest) =>
    axiosInstance
      .patch<ApiResponse<ContinuousFeedbackActionItem>>(`${BASE_URL}/action-items/${actionItemId}/status`, data)
      .then((r) => r.data),

  addComment: (feedbackId: number, data: ContinuousFeedbackCommentRequest) =>
    axiosInstance
      .post<ApiResponse<ContinuousFeedbackComment>>(`${BASE_URL}/${feedbackId}/comments`, data)
      .then((r) => r.data),

  getPipWarning: (employeeId: number) =>
    axiosInstance.get<ApiResponse<PipWarning>>(`${BASE_URL}/employee/${employeeId}/pip-warning`).then((r) => r.data),

  createPipFromFeedback: (feedbackId: number, triggerReason?: string) =>
    axiosInstance
      .post<ApiResponse<unknown>>(`${BASE_URL}/${feedbackId}/create-pip`, { triggerReason })
      .then((r) => r.data),

  createMeetingFromFeedback: (feedbackId: number, data?: { scheduledTime?: string; durationMinutes?: number; description?: string }) =>
    axiosInstance
      .post<ApiResponse<unknown>>(`${BASE_URL}/${feedbackId}/create-meeting`, data || {})
      .then((r) => r.data),

  getDashboard: () =>
    axiosInstance.get<ApiResponse<ContinuousFeedbackDashboard>>(`${BASE_URL}/dashboard`).then((r) => r.data),

  getEvidenceForEmployee: (employeeId: number, startDate?: string, endDate?: string) =>
    axiosInstance
      .get<ApiResponse<ContinuousFeedbackEvidence[]>>(`${BASE_URL}/evidence/employee/${employeeId}`, {
        params: { startDate, endDate },
      })
      .then((r) => r.data),
};
