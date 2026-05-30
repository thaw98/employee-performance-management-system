import type { SelfAssessmentRatingSystem } from './api/selfAssessmentFormApi'

export const ratingSystemLabels: Record<SelfAssessmentRatingSystem, string> = {
  FIVE_POINT: '5-point scale',
  TEN_POINT: '1-10 scale',
}

export const DEFAULT_TEN_POINT_YES_MIN_RATING = 5
export const MIN_TEN_POINT_YES_MIN_RATING = 2
export const MAX_TEN_POINT_YES_MIN_RATING = 10

export const DEFAULT_FIVE_POINT_YES_MIN_RATING = 3
export const MIN_FIVE_POINT_YES_MIN_RATING = 2
export const MAX_FIVE_POINT_YES_MIN_RATING = 5

export const normalizeTenPointYesMinRating = (value: number | null | undefined) => {
  const numeric = Number(value ?? DEFAULT_TEN_POINT_YES_MIN_RATING)
  if (!Number.isFinite(numeric)) return DEFAULT_TEN_POINT_YES_MIN_RATING
  return Math.min(MAX_TEN_POINT_YES_MIN_RATING, Math.max(MIN_TEN_POINT_YES_MIN_RATING, Math.trunc(numeric)))
}

export const normalizeFivePointYesMinRating = (value: number | null | undefined) => {
  const numeric = Number(value ?? DEFAULT_FIVE_POINT_YES_MIN_RATING)
  if (!Number.isFinite(numeric)) return DEFAULT_FIVE_POINT_YES_MIN_RATING
  return Math.min(MAX_FIVE_POINT_YES_MIN_RATING, Math.max(MIN_FIVE_POINT_YES_MIN_RATING, Math.trunc(numeric)))
}

export const tenPointYesMinRatingOptions = Array.from(
  { length: MAX_TEN_POINT_YES_MIN_RATING - MIN_TEN_POINT_YES_MIN_RATING + 1 },
  (_, index) => MIN_TEN_POINT_YES_MIN_RATING + index,
)

export const fivePointYesMinRatingOptions = Array.from(
  { length: MAX_FIVE_POINT_YES_MIN_RATING - MIN_FIVE_POINT_YES_MIN_RATING + 1 },
  (_, index) => MIN_FIVE_POINT_YES_MIN_RATING + index,
)

export const getRatingOptions = (
  ratingSystem: SelfAssessmentRatingSystem | null | undefined,
  yesNoAnswer: string | null | undefined,
  tenPointYesMinRating?: number | null,
  fivePointYesMinRating?: number | null,
  includeYesNo?: boolean,
) => {
  const system = ratingSystem === 'TEN_POINT' ? 'TEN_POINT' : 'FIVE_POINT'
  const max = system === 'TEN_POINT' ? 10 : 5
  if (includeYesNo === false) {
    return Array.from({ length: max }, (_, index) => max - index)
  }
  if (yesNoAnswer === 'Yes') {
    if (system === 'TEN_POINT') {
      const threshold = normalizeTenPointYesMinRating(tenPointYesMinRating)
      return Array.from({ length: 10 - threshold + 1 }, (_, index) => 10 - index)
    }
    const threshold = normalizeFivePointYesMinRating(fivePointYesMinRating)
    return Array.from({ length: 5 - threshold + 1 }, (_, index) => 5 - index)
  }
  if (yesNoAnswer === 'No') {
    if (system === 'TEN_POINT') {
      const threshold = normalizeTenPointYesMinRating(tenPointYesMinRating)
      return Array.from({ length: threshold - 1 }, (_, index) => threshold - 1 - index)
    }
    const threshold = normalizeFivePointYesMinRating(fivePointYesMinRating)
    return Array.from({ length: threshold - 1 }, (_, index) => threshold - 1 - index)
  }
  return []
}

export const isIncludeYesNoEnabled = (
  formIncludeYesNo: boolean | null | undefined,
  templateIncludeYesNo?: boolean | null | undefined,
): boolean => {
  if (formIncludeYesNo != null) return formIncludeYesNo
  if (templateIncludeYesNo != null) return templateIncludeYesNo
  return true
}

export const isRatingValidForAnswer = (
  ratingSystem: SelfAssessmentRatingSystem | null | undefined,
  yesNoAnswer: string | null | undefined,
  rating: number | null | undefined,
  tenPointYesMinRating?: number | null,
  fivePointYesMinRating?: number | null,
  includeYesNo?: boolean,
) => {
  if (includeYesNo === false) {
    if (rating == null) return true
    const max = ratingSystem === 'TEN_POINT' ? 10 : 5
    return rating >= 1 && rating <= max
  }
  if (!yesNoAnswer || rating == null) return true
  return getRatingOptions(ratingSystem, yesNoAnswer, tenPointYesMinRating, fivePointYesMinRating, includeYesNo).includes(rating)
}

/** Proposed adjustment must change Yes/No and/or rating vs the employee's saved answer. */
export const isManagerAdjustmentDifferentFromAnswer = (
  current: { yesNoAnswer?: string | null; rating?: number | null },
  proposed: { proposedYesNo: string; proposedRating: number },
) => {
  const sameYesNo = proposed.proposedYesNo === (current.yesNoAnswer ?? '')
  const sameRating = proposed.proposedRating === (current.rating ?? null)
  return !(sameYesNo && sameRating)
}
