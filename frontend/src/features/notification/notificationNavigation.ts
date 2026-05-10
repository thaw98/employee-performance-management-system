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

export function getPipPath(pathname: string) {
  if (pathname.startsWith('/hr')) {
    return '/hr/pip-monitoring';
  }

  if (pathname.startsWith('/manager')) {
    return '/manager/pip';
  }

  return '/employee/pip';
}

export function getAppraisalPath(pathname: string) {
  if (pathname.startsWith('/hr')) {
    return '/hr/appraisals';
  }

  if (pathname.startsWith('/manager')) {
    return '/manager/appraisals';
  }

  return '/employee/dashboard';
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

export function getNotificationDestinationPath(notification: Pick<NotificationItem, 'source'>, pathname: string) {
  if (notification.source === 'SELF_ASSESSMENT_FORM') {
    return getSelfAssessmentPath(pathname);
  }

  if (notification.source === 'MEETING') {
    return getMeetingPath(pathname);
  }

  if (notification.source === 'PIP') {
    return getPipPath(pathname);
  }

  if (notification.source === 'APPRAISAL') {
    return getAppraisalPath(pathname);
  }

  if (notification.source === 'KPI') {
    return getKpiPath(pathname);
  }

  return getFeedbackPath(pathname);
}
