import { getRatingSystemMax, type SelfAssessmentRatingSystem } from './ratingSystem'

export interface SelfAssessmentAnswerRating {
  rating: number | null
}

export interface ScoreBandLike {
  minScore: number
  maxScore: number
  title: string
}

export interface SelfAssessmentLiveScoreStats {
  pointsAchieved: number
  maxPoints: number
  liveScore: number
  ratingCategory: string | null
}

/** Matches backend SelfAssessmentFormService.evaluateFormula fallback. */
export function computeSelfAssessmentPercentage(
  sumRatings: number,
  numQuestions: number,
  maxRating: number,
): number {
  if (numQuestions <= 0 || maxRating <= 0) return 0
  return (sumRatings / (numQuestions * maxRating)) * 100
}

export function defaultSelfAssessmentScoreBandTitle(score: number): string {
  const rounded = Math.floor(Math.max(0, Math.min(100, score)))
  if (rounded >= 86) return 'Outstanding'
  if (rounded >= 71) return 'Good'
  if (rounded >= 60) return 'Meet Requirement'
  if (rounded >= 40) return 'Need Improvement'
  return 'Unsatisfactory'
}

export function resolveSelfAssessmentScoreBandTitle(
  score: number,
  bands: ScoreBandLike[] | null | undefined,
): string | null {
  if (!Number.isFinite(score)) return null
  const rounded = Math.floor(Math.max(0, Math.min(100, score)))
  const match = bands?.find((band) => rounded >= band.minScore && rounded <= band.maxScore)
  return match?.title ?? defaultSelfAssessmentScoreBandTitle(rounded)
}

export function computeSelfAssessmentLiveScoreStats(
  answers: SelfAssessmentAnswerRating[],
  ratingSystem: SelfAssessmentRatingSystem,
  scoreBands?: ScoreBandLike[] | null,
): SelfAssessmentLiveScoreStats {
  const maxRating = getRatingSystemMax(ratingSystem)
  const numQuestions = answers.length
  const pointsAchieved = answers.reduce((sum, answer) => sum + (answer.rating ?? 0), 0)
  const maxPoints = numQuestions * maxRating
  const liveScore = computeSelfAssessmentPercentage(pointsAchieved, numQuestions, maxRating)
  const ratingCategory = numQuestions > 0
    ? resolveSelfAssessmentScoreBandTitle(liveScore, scoreBands)
    : null

  return { pointsAchieved, maxPoints, liveScore, ratingCategory }
}
