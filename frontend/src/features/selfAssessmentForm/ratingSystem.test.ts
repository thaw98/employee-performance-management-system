import { describe, expect, it } from 'vitest'
import { getRatingOptions, isManagerAdjustmentDifferentFromAnswer, getRatingSystemMax, getDefaultYesMinRating, getYesMinRatingOptions, normalizeYesMinRating } from './ratingSystem'

describe('getRatingSystemMax', () => {
  it('returns correct max for each scale', () => {
    expect(getRatingSystemMax('TWO_POINT')).toBe(2)
    expect(getRatingSystemMax('THREE_POINT')).toBe(3)
    expect(getRatingSystemMax('FOUR_POINT')).toBe(4)
    expect(getRatingSystemMax('FIVE_POINT')).toBe(5)
    expect(getRatingSystemMax('SIX_POINT')).toBe(6)
    expect(getRatingSystemMax('SEVEN_POINT')).toBe(7)
    expect(getRatingSystemMax('TEN_POINT')).toBe(10)
  })
})

describe('getDefaultYesMinRating', () => {
  it('returns correct defaults for each scale', () => {
    expect(getDefaultYesMinRating('TWO_POINT')).toBe(2)
    expect(getDefaultYesMinRating('THREE_POINT')).toBe(2)
    expect(getDefaultYesMinRating('FOUR_POINT')).toBe(3)
    expect(getDefaultYesMinRating('FIVE_POINT')).toBe(3)
    expect(getDefaultYesMinRating('SIX_POINT')).toBe(4)
    expect(getDefaultYesMinRating('SEVEN_POINT')).toBe(4)
    expect(getDefaultYesMinRating('TEN_POINT')).toBe(5)
  })
})

describe('normalizeYesMinRating', () => {
  it('clamps to valid range', () => {
    expect(normalizeYesMinRating('FIVE_POINT', 0)).toBe(2)
    expect(normalizeYesMinRating('FIVE_POINT', 1)).toBe(2)
    expect(normalizeYesMinRating('FIVE_POINT', 3)).toBe(3)
    expect(normalizeYesMinRating('FIVE_POINT', 6)).toBe(5)
    expect(normalizeYesMinRating('TEN_POINT', 1)).toBe(2)
    expect(normalizeYesMinRating('TEN_POINT', 11)).toBe(10)
    expect(normalizeYesMinRating('TWO_POINT', 1)).toBe(2)
    expect(normalizeYesMinRating('TWO_POINT', 3)).toBe(2)
  })

  it('uses default when null', () => {
    expect(normalizeYesMinRating('FIVE_POINT', null)).toBe(3)
    expect(normalizeYesMinRating('TEN_POINT', undefined)).toBe(5)
    expect(normalizeYesMinRating('TWO_POINT', null)).toBe(2)
  })
})

describe('getYesMinRatingOptions', () => {
  it('returns correct options for each scale', () => {
    expect(getYesMinRatingOptions('TWO_POINT')).toEqual([2])
    expect(getYesMinRatingOptions('THREE_POINT')).toEqual([2, 3])
    expect(getYesMinRatingOptions('FIVE_POINT')).toEqual([2, 3, 4, 5])
    expect(getYesMinRatingOptions('TEN_POINT')).toEqual([2, 3, 4, 5, 6, 7, 8, 9, 10])
  })
})

describe('getRatingOptions', () => {
  it('splits Yes and No scores when includeYesNo is enabled', () => {
    expect(getRatingOptions('FIVE_POINT', 'Yes', undefined, 4, true)).toEqual([5, 4])
    expect(getRatingOptions('FIVE_POINT', 'No', undefined, 4, true)).toEqual([3, 2, 1])
  })

  it('returns the full scale when includeYesNo is disabled', () => {
    expect(getRatingOptions('FIVE_POINT', 'Yes', undefined, 4, false)).toEqual([5, 4, 3, 2, 1])
    expect(getRatingOptions('FIVE_POINT', null, undefined, 4, false)).toEqual([5, 4, 3, 2, 1])
  })

  it('uses Yes/No thresholds when includeYesNo is omitted', () => {
    expect(getRatingOptions('FIVE_POINT', 'Yes', undefined, 3)).toEqual([5, 4, 3])
    expect(getRatingOptions('FIVE_POINT', 'No', undefined, 3)).toEqual([2, 1])
  })

  it('uses yesMinRating when provided', () => {
    expect(getRatingOptions('FIVE_POINT', 'Yes', undefined, undefined, true, 4)).toEqual([5, 4])
    expect(getRatingOptions('FIVE_POINT', 'No', undefined, undefined, true, 4)).toEqual([3, 2, 1])
    expect(getRatingOptions('TEN_POINT', 'Yes', undefined, undefined, true, 5)).toEqual([10, 9, 8, 7, 6, 5])
    expect(getRatingOptions('TEN_POINT', 'No', undefined, undefined, true, 5)).toEqual([4, 3, 2, 1])
  })

  it('handles all seven scales correctly', () => {
    // TWO_POINT: max=2, default yesMin=2 -> Yes: [2], No: [1]
    expect(getRatingOptions('TWO_POINT', 'Yes', undefined, undefined, true, 2)).toEqual([2])
    expect(getRatingOptions('TWO_POINT', 'No', undefined, undefined, true, 2)).toEqual([1])
    expect(getRatingOptions('TWO_POINT', 'Yes', undefined, undefined, false)).toEqual([2, 1])

    // THREE_POINT: max=3, yesMin=2 -> Yes: [3,2], No: [1]
    expect(getRatingOptions('THREE_POINT', 'Yes', undefined, undefined, true, 2)).toEqual([3, 2])
    expect(getRatingOptions('THREE_POINT', 'No', undefined, undefined, true, 2)).toEqual([1])

    // SEVEN_POINT: max=7, yesMin=4 -> Yes: [7,6,5,4], No: [3,2,1]
    expect(getRatingOptions('SEVEN_POINT', 'Yes', undefined, undefined, true, 4)).toEqual([7, 6, 5, 4])
    expect(getRatingOptions('SEVEN_POINT', 'No', undefined, undefined, true, 4)).toEqual([3, 2, 1])
  })
})

describe('isManagerAdjustmentDifferentFromAnswer', () => {
  it('rejects when both Yes/No and rating match the current answer', () => {
    expect(
      isManagerAdjustmentDifferentFromAnswer(
        { yesNoAnswer: 'Yes', rating: 5 },
        { proposedYesNo: 'Yes', proposedRating: 5 },
      ),
    ).toBe(false)
  })

  it('allows when only the rating differs', () => {
    expect(
      isManagerAdjustmentDifferentFromAnswer(
        { yesNoAnswer: 'Yes', rating: 5 },
        { proposedYesNo: 'Yes', proposedRating: 4 },
      ),
    ).toBe(true)
  })

  it('allows when only Yes/No differs', () => {
    expect(
      isManagerAdjustmentDifferentFromAnswer(
        { yesNoAnswer: 'Yes', rating: 5 },
        { proposedYesNo: 'No', proposedRating: 1 },
      ),
    ).toBe(true)
  })
})
