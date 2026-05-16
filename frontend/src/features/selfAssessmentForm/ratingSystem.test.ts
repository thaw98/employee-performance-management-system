import { describe, expect, it } from 'vitest'
import { isManagerAdjustmentDifferentFromAnswer } from './ratingSystem'

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
