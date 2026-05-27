import { describe, expect, it } from 'vitest'
import {
  feedbackPercentageFromAverage,
  feedbackRemarkForPercentage,
  findFeedbackScoreRange,
  formatFeedbackPercentage,
} from './feedbackScorePdf'

describe('feedback score PDF helpers', () => {
  it('maps percentage scores to feedback remarks using the feedback thresholds', () => {
    expect(feedbackRemarkForPercentage(86)).toBe('Outstanding')
    expect(feedbackRemarkForPercentage(85.9)).toBe('Good')
    expect(feedbackRemarkForPercentage(71)).toBe('Good')
    expect(feedbackRemarkForPercentage(70.9)).toBe('Meet Requirement')
    expect(feedbackRemarkForPercentage(60)).toBe('Meet Requirement')
    expect(feedbackRemarkForPercentage(59.9)).toBe('Need Improvement')
    expect(feedbackRemarkForPercentage(40)).toBe('Need Improvement')
    expect(feedbackRemarkForPercentage(39.9)).toBe('Unsatisfactory')
  })

  it('converts aggregate 1-5 averages to percentages', () => {
    expect(feedbackPercentageFromAverage(4.125)).toBe(82.5)
    expect(feedbackPercentageFromAverage(null)).toBe(0)
    expect(feedbackPercentageFromAverage(Number.NaN)).toBe(0)
  })

  it('formats percentages with one decimal place', () => {
    expect(formatFeedbackPercentage(82.5)).toBe('82.5%')
    expect(formatFeedbackPercentage(86)).toBe('86.0%')
  })

  it('finds the score table row by the resolved remark', () => {
    expect(findFeedbackScoreRange(82.5).remark).toBe('Good')
    expect(findFeedbackScoreRange(82.5, 'Outstanding').remark).toBe('Outstanding')
  })
})
