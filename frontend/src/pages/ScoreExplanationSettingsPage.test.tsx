import React from 'react'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { ScoreExplanationSettingsPage } from './ScoreExplanationSettingsPage'
import { type ScoreExplanation, type ScoreExplanationModule } from '../features/scoreExplanation/scoreExplanationApi'
import { EDIT_SCORE_BOUNDARIES_PATH } from '../features/scoreExplanation/scoreExplanationModules'

const mocks = vi.hoisted(() => {
  const saBands: ScoreExplanation[] = [
    { id: 1, module: 'SELF_ASSESSMENT', sortOrder: 1, minScore: 86, maxScore: 100, title: 'Outstanding', details: 'Exceeds expectations', createdAt: '', updatedAt: '' },
    { id: 2, module: 'SELF_ASSESSMENT', sortOrder: 2, minScore: 71, maxScore: 85, title: 'Good', details: 'Strong performance', createdAt: '', updatedAt: '' },
    { id: 3, module: 'SELF_ASSESSMENT', sortOrder: 3, minScore: 60, maxScore: 70, title: 'Meet Requirement', details: 'Meets standard', createdAt: '', updatedAt: '' },
    { id: 4, module: 'SELF_ASSESSMENT', sortOrder: 4, minScore: 40, maxScore: 59, title: 'Need Improvement', details: 'Needs focus', createdAt: '', updatedAt: '' },
    { id: 5, module: 'SELF_ASSESSMENT', sortOrder: 5, minScore: 0, maxScore: 39, title: 'Unsatisfactory', details: 'Below expected', createdAt: '', updatedAt: '' },
  ]
  const apBands: ScoreExplanation[] = [
    { id: 11, module: 'APPRAISAL', sortOrder: 1, minScore: 86, maxScore: 100, title: 'Outstanding', details: 'Exceeds expectations', createdAt: '', updatedAt: '' },
    { id: 12, module: 'APPRAISAL', sortOrder: 2, minScore: 71, maxScore: 85, title: 'Good', details: 'Strong performance', createdAt: '', updatedAt: '' },
    { id: 13, module: 'APPRAISAL', sortOrder: 3, minScore: 60, maxScore: 70, title: 'Meet Requirement', details: 'Meets standard', createdAt: '', updatedAt: '' },
    { id: 14, module: 'APPRAISAL', sortOrder: 4, minScore: 40, maxScore: 59, title: 'Need Improvement', details: 'Needs focus', createdAt: '', updatedAt: '' },
    { id: 15, module: 'APPRAISAL', sortOrder: 5, minScore: 0, maxScore: 39, title: 'Unsatisfactory', details: 'Below expected', createdAt: '', updatedAt: '' },
  ]
  const fbBands: ScoreExplanation[] = [
    { id: 21, module: 'FEEDBACK_360', sortOrder: 1, minScore: 86, maxScore: 100, title: 'Outstanding', details: 'Exceeds expectations', createdAt: '', updatedAt: '' },
    { id: 22, module: 'FEEDBACK_360', sortOrder: 2, minScore: 71, maxScore: 85, title: 'Good', details: 'Strong performance', createdAt: '', updatedAt: '' },
    { id: 23, module: 'FEEDBACK_360', sortOrder: 3, minScore: 60, maxScore: 70, title: 'Meet Requirement', details: 'Meets standard', createdAt: '', updatedAt: '' },
    { id: 24, module: 'FEEDBACK_360', sortOrder: 4, minScore: 40, maxScore: 59, title: 'Need Improvement', details: 'Needs focus', createdAt: '', updatedAt: '' },
    { id: 25, module: 'FEEDBACK_360', sortOrder: 5, minScore: 0, maxScore: 39, title: 'Unsatisfactory', details: 'Below expected', createdAt: '', updatedAt: '' },
  ]
  return {
    data: { SELF_ASSESSMENT: saBands, APPRAISAL: apBands, FEEDBACK_360: fbBands } as Record<ScoreExplanationModule, ScoreExplanation[]>,
  }
})

vi.mock('../features/scoreExplanation/scoreExplanationApi', () => ({
  useGetScoreExplanationsQuery: () => ({ data: mocks.data, isLoading: false, isError: false }),
  useUpdateScoreExplanationMutation: () => [vi.fn(), { isLoading: false }],
  useBulkUpdateScoreExplanationMutation: () => [vi.fn(), { isLoading: false }],
}))

const renderPage = () => render(
  <MemoryRouter>
    <ScoreExplanationSettingsPage />
  </MemoryRouter>,
)

describe('ScoreExplanationSettingsPage', () => {
  afterEach(() => {
    cleanup()
  })

  it('renders the header and module tabs', () => {
    renderPage()
    expect(screen.getAllByText('Score Band Settings').length).toBeGreaterThan(0)
    expect(screen.getByRole('heading', { name: 'Score Band Settings' })).toBeTruthy()
    expect(screen.getAllByText('Self Assessment').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Appraisal').length).toBeGreaterThan(0)
    expect(screen.getAllByText('360 Feedback').length).toBeGreaterThan(0)
  })

  it('shows bands for the active module', () => {
    renderPage()
    expect(screen.getByText('Self Assessment Bands')).toBeTruthy()
    expect(screen.getAllByText('Outstanding').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Good').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Need Improvement').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Unsatisfactory').length).toBeGreaterThan(0)
  })

  it('switches module when a tab is clicked', async () => {
    renderPage()
    const user = userEvent.setup()
    const appraisalTabs = screen.getAllByRole('button', { name: /Appraisal/ })
    await user.click(appraisalTabs[0])
    expect(screen.getByText('Appraisal Bands')).toBeTruthy()
  })

  it('links Edit Boundaries to the dedicated edit page with active module', () => {
    renderPage()
    const editLink = screen.getByRole('link', { name: /Edit Boundaries/ })
    expect(editLink.getAttribute('href')).toBe(`${EDIT_SCORE_BOUNDARIES_PATH}?module=SELF_ASSESSMENT`)
  })

  it('does not render the inline editor on the settings page', () => {
    renderPage()
    expect(screen.queryByText('Edit Score Boundaries')).toBeNull()
    expect(screen.queryByPlaceholderText('Explain why these changes are needed...')).toBeNull()
  })
})
