export interface ContinuousFeedback {
  feedbackId: number;
  employeeId: number;
  employeeName: string;
  employeeBusinessId: string;
  managerId: number;
  managerName: string;
  category: ContinuousFeedbackCategory;
  feedbackMessage: string | null;
  privateManagerNote: string | null;
  visibilityStatus: 'PRIVATE_NOTE' | 'SHARED';
  shared: boolean;
  sharedAt: string | null;
  acknowledged: boolean;
  acknowledgedAt: string | null;
  supportingEvidence: boolean;
  pipSuggested: boolean;
  pipSuggestedAt: string | null;
  createdAt: string;
  updatedAt: string | null;
  createdByUserId: number;
  updatedByUserId: number | null;
  actionItems?: ContinuousFeedbackActionItem[];
  comments?: ContinuousFeedbackComment[];
}

export type ContinuousFeedbackCategory =
  | 'PRAISE'
  | 'COACHING'
  | 'IMPROVEMENT_NEEDED'
  | 'GOAL_PROGRESS'
  | 'BEHAVIORAL_NOTE'
  | 'ATTENDANCE'
  | 'COMMUNICATION'
  | 'TEAMWORK'
  | 'PERFORMANCE_RISK';

export const FEEDBACK_CATEGORY_LABELS: Record<ContinuousFeedbackCategory, string> = {
  PRAISE: 'Praise',
  COACHING: 'Coaching',
  IMPROVEMENT_NEEDED: 'Improvement Needed',
  GOAL_PROGRESS: 'Goal Progress',
  BEHAVIORAL_NOTE: 'Behavioral Note',
  ATTENDANCE: 'Attendance',
  COMMUNICATION: 'Communication',
  TEAMWORK: 'Teamwork',
  PERFORMANCE_RISK: 'Performance Risk',
};

export interface ContinuousFeedbackActionItem {
  actionItemId: number;
  feedbackId: number;
  description: string;
  dueDate: string | null;
  status: 'OPEN' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  completedAt: string | null;
  createdAt: string;
  updatedAt: string | null;
}

export interface ContinuousFeedbackComment {
  commentId: number;
  feedbackId: number;
  authorEmployeeId: number;
  authorEmployeeName: string;
  commentText: string;
  commentType: 'EMPLOYEE_REPLY' | 'MANAGER_FOLLOW_UP' | 'HR_NOTE' | 'AUDIT_NOTE';
  visibleToEmployee: boolean;
  createdAt: string;
}

export interface ContinuousFeedbackCreateRequest {
  employeeId: number;
  category: string;
  feedbackMessage?: string;
  privateManagerNote?: string;
  shareImmediately: boolean;
}

export interface ContinuousFeedbackUpdatePrivateNoteRequest {
  privateManagerNote: string;
}

export interface ContinuousFeedbackActionItemRequest {
  description: string;
  dueDate?: string;
}

export interface ContinuousFeedbackActionItemStatusUpdateRequest {
  status: string;
}

export interface ContinuousFeedbackCommentRequest {
  commentText: string;
  visibleToEmployee: boolean;
}

export interface ContinuousFeedbackDashboard {
  totalFeedbackRecords: number;
  feedbackByCategory: Record<string, number>;
  openActionItems: number;
  overdueActionItems: number;
  pipWarningCases: number;
  recentFeedback?: ContinuousFeedback[];
  overdueItems?: ContinuousFeedbackActionItem[];
}

export interface ContinuousFeedbackEvidence {
  feedbackId: number;
  category: string;
  feedbackMessage: string;
  managerName: string;
  createdAt: string;
  acknowledged: boolean;
  acknowledgedAt: string | null;
  actionItems: ContinuousFeedbackActionItem[];
}

export interface PipWarning {
  warningActive: boolean;
  negativeFeedbackCount: number;
  message: string;
  latestFeedbackId: number | null;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}