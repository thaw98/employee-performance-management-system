import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MySelfAssessmentFormPage } from './MySelfAssessmentFormPage'
import { toast } from 'react-hot-toast'
import { MemoryRouter } from 'react-router-dom'

const mocks = vi.hoisted(() => {
  const formStatus = {
    status: 'DRAFT',
    isEligible: true,
    hasActiveTemplate: true,
    deadlinePassed: false,
    message: null as string | null,
  }

  const editableFormData = {
    id: 1,
    templateId: 10,
    cycleId: 3,
    cycleName: 'Q1',
    title: 'Employee Self Assessment',
    ratingSystem: 'FIVE_POINT',
    tenPointYesMinRating: 5,
    deadlineDate: '2026-05-30',
    managerReviewDeadlineDate: null,
    finalApprovalDeadlineDate: null,
    assignedAt: null,
    assignedBy: null,
    status: 'DRAFT',
    totalScore: null,
    ratingCategory: null,
    employeeRemarks: 'Initial remarks',
    employeeSignatureId: null,
    employeeSignatureDate: null,
    overallRemarks: 'Overall',
    managerId: null,
    managerName: null,
    managerSignatureId: null,
    managerSignatureDate: null,
    managerComments: null,
    hrSignatureId: null,
    hrSignatureDate: null,
    hrFinalSignatureId: null,
    hrFinalSignatureDate: null,
    hrAdjustmentSignatureId: null,
    hrAdjustmentSignatureDate: null,
    createdDate: '2026-05-01',
    submittedDate: null,
    assessmentDate: null,
    employee: {
      id: 5,
      employeeId: 'E-001',
      employeeName: 'Ada Lovelace',
      email: 'ada@example.com',
      departmentId: 2,
      departmentName: 'Engineering',
      departmentCode: 'ENG',
      positionId: 8,
      positionName: 'Developer',
      positionCode: 'DEV',
    },
    answers: [
      {
        id: 101,
        questionText: 'Did you meet your goals?',
        sortOrder: 0,
        yesNoAnswer: null,
        rating: null,
        remarks: '',
        managerProposedYesNo: null,
        managerProposedRating: null,
        managerProposedComment: null,
        hrAdjustmentApproved: null,
      },
    ],
    adjustments: [],
    managerRevisedTotalScore: null as number | null,
    finalApprovedTotalScore: null as number | null,
    employeeAcknowledgedAt: null,
    employeeDisputedAt: null,
    employeeDisputeReason: null,
    hrReviewRequired: null,
    hrReviewReason: null,
    hrReviewReasonAt: null,
  }

  return {
    autosaveOptions: undefined as any,
    autosaveState: {
      isSaving: false,
      lastError: null as Error | null,
      hasPendingChanges: true,
    },
    formStatus,
    editableFormData,
    flush: vi.fn(),
    refetch: vi.fn(),
    saveDraft: vi.fn(),
    submitForm: vi.fn(),
    employeeAcknowledge: vi.fn(),
    employeeDispute: vi.fn(),
  }
})

vi.mock('react-hook-form-autosave', () => ({
  useRhfAutosave: vi.fn((options) => {
    mocks.autosaveOptions = options
    return {
      isSaving: mocks.autosaveState.isSaving,
      lastError: mocks.autosaveState.lastError,
      hasPendingChanges: mocks.autosaveState.hasPendingChanges,
      flush: mocks.flush,
      abort: vi.fn(),
      forceSave: mocks.flush,
      forceBaselineUpdate: vi.fn(),
      getBaseline: vi.fn(),
      isBaselineInitialized: vi.fn(),
      getMetrics: vi.fn(),
      getCacheStats: vi.fn(),
      getPendingChanges: vi.fn(),
      isEmpty: vi.fn(),
      undo: undefined,
      redo: undefined,
      undoLastSave: undefined,
      canUndo: false,
      canRedo: false,
      hydrateFromServer: vi.fn(),
      metrics: {},
    }
  }),
  withRetry: vi.fn((transport) => transport),
}))

vi.mock('react-hot-toast', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

vi.mock('../../features/selfAssessmentForm/api/selfAssessmentFormApi', () => ({
  useGetMyFormStatusQuery: () => ({
    data: mocks.formStatus,
    isLoading: false,
  }),
  useGetMyCurrentFormQuery: () => ({
    data: mocks.editableFormData,
    isLoading: false,
    refetch: mocks.refetch,
  }),
  useSaveDraftMutation: () => [mocks.saveDraft, { isLoading: false }],
  useSubmitFormMutation: () => [mocks.submitForm, { isLoading: false }],
  useEmployeeAcknowledgeMutation: () => [mocks.employeeAcknowledge, { isLoading: false }],
  useEmployeeDisputeMutation: () => [mocks.employeeDispute, { isLoading: false }],
}))

vi.mock('../../features/selfAssessmentForm/components/SelfAssessmentRatingPicker', () => ({
  SelfAssessmentRatingPicker: ({ onChange, disabled }: { onChange: (value: number) => void; disabled: boolean }) => (
    <button type="button" disabled={disabled} onClick={() => onChange(4)}>
      Rating 4
    </button>
  ),
}))

vi.mock('../../features/selfAssessmentForm/ratingSystem', () => ({
  isRatingValidForAnswer: () => true,
}))

vi.mock('../../features/user/userApi', () => ({
  useGetDefaultSignatureQuery: () => ({
    data: { data: { signatureData: 'signed' } },
    isLoading: false,
  }),
}))

describe('MySelfAssessmentFormPage autosave', () => {
  const renderPage = () => render(
    <MemoryRouter>
      <MySelfAssessmentFormPage />
    </MemoryRouter>,
  )

  afterEach(() => {
    cleanup()
  })

  beforeEach(() => {
    mocks.autosaveOptions = undefined
    mocks.autosaveState.isSaving = false
    mocks.autosaveState.lastError = null
    mocks.autosaveState.hasPendingChanges = true
    mocks.flush.mockReset()
    mocks.flush.mockResolvedValue({ ok: true })
    mocks.refetch.mockReset()
    mocks.saveDraft.mockReset()
    mocks.saveDraft.mockReturnValue({ unwrap: () => Promise.resolve({}) })
    mocks.submitForm.mockReset()
    mocks.submitForm.mockReturnValue({ unwrap: () => Promise.resolve({}) })
    mocks.employeeAcknowledge.mockReset()
    mocks.employeeDispute.mockReset()
    mocks.formStatus.status = 'DRAFT'
    mocks.formStatus.isEligible = true
    mocks.formStatus.hasActiveTemplate = true
    mocks.formStatus.deadlinePassed = false
    mocks.formStatus.message = null
    mocks.editableFormData.status = 'DRAFT'
    mocks.editableFormData.totalScore = null
    mocks.editableFormData.managerRevisedTotalScore = null
    mocks.editableFormData.managerComments = null
    mocks.editableFormData.answers[0].yesNoAnswer = null
    mocks.editableFormData.answers[0].rating = null
    mocks.editableFormData.answers[0].managerProposedYesNo = null
    mocks.editableFormData.answers[0].managerProposedRating = null
    mocks.editableFormData.answers[0].managerProposedComment = null
  })

  it('renders multi-word status labels without underscores', async () => {
    mocks.editableFormData.status = 'PENDING_HR_CALIBRATION_REVIEW'

    renderPage()

    expect(await screen.findByText('PENDING HR CALIBRATION REVIEW')).toBeTruthy()
    expect(screen.queryByText(/PENDING_HR/)).toBeNull()
  })

  it('does not show total mark until at least one question is fully answered', async () => {
    renderPage()

    expect(await screen.findByText('Did you meet your goals?')).toBeTruthy()
    expect(screen.queryByText('Total Mark')).toBeNull()
  })

  it('configures react-hook-form autosave for editable drafts', async () => {
    renderPage()

    expect(await screen.findByText('Did you meet your goals?')).toBeTruthy()
    expect(mocks.autosaveOptions.config).toMatchObject({
      debounceMs: 2000,
      maxRetries: 3,
      debug: false,
    })
    expect(
      mocks.autosaveOptions.shouldSave({
        isDirty: true,
        dirtyFields: { employeeRemarks: true },
      }),
    ).toBe(true)
    expect(mocks.autosaveOptions.mapPayload()).toEqual({
      answers: [
        {
          id: 101,
          yesNoAnswer: null,
          rating: null,
          remarks: '',
        },
      ],
      employeeRemarks: 'Initial remarks',
      overallRemarks: 'Overall',
    })
  })

  it('flushes pending changes from Save Now', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.click(await screen.findByRole('button', { name: 'Save Now' }))

    await waitFor(() => {
      expect(mocks.flush).toHaveBeenCalledTimes(1)
      expect(mocks.refetch).toHaveBeenCalledTimes(1)
    })
  })

  it('prevents autosave when the server status is read-only', async () => {
    mocks.editableFormData.status = 'SUBMITTED'

    renderPage()

    expect(await screen.findByText('Read-only mode')).toBeTruthy()
    expect(
      mocks.autosaveOptions.shouldSave({
        isDirty: true,
        dirtyFields: { employeeRemarks: true },
      }),
    ).toBe(false)
    expect(screen.queryByRole('button', { name: 'Save Now' })).toBeNull()
  })

  it('disables submit when rating is missing after Yes/No is selected', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.click(await screen.findByRole('button', { name: 'Yes' }))
    expect(screen.getByRole('button', { name: 'Submit Assessment' })).toBeDisabled()
    expect(screen.queryByRole('button', { name: 'Confirm Submit' })).toBeNull()
    expect(mocks.submitForm).not.toHaveBeenCalled()
    expect(toast.error).not.toHaveBeenCalled()
  })

  it('shows total mark from current answer ratings', async () => {
    mocks.editableFormData.answers[0].yesNoAnswer = 'Yes'
    mocks.editableFormData.answers[0].rating = 4

    renderPage()
    const totalMarkLabels = await screen.findAllByText('Total Mark')
    const totalMarkCard = totalMarkLabels
      .map((label) => label.closest('div'))
      .find((card) => (card?.textContent ?? '').includes('80.0%'))

    expect(totalMarkCard?.textContent ?? '').toContain('80.0%')
    expect(totalMarkCard?.textContent ?? '').toContain('Good')
  })

  it('shows manager review actions for expired forms pending employee review', async () => {
    mocks.formStatus.status = 'PENDING_EMPLOYEE_REVIEW'
    mocks.formStatus.deadlinePassed = true
    mocks.editableFormData.status = 'PENDING_EMPLOYEE_REVIEW'
    mocks.editableFormData.totalScore = 80
    mocks.editableFormData.managerRevisedTotalScore = 70
    mocks.editableFormData.answers[0].yesNoAnswer = 'Yes'
    mocks.editableFormData.answers[0].rating = 4
    mocks.editableFormData.answers[0].managerProposedYesNo = 'No'
    mocks.editableFormData.answers[0].managerProposedRating = 3
    mocks.editableFormData.answers[0].managerProposedComment = 'Needs stronger evidence'

    renderPage()

    expect(await screen.findByText('Manager Review Completed')).toBeTruthy()
    expect(screen.getAllByText('Manager Revised Score').length).toBeGreaterThan(0)
    expect(screen.getByText('Needs stronger evidence')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Dispute' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Acknowledge' })).toBeTruthy()
    expect(screen.queryByText('Deadline Passed')).toBeNull()
  })

  it('requires confirmation before acknowledging manager review', async () => {
    const user = userEvent.setup()
    mocks.formStatus.status = 'PENDING_EMPLOYEE_REVIEW'
    mocks.editableFormData.status = 'PENDING_EMPLOYEE_REVIEW'
    mocks.employeeAcknowledge.mockReturnValue({ unwrap: () => Promise.resolve({}) })

    renderPage()

    await user.click(await screen.findByRole('button', { name: 'Acknowledge' }))
    expect(screen.getByText('Confirm Acknowledgement')).toBeTruthy()
    expect(mocks.employeeAcknowledge).not.toHaveBeenCalled()

    await user.click(screen.getByRole('button', { name: 'Confirm Acknowledge' }))

    await waitFor(() => {
      expect(mocks.employeeAcknowledge).toHaveBeenCalledWith(1)
      expect(toast.success).toHaveBeenCalledWith('You have acknowledged the manager review')
    })
  })

  it.each(['DRAFT', 'NOT_SUBMITTED'])(
    'shows the deadline-passed state for expired %s forms',
    async (status) => {
      mocks.formStatus.status = status
      mocks.formStatus.deadlinePassed = true
      mocks.editableFormData.status = status

      renderPage()

      expect(await screen.findByText('Deadline Passed')).toBeTruthy()
      expect(screen.queryByText('Manager Review Completed')).toBeNull()
      expect(screen.queryByRole('button', { name: 'Save Now' })).toBeNull()
    },
  )
})
