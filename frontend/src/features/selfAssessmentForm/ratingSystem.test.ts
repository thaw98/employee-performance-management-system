import { describe, expect, it } from 'vitest'
import { getRatingOptions, isManagerAdjustmentDifferentFromAnswer } from './ratingSystem'

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
