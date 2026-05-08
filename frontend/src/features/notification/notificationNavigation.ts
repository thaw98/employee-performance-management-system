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
    return '/manager/self-assessment-forms/review-queue';
  }

  if (pathname.startsWith('/hr')) {
    return '/hr/self-assessment/review-queue';
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

type NotificationNavigationInput = Pick<NotificationItem, 'source' | 'title' | 'message'>;

function normalizeNotificationSource(source: string | undefined) {
  return source?.trim().toUpperCase() ?? '';
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
  return '';
}

export function getNotificationDestinationPath(notification: NotificationNavigationInput, pathname: string) {
  const source = normalizeNotificationSource(notification.source) || resolveLegacySource(notification);

  if (source === 'SELF_ASSESSMENT_FORM') {
    return getSelfAssessmentPath(pathname);
  }

  if (source === 'MEETING') {
    return getMeetingPath(pathname);
  }

  if (source === 'PIP') {
    return getPipPath(pathname);
  }

  if (source === 'APPRAISAL') {
    return getAppraisalPath(pathname);
  }

  if (source === 'KPI') {
    return getKpiPath(pathname);
  }

  return getFeedbackPath(pathname);
}
