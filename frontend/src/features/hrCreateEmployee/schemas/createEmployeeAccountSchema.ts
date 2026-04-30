import { addDays, format, isBefore, parseISO, startOfDay } from 'date-fns'
import { z } from 'zod'

import { getNrcTownships } from '../../employeeOnboarding/utils/nrcData'
import { toTitleCasePersonName } from '../../../utils/personName'

const townships = getNrcTownships()

/** Must match backend HrCreateEmployeeAccountRequestDto phone / emergency phone pattern. */
const phoneRe = /^(?:\+95[0-9]{5,12}|09[0-9]{6,13})$/

function startOfTodayLocal() {
  return startOfDay(new Date())
}

function nrcTownshipRefine(val: { nrcStateCode?: string; nrcTownshipCode?: string }, ctx: z.RefinementCtx) {
  const stateCode = String(val.nrcStateCode ?? '').trim()
  const townshipCode = String(val.nrcTownshipCode ?? '').trim()
  if (!stateCode || !townshipCode) return
  const township = townships.find((t) => t.short.en === townshipCode && t.stateCode === stateCode)
  if (!township) {
    ctx.addIssue({ code: 'custom', message: 'Select a valid township for the state', path: ['nrcTownshipCode'] })
  }
}

function nrcPartsRefine(
  val: {
    nrcStateCode?: string
    nrcTownshipCode?: string
    nrcType?: string
    nrcNumber?: string
  },
  ctx: z.RefinementCtx,
) {
  const parts = [
    String(val.nrcStateCode ?? '').trim(),
    String(val.nrcTownshipCode ?? '').trim(),
    String(val.nrcType ?? '').trim(),
    String(val.nrcNumber ?? '').trim(),
  ]
  const filled = parts.filter((p) => p.length > 0).length
  if (filled === 0) {
    ctx.addIssue({ code: 'custom', message: 'Required', path: ['nrcStateCode'] })
    ctx.addIssue({ code: 'custom', message: 'Required', path: ['nrcTownshipCode'] })
    ctx.addIssue({ code: 'custom', message: 'Required', path: ['nrcType'] })
    ctx.addIssue({ code: 'custom', message: 'Required', path: ['nrcNumber'] })
    return
  }
  if (filled < 4) {
    if (!parts[0]) ctx.addIssue({ code: 'custom', message: 'Required', path: ['nrcStateCode'] })
    if (!parts[1]) ctx.addIssue({ code: 'custom', message: 'Required', path: ['nrcTownshipCode'] })
    if (!parts[2]) ctx.addIssue({ code: 'custom', message: 'Required', path: ['nrcType'] })
    if (!parts[3]) ctx.addIssue({ code: 'custom', message: 'Required', path: ['nrcNumber'] })
    return
  }
  if (!/^[0-9]{6}$/.test(parts[3])) {
    ctx.addIssue({ code: 'custom', message: 'NRC number must be 6 digits', path: ['nrcNumber'] })
  }
}

function spouseNrcTownshipRefine(val: { spouseNrcStateCode?: string; spouseNrcTownshipCode?: string }, ctx: z.RefinementCtx) {
  const stateCode = String(val.spouseNrcStateCode ?? '').trim()
  const townshipCode = String(val.spouseNrcTownshipCode ?? '').trim()
  if (!stateCode || !townshipCode) return
  const tw = townships.find((t) => t.short.en === townshipCode && t.stateCode === stateCode)
  if (!tw) {
    ctx.addIssue({ code: 'custom', message: 'Select a valid township for the state', path: ['spouseNrcTownshipCode'] })
  }
}

function spouseNrcPartsRefine(
  val: {
    spouseNrcStateCode?: string
    spouseNrcTownshipCode?: string
    spouseNrcType?: string
    spouseNrcNumber?: string
  },
  ctx: z.RefinementCtx,
) {
  const parts = [
    String(val.spouseNrcStateCode ?? '').trim(),
    String(val.spouseNrcTownshipCode ?? '').trim(),
    String(val.spouseNrcType ?? '').trim(),
    String(val.spouseNrcNumber ?? '').trim(),
  ]
  const filled = parts.filter((p) => p.length > 0).length
  if (filled < 4) {
    if (!parts[0]) ctx.addIssue({ code: 'custom', message: 'Required', path: ['spouseNrcStateCode'] })
    if (!parts[1]) ctx.addIssue({ code: 'custom', message: 'Required', path: ['spouseNrcTownshipCode'] })
    if (!parts[2]) ctx.addIssue({ code: 'custom', message: 'Required', path: ['spouseNrcType'] })
    if (!parts[3]) ctx.addIssue({ code: 'custom', message: 'Required', path: ['spouseNrcNumber'] })
    return
  }
  if (!/^[0-9]{6}$/.test(parts[3])) {
    ctx.addIssue({ code: 'custom', message: 'NRC number must be 6 digits', path: ['spouseNrcNumber'] })
  }
}

function fatherNrcTownshipRefine(val: { fatherNrcStateCode?: string; fatherNrcTownshipCode?: string }, ctx: z.RefinementCtx) {
  const stateCode = String(val.fatherNrcStateCode ?? '').trim()
  const townshipCode = String(val.fatherNrcTownshipCode ?? '').trim()
  if (!stateCode || !townshipCode) return
  const tw = townships.find((t) => t.short.en === townshipCode && t.stateCode === stateCode)
  if (!tw) {
    ctx.addIssue({ code: 'custom', message: 'Select a valid township for the state', path: ['fatherNrcTownshipCode'] })
  }
}

function fatherNrcPartsRefine(
  val: {
    fatherNrcStateCode?: string
    fatherNrcTownshipCode?: string
    fatherNrcType?: string
    fatherNrcNumber?: string
  },
  ctx: z.RefinementCtx,
) {
  const parts = [
    String(val.fatherNrcStateCode ?? '').trim(),
    String(val.fatherNrcTownshipCode ?? '').trim(),
    String(val.fatherNrcType ?? '').trim(),
    String(val.fatherNrcNumber ?? '').trim(),
  ]
  const filled = parts.filter((p) => p.length > 0).length
  if (filled < 4) {
    if (!parts[0]) ctx.addIssue({ code: 'custom', message: 'Required', path: ['fatherNrcStateCode'] })
    if (!parts[1]) ctx.addIssue({ code: 'custom', message: 'Required', path: ['fatherNrcTownshipCode'] })
    if (!parts[2]) ctx.addIssue({ code: 'custom', message: 'Required', path: ['fatherNrcType'] })
    if (!parts[3]) ctx.addIssue({ code: 'custom', message: 'Required', path: ['fatherNrcNumber'] })
    return
  }
  if (!/^[0-9]{6}$/.test(parts[3])) {
    ctx.addIssue({ code: 'custom', message: 'NRC number must be 6 digits', path: ['fatherNrcNumber'] })
  }
}

export const employeeInformationSchema = z
  .object({
    email: z.string().trim().min(1, 'Email is required').email('Enter a valid email'),
    staffNo: z
      .string()
      .trim()
      .min(1, 'Staff number is required')
      .max(50, 'Max 50 characters')
      .regex(/^[0-9]+$/, 'Staff number must be digits only'),
    employeeName: z
      .string()
      .trim()
      .min(1, 'Name is required')
      .max(50, 'Max 50 characters')
      .refine((s) => s.length > 0 && !/^\s+$/.test(s), 'Name is required')
      .transform(toTitleCasePersonName),
    gender: z.enum(['Male', 'Female'], { message: 'Gender is required' }),
    dateOfBirth: z.string().min(1, 'Date of birth is required'),
    phoneNo: z.string().trim().min(1, 'Phone is required').regex(phoneRe, 'Invalid phone format'),
    address: z
      .string()
      .trim()
      .min(1, 'Address is required')
      .max(2000, 'Address must be at most 2000 characters'),
    religion: z
      .string()
      .min(1, 'Religion is required')
      .refine((val) => ['Buddhist', 'Christian', 'Muslim', 'Hindu'].includes(val), {
        message: 'Invalid religion',
      }),
    race: z.string().trim().min(1, 'Race is required').max(100),
    nrcStateCode: z.string().optional(),
    nrcTownshipCode: z.string().optional(),
    nrcType: z.string().optional(),
    nrcNumber: z.string().optional(),
  })
  .superRefine((val, ctx) => {
    const dob = parseISO(val.dateOfBirth)
    if (!isBefore(dob, startOfTodayLocal())) {
      ctx.addIssue({ code: 'custom', message: 'Date of birth must be in the past', path: ['dateOfBirth'] })
    }
    nrcPartsRefine(val, ctx)
    nrcTownshipRefine(val, ctx)
  })

/** Father table plus emergency_contact. */
export const familyEmergencyInformationSchema = z
  .object({
    maritalStatus: z.enum(['Single', 'Married'], { message: 'Marital status is required' }),
    spouseName: z.string().optional(),
    spouseNrcStateCode: z.string().optional(),
    spouseNrcTownshipCode: z.string().optional(),
    spouseNrcType: z.string().optional(),
    spouseNrcNumber: z.string().optional(),
    fatherName: z
      .string()
      .trim()
      .min(1, 'Father name is required')
      .max(100)
      .transform(toTitleCasePersonName),
    fatherNrcStateCode: z.string().optional(),
    fatherNrcTownshipCode: z.string().optional(),
    fatherNrcType: z.string().optional(),
    fatherNrcNumber: z.string().optional(),
    fatherOccupation: z.string().trim().max(100),
    emergencyPhone: z.string().trim().min(1, 'Emergency phone is required').regex(phoneRe, 'Invalid phone format'),
    emergencyRelation: z
      .string()
      .trim()
      .min(1, 'Relationship is required')
      .max(50, 'Max 50 characters'),
  })
  .superRefine((val, ctx) => {
    fatherNrcPartsRefine(val, ctx)
    fatherNrcTownshipRefine(val, ctx)
    if (val.maritalStatus === 'Married') {
      const sn = String(val.spouseName ?? '').trim()
      if (!sn) {
        ctx.addIssue({ code: 'custom', message: 'Spouse name is required', path: ['spouseName'] })
      } else if (sn.length > 100) {
        ctx.addIssue({ code: 'custom', message: 'Max 100 characters', path: ['spouseName'] })
      }
      spouseNrcPartsRefine(val, ctx)
      spouseNrcTownshipRefine(val, ctx)
    }
  })

export const employmentInformationSchema = z
  .object({
    staffType: z.enum(['PERMANENT', 'PROBATION']),
    probationStartDate: z.string().optional(),
    probationEndDate: z.string().optional(),
    hireDate: z.string().min(1, 'Hire date is required'),
    departmentId: z.number().nullable(),
    departmentPositionId: z.number().nullable(),
    positionId: z.number().nullable().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.staffType === 'PROBATION') {
      if (!data.probationStartDate) {
        ctx.addIssue({ code: 'custom', message: 'Probation start date is required', path: ['probationStartDate'] })
        return
      }
      const start = parseISO(data.probationStartDate)
      const expectedStr = format(addDays(start, 90), 'yyyy-MM-dd')
      if (data.probationEndDate !== expectedStr) {
        ctx.addIssue({
          code: 'custom',
          message: 'Probation end must be exactly 90 days after start',
          path: ['probationEndDate'],
        })
      }
    }
    if (data.departmentId == null) {
      ctx.addIssue({ code: 'custom', message: 'Department is required', path: ['departmentId'] })
    }
    if (data.departmentPositionId == null && data.positionId == null) {
      ctx.addIssue({ code: 'custom', message: 'Position is required', path: ['departmentPositionId'] })
    }
  })

export const createEmployeeAccountSchema = employeeInformationSchema
  .and(familyEmergencyInformationSchema)
  .and(employmentInformationSchema)

export type CreateEmployeeAccountFormValues = z.infer<typeof createEmployeeAccountSchema>

// ─────────────────────────────────────────────────────────────────────────────
// Edit Employee Schema  (used in EditEmployeeModal — relaxed validation)
// ─────────────────────────────────────────────────────────────────────────────

export const editEmployeeSchema = z
  .object({
    // ── locked / auto fields ────────────────────────────────────────────────
    staffNo:    z.string().optional(),
    employeeId: z.string().optional(),

    // ── personal — core required ────────────────────────────────────────────
    employeeName: z
      .string()
      .trim()
      .min(1, 'Name is required')
      .max(50, 'Max 50 characters')
      .transform(toTitleCasePersonName),
    email: z.string().trim().min(1, 'Email is required').email('Enter a valid email'),
    gender: z.enum(['Male', 'Female'], { message: 'Gender is required' }),

    // ── personal — optional ─────────────────────────────────────────────────
    dateOfBirth: z.string().optional(),
    phoneNo:     z.string().trim().optional(),
    address:     z.string().trim().max(2000).optional(),
    race: z.string().trim().max(100).optional(),
    religion:    z.string().optional(),

    // ── NRC — all optional (validated together below) ───────────────────────
    nrcStateCode:    z.string().optional(),
    nrcTownshipCode: z.string().optional(),
    nrcType:         z.string().optional(),
    nrcNumber:       z.string().optional(),

    // ── family — all optional ───────────────────────────────────────────────
    fatherName:           z.string().trim().max(100).optional(),
    fatherNrcStateCode:   z.string().optional(),
    fatherNrcTownshipCode: z.string().optional(),
    fatherNrcType:        z.string().optional(),
    fatherNrcNumber:      z.string().optional(),
    fatherOccupation:     z.string().trim().max(100).optional(),
    emergencyPhone:       z.string().trim().optional(),
    emergencyRelation:    z.string().trim().max(50).optional(),
    maritalStatus: z.enum(['Single', 'Married']).optional(),
    spouseName: z.string().trim().max(100).optional(),
    spouseNrcStateCode: z.string().optional(),
    spouseNrcTownshipCode: z.string().optional(),
    spouseNrcType: z.string().optional(),
    spouseNrcNumber: z.string().optional(),

    // ── employment — required ───────────────────────────────────────────────
    staffType:  z.enum(['PERMANENT', 'PROBATION']),
    hireDate:   z.string().min(1, 'Hire date is required'),
    departmentId: z.number().nullable(),
    departmentPositionId: z.number().nullable(),
    positionId: z.number().nullable().optional(),

    // ── probation — optional ────────────────────────────────────────────────
    probationStartDate: z.string().optional(),
    probationEndDate:   z.string().optional(),
  })
  .superRefine((val, ctx) => {
    // NRC parts: if any part is filled, all must be filled + 6-digit number
    const nrcParts = [
      String(val.nrcStateCode    ?? '').trim(),
      String(val.nrcTownshipCode ?? '').trim(),
      String(val.nrcType         ?? '').trim(),
      String(val.nrcNumber       ?? '').trim(),
    ]
    const nrcFilled = nrcParts.filter((p) => p.length > 0).length
    if (nrcFilled > 0 && nrcFilled < 4) {
      if (!nrcParts[0]) ctx.addIssue({ code: 'custom', message: 'Required', path: ['nrcStateCode'] })
      if (!nrcParts[1]) ctx.addIssue({ code: 'custom', message: 'Required', path: ['nrcTownshipCode'] })
      if (!nrcParts[2]) ctx.addIssue({ code: 'custom', message: 'Required', path: ['nrcType'] })
      if (!nrcParts[3]) ctx.addIssue({ code: 'custom', message: 'Required', path: ['nrcNumber'] })
    }
    if (nrcFilled === 4 && !/^[0-9]{6}$/.test(nrcParts[3])) {
      ctx.addIssue({ code: 'custom', message: 'NRC number must be 6 digits', path: ['nrcNumber'] })
    }
    nrcTownshipRefine(val, ctx)

    // Father NRC: same partial-fill check
    const fNrcParts = [
      String(val.fatherNrcStateCode    ?? '').trim(),
      String(val.fatherNrcTownshipCode ?? '').trim(),
      String(val.fatherNrcType         ?? '').trim(),
      String(val.fatherNrcNumber       ?? '').trim(),
    ]
    const fNrcFilled = fNrcParts.filter((p) => p.length > 0).length
    if (fNrcFilled > 0 && fNrcFilled < 4) {
      if (!fNrcParts[0]) ctx.addIssue({ code: 'custom', message: 'Required', path: ['fatherNrcStateCode'] })
      if (!fNrcParts[1]) ctx.addIssue({ code: 'custom', message: 'Required', path: ['fatherNrcTownshipCode'] })
      if (!fNrcParts[2]) ctx.addIssue({ code: 'custom', message: 'Required', path: ['fatherNrcType'] })
      if (!fNrcParts[3]) ctx.addIssue({ code: 'custom', message: 'Required', path: ['fatherNrcNumber'] })
    }
    if (fNrcFilled === 4 && !/^[0-9]{6}$/.test(fNrcParts[3])) {
      ctx.addIssue({ code: 'custom', message: 'NRC number must be 6 digits', path: ['fatherNrcNumber'] })
    }
    fatherNrcTownshipRefine(val, ctx)

    // Spouse fields: if married, require spouse name and full spouse NRC parts.
    if (val.maritalStatus === 'Married') {
      const spouseName = String(val.spouseName ?? '').trim()
      if (!spouseName) {
        ctx.addIssue({ code: 'custom', message: 'Spouse name is required', path: ['spouseName'] })
      }
      spouseNrcPartsRefine(val, ctx)
      spouseNrcTownshipRefine(val, ctx)
    }

    // Department & position mapping still required
    if (val.departmentId == null) {
      ctx.addIssue({ code: 'custom', message: 'Department is required', path: ['departmentId'] })
    }
    if (val.departmentPositionId == null && val.positionId == null) {
      ctx.addIssue({ code: 'custom', message: 'Position is required', path: ['departmentPositionId'] })
    }
  })

export type EditEmployeeFormValues = z.infer<typeof editEmployeeSchema>

