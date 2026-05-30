import { describe, expect, it } from 'vitest'
import type { SelfAssessmentFormDto } from './api/selfAssessmentFormApi'
import { resolveAttemptsForExport } from './exportSelfAssessmentReviewPdf'

const baseForm = (): SelfAssessmentFormDto => ({
  id: 8,
  templateId: 1,
  cycleId: 1,
  cycleName: 'Q1 2026',
  cycleStartDate: null,
  cycleEndDate: null,
  title: 'Self Assessment',
  ratingSystem: 'FIVE_POINT',
  tenPointYesMinRating: 7,
  fivePointYesMinRating: 3,
  startDate: null,
  deadlineDate: null,
  managerReviewDeadlineDate: null,
  finalApprovalDeadlineDate: null,
  assignedAt: null,
  assignedBy: null,
  status: 'FINALIZED_LOCKED',
  totalScore: 80,
  ratingCategory: 'Good',
  employeeRemarks: null,
  employeeSignatureId: null,
  employeeSignatureData: null,
  employeeSignatureType: null,
  employeeSignatureDate: null,
  overallRemarks: null,
  managerId: 2,
  managerName: 'Manager',
  managerSignatureId: null,
  managerSignatureData: null,
  managerSignatureType: null,
  managerSignatureDate: null,
  managerComments: null,
  hrSignatureId: null,
  hrSignatureData: null,
  hrSignatureType: null,
  hrSignatureDate: null,
  hrFinalSignatureId: null,
  hrFinalSignatureData: null,
  hrFinalSignatureType: null,
  hrFinalSignatureDate: null,
  hrAdjustmentSignatureId: null,
  hrAdjustmentSignatureData: null,
  hrAdjustmentSignatureType: null,
  hrAdjustmentSignatureDate: null,
  createdDate: '2026-01-01T00:00:00Z',
  submittedDate: '2026-01-10T00:00:00Z',
  assessmentDate: '2026-01-10',
  employee: {
    id: 1,
    employeeId: 'E001',
    employeeName: 'Jane Doe',
    email: 'jane@example.com',
    departmentId: 1,
    departmentName: 'IT',
    departmentCode: 'IT',
    positionId: 1,
    positionName: 'Developer',
    positionCode: 'DEV',
    roleId: 3,
  },
  answers: [],
  adjustments: [],
  managerRevisedTotalScore: null,
  finalApprovedTotalScore: 85,
  employeeAcknowledgedAt: null,
  employeeDisputedAt: null,
  employeeDisputeReason: null,
  retakeRequestedAt: '2026-01-12T00:00:00Z',
	  retakeSubmittedAt: '2026-01-15T00:00:00Z',
	  retakeRequestUsed: true,
	  managerApprovedRetakeAt: '2026-01-16T00:00:00Z',
	  managerForceChangeApprovedAt: null,
  hrReviewRequired: false,
  hrReviewReason: null,
  hrReturnComments: null,
  hrReviewReasonAt: null,
  hrName: null,
  submissionAttempts: [
    {
      attemptNumber: 1,
      submittedAt: '2026-01-10T00:00:00Z',
      retakeReason: null,
      answers: [
        {
          answerId: 1,
          questionText: 'Q1',
          sortOrder: 1,
          yesNoAnswer: 'No',
          rating: 2,
	          remarks: null,
	          retakeReason: null,
	          managerForceChangeReason: null,
	        },
      ],
    },
    {
      attemptNumber: 2,
      submittedAt: '2026-01-15T00:00:00Z',
      retakeReason: 'Improved performance',
      answers: [
        {
          answerId: 1,
          questionText: 'Q1',
          sortOrder: 1,
          yesNoAnswer: 'Yes',
          rating: 5,
	          remarks: null,
	          retakeReason: 'Improved performance',
	          managerForceChangeReason: null,
	        },
      ],
    },
  ],
})

describe('resolveAttemptsForExport', () => {
  it('returns only the final attempt when a retake submission exists', () => {
    const attempts = resolveAttemptsForExport(baseForm())

    expect(attempts).toHaveLength(1)
    expect(attempts[0].attemptNumber).toBe(2)
    expect(attempts[0].answers[0].yesNoAnswer).toBe('Yes')
    expect(attempts[0].answers[0].rating).toBe(5)
  })

  it('returns the single attempt when no retake exists', () => {
    const form = baseForm()
    form.submissionAttempts = [form.submissionAttempts[0]]
    form.retakeSubmittedAt = null
    form.retakeRequestUsed = false

    const attempts = resolveAttemptsForExport(form)

    expect(attempts).toHaveLength(1)
    expect(attempts[0].attemptNumber).toBe(1)
    expect(attempts[0].answers[0].yesNoAnswer).toBe('No')
  })
})
