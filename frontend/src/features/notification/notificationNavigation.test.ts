import { describe, expect, it } from 'vitest';
import { getNotificationDestinationPath } from './notificationNavigation';

describe('notification navigation', () => {
  it('deep-links HR self-assessment notifications when a form id is available', () => {
    expect(getNotificationDestinationPath({
      id: 1,
      userId: 2,
      title: 'Self-Assessment Disputed',
      message: 'A form was disputed',
      source: 'SELF_ASSESSMENT_FORM',
      targetId: 42,
      read: false,
      createdAt: '2026-05-09T10:00:00',
    }, '/hr/notifications')).toBe('/hr/self-assessment/reviews/42');
  });

  it('falls back to the HR queue for self-assessment notifications without a form id', () => {
    expect(getNotificationDestinationPath({
      id: 1,
      userId: 2,
      title: 'Self-Assessment Disputed',
      message: 'A form was disputed',
      source: 'SELF_ASSESSMENT_FORM',
      read: false,
      createdAt: '2026-05-09T10:00:00',
    }, '/hr/notifications')).toBe('/hr/self-assessment/review-queue');
  });
});
