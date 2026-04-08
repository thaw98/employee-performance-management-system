import { z } from 'zod'
import { getNrcTownships } from 'mm-nrc'
import { phoneRegex } from '../utils/phoneValidation'

const allTownships = getNrcTownships()

const today = new Date()
today.setHours(0, 0, 0, 0)

export const employeeInfoSchema = z
  .object({
  employeeId: z.string().regex(/^[0-9]+$/, 'Employee ID must be numeric only'),
  employeeName: z.string().min(1).max(50),
  otherName: z.string().optional(),
  nrcStateCode: z.string().min(1, 'State/Region is required'),
  nrcTownshipCode: z.string().min(1, 'Township is required'),
  nrcType: z.string().min(1, 'NRC type is required'),
  nrcNumber: z
    .string()
    .min(1, 'NRC number is required')
    .regex(/^[0-9]+$/, 'NRC number must be digits only'),
  gender: z.enum(['Male', 'Female'], { message: 'Gender must be Male or Female' }),
  race: z.string().min(1),
  religionId: z.number().positive(),
  dateOfBirth: z.string().min(1).refine((v) => new Date(v) < today, 'Date of birth must be in the past'),
  birthPlace: z.string().optional(),
  contactAddress: z.string().optional(),
  permanentAddress: z.string().optional(),
  phoneNo: z.string().regex(phoneRegex, 'Invalid phone number'),
  emailAddress: z.string().email(),
  maritalStatus: z.string().optional(),
  spouseName: z.string().optional(),
  spouseNrcNo: z.string().optional(),
  fatherName: z.string().optional(),
  fatherNrcNo: z.string().optional(),
  fatherOccupation: z.string().optional(),
  spouseOccupation: z.string().optional(),
  departmentId: z.number().positive(),
  positionId: z.number().positive(),
  nationalityId: z.number().positive(),
  dateOfJoining: z.string().min(1).refine((v) => new Date(v) <= today, 'Date of joining cannot be in future'),
  onProbation: z.boolean().default(false),
  probationStartDate: z.string().optional(),
  })
  .superRefine((val, ctx) => {
    if (val.nrcStateCode && val.nrcTownshipCode) {
      const township = allTownships.find((t) => t.short.en === val.nrcTownshipCode)
      if (!township || township.stateCode !== val.nrcStateCode) {
        ctx.addIssue({
          code: 'custom',
          message: 'Township does not belong to selected State/Region',
          path: ['nrcTownshipCode'],
        })
      }
    }
  })

export type EmployeeInfoFormValues = z.infer<typeof employeeInfoSchema>
