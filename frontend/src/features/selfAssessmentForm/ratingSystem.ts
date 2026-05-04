import type { SelfAssessmentRatingSystem } from './api/selfAssessmentFormApi'

export const ratingSystemLabels: Record<SelfAssessmentRatingSystem, string> = {
  FIVE_POINT: '5-point scale',
  TEN_POINT: '1–10 scale',
}

export const getRatingOptions = (
  ratingSystem: SelfAssessmentRatingSystem | null | undefined,
  yesNoAnswer: string | null | undefined,
) => {
  const system = ratingSystem === 'TEN_POINT' ? 'TEN_POINT' : 'FIVE_POINT'
  if (yesNoAnswer === 'Yes') {
    return system === 'TEN_POINT' ? [10, 9, 8, 7, 6, 5] : [5, 4, 3]
  }
  if (yesNoAnswer === 'No') {
    return system === 'TEN_POINT' ? [4, 3, 2, 1] : [2, 1]
  }
  return []
}

export const isRatingValidForAnswer = (
  ratingSystem: SelfAssessmentRatingSystem | null | undefined,
  yesNoAnswer: string | null | undefined,
  rating: number | null | undefined,
) => {
  if (!yesNoAnswer || rating == null) return true
  return getRatingOptions(ratingSystem, yesNoAnswer).includes(rating)
}

