import { Award, ClipboardList, Users } from 'lucide-react'
import type { ScoreExplanationModule } from './scoreExplanationApi'

export const SCORE_EXPLANATION_MODULES: Array<{
  key: ScoreExplanationModule
  label: string
  icon: typeof ClipboardList
  desc: string
  accent: string
  accentBg: string
  accentText: string
}> = [
  { key: 'SELF_ASSESSMENT', label: 'Self Assessment', icon: ClipboardList, desc: 'Employee self-rating bands', accent: 'blue', accentBg: 'bg-blue-50 dark:bg-blue-900/20', accentText: 'text-blue-600 dark:text-blue-400' },
  { key: 'APPRAISAL', label: 'Appraisal', icon: Award, desc: 'Manager evaluation bands', accent: 'violet', accentBg: 'bg-violet-50 dark:bg-violet-900/20', accentText: 'text-violet-600 dark:text-violet-400' },
  { key: 'FEEDBACK_360', label: '360 Feedback', icon: Users, desc: 'Peer & multi-rater bands', accent: 'teal', accentBg: 'bg-teal-50 dark:bg-teal-900/20', accentText: 'text-teal-600 dark:text-teal-400' },
]

export const SCORE_EXPLANATION_SETTINGS_PATH = '/hr/settings/system/score-explanations'
export const EDIT_SCORE_BOUNDARIES_PATH = '/hr/settings/system/score-explanations/edit'

export function parseScoreExplanationModule(value: string | null): ScoreExplanationModule {
  if (value === 'APPRAISAL' || value === 'FEEDBACK_360' || value === 'SELF_ASSESSMENT') {
    return value
  }
  return 'SELF_ASSESSMENT'
}
