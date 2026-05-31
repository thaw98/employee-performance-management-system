import type { SelfAssessmentRatingSystem } from './api/selfAssessmentFormApi'

export const ratingSystemLabels: Record<SelfAssessmentRatingSystem, string> = {
  TWO_POINT: '1-2 Scale',
  THREE_POINT: '1-3 Scale',
  FOUR_POINT: '1-4 Scale',
  FIVE_POINT: '1-5 Scale',
  SIX_POINT: '1-6 Scale',
  SEVEN_POINT: '1-7 Scale',
  TEN_POINT: '1-10 Scale',
}

export const RATING_SYSTEM_OPTIONS: { value: SelfAssessmentRatingSystem; label: string }[] = [
  { value: 'TWO_POINT', label: '1-2 Scale' },
  { value: 'THREE_POINT', label: '1-3 Scale' },
  { value: 'FOUR_POINT', label: '1-4 Scale' },
  { value: 'FIVE_POINT', label: '1-5 Scale' },
  { value: 'SIX_POINT', label: '1-6 Scale' },
  { value: 'SEVEN_POINT', label: '1-7 Scale' },
  { value: 'TEN_POINT', label: '1-10 Scale' },
]

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

export const getRatingSystemMax = (ratingSystem: SelfAssessmentRatingSystem): number => {
  switch (ratingSystem) {
    case 'TWO_POINT': return 2
    case 'THREE_POINT': return 3
    case 'FOUR_POINT': return 4
    case 'FIVE_POINT': return 5
    case 'SIX_POINT': return 6
    case 'SEVEN_POINT': return 7
    case 'TEN_POINT': return 10
  }
}

export const getDefaultYesMinRating = (ratingSystem: SelfAssessmentRatingSystem): number => {
  switch (ratingSystem) {
    case 'TWO_POINT': return 2
    case 'THREE_POINT': return 2
    case 'FOUR_POINT': return 3
    case 'FIVE_POINT': return 3
    case 'SIX_POINT': return 4
    case 'SEVEN_POINT': return 4
    case 'TEN_POINT': return 5
  }
}

export const normalizeYesMinRating = (ratingSystem: SelfAssessmentRatingSystem, value: number | null | undefined): number => {
  const numeric = Number(value ?? getDefaultYesMinRating(ratingSystem))
  if (!Number.isFinite(numeric)) return getDefaultYesMinRating(ratingSystem)
  const max = getRatingSystemMax(ratingSystem)
  return Math.min(max, Math.max(2, Math.trunc(numeric)))
}

export const getYesMinRatingOptions = (ratingSystem: SelfAssessmentRatingSystem): number[] => {
  const max = getRatingSystemMax(ratingSystem)
  return Array.from({ length: max - 1 }, (_, index) => index + 2)
}

export const getRatingOptions = (
  ratingSystem: SelfAssessmentRatingSystem | null | undefined,
  yesNoAnswer: string | null | undefined,
  tenPointYesMinRating?: number | null,
  fivePointYesMinRating?: number | null,
  includeYesNo?: boolean,
  yesMinRating?: number | null,
) => {
  const system: SelfAssessmentRatingSystem = ratingSystem && ['TWO_POINT', 'THREE_POINT', 'FOUR_POINT', 'FIVE_POINT', 'SIX_POINT', 'SEVEN_POINT', 'TEN_POINT'].includes(ratingSystem)
    ? ratingSystem
    : 'FIVE_POINT'
  const max = getRatingSystemMax(system)

  if (includeYesNo === false) {
    return Array.from({ length: max }, (_, index) => max - index)
  }

  let threshold: number
  if (yesMinRating != null) {
    threshold = normalizeYesMinRating(system, yesMinRating)
  } else if (system === 'TEN_POINT') {
    threshold = normalizeTenPointYesMinRating(tenPointYesMinRating)
  } else {
    threshold = normalizeFivePointYesMinRating(fivePointYesMinRating)
  }

  if (yesNoAnswer === 'Yes') {
    return Array.from({ length: max - threshold + 1 }, (_, index) => max - index)
  }
  if (yesNoAnswer === 'No') {
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
  yesMinRating?: number | null,
) => {
  const system: SelfAssessmentRatingSystem = ratingSystem && ['TWO_POINT', 'THREE_POINT', 'FOUR_POINT', 'FIVE_POINT', 'SIX_POINT', 'SEVEN_POINT', 'TEN_POINT'].includes(ratingSystem)
    ? ratingSystem
    : 'FIVE_POINT'

  if (includeYesNo === false) {
    if (rating == null) return true
    const max = getRatingSystemMax(system)
    return rating >= 1 && rating <= max
  }
  if (!yesNoAnswer || rating == null) return true
  return getRatingOptions(ratingSystem, yesNoAnswer, tenPointYesMinRating, fivePointYesMinRating, includeYesNo, yesMinRating).includes(rating)
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
