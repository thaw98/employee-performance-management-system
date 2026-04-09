import { z } from 'zod'
import { getNrcTownships } from '../utils/nrcData'
import { phoneRegex } from '../utils/phoneValidation'

const allTownships = getNrcTownships()

const today = new Date()
today.setHours(0, 0, 0, 0)

/** One user-facing message for all schema validation failures (avoids Zod default technical text). */
export const GENERIC_FIELD_VALIDATION_MESSAGE = 'Please complete this field.'

const g = GENERIC_FIELD_VALIDATION_MESSAGE

function nrcSuperRefine(val: { nrcStateCode: string; nrcTownshipCode: string }, ctx: z.RefinementCtx) {
  if (val.nrcStateCode && val.nrcTownshipCode) {
    const township = allTownships.find((t) => t.short.en === val.nrcTownshipCode)
    if (!township || township.stateCode !== val.nrcStateCode) {
      ctx.addIssue({
        code: 'custom',
        message: g,
        path: ['nrcTownshipCode'],
      })
    }
  }
}

const personalContactShape = z.object({
  employeeId: z.string(g).regex(/^[0-9]+$/, { message: g }),
  employeeName: z.string(g).min(1, g).max(50, g),
  otherName: z.string().optional(),
  nrcStateCode: z.string(g).min(1, g),
  nrcTownshipCode: z.string(g).min(1, g),
  nrcType: z.string(g).min(1, g),
  nrcNumber: z.string(g).min(1, g).regex(/^[0-9]{1,6}$/, { message: g }),
  gender: z.enum(['Male', 'Female'], g),
  race: z.string(g).min(1, g),
  religionId: z.number(g).positive(g),
  dateOfBirth: z
    .string(g)
    .min(1, g)
    .refine((v) => new Date(v) < today, g),
  birthPlace: z.string().optional(),
  contactAddress: z.string(g).min(1, g).max(500, g),
  permanentAddress: z.string().optional(),
  phoneNo: z.string(g).regex(phoneRegex, { message: g }),
  emailAddress: z.string(g).email({ message: g }),
  maritalStatus: z.string().optional(),
  spouseName: z.string().optional(),
  spouseNrcNo: z.string().optional(),
  fatherName: z.string(g).min(1, g),
  fatherNrcNo: z.string(g).min(1, g),
  fatherOccupation: z.string().optional(),
  spouseOccupation: z.string().optional(),
  hasSpouse: z.boolean().default(false),
  emergencyPhone: z.string(g).regex(phoneRegex, { message: g }),
  emergencyRelation: z.string(g).min(1, g),
  nationality: z.string(g).min(1, g).max(100, g),
})

export const PROBATION_DURATION_VALUES = ['1', '3', '6', 'custom'] as const
export type ProbationDurationValue = (typeof PROBATION_DURATION_VALUES)[number]

const employmentShape = z.object({
  departmentId: z.number(g).positive(g),
  positionId: z.number(g).positive(g),
  dateOfJoining: z
    .string(g)
    .min(1, g)
    .refine((v) => new Date(v) <= today, g),
  onProbation: z.boolean().default(false),
  probationDuration: z.enum(PROBATION_DURATION_VALUES).optional(),
  probationStartDate: z.string().optional(),
  probationEndDate: z.string().optional(),
})

/** Step 1: personal details, NRC, and contact (before employment). */
export const employeePersonalContactSchema = personalContactShape
  .superRefine(nrcSuperRefine)
  .superRefine(spouseSuperRefine)

function spouseSuperRefine(val: { hasSpouse: boolean; spouseName?: string; spouseNrcNo?: string }, ctx: z.RefinementCtx) {
  if (val.hasSpouse) {
    if (!val.spouseName || val.spouseName.trim() === '') {
      ctx.addIssue({ code: 'custom', message: g, path: ['spouseName'] })
    }
    if (!val.spouseNrcNo || val.spouseNrcNo.trim() === '') {
      ctx.addIssue({ code: 'custom', message: g, path: ['spouseNrcNo'] })
    }
  }
}

/** Step 2: department, role, joining date, probation. */
export const employeeEmploymentSchema = employmentShape.superRefine(probationSuperRefine)

function probationSuperRefine(
  val: {
    onProbation: boolean
    dateOfJoining: string
    probationDuration?: ProbationDurationValue
    probationStartDate?: string
    probationEndDate?: string
  },
  ctx: z.RefinementCtx,
) {
  if (!val.onProbation) return
  const start = (val.probationStartDate?.trim() ? val.probationStartDate : val.dateOfJoining) || ''
  if (!start) {
    ctx.addIssue({ code: 'custom', message: g, path: ['probationStartDate'] })
    return
  }
  if (!val.probationDuration) {
    ctx.addIssue({ code: 'custom', message: g, path: ['probationDuration'] })
    return
  }
  if (val.probationDuration === 'custom') {
    const end = val.probationEndDate?.trim()
    if (!end) {
      ctx.addIssue({ code: 'custom', message: g, path: ['probationEndDate'] })
      return
    }
    if (new Date(end) < new Date(start)) {
      ctx.addIssue({ code: 'custom', message: g, path: ['probationEndDate'] })
    }
  }
}

export const employeeInfoSchema = personalContactShape
  .merge(employmentShape)
  .superRefine(nrcSuperRefine)
  .superRefine(spouseSuperRefine)
  .superRefine(probationSuperRefine)

export type EmployeeInfoFormValues = z.infer<typeof employeeInfoSchema>
