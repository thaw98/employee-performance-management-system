import { describe, expect, it } from 'vitest';
import { getNotificationDestinationPath } from './notificationNavigation';

describe('notification navigation', () => {
  it('deep-links HR self-assessment notifications when a form id is available', () => {
    expect(getNotificationDestinationPath({
      title: 'Self-Assessment Disputed',
      message: 'A form was disputed',
      source: 'SELF_ASSESSMENT_FORM',
      targetId: 42,
    }, '/hr/notifications')).toBe('/hr/self-assessment/reviews/42');
  });

  it('falls back to the HR queue for self-assessment notifications without a form id', () => {
    expect(getNotificationDestinationPath({
      title: 'Self-Assessment Disputed',
      message: 'A form was disputed',
      source: 'SELF_ASSESSMENT_FORM',
    }, '/hr/notifications')).toBe('/hr/self-assessment/review-queue');
  });

  it('routes HR self-assessment unlock requests to the unlock requests page', () => {
    expect(getNotificationDestinationPath({
      title: 'Self-Assessment Unlock Requested',
      message: 'U Kaung Sithu requested HR unlock for Q1 2026 Self-Assessment Form. Reason: Wrong rating selected.',
      source: 'SELF_ASSESSMENT_FORM',
      targetId: 4,
    }, '/hr/dashboard')).toBe('/hr/self-assessment/unlock-requests');
  });

  it('deep-links HR appraisal submitted notifications to the matching submission', () => {
    expect(getNotificationDestinationPath({
      title: 'Appraisal Submitted',
      message: 'Manager U Min Min Tun has submitted the performance appraisal evaluation for Daw Lisa Wong.',
      source: 'APPRAISAL',
      targetId: 17,
    }, '/hr/dashboard')).toBe('/hr/appraisals/submissions?assignmentId=17');
  });

  it('routes legacy appraisal notifications when source is GENERAL', () => {
    expect(getNotificationDestinationPath({
      title: 'Appraisal Submitted',
      message: 'Manager submitted an appraisal.',
      source: 'GENERAL',
      targetId: 9,
    }, '/hr/notifications')).toBe('/hr/appraisals/submissions?assignmentId=9');
  });

  it('deep-links manager appraisal notifications to the evaluation page', () => {
    expect(getNotificationDestinationPath({
      title: 'Appraisal Reset for Re-evaluation',
      message: 'HR has reset the appraisal evaluation.',
      source: 'APPRAISAL',
      targetId: 4,
    }, '/manager/dashboard')).toBe('/manager/appraisals/4/evaluate');
  });
});
