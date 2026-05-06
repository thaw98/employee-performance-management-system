import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MySelfAssessmentFormPage } from './MySelfAssessmentFormPage'

const mocks = vi.hoisted(() => {
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
  }

  return {
    autosaveOptions: undefined as any,
    autosaveState: {
      isSaving: false,
      lastError: null as Error | null,
      hasPendingChanges: true,
    },
    editableFormData,
    flush: vi.fn(),
    refetch: vi.fn(),
    saveDraft: vi.fn(),
    submitForm: vi.fn(),
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
    data: {
      status: 'DRAFT',
      isEligible: true,
      hasActiveTemplate: true,
      deadlinePassed: false,
      message: null,
    },
    isLoading: false,
  }),
  useGetMyCurrentFormQuery: () => ({
    data: mocks.editableFormData,
    isLoading: false,
    refetch: mocks.refetch,
  }),
  useSaveDraftMutation: () => [mocks.saveDraft, { isLoading: false }],
  useSubmitFormMutation: () => [mocks.submitForm, { isLoading: false }],
}))

vi.mock('../../features/selfAssessmentForm/components/SelfAssessmentRatingPicker', () => ({
  SelfAssessmentRatingPicker: ({ onChange, disabled }: { onChange: (value: number) => void; disabled: boolean }) => (
    <button type="button" disabled={disabled} onClick={() => onChange(4)}>
      Rating 4
    </button>
  ),
}))

describe('MySelfAssessmentFormPage autosave', () => {
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
    mocks.editableFormData.status = 'DRAFT'
  })

  it('configures react-hook-form autosave for editable drafts', async () => {
    render(<MySelfAssessmentFormPage />)

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
    render(<MySelfAssessmentFormPage />)

    await user.click(await screen.findByRole('button', { name: 'Save Now' }))

    await waitFor(() => {
      expect(mocks.flush).toHaveBeenCalledTimes(1)
      expect(mocks.refetch).toHaveBeenCalledTimes(1)
    })
  })

  it('prevents autosave when the server status is read-only', async () => {
    mocks.editableFormData.status = 'SUBMITTED'

    render(<MySelfAssessmentFormPage />)

    expect(await screen.findByText('Read-only mode')).toBeTruthy()
    expect(
      mocks.autosaveOptions.shouldSave({
        isDirty: true,
        dirtyFields: { employeeRemarks: true },
      }),
    ).toBe(false)
    expect(screen.queryByRole('button', { name: 'Save Now' })).toBeNull()
  })
})
