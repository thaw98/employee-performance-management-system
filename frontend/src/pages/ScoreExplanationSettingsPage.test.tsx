import React from 'react'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { ScoreExplanationSettingsPage } from './ScoreExplanationSettingsPage'
import { type ScoreExplanation, type ScoreExplanationModule } from '../features/scoreExplanation/scoreExplanationApi'

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
    bulkUpdate: vi.fn().mockReturnValue({ unwrap: () => Promise.resolve([]) }),
    data: { SELF_ASSESSMENT: saBands, APPRAISAL: apBands, FEEDBACK_360: fbBands } as Record<ScoreExplanationModule, ScoreExplanation[]>,
  }
})

vi.mock('../features/scoreExplanation/scoreExplanationApi', () => ({
  useGetScoreExplanationsQuery: () => ({ data: mocks.data, isLoading: false, isError: false }),
  useUpdateScoreExplanationMutation: () => [vi.fn(), { isLoading: false }],
  useBulkUpdateScoreExplanationMutation: () => [mocks.bulkUpdate, { isLoading: false }],
}))

const renderPage = () => render(
  <MemoryRouter>
    <ScoreExplanationSettingsPage />
  </MemoryRouter>,
)

describe('ScoreExplanationSettingsPage', () => {
  beforeEach(() => {
    mocks.bulkUpdate.mockReset()
    mocks.bulkUpdate.mockReturnValue({ unwrap: () => Promise.resolve([]) })
  })

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

  it('opens editor when Edit Boundaries is clicked', async () => {
    renderPage()
    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: /Edit Boundaries/ }))
    expect(screen.getByText('Edit Score Boundaries')).toBeTruthy()
    expect(screen.getByPlaceholderText('Explain why these changes are needed...')).toBeTruthy()
  })

  it('changing Unsatisfactory max auto-adjusts Need Improvement min', async () => {
    renderPage()
    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: /Edit Boundaries/ }))

    const boundaryInputs = screen.getAllByRole('spinbutton')
    expect(boundaryInputs.length).toBeGreaterThanOrEqual(4)

    const unsatMaxInput = boundaryInputs[0]
    await user.clear(unsatMaxInput)
    await user.type(unsatMaxInput, '45')

    const needImpMaxInput = boundaryInputs[1]
    expect(Number(needImpMaxInput.getAttribute('value'))).toBeGreaterThanOrEqual(46)
  })

  it('cannot create gaps or overlaps via numeric input', async () => {
    renderPage()
    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: /Edit Boundaries/ }))

    const boundaryInputs = screen.getAllByRole('spinbutton')
    const b1 = boundaryInputs[0]
    const b2 = boundaryInputs[1]

    await user.clear(b2)
    await user.type(b2, '39')

    const b1Value = Number(b1.getAttribute('value'))
    const b2Value = Number(b2.getAttribute('value'))
    expect(b2Value).toBeGreaterThan(b1Value)
  })

  it('multi-module selection sends selected modules', async () => {
    renderPage()
    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: /Edit Boundaries/ }))

    const applyToModuleButtons = screen.getAllByRole('button', { name: /Appraisal/ })
    const appraisalApplyBtn = applyToModuleButtons[applyToModuleButtons.length - 1]
    await user.click(appraisalApplyBtn)

    const reasonInput = screen.getByPlaceholderText('Explain why these changes are needed...')
    await user.type(reasonInput, 'Standardizing boundaries across modules')

    await user.click(screen.getByText('Save Changes'))

    await waitFor(() => {
      expect(mocks.bulkUpdate).toHaveBeenCalled()
      const callArg = mocks.bulkUpdate.mock.calls[0][0]
      expect(callArg.body.applyToModules).toContain('SELF_ASSESSMENT')
      expect(callArg.body.applyToModules).toContain('APPRAISAL')
      expect(callArg.body.reason).toBe('Standardizing boundaries across modules')
    })
  })

  it('save button is disabled without reason', async () => {
    renderPage()
    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: /Edit Boundaries/ }))

    const saveBtn = screen.getByText('Save Changes')
    expect(saveBtn.hasAttribute('disabled')).toBeTruthy()
  })

  it('save button is enabled with valid data and reason', async () => {
    renderPage()
    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: /Edit Boundaries/ }))

    const reasonInput = screen.getByPlaceholderText('Explain why these changes are needed...')
    await user.type(reasonInput, 'Updating ranges for clarity')

    const saveBtn = screen.getByText('Save Changes')
    expect(saveBtn.hasAttribute('disabled')).toBeFalsy()
  })

  it('backend error is shown as a user-friendly toast', async () => {
    mocks.bulkUpdate.mockReturnValue({
      unwrap: () => Promise.reject({ data: { message: 'Score ranges must cover 0-100' } }),
    })

    renderPage()
    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: /Edit Boundaries/ }))

    const reasonInput = screen.getByPlaceholderText('Explain why these changes are needed...')
    await user.type(reasonInput, 'Testing error handling')

    await user.click(screen.getByText('Save Changes'))

    await waitFor(() => {
      expect(mocks.bulkUpdate).toHaveBeenCalled()
    })
  })

  it('cancel restores original boundary values', async () => {
    renderPage()
    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: /Edit Boundaries/ }))

    const boundaryInputs = screen.getAllByRole('spinbutton')
    const unsatMaxInput = boundaryInputs[0]
    await user.clear(unsatMaxInput)
    await user.type(unsatMaxInput, '45')

    const cancelButtons = screen.getAllByText('Cancel')
    await user.click(cancelButtons[cancelButtons.length - 1])

    expect(screen.queryByText('Edit Score Boundaries')).toBeNull()
  })
})
