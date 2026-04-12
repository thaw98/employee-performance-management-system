import { isAfter, isBefore, parseISO, startOfDay } from 'date-fns'
import { z } from 'zod'
import { getNrcTownships } from '../utils/nrcData'
import { phoneRegex } from '../utils/phoneValidation'
import { STAFF_TYPE_PERMANENT, STAFF_TYPE_PROBATION } from '../utils/staffType'

const allTownships = getNrcTownships()

/** Local start of "today" for comparisons (avoid `new Date("yyyy-mm-dd")` UTC parsing). */
function startOfTodayLocal() {
  return startOfDay(new Date())
}

/** One user-facing message for all schema validation failures (avoids Zod default technical text). */
export const GENERIC_FIELD_VALIDATION_MESSAGE = 'Please complete this field.'

const g = GENERIC_FIELD_VALIDATION_MESSAGE

function staffNrcSuperRefine(val: Record<string, unknown>, ctx: z.RefinementCtx) {
  const stateCode = String(val.nrcStateCode ?? '').trim()
  const townshipCode = String(val.nrcTownshipCode ?? '').trim()
  if (!stateCode || !townshipCode) return
  // Short codes like "LaMaNa" repeat across states; match state + township together.
  const township = allTownships.find(
    (t) => t.short.en === townshipCode && t.stateCode === stateCode,
  )
  if (!township) {
    ctx.addIssue({ code: 'custom', message: g, path: ['nrcTownshipCode'] })
  }
}

/** Empty father NRC is allowed; if any part is set, all parts must be valid and consistent. */
function fatherNrcSuperRefine(val: Record<string, unknown>, ctx: z.RefinementCtx) {
  const stateCode = String(val.fatherNrcStateCode ?? '').trim()
  const townshipCode = String(val.fatherNrcTownshipCode ?? '').trim()
  const type = String(val.fatherNrcType ?? '').trim()
  const number = String(val.fatherNrcNumber ?? '').trim()
  const parts = [stateCode, townshipCode, type, number]
  const filledCount = parts.filter((p) => p.length > 0).length
  if (filledCount === 0) {
    return
  }
  if (filledCount < 4) {
    if (!stateCode) ctx.addIssue({ code: 'custom', message: g, path: ['fatherNrcStateCode'] })
    if (!townshipCode) ctx.addIssue({ code: 'custom', message: g, path: ['fatherNrcTownshipCode'] })
    if (!type) ctx.addIssue({ code: 'custom', message: g, path: ['fatherNrcType'] })
    if (!number) ctx.addIssue({ code: 'custom', message: g, path: ['fatherNrcNumber'] })
    return
  }
  if (!/^[0-9]{1,6}$/.test(number)) {
    ctx.addIssue({ code: 'custom', message: g, path: ['fatherNrcNumber'] })
    return
  }
  const township = allTownships.find(
    (t) => t.short.en === townshipCode && t.stateCode === stateCode,
  )
  if (!township) {
    ctx.addIssue({
      code: 'custom',
      message: g,
      path: ['fatherNrcTownshipCode'],
    })
  }
}

const personalContactShape = z.object({
  /** Business employee number; stored on employees.employee_id (you assign it — not auto-filled from the database id). */
  employeeId: z
    .string(g)
    .min(1, g)
    .regex(/^[A-Za-z0-9._-]{1,100}$/, 'Use letters, digits, dots, underscores, or hyphens only (1–100 characters).'),
  employeeName: z.string(g).min(1, g).max(50, g),
  otherName: z.string().optional(),
  nrcStateCode: z.string(g).min(1, g),
  nrcTownshipCode: z.string(g).min(1, g),
  nrcType: z.string(g).min(1, g),
  nrcNumber: z.string(g).regex(/^[0-9]{6}$/, g),
  gender: z.enum(['Male', 'Female'], g),
  race: z.string(g).min(1, g),
  religionId: z.number(g).positive(g),
  dateOfBirth: z
    .string(g)
    .min(1, g)
    .refine((v) => isBefore(parseISO(v), startOfTodayLocal()), g),
  birthPlace: z.string().optional(),
  contactAddress: z.string(g).min(1, g).max(500, g),
  permanentAddress: z.string().optional(),
  phoneNo: z.string(g).regex(phoneRegex, { message: g }),
  fatherName: z.string().max(100, g),
  fatherNrcNo: z.string().optional(),
  fatherNrcStateCode: z.string(),
  fatherNrcTownshipCode: z.string(),
  fatherNrcType: z.string(),
  fatherNrcNumber: z.string(),
  fatherOccupation: z.string().optional(),
  spouseOccupation: z.string().optional(),
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
    .refine((v) => !isAfter(parseISO(v), startOfTodayLocal()), g),
  staffTypeId: z
    .number(g)
    .refine((n) => n === STAFF_TYPE_PERMANENT || n === STAFF_TYPE_PROBATION, g)
    .default(STAFF_TYPE_PERMANENT),
  probationDuration: z.enum(PROBATION_DURATION_VALUES).optional(),
  probationStartDate: z.string().optional(),
  probationEndDate: z.string().optional(),
})

/** Step 1: personal details, NRC, and contact (before employment). */
export const employeePersonalContactSchema = personalContactShape.superRefine((val, ctx) => {
  staffNrcSuperRefine(val as Record<string, unknown>, ctx)
  fatherNrcSuperRefine(val as Record<string, unknown>, ctx)
})

/** Step 2: department, role, joining date, probation. */
export const employeeEmploymentSchema = employmentShape.superRefine(probationSuperRefine)

function probationSuperRefine(
  val: {
    staffTypeId: number
    dateOfJoining: string
    probationDuration?: ProbationDurationValue
    probationStartDate?: string
    probationEndDate?: string
  },
  ctx: z.RefinementCtx,
) {
  if (val.staffTypeId !== STAFF_TYPE_PROBATION) return
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
    if (isBefore(parseISO(end), parseISO(start))) {
      ctx.addIssue({ code: 'custom', message: g, path: ['probationEndDate'] })
    }
  }
}

export const employeeInfoSchema = personalContactShape
  .merge(employmentShape)
  .superRefine((val, ctx) => {
    staffNrcSuperRefine(val as Record<string, unknown>, ctx)
    fatherNrcSuperRefine(val as Record<string, unknown>, ctx)
  })
  .superRefine(probationSuperRefine)

export type EmployeeInfoFormValues = z.infer<typeof employeeInfoSchema>

