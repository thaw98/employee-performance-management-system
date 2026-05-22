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

  it('deep-links HR appraisal submitted notifications to the matching submission', () => {
    expect(getNotificationDestinationPath({
      id: 1,
      userId: 2,
      title: 'Appraisal Submitted',
      message: 'Manager U Min Min Tun has submitted the performance appraisal evaluation for Daw Lisa Wong.',
      source: 'APPRAISAL',
      targetId: 17,
      read: false,
      createdAt: '2026-05-22T10:00:00',
    }, '/hr/dashboard')).toBe('/hr/appraisals/submissions?assignmentId=17');
  });

  it('routes legacy appraisal notifications when source is GENERAL', () => {
    expect(getNotificationDestinationPath({
      id: 1,
      userId: 2,
      title: 'Appraisal Submitted',
      message: 'Manager submitted an appraisal.',
      source: 'GENERAL',
      targetId: 9,
      read: false,
      createdAt: '2026-05-22T10:00:00',
    }, '/hr/notifications')).toBe('/hr/appraisals/submissions?assignmentId=9');
  });

  it('deep-links manager appraisal notifications to the evaluation page', () => {
    expect(getNotificationDestinationPath({
      id: 1,
      userId: 2,
      title: 'Appraisal Reset for Re-evaluation',
      message: 'HR has reset the appraisal evaluation.',
      source: 'APPRAISAL',
      targetId: 4,
      read: false,
      createdAt: '2026-05-22T10:00:00',
    }, '/manager/dashboard')).toBe('/manager/appraisals/4/evaluate');
  });
});
