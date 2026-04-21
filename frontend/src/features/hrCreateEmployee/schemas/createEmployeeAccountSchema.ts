import { isBefore, parseISO, startOfDay } from 'date-fns'
import { z } from 'zod'

import { getNrcTownships } from '../../employeeOnboarding/utils/nrcData'
import { toTitleCasePersonName } from '../../../utils/personName'

const townships = getNrcTownships()

const phoneRe = /^\+?[0-9]{8,15}$/

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
    gender: z.enum(['Male', 'Female'], {
      required_error: 'Gender is required',
      invalid_type_error: 'Gender is required',
    }),
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
    nationality: z.string().trim().min(1, 'Nationality is required').max(100),
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
  })

export const employmentInformationSchema = z
  .object({
    staffType: z.enum(['PERMANENT', 'PROBATION']),
    probationStartDate: z.string().optional(),
    probationEndDate: z.string().optional(),
    hireDate: z.string().min(1, 'Hire date is required'),
    departmentId: z.number().nullable(),
    positionId: z.number().nullable(),
  })
  .superRefine((data, ctx) => {
    if (data.staffType === 'PROBATION') {
      if (!data.probationStartDate) {
        ctx.addIssue({ code: 'custom', message: 'Probation start date is required', path: ['probationStartDate'] })
        return
      }
      const start = parseISO(data.probationStartDate)
      const expectedEnd = new Date(start)
      expectedEnd.setMonth(expectedEnd.getMonth() + 3)
      const y = expectedEnd.getFullYear()
      const m = String(expectedEnd.getMonth() + 1).padStart(2, '0')
      const d = String(expectedEnd.getDate()).padStart(2, '0')
      const expectedStr = `${y}-${m}-${d}`
      if (data.probationEndDate !== expectedStr) {
        ctx.addIssue({
          code: 'custom',
          message: 'Probation end must be exactly 3 months after start',
          path: ['probationEndDate'],
        })
      }
    }
    if (data.departmentId == null) {
      ctx.addIssue({ code: 'custom', message: 'Department is required', path: ['departmentId'] })
    }
    if (data.positionId == null) {
      ctx.addIssue({ code: 'custom', message: 'Position is required', path: ['positionId'] })
    }
  })

export const createEmployeeAccountSchema = employeeInformationSchema
  .and(familyEmergencyInformationSchema)
  .and(employmentInformationSchema)

export type CreateEmployeeAccountFormValues = z.infer<typeof createEmployeeAccountSchema>
