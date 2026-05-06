import type { NotificationItem } from './notificationSlice';
import { EMPLOYEE_SELF_ASSESSMENT_MY_FORM_PATH } from '../../routes/employeeSelfAssessmentRoutes';

function getRolePrefix(pathname: string) {
  return pathname.split('/').filter(Boolean)[0] || 'employee';
}

export function getFeedbackPath(pathname: string) {
  return `/${getRolePrefix(pathname)}/360-feedback/received`;
}

export function getSelfAssessmentPath(pathname: string) {
  if (pathname.startsWith('/manager')) {
    return '/manager/self-assessment-forms/reviews';
  }

  if (pathname.startsWith('/hr')) {
    return '/hr/self-assessment/reviews';
  }

  return EMPLOYEE_SELF_ASSESSMENT_MY_FORM_PATH;
}

export function getMeetingPath(pathname: string) {
  return `/${getRolePrefix(pathname)}/meetings`;
}

export function getNotificationsPath(pathname: string) {
  return `/${getRolePrefix(pathname)}/notifications`;
}

export function getNotificationDestinationPath(notification: Pick<NotificationItem, 'source'>, pathname: string) {
  if (notification.source === 'SELF_ASSESSMENT_FORM') {
    return getSelfAssessmentPath(pathname);
  }

  if (notification.source === 'MEETING') {
    return getMeetingPath(pathname);
  }

  return getFeedbackPath(pathname);
}
