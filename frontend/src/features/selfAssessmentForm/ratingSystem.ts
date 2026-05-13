import type { SelfAssessmentRatingSystem } from './api/selfAssessmentFormApi'

export const ratingSystemLabels: Record<SelfAssessmentRatingSystem, string> = {
  FIVE_POINT: '5-point scale',
  TEN_POINT: '1-10 scale',
}

export const DEFAULT_TEN_POINT_YES_MIN_RATING = 5
export const MIN_TEN_POINT_YES_MIN_RATING = 2
export const MAX_TEN_POINT_YES_MIN_RATING = 10

export const normalizeTenPointYesMinRating = (value: number | null | undefined) => {
  const numeric = Number(value ?? DEFAULT_TEN_POINT_YES_MIN_RATING)
  if (!Number.isFinite(numeric)) return DEFAULT_TEN_POINT_YES_MIN_RATING
  return Math.min(MAX_TEN_POINT_YES_MIN_RATING, Math.max(MIN_TEN_POINT_YES_MIN_RATING, Math.trunc(numeric)))
}

export const tenPointYesMinRatingOptions = Array.from(
  { length: MAX_TEN_POINT_YES_MIN_RATING - MIN_TEN_POINT_YES_MIN_RATING + 1 },
  (_, index) => MIN_TEN_POINT_YES_MIN_RATING + index,
)

export const getRatingOptions = (
  ratingSystem: SelfAssessmentRatingSystem | null | undefined,
  yesNoAnswer: string | null | undefined,
  tenPointYesMinRating?: number | null,
) => {
  const system = ratingSystem === 'TEN_POINT' ? 'TEN_POINT' : 'FIVE_POINT'
  if (yesNoAnswer === 'Yes') {
    if (system === 'TEN_POINT') {
      const threshold = normalizeTenPointYesMinRating(tenPointYesMinRating)
      return Array.from({ length: 10 - threshold + 1 }, (_, index) => 10 - index)
    }
    return [5, 4, 3]
  }
  if (yesNoAnswer === 'No') {
    if (system === 'TEN_POINT') {
      const threshold = normalizeTenPointYesMinRating(tenPointYesMinRating)
      return Array.from({ length: threshold - 1 }, (_, index) => threshold - 1 - index)
    }
    return [2, 1]
  }
  return []
}

export const isRatingValidForAnswer = (
  ratingSystem: SelfAssessmentRatingSystem | null | undefined,
  yesNoAnswer: string | null | undefined,
  rating: number | null | undefined,
  tenPointYesMinRating?: number | null,
) => {
  if (!yesNoAnswer || rating == null) return true
  return getRatingOptions(ratingSystem, yesNoAnswer, tenPointYesMinRating).includes(rating)
}
