export const NOTIFICATION_SOURCE_LABELS: Record<string, string> = {
  APPRAISAL: 'Appraisal',
  KPI: 'KPI',
  '360_FEEDBACK': '360 Feedback',
  MEETING: 'One-on-one Meeting',
  PIP: 'PIP',
  SELF_ASSESSMENT_FORM: 'Self-Assessment',
};

export function getNotificationSourceLabel(source: string): string {
  return NOTIFICATION_SOURCE_LABELS[source] ?? source.replaceAll('_', ' ');
}
