import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { QuestionBankPickerModal } from './QuestionBankPickerModal'

const onClose = vi.fn()
const onInsert = vi.fn()

vi.mock('../../features/selfAssessmentForm/api/selfAssessmentFormApi', () => ({
  useGetQuestionBankQuery: () => ({
    data: [
      { id: 1, questionText: 'I delivered work with minimal errors.', isActive: true },
      { id: 2, questionText: 'I managed my time effectively.', isActive: true },
      { id: 3, questionText: 'I am satisfied with my performance.', isActive: true },
    ],
    isLoading: false,
  }),
}))

describe('QuestionBankPickerModal', () => {
  afterEach(() => {
    cleanup()
    onClose.mockReset()
    onInsert.mockReset()
  })

  it('inserts multiple selected questions', async () => {
    const user = userEvent.setup()
    render(<QuestionBankPickerModal isOpen onClose={onClose} onInsert={onInsert} />)

    const checkboxes = screen.getAllByRole('checkbox')
    await user.click(checkboxes[0])
    await user.click(checkboxes[2])

    await user.click(screen.getByRole('button', { name: /Insert 2 Questions/i }))

    expect(onInsert).toHaveBeenCalledWith([
      'I delivered work with minimal errors.',
      'I am satisfied with my performance.',
    ])
  })

  it('selects all visible questions', async () => {
    const user = userEvent.setup()
    render(<QuestionBankPickerModal isOpen onClose={onClose} onInsert={onInsert} />)

    await user.click(screen.getByRole('button', { name: 'Select all' }))
    await user.click(screen.getByRole('button', { name: /Insert 3 Questions/i }))

    expect(onInsert).toHaveBeenCalledWith([
      'I delivered work with minimal errors.',
      'I managed my time effectively.',
      'I am satisfied with my performance.',
    ])
  })
})
