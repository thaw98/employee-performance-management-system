import type { EmployeeInfoFormValues } from '../schemas/employeeInfoSchema'
import type { EmployeeDraftPayload, EmployeeInfoPayload } from '../types/employee'
import { STAFF_TYPE_PROBATION } from './staffType'

function trimStr(v: unknown): string | undefined {
  if (v === undefined || v === null) return undefined
  const t = String(v).trim()
  return t === '' ? undefined : t
}

function positiveId(v: unknown): number | undefined {
  if (typeof v !== 'number' || Number.isNaN(v) || v <= 0) return undefined
  return v
}

/** Maps current form values to a partial API body; empty fields are omitted so the backend stores nulls. */
export function buildEmployeeDraftPayload(values: Partial<EmployeeInfoFormValues>): EmployeeDraftPayload {
  const fatherNrcNo =
    values.fatherNrcStateCode &&
    values.fatherNrcTownshipCode &&
    values.fatherNrcType &&
    values.fatherNrcNumber
      ? `${values.fatherNrcStateCode}/${values.fatherNrcTownshipCode}(${values.fatherNrcType})${values.fatherNrcNumber}`
      : trimStr(values.fatherNrcNo)

  const staffNrcNo =
    values.nrcStateCode &&
    values.nrcTownshipCode &&
    values.nrcType &&
    values.nrcNumber &&
    /^[0-9]{6}$/.test(String(values.nrcNumber).trim())
      ? `${values.nrcStateCode}/${values.nrcTownshipCode}(${values.nrcType})${values.nrcNumber}`
      : undefined

  const p: EmployeeDraftPayload = {
    employeeName: trimStr(values.employeeName),
    otherName: trimStr(values.otherName),
    staffNrcNo,
    gender: trimStr(values.gender),
    race: trimStr(values.race),
    religionId: positiveId(values.religionId),
    dateOfBirth: trimStr(values.dateOfBirth),
    birthPlace: trimStr(values.birthPlace),
    contactAddress: trimStr(values.contactAddress),
    permanentAddress: trimStr(values.permanentAddress),
    phoneNo: trimStr(values.phoneNo),
    fatherName: trimStr(values.fatherName),
    fatherNrcNo,
    fatherOccupation: trimStr(values.fatherOccupation),
    spouseOccupation: trimStr(values.spouseOccupation),
    emergencyPhone: trimStr(values.emergencyPhone),
    emergencyRelation: trimStr(values.emergencyRelation),
    departmentId: positiveId(values.departmentId),
    positionId: positiveId(values.positionId),
    nationality: trimStr(values.nationality),
    dateOfJoining: trimStr(values.dateOfJoining),
    staffTypeId: positiveId(values.staffTypeId),
    probationStartDate: trimStr(values.probationStartDate),
    probationMonth:
      values.staffTypeId === STAFF_TYPE_PROBATION &&
      values.probationDuration &&
      values.probationDuration !== 'custom'
        ? Number(values.probationDuration)
        : undefined,
    probationEndDate:
      values.staffTypeId === STAFF_TYPE_PROBATION && values.probationDuration === 'custom'
        ? trimStr(values.probationEndDate)
        : undefined,
  }
  return Object.fromEntries(Object.entries(p).filter(([, v]) => v !== undefined)) as EmployeeDraftPayload
}

/** Full create payload from validated form values (drops UI-only probation duration). */
export function buildEmployeeCreatePayload(v: EmployeeInfoFormValues): EmployeeInfoPayload {
  const {
    probationDuration,
    probationStartDate,
    probationEndDate,
    staffTypeId,
    nrcStateCode,
    nrcTownshipCode,
    nrcType,
    nrcNumber,
    fatherNrcStateCode,
    fatherNrcTownshipCode,
    fatherNrcType,
    fatherNrcNumber,
    ...rest
  } = v

  const staffNrcNo = `${nrcStateCode}/${nrcTownshipCode}(${nrcType})${nrcNumber}`

  const fatherNrcNo =
    fatherNrcStateCode && fatherNrcTownshipCode && fatherNrcType && fatherNrcNumber
      ? `${fatherNrcStateCode}/${fatherNrcTownshipCode}(${fatherNrcType})${fatherNrcNumber}`
      : v.fatherNrcNo

  const payload = {
    ...rest,
    staffNrcNo,
    fatherNrcNo,
    staffTypeId,
  } as EmployeeInfoPayload

  if (staffTypeId !== STAFF_TYPE_PROBATION) {
    payload.probationStartDate = undefined
    payload.probationMonth = undefined
    payload.probationEndDate = undefined
    return payload
  }
  payload.probationStartDate = probationStartDate?.trim() ? probationStartDate : v.dateOfJoining
  if (probationDuration === 'custom') {
    payload.probationMonth = null
    payload.probationEndDate = probationEndDate ?? null
  } else {
    payload.probationMonth = probationDuration ? Number(probationDuration) : undefined
    payload.probationEndDate = undefined
  }
  return payload
}

