import React from 'react'
import { cleanup, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ManagerEvaluationPage } from './ManagerEvaluationPage'

const mocks = vi.hoisted(() => {
  const assignment = {
    id: 11,
    employee: {
      id: 5,
      employeeId: 'E-001',
      employeeName: 'Ada Lovelace',
      department: { departmentName: 'Engineering', name: 'Engineering' },
      position: { positionName: 'Developer', name: 'Developer' },
    },
    template: {
      id: 3,
      name: 'Q1 Appraisal',
      maxRating: 5,
      categories: [
        {
          id: 2,
          name: 'Delivery',
          description: 'Delivery quality',
          questions: [
            {
              id: 101,
              questionText: 'Meets goals',
              isRequired: true,
              sortOrder: 1,
            },
          ],
        },
      ],
    },
    status: 'PENDING_MANAGER',
    managerComments: 'Initial manager note',
    managerSignature: '',
    answers: [
      {
        question: { id: 101 },
        rating: 4,
        comments: 'Strong delivery',
      },
    ],
  }

  return {
    assignment,
    navigate: vi.fn(),
    axiosGet: vi.fn(),
    axiosPost: vi.fn(),
    autosaveOptions: undefined as any,
    withRetryOptions: undefined as any,
    autosaveState: {
      isSaving: false,
      lastError: null as Error | null,
      hasPendingChanges: true,
    },
    flush: vi.fn(),
    forceBaselineUpdate: vi.fn(),
  }
})

vi.mock('react-router-dom', () => ({
  useParams: () => ({ id: '11' }),
  useNavigate: () => mocks.navigate,
}))

vi.mock('react-hot-toast', () => ({
  toast: {
    loading: vi.fn(),
    success: vi.fn(),
    error: vi.fn(),
  },
}))

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
      forceBaselineUpdate: mocks.forceBaselineUpdate,
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
  withRetry: vi.fn((transport, options) => {
    mocks.withRetryOptions = options
    return transport
  }),
}))

vi.mock('../../app/axiosInstance', () => ({
  default: {
    get: (...args: any[]) => mocks.axiosGet(...args),
    post: (...args: any[]) => mocks.axiosPost(...args),
  },
}))

vi.mock('../../features/user/userApi', () => ({
  useGetDefaultSignatureQuery: () => ({
    data: { data: { signatureData: 'default-signature' } },
    isLoading: false,
    refetch: vi.fn().mockResolvedValue({ data: { data: { signatureData: 'default-signature' } } }),
  }),
}))

vi.mock('../../features/scoreExplanation/scoreExplanationApi', () => ({
  useGetScoreExplanationsQuery: () => ({ data: undefined, isLoading: false, isError: false }),
}))

vi.mock('react-signature-canvas', () => ({
  default: React.forwardRef((props: any, ref: React.Ref<any>) => {
    React.useImperativeHandle(ref, () => ({
      clear: vi.fn(),
      isEmpty: () => true,
      getCanvas: () => ({ toDataURL: () => 'drawn-signature' }),
    }))
    return <div data-testid="signature-canvas" {...props.canvasProps} />
  }),
}))

vi.mock('../../utils/exportAppraisalPdf', () => ({
  exportAppraisalPdf: vi.fn(),
}))

describe('ManagerEvaluationPage autosave', () => {
  afterEach(() => {
    cleanup()
  })

  beforeEach(() => {
    mocks.navigate.mockReset()
    mocks.flush.mockReset()
    mocks.flush.mockResolvedValue({ ok: true })
    mocks.forceBaselineUpdate.mockReset()
    mocks.axiosGet.mockReset()
    mocks.axiosGet.mockImplementation((url: string) => {
      if (url === '/signatures/default') {
        return Promise.resolve({ data: { success: true, data: { signatureData: 'default-signature' } } })
      }
      return Promise.resolve({ data: { success: true, data: structuredClone(mocks.assignment) } })
    })
    mocks.axiosPost.mockReset()
    mocks.axiosPost.mockResolvedValue({ data: { success: true, data: structuredClone(mocks.assignment) } })
    mocks.assignment.status = 'PENDING_MANAGER'
    mocks.assignment.managerComments = 'Initial manager note'
    mocks.assignment.managerSignature = ''
    mocks.assignment.answers[0].rating = 4
    mocks.assignment.answers[0].comments = 'Strong delivery'
    mocks.autosaveOptions = undefined
    mocks.withRetryOptions = undefined
    mocks.autosaveState.isSaving = false
    mocks.autosaveState.lastError = null
    mocks.autosaveState.hasPendingChanges = true
  })

  it('shows live score and completion progress while evaluating', async () => {
    render(<ManagerEvaluationPage />)

    expect(await screen.findByText('Meets goals')).toBeTruthy()
    expect(screen.getByText('Completion Progress')).toBeTruthy()
    expect(screen.getByText('(1/1 Answered)')).toBeTruthy()
    expect(screen.getByText('Live Score')).toBeTruthy()
    expect(screen.getByText('80.0%')).toBeTruthy()
    expect(screen.getByText('GOOD')).toBeTruthy()
    expect(screen.getByText('1/1 Answered')).toBeTruthy()
    expect(screen.getByText('100% complete')).toBeTruthy()
  })

  it('updates live score when a rating changes', async () => {
    mocks.assignment.answers[0].rating = 0
    const user = userEvent.setup()
    render(<ManagerEvaluationPage />)

    await screen.findByText('Meets goals')
    expect(screen.getByText('(0/1 Answered)')).toBeTruthy()
    expect(screen.getByText('0.0%')).toBeTruthy()
    expect(screen.getByText('1 question remaining')).toBeTruthy()

    await user.click(screen.getByRole('button', { name: '5' }))

    await waitFor(() => {
      expect(screen.getByText('(1/1 Answered)')).toBeTruthy()
      expect(screen.getByText('100.0%')).toBeTruthy()
      expect(screen.getByText('EXCEPTIONAL')).toBeTruthy()
    })
  })

  it('configures autosave with debounce and retry, mapping answers while excluding signature', async () => {
    render(<ManagerEvaluationPage />)

    expect(await screen.findByText('Meets goals')).toBeTruthy()
    expect(mocks.autosaveOptions.config).toMatchObject({
      debounceMs: 2000,
      maxRetries: 3,
      debug: false,
    })
    expect(mocks.withRetryOptions).toEqual({ maxRetries: 3 })
    expect(
      mocks.autosaveOptions.shouldSave({
        isDirty: true,
        dirtyFields: { comments: true },
      }),
    ).toBe(true)
    expect(mocks.autosaveOptions.mapPayload()).toEqual({
      answers: [
        {
          questionId: 101,
          rating: 4,
          comments: 'Strong delivery',
        },
      ],
      comments: 'Initial manager note',
    })
  })

  it('manual Save Draft flushes pending changes and posts signature-inclusive payload', async () => {
    const user = userEvent.setup()
    render(<ManagerEvaluationPage />)

    await screen.findByText('Meets goals')
    const formLoads = mocks.axiosGet.mock.calls.filter(
      ([url]) => url === '/appraisal-assignments/11/form',
    ).length

    await user.click(await screen.findByRole('button', { name: 'Save Draft' }))

    await waitFor(() => {
      expect(mocks.flush).toHaveBeenCalledTimes(1)
      expect(mocks.axiosPost).toHaveBeenCalledWith('/appraisal-assignments/11/draft', {
        answers: [
          {
            questionId: 101,
            rating: 4,
            comments: 'Strong delivery',
          },
        ],
        comments: 'Initial manager note',
        signature: 'default-signature',
      })
      expect(mocks.forceBaselineUpdate).toHaveBeenCalledTimes(1)
    })

    const formLoadsAfterSave = mocks.axiosGet.mock.calls.filter(
      ([url]) => url === '/appraisal-assignments/11/form',
    ).length
    expect(formLoadsAfterSave).toBe(formLoads)
    expect(screen.queryByText('Loading appraisal form...')).toBeNull()
  })

  it('disables autosave and edit actions when the assignment is read-only', async () => {
    mocks.assignment.status = 'SUBMITTED'

    render(<ManagerEvaluationPage />)

    expect(await screen.findByText('View Evaluation')).toBeTruthy()
    expect(
      mocks.autosaveOptions.shouldSave({
        isDirty: true,
        dirtyFields: { comments: true },
      }),
    ).toBe(false)
    expect(screen.queryByRole('button', { name: 'Save Draft' })).toBeNull()
    expect(screen.queryByRole('button', { name: 'Submit Evaluation' })).toBeNull()
  })

  it('shows a confirmation modal before final submit', async () => {
    const user = userEvent.setup()
    render(<ManagerEvaluationPage />)

    await user.click(await screen.findByRole('button', { name: 'Submit Evaluation' }))

    const dialog = await screen.findByRole('dialog')
    expect(within(dialog).getByText(/finalize it and send it to HR/i)).toBeTruthy()
    expect(mocks.flush).not.toHaveBeenCalled()
    expect(mocks.axiosPost).not.toHaveBeenCalledWith(
      '/appraisal-assignments/11/evaluate',
      expect.anything(),
    )

    await user.click(within(dialog).getByRole('button', { name: 'Submit Evaluation' }))

    await waitFor(() => {
      expect(mocks.flush).toHaveBeenCalledTimes(1)
      expect(mocks.axiosPost).toHaveBeenCalledWith('/appraisal-assignments/11/evaluate', {
        answers: [
          {
            questionId: 101,
            rating: 4,
            comments: 'Strong delivery',
          },
        ],
        comments: 'Initial manager note',
        signature: 'default-signature',
      })
    })
  })

  it('does not submit when the confirmation modal is cancelled', async () => {
    const user = userEvent.setup()
    render(<ManagerEvaluationPage />)

    await user.click(await screen.findByRole('button', { name: 'Submit Evaluation' }))
    const dialog = await screen.findByRole('dialog')
    await user.click(within(dialog).getByRole('button', { name: 'Cancel' }))

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).toBeNull()
    })
    expect(mocks.flush).not.toHaveBeenCalled()
    expect(mocks.axiosPost).not.toHaveBeenCalledWith(
      '/appraisal-assignments/11/evaluate',
      expect.anything(),
    )
  })
})
