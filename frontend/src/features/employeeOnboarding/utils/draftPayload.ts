import type { EmployeeInfoFormValues } from '../schemas/employeeInfoSchema'
import type { EmployeeDraftPayload, EmployeeInfoPayload } from '../types/employee'

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

  const spouseNrcNo =
    values.spouseNrcStateCode &&
    values.spouseNrcTownshipCode &&
    values.spouseNrcType &&
    values.spouseNrcNumber
      ? `${values.spouseNrcStateCode}/${values.spouseNrcTownshipCode}(${values.spouseNrcType})${values.spouseNrcNumber}`
      : trimStr(values.spouseNrcNo)

  const p: EmployeeDraftPayload = {
    employeeId: trimStr(values.employeeId),
    employeeName: trimStr(values.employeeName),
    otherName: trimStr(values.otherName),
    nrcStateCode: trimStr(values.nrcStateCode),
    nrcTownshipCode: trimStr(values.nrcTownshipCode),
    nrcType: trimStr(values.nrcType),
    nrcNumber: trimStr(values.nrcNumber),
    gender: trimStr(values.gender),
    race: trimStr(values.race),
    religionId: positiveId(values.religionId),
    dateOfBirth: trimStr(values.dateOfBirth),
    birthPlace: trimStr(values.birthPlace),
    contactAddress: trimStr(values.contactAddress),
    permanentAddress: trimStr(values.permanentAddress),
    phoneNo: trimStr(values.phoneNo),
    emailAddress: trimStr(values.emailAddress),
    maritalStatus: trimStr(values.maritalStatus),
    spouseName: trimStr(values.spouseName),
    spouseNrcNo,
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
    onProbation: values.onProbation === true ? true : undefined,
    probationStartDate: trimStr(values.probationStartDate),
    probationMonth:
      values.onProbation === true && values.probationDuration && values.probationDuration !== 'custom'
        ? Number(values.probationDuration)
        : undefined,
    probationEndDate:
      values.onProbation === true && values.probationDuration === 'custom'
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
    onProbation,
    fatherNrcStateCode,
    fatherNrcTownshipCode,
    fatherNrcType,
    fatherNrcNumber,
    spouseNrcStateCode,
    spouseNrcTownshipCode,
    spouseNrcType,
    spouseNrcNumber,
    ...rest 
  } = v

  const fatherNrcNo =
    fatherNrcStateCode && fatherNrcTownshipCode && fatherNrcType && fatherNrcNumber
      ? `${fatherNrcStateCode}/${fatherNrcTownshipCode}(${fatherNrcType})${fatherNrcNumber}`
      : v.fatherNrcNo

  const spouseNrcNo =
    spouseNrcStateCode && spouseNrcTownshipCode && spouseNrcType && spouseNrcNumber
      ? `${spouseNrcStateCode}/${spouseNrcTownshipCode}(${spouseNrcType})${spouseNrcNumber}`
      : v.spouseNrcNo

  const payload = {
    ...rest,
    fatherNrcNo,
    spouseNrcNo,
    onProbation: Boolean(onProbation),
  } as EmployeeInfoPayload

  if (!onProbation) {
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

