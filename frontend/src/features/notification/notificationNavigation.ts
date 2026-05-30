import type { NotificationItem } from './notificationSlice';
import {
  EMPLOYEE_SELF_ASSESSMENT_MY_FORM_PATH,
  MANAGER_SELF_ASSESSMENT_MY_FORM_PATH,
} from '../../routes/employeeSelfAssessmentRoutes';

function getRolePrefix(pathname: string) {
  return pathname.split('/').filter(Boolean)[0] || 'employee';
}

export function getFeedbackPath(pathname: string) {
  return `/${getRolePrefix(pathname)}/360-feedback/received`;
}

/**
 * Routes a feedback notification to either the History (given) or Received page.
 *
 * Routing rules:
 * - GIVER (evaluator) should open Feedback History when they receive a chat/reply
 *   notification FROM the evaluatee.
 * - RECEIVER (evaluatee) should open Received Feedback when they receive a chat
 *   notification FROM the evaluator.
 *
 * The backend now includes a distinguishing phrase in the notification message:
 *  - "[EVALUATOR_RECIPIENT]" → notification was sent to the evaluator (giver) → history
 *  - "[EVALUATEE_RECIPIENT]" → notification was sent to the evaluatee (receiver) → received
 *
 * Legacy / explicit text cues are also checked for backward compatibility.
 */
export function getFeedbackRoutePath(
  pathname: string,
  notification: NotificationNavigationInput,
) {
  const prefix = getRolePrefix(pathname);
  // Default: received feedback page
  return `/${prefix}/360-feedback/received`;
}

export function getGiveFeedbackPath(pathname: string) {
  return `/${getRolePrefix(pathname)}/360-feedback/give`;
}

function isFeedbackCycleStartNotification(notification: NotificationNavigationInput) {
  const searchableText = `${notification.title ?? ''} ${notification.message ?? ''}`.toUpperCase();
  return searchableText.includes('NEW REVIEW CYCLE') || searchableText.includes('REVIEW CYCLE HAS STARTED');
}

function isManagerSelfAssessmentOwnFormNotification(notification: NotificationNavigationInput) {
  const searchableText = `${notification.title ?? ''} ${notification.message ?? ''}`.toUpperCase();
  return (
    searchableText.includes('RETAKE REQUESTED') ||
    searchableText.includes('ASSIGNED') ||
    searchableText.includes('MY FORM')
  ) && !searchableText.includes('FOR YOUR REVIEW');
}

function isSelfAssessmentUnlockRequestedNotification(notification: NotificationNavigationInput) {
  const searchableText = `${notification.title ?? ''} ${notification.message ?? ''}`.toUpperCase();
  return searchableText.includes('UNLOCK REQUESTED') || searchableText.includes('REQUESTED HR UNLOCK');
}

export function getSelfAssessmentPath(pathname: string, formId?: number | null, notification?: NotificationNavigationInput) {
  if (pathname.startsWith('/manager')) {
    if (notification && isManagerSelfAssessmentOwnFormNotification(notification)) {
      return MANAGER_SELF_ASSESSMENT_MY_FORM_PATH;
    }
    return formId ? `/manager/self-assessment-forms/reviews/${formId}` : '/manager/self-assessment-forms/review-queue';
  }

  if (pathname.startsWith('/hr')) {
    if (notification && isSelfAssessmentUnlockRequestedNotification(notification)) {
      return '/hr/self-assessment/unlock-requests';
    }
    return formId ? `/hr/self-assessment/reviews/${formId}` : '/hr/self-assessment/review-queue';
  }

  return EMPLOYEE_SELF_ASSESSMENT_MY_FORM_PATH;
}

export function getMeetingPath(pathname: string) {
  return `/${getRolePrefix(pathname)}/meetings`;
}

export function getPipPath(pathname: string) {
  if (pathname.startsWith('/hr')) {
    return '/hr/pip-monitoring';
  }

  if (pathname.startsWith('/manager')) {
    return '/manager/pip';
  }

  return '/employee/pip';
}

export function getAppraisalPath(pathname: string, assignmentId?: number | null) {
  if (pathname.startsWith('/hr')) {
    const base = '/hr/appraisals/submissions';
    return assignmentId ? `${base}?assignmentId=${assignmentId}` : base;
  }

  if (pathname.startsWith('/manager')) {
    return assignmentId ? `/manager/appraisals/${assignmentId}/evaluate` : '/manager/appraisals';
  }

  return assignmentId ? `/employee/appraisals/${assignmentId}/view` : '/employee/appraisals';
}

export function getKpiPath(pathname: string) {
  if (pathname.startsWith('/hr')) {
    return '/hr/kpi-management';
  }

  if (pathname.startsWith('/manager')) {
    return '/manager/kpis';
  }

  return '/employee/kpis';
}

export function getNotificationsPath(pathname: string) {
  return `/${getRolePrefix(pathname)}/notifications`;
}

export function getFaqSupportPath(pathname: string) {
  return pathname.startsWith('/hr') ? '/hr/settings/faq-support' : `/${getRolePrefix(pathname)}/faq`;
}

export function getTransferPath(pathname: string, employeeId?: number | null) {
  if (pathname.startsWith('/hr') && employeeId) {
    return `/hr/employees?employeeId=${employeeId}`;
  }
  if (employeeId) {
    return `/hr/employees?employeeId=${employeeId}`;
  }
  return `/${getRolePrefix(pathname)}/notifications`;
}

type NotificationNavigationInput = Pick<NotificationItem, 'source' | 'title' | 'message' | 'targetId'>;

function normalizeNotificationSource(source: string | undefined) {
  const normalized = source?.trim().toUpperCase() ?? '';
  return normalized === 'GENERAL' ? '' : normalized;
}

function resolveLegacySource(notification: NotificationNavigationInput) {
  const searchableText = `${notification.title ?? ''} ${notification.message ?? ''}`.toUpperCase();
  if (searchableText.includes('SELF-ASSESSMENT')) {
    return 'SELF_ASSESSMENT_FORM';
  }
  if (searchableText.includes('MEETING')) {
    return 'MEETING';
  }
  if (searchableText.includes('APPRAISAL')) {
    return 'APPRAISAL';
  }
  if (searchableText.includes('KPI')) {
    return 'KPI';
  }
  if (searchableText.includes('PIP')) {
    return 'PIP';
  }
  if (searchableText.includes('FEEDBACK')) {
    return '360_FEEDBACK';
  }
  if (searchableText.includes('FAQ')) {
    return 'FAQ_SUPPORT';
  }
  return '';
}

export function getNotificationDestinationPath(notification: NotificationNavigationInput, pathname: string) {
  const source = normalizeNotificationSource(notification.source) || resolveLegacySource(notification);

  if (source === 'SELF_ASSESSMENT_FORM') {
    return getSelfAssessmentPath(pathname, notification.targetId, notification);
  }

  if (source === 'MEETING') {
    return getMeetingPath(pathname);
  }

  if (source === 'PIP') {
    return getPipPath(pathname);
  }

  if (source === 'APPRAISAL') {
    return getAppraisalPath(pathname, notification.targetId);
  }

  if (source === 'KPI') {
    return getKpiPath(pathname);
  }

  if (source === 'FAQ_SUPPORT') {
    return getFaqSupportPath(pathname);
  }

  if (source === 'TRANSFER') {
    return getTransferPath(pathname, notification.targetId);
  }

  if (source === '360_FEEDBACK' && isFeedbackCycleStartNotification(notification)) {
    return getGiveFeedbackPath(pathname);
  }

  // Route to Feedback History (for givers) or Received Feedback (for receivers)
  // based on the embedded recipient marker set by the backend.
  return getFeedbackRoutePath(pathname, notification);
}
