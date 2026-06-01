import { describe, expect, it } from 'vitest'
import {
  computeSelfAssessmentLiveScoreStats,
  computeSelfAssessmentPercentage,
  resolveSelfAssessmentScoreBandTitle,
} from './computeSelfAssessmentLiveScore'

describe('computeSelfAssessmentLiveScore', () => {
  it('computes percentage using total questions and max rating', () => {
    expect(computeSelfAssessmentPercentage(4, 1, 5)).toBe(80)
    expect(computeSelfAssessmentPercentage(0, 5, 5)).toBe(0)
  })

  it('resolves score band title from configured bands', () => {
    const bands = [
      { minScore: 0, maxScore: 59, title: 'Low', sortOrder: 0 },
      { minScore: 60, maxScore: 100, title: 'High', sortOrder: 1 },
    ].map(({ minScore, maxScore, title }) => ({ minScore, maxScore, title }))

    expect(resolveSelfAssessmentScoreBandTitle(80, bands)).toBe('High')
    expect(resolveSelfAssessmentScoreBandTitle(40, bands)).toBe('Low')
  })

  it('aggregates ratings into live score stats', () => {
    const stats = computeSelfAssessmentLiveScoreStats(
      [{ rating: 4 }, { rating: null }],
      'FIVE_POINT',
      [{ minScore: 0, maxScore: 100, title: 'Pass' }],
    )

    expect(stats.pointsAchieved).toBe(4)
    expect(stats.maxPoints).toBe(10)
    expect(stats.liveScore).toBe(40)
    expect(stats.ratingCategory).toBe('Pass')
  })
})
