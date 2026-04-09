import { zodResolver } from '@hookform/resolvers/zod'
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Checkbox,
  FormControlLabel,
  MenuItem,
  TextField,
} from '@mui/material'
import { z } from 'zod'
import {
  Controller,
  useController,
  useForm,
  type FieldPath,
  type Resolver,
  type UseFormSetError,
} from 'react-hook-form'
import { useState, type FocusEvent, type ReactNode } from 'react'

import {
  employeeEmploymentSchema,
  employeeInfoSchema,
  GENERIC_FIELD_VALIDATION_MESSAGE,
  type EmployeeInfoFormValues,
} from '../schemas/employeeInfoSchema'
import {
  useCreateDraftMutation,
  useCreateEmployeeAccountMutation,
  useCreateEmployeeMutation,
  useGetDepartmentsQuery,
  useGetPositionsQuery,
  useGetReligionsQuery,
  useLazyCheckEmailInEmployeesQuery,
  useLazyCheckEmployeeIdQuery,
  useLazyCheckUserEmailQuery,
} from '../services/employeeApi'
import { buildEmployeeCreatePayload, buildEmployeeDraftPayload } from '../utils/draftPayload'
import { calculateProbationEnd, formatProbationEndDisplay } from '../utils/probation'
import { EmployeeStepper } from '../components/EmployeeStepper'
import { NrcFields } from '../components/NrcFields'
import type { MasterOption } from '../types/employee'

const MAX_PHONE_INPUT_LENGTH = 16 // optional "+" plus up to 15 digits
const EMPLOYEE_NAME_MAX_LENGTH = 50

const STEP1_FIELD_NAMES: FieldPath<EmployeeInfoFormValues>[] = [
  'employeeId',
  'employeeName',
  'nrcStateCode',
  'nrcTownshipCode',
  'nrcType',
  'nrcNumber',
  'gender',
  'race',
  'religionId',
  'dateOfBirth',
  'nationality',
  'phoneNo',
  'emailAddress',
  'contactAddress',
]

const STEP2_FIELD_NAMES: FieldPath<EmployeeInfoFormValues>[] = [
  'fatherName',
  'fatherNrcNo',
  'hasSpouse',
  'spouseName',
  'spouseNrcNo',
  'emergencyPhone',
  'emergencyRelation',
]

const STEP3_FIELD_NAMES: FieldPath<EmployeeInfoFormValues>[] = [
  'departmentId',
  'positionId',
  'dateOfJoining',
  'onProbation',
  'probationDuration',
  'probationStartDate',
  'probationEndDate',
]

function applyZodIssues(issues: z.ZodIssue[], setError: UseFormSetError<EmployeeInfoFormValues>) {
  for (const issue of issues) {
    const key = issue.path[0]
    if (key !== undefined && (typeof key === 'string' || typeof key === 'number')) {
      setError(String(key) as FieldPath<EmployeeInfoFormValues>, {
        message: issue.message || GENERIC_FIELD_VALIDATION_MESSAGE,
      })
    }
  }
}

function today() {
  return new Date().toISOString().split('T')[0]
}

function FormSection({ icon, title, children }: { icon: string; title: string; children: ReactNode }) {
  return (
    <div className="rounded-xl border border-slate-100 bg-white p-6 shadow-sm">
      <div className="mb-5 flex items-center gap-2.5 border-b border-slate-100 pb-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50">
          <i className={`bi ${icon} text-sm text-blue-600`} />
        </div>
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">{title}</h2>
      </div>
      {children}
    </div>
  )
}

export function CreateEmployeeAccountPage() {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1)
  const [employeePkId, setEmployeePkId] = useState<number | null>(null)
  const [employeeEmail, setEmployeeEmail] = useState('')
  const [savedValues, setSavedValues] = useState<EmployeeInfoFormValues | null>(null)
  const [accountSuccess, setAccountSuccess] = useState(false)
  const [tempPassword, setTempPassword] = useState('')
  const [accountError, setAccountError] = useState('')
  const [formMessage, setFormMessage] = useState('')
  const [formMessageSeverity, setFormMessageSeverity] = useState<'success' | 'error' | 'info'>('info')

  const [createEmployee, createEmployeeState] = useCreateEmployeeMutation()
  const [createDraft, createDraftState] = useCreateDraftMutation()
  const [createAccount, createAccountState] = useCreateEmployeeAccountMutation()
  const [checkEmployeeId] = useLazyCheckEmployeeIdQuery()
  const [checkEmailEmployees] = useLazyCheckEmailInEmployeesQuery()
  const [checkEmailUsers] = useLazyCheckUserEmailQuery()

  const religions = useGetReligionsQuery()
  const departments = useGetDepartmentsQuery('')
  const positions = useGetPositionsQuery('')

  const {
    register,
    control,
    getValues,
    watch,
    setValue,
    setError,
    clearErrors,
    formState: { errors },
  } = useForm<EmployeeInfoFormValues>({
    resolver: zodResolver(employeeInfoSchema) as Resolver<EmployeeInfoFormValues>,
    defaultValues: {
      dateOfJoining: today(),
      onProbation: false,
      probationDuration: '3',
      gender: undefined,
      religionId: undefined,
      departmentId: undefined,
      positionId: undefined,
      nationality: '',
    },
  })
  const { field: probationField } = useController({ control, name: 'onProbation' })

  const hasSpouse = watch('hasSpouse')
  const onProbation = watch('onProbation')
  const probationDurationWatch = watch('probationDuration')
  const probationStartForEnd = watch('probationStartDate') || watch('dateOfJoining')
  const employeeNameLength = (watch('employeeName') ?? '').length
  const computedPresetProbationEndIso =
    onProbation &&
    probationDurationWatch &&
    probationDurationWatch !== 'custom' &&
    probationStartForEnd
      ? calculateProbationEnd(probationStartForEnd, Number(probationDurationWatch))
      : ''
  const computedPresetProbationEndDisplay = computedPresetProbationEndIso
    ? formatProbationEndDisplay(computedPresetProbationEndIso)
    : ''
  const religionsOptions = religions.data?.data ?? []
  const departmentsOptions = departments.data?.data ?? []
  const positionsOptions = positions.data?.data ?? []
  const selectedOption = (options: MasterOption[], value?: number) =>
    options.find((opt) => opt.id === value) ?? null

  const employeeIdRegistration = register('employeeId')
  const emailAddressRegistration = register('emailAddress')

  async function handleEmployeeIdBlur(event: FocusEvent<HTMLInputElement | HTMLTextAreaElement>) {
    employeeIdRegistration.onBlur(event)
    const employeeId = event.target.value.trim()
    if (!employeeId) {
      if (errors.employeeId?.message === 'Employee ID already exists') {
        clearErrors('employeeId')
      }
      return
    }
    const idTaken = await checkEmployeeId(employeeId).unwrap()
    if (idTaken.data) {
      setError('employeeId', { message: 'Employee ID already exists' })
      return
    }
    if (errors.employeeId?.message === 'Employee ID already exists') {
      clearErrors('employeeId')
    }
  }

  async function handleEmailAddressBlur(event: FocusEvent<HTMLInputElement | HTMLTextAreaElement>) {
    emailAddressRegistration.onBlur(event)
    const emailAddress = event.target.value.trim()
    if (!emailAddress) {
      if (errors.emailAddress?.message === 'Email already exists') {
        clearErrors('emailAddress')
      }
      return
    }
    const [employeeEmailTaken, userEmailTaken] = await Promise.all([
      checkEmailEmployees(emailAddress).unwrap(),
      checkEmailUsers(emailAddress).unwrap(),
    ])
    if (employeeEmailTaken.data || userEmailTaken.data) {
      setError('emailAddress', { message: 'Email already exists' })
      return
    }
    if (errors.emailAddress?.message === 'Email already exists') {
      clearErrors('emailAddress')
    }
  }

  function submitStep1Next() {
    setFormMessage('')
    clearErrors(STEP1_FIELD_NAMES)
    setStep(2)
  }

  function submitStep2Next() {
    setFormMessage('')
    clearErrors(STEP2_FIELD_NAMES)
    setStep(3)
  }

  async function submitStep3Next() {
    setFormMessage('')
    clearErrors(STEP3_FIELD_NAMES)
    const values = getValues()
    const employmentParsed = employeeEmploymentSchema.safeParse(values)
    if (!employmentParsed.success) {
      applyZodIssues(employmentParsed.error.issues, setError)
      return
    }
    const fullParsed = employeeInfoSchema.safeParse(values)
    if (!fullParsed.success) {
      applyZodIssues(fullParsed.error.issues, setError)
      return
    }
    const v = fullParsed.data
    const [idTaken, employeeEmailTaken, userEmailTaken] = await Promise.all([
      checkEmployeeId(v.employeeId).unwrap(),
      checkEmailEmployees(v.emailAddress).unwrap(),
      checkEmailUsers(v.emailAddress).unwrap(),
    ])
    if (idTaken.data) {
      setError('employeeId', { message: 'Employee ID already exists' })
      setStep(1)
      return
    }
    if (employeeEmailTaken.data || userEmailTaken.data) {
      setError('emailAddress', { message: 'Email already exists' })
      setStep(1)
      return
    }
    const res = await createEmployee(buildEmployeeCreatePayload(v)).unwrap()
    if (!res.success || !res.data) {
      setFormMessage(res.message || 'Unable to save employee information')
      setFormMessageSeverity('error')
      return
    }
    setEmployeePkId(res.data.id)
    setEmployeeEmail(res.data.emailAddress)
    setSavedValues(values as EmployeeInfoFormValues)
    setStep(4)
  }

  async function submitDraft() {
    setFormMessage('')
    try {
      const res = await createDraft(buildEmployeeDraftPayload(getValues())).unwrap()
      setFormMessage(res.success ? 'Draft saved successfully.' : res.message)
      setFormMessageSeverity(res.success ? 'success' : 'error')
    } catch {
      setFormMessage('Unable to save draft.')
      setFormMessageSeverity('error')
    }
  }

  async function handleCreateAccount() {
    if (!employeePkId) return
    setAccountError('')
    const res = await createAccount({ employeePkId }).unwrap()
    if (res.success && res.data) {
      setAccountSuccess(true)
      setTempPassword(res.data.temporaryPassword)
    } else {
      setAccountError(res.message || 'Failed to create account')
    }
  }

  const departmentName = savedValues?.departmentId
    ? (departmentsOptions.find((d) => d.id === savedValues.departmentId)?.name ?? '—')
    : '—'
  const positionName = savedValues?.positionId
    ? (positionsOptions.find((p) => p.id === savedValues.positionId)?.name ?? '—')
    : '—'

  return (
    <div className="mx-auto max-w-5xl px-6 py-8 md:px-8">
      {/* Page Header */}
      <div className="mb-8">
        <div className="mb-3 flex items-center gap-1.5 text-xs text-slate-400">
          <i className="bi bi-people" />
          <span>HR Management</span>
          <i className="bi bi-chevron-right text-[10px]" />
          <span className="font-medium text-slate-600">Create Employee Account</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600 shadow-lg shadow-blue-200">
            <i className="bi bi-person-plus-fill text-xl text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Create Employee Account</h1>
            <p className="text-sm text-slate-500">Complete employee details, then generate system login credentials</p>
          </div>
        </div>
      </div>

      <EmployeeStepper currentStep={step} />

      {step === 1 ? (
        <Box component="form" className="space-y-5">
          {/* Personal Information */}
          <FormSection icon="bi-person-badge" title="Personal Information">
            <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <TextField
                fullWidth
                label="Employee ID *"
                name={employeeIdRegistration.name}
                inputRef={employeeIdRegistration.ref}
                onChange={(event) => {
                  employeeIdRegistration.onChange(event)
                  if (!event.target.value.trim() && errors.employeeId?.message === 'Employee ID already exists') {
                    clearErrors('employeeId')
                  }
                }}
                onBlur={(event) => { void handleEmployeeIdBlur(event) }}
                error={Boolean(errors.employeeId)}
                helperText={errors.employeeId?.message}
              />
              <TextField
                fullWidth
                label="Employee Name *"
                slotProps={{ htmlInput: { maxLength: EMPLOYEE_NAME_MAX_LENGTH } }}
                {...register('employeeName')}
                error={Boolean(errors.employeeName)}
                helperText={
                  <Box
                    component="span"
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      gap: 1,
                      width: '100%',
                    }}
                  >
                    <Box
                      component="span"
                      sx={{ flex: 1, color: errors.employeeName ? 'error.main' : 'inherit' }}
                    >
                      {errors.employeeName?.message}
                    </Box>
                    <Box
                      component="span"
                      sx={{ color: 'text.secondary', flexShrink: 0, typography: 'caption' }}
                    >
                      {employeeNameLength}/{EMPLOYEE_NAME_MAX_LENGTH}
                    </Box>
                  </Box>
                }
              />
            </div>
            <NrcFields control={control} errors={errors} setValue={setValue} />
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Controller
                control={control}
                name="gender"
                render={({ field }) => (
                  <TextField
                    select
                    fullWidth
                    label="Gender *"
                    {...field}
                    error={Boolean(errors.gender)}
                    helperText={errors.gender?.message}
                  >
                    <MenuItem value="">Select</MenuItem>
                    <MenuItem value="Male">Male</MenuItem>
                    <MenuItem value="Female">Female</MenuItem>
                  </TextField>
                )}
              />
              <TextField
                fullWidth
                label="Race *"
                {...register('race')}
                error={Boolean(errors.race)}
                helperText={errors.race?.message}
              />
              <Controller
                control={control}
                name="religionId"
                render={({ field }) => (
                  <Autocomplete
                    options={religionsOptions}
                    loading={religions.isFetching}
                    value={selectedOption(religionsOptions, field.value)}
                    isOptionEqualToValue={(option, value) => option.id === value.id}
                    getOptionLabel={(option) => option.name}
                    onChange={(_, value) => field.onChange(value?.id)}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Religion *"
                        error={Boolean(errors.religionId)}
                        helperText={errors.religionId?.message}
                      />
                    )}
                  />
                )}
              />
              <TextField
                fullWidth
                label="Date of Birth *"
                type="date"
                slotProps={{ inputLabel: { shrink: true }, htmlInput: { max: today() } }}
                {...register('dateOfBirth')}
                error={Boolean(errors.dateOfBirth)}
                helperText={errors.dateOfBirth?.message}
              />
              <TextField
                fullWidth
                label="Nationality *"
                slotProps={{ htmlInput: { maxLength: 100 } }}
                {...register('nationality')}
                error={Boolean(errors.nationality)}
                helperText={errors.nationality?.message}
              />
            </div>
            </div>
          </FormSection>

          {/* Contact Information */}
          <FormSection icon="bi-telephone" title="Contact Information">
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <TextField
                  fullWidth
                  label="Phone Number *"
                  slotProps={{ htmlInput: { maxLength: MAX_PHONE_INPUT_LENGTH } }}
                  {...register('phoneNo')}
                  error={Boolean(errors.phoneNo)}
                  helperText={errors.phoneNo?.message}
                />
                <TextField
                  fullWidth
                  type="email"
                  label="Employee Email *"
                  name={emailAddressRegistration.name}
                  inputRef={emailAddressRegistration.ref}
                  onChange={(event) => {
                    emailAddressRegistration.onChange(event)
                    if (!event.target.value.trim() && errors.emailAddress?.message === 'Email already exists') {
                      clearErrors('emailAddress')
                    }
                  }}
                  onBlur={(event) => { void handleEmailAddressBlur(event) }}
                  error={Boolean(errors.emailAddress)}
                  helperText={errors.emailAddress?.message}
                />
              </div>
              <TextField
                fullWidth
                multiline
                minRows={2}
                label="Address *"
                slotProps={{ htmlInput: { maxLength: 500 } }}
                {...register('contactAddress')}
                error={Boolean(errors.contactAddress)}
                helperText={errors.contactAddress?.message}
              />
            </div>
          </FormSection>

          {/* Form Message */}
          {formMessage ? <Alert severity={formMessageSeverity}>{formMessage}</Alert> : null}

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 rounded-xl border border-slate-100 bg-white px-6 py-4 shadow-sm">
            <span className="mr-auto text-xs text-slate-400">
              Fields marked with <span className="text-red-400">*</span> are required
            </span>
            <Button
              type="button"
              variant="outlined"
              onClick={() => void submitDraft()}
              disabled={createDraftState.isLoading}
            >
              {createDraftState.isLoading ? 'Saving...' : 'Save Draft'}
            </Button>
            <Button type="button" variant="contained" onClick={submitStep1Next}>
              Next
            </Button>
          </div>
        </Box>
      ) : step === 2 ? (
        <Box component="form" className="space-y-5">
          {/* Family Information */}
          <FormSection icon="bi-people" title="Family Information">
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <TextField
                  fullWidth
                  label="Father Name *"
                  {...register('fatherName')}
                  error={Boolean(errors.fatherName)}
                  helperText={errors.fatherName?.message}
                />
                <TextField
                  fullWidth
                  label="Father NRC *"
                  {...register('fatherNrcNo')}
                  error={Boolean(errors.fatherNrcNo)}
                  helperText={errors.fatherNrcNo?.message}
                />
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <TextField
                  select
                  fullWidth
                  label="Marital Status"
                  {...register('maritalStatus')}
                  error={Boolean(errors.maritalStatus)}
                  helperText={errors.maritalStatus?.message}
                >
                  <MenuItem value="">Select</MenuItem>
                  <MenuItem value="Single">Single</MenuItem>
                  <MenuItem value="Married">Married</MenuItem>
                  <MenuItem value="Divorced">Divorced</MenuItem>
                  <MenuItem value="Widowed">Widowed</MenuItem>
                </TextField>
                <div className="flex items-center">
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={Boolean(hasSpouse)}
                        onChange={(e) => setValue('hasSpouse', e.target.checked)}
                      />
                    }
                    label="Has Spouse"
                  />
                </div>
              </div>

              {hasSpouse ? (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <TextField
                    fullWidth
                    label="Spouse Name *"
                    {...register('spouseName')}
                    error={Boolean(errors.spouseName)}
                    helperText={errors.spouseName?.message}
                  />
                  <TextField
                    fullWidth
                    label="Spouse NRC No. *"
                    {...register('spouseNrcNo')}
                    error={Boolean(errors.spouseNrcNo)}
                    helperText={errors.spouseNrcNo?.message}
                  />
                </div>
              ) : null}
            </div>
          </FormSection>

          {/* Emergency Contact */}
          <FormSection icon="bi-exclamation-triangle" title="Emergency Contact">
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <TextField
                  fullWidth
                  label="Emergency Mobile No. *"
                  slotProps={{ htmlInput: { maxLength: MAX_PHONE_INPUT_LENGTH } }}
                  {...register('emergencyPhone')}
                  error={Boolean(errors.emergencyPhone)}
                  helperText={errors.emergencyPhone?.message}
                />
                <TextField
                  fullWidth
                  label="Relation with Emergency Mobile No. *"
                  {...register('emergencyRelation')}
                  error={Boolean(errors.emergencyRelation)}
                  helperText={errors.emergencyRelation?.message}
                />
              </div>
            </div>
          </FormSection>

          {formMessage ? <Alert severity={formMessageSeverity}>{formMessage}</Alert> : null}

          <div className="flex flex-wrap items-center justify-end gap-3 rounded-xl border border-slate-100 bg-white px-6 py-4 shadow-sm">
            <span className="mr-auto w-full text-xs text-slate-400 sm:w-auto">
              Fields marked with <span className="text-red-400">*</span> are required
            </span>
            <Button type="button" variant="text" onClick={() => setStep(1)}>
              Back
            </Button>
            <Button
              type="button"
              variant="outlined"
              onClick={() => void submitDraft()}
              disabled={createDraftState.isLoading}
            >
              {createDraftState.isLoading ? 'Saving...' : 'Save Draft'}
            </Button>
            <Button type="button" variant="contained" onClick={submitStep2Next}>
              Next
            </Button>
          </div>
        </Box>
      ) : step === 3 ? (
        <Box component="form" className="space-y-5">
          <FormSection icon="bi-briefcase" title="Employment Details">
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Controller
                  control={control}
                  name="departmentId"
                  render={({ field }) => (
                    <Autocomplete
                      options={departmentsOptions}
                      loading={departments.isFetching}
                      value={selectedOption(departmentsOptions, field.value)}
                      isOptionEqualToValue={(option, value) => option.id === value.id}
                      getOptionLabel={(option) => option.name}
                      onChange={(_, value) => field.onChange(value?.id)}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="Department *"
                          error={Boolean(errors.departmentId)}
                          helperText={errors.departmentId?.message}
                        />
                      )}
                    />
                  )}
                />
                <Controller
                  control={control}
                  name="positionId"
                  render={({ field }) => (
                    <Autocomplete
                      options={positionsOptions}
                      loading={positions.isFetching}
                      value={selectedOption(positionsOptions, field.value)}
                      isOptionEqualToValue={(option, value) => option.id === value.id}
                      getOptionLabel={(option) => option.name}
                      onChange={(_, value) => field.onChange(value?.id)}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="Position *"
                          error={Boolean(errors.positionId)}
                          helperText={errors.positionId?.message}
                        />
                      )}
                    />
                  )}
                />
                <TextField
                  fullWidth
                  label="Date of Joining *"
                  type="date"
                  slotProps={{ inputLabel: { shrink: true }, htmlInput: { max: today() } }}
                  {...register('dateOfJoining')}
                  error={Boolean(errors.dateOfJoining)}
                  helperText={errors.dateOfJoining?.message}
                />
              </div>
              <div>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={Boolean(probationField.value)}
                      onChange={(event) => {
                        const checked = event.target.checked
                        probationField.onChange(checked)
                        if (checked) {
                          setValue('probationDuration', getValues('probationDuration') ?? '3')
                          if (!getValues('probationStartDate')) {
                            setValue('probationStartDate', getValues('dateOfJoining'))
                          }
                        } else {
                          setValue('probationDuration', undefined)
                          setValue('probationStartDate', undefined)
                          setValue('probationEndDate', undefined)
                        }
                      }}
                    />
                  }
                  label="On Probation"
                />
              </div>
              {onProbation ? (
                <div className="flex flex-col gap-6">
                  <TextField
                    select
                    fullWidth
                    label="Probation period *"
                    value={probationDurationWatch ?? '3'}
                    onChange={(e) => setValue('probationDuration', e.target.value as any)}
                    error={Boolean(errors.probationDuration)}
                    helperText={errors.probationDuration?.message}
                  >
                    <MenuItem value="1">1 month</MenuItem>
                    <MenuItem value="3">3 months</MenuItem>
                    <MenuItem value="6">6 months</MenuItem>
                    <MenuItem value="custom">Custom</MenuItem>
                  </TextField>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-x-6">
                    <TextField
                      fullWidth
                      label="Probation Start Date *"
                      type="date"
                      slotProps={{ inputLabel: { shrink: true } }}
                      {...register('probationStartDate')}
                      error={Boolean(errors.probationStartDate)}
                      helperText={errors.probationStartDate?.message}
                    />
                    {probationDurationWatch === 'custom' ? (
                      <TextField
                        fullWidth
                        label="Probation End Date *"
                        type="date"
                        slotProps={{
                          inputLabel: { shrink: true },
                          htmlInput: { min: probationStartForEnd || undefined },
                        }}
                        {...register('probationEndDate')}
                        error={Boolean(errors.probationEndDate)}
                        helperText={errors.probationEndDate?.message}
                      />
                    ) : (
                      <TextField
                        fullWidth
                        label="Probation End Date"
                        value={computedPresetProbationEndDisplay}
                        slotProps={{ input: { readOnly: true } }}
                      />
                    )}
                  </div>
                </div>
              ) : null}
            </div>
          </FormSection>

          {formMessage ? <Alert severity={formMessageSeverity}>{formMessage}</Alert> : null}

          <div className="flex flex-wrap items-center justify-end gap-3 rounded-xl border border-slate-100 bg-white px-6 py-4 shadow-sm">
            <span className="mr-auto w-full text-xs text-slate-400 sm:w-auto">
              Fields marked with <span className="text-red-400">*</span> are required
            </span>
            <Button type="button" variant="text" onClick={() => setStep(2)}>
              Back
            </Button>
            <Button
              type="button"
              variant="outlined"
              onClick={() => void submitDraft()}
              disabled={createDraftState.isLoading}
            >
              {createDraftState.isLoading ? 'Saving...' : 'Save Draft'}
            </Button>
            <Button
              type="button"
              variant="contained"
              onClick={() => void submitStep3Next()}
              disabled={createEmployeeState.isLoading}
            >
              {createEmployeeState.isLoading ? 'Saving...' : 'Next'}
            </Button>
          </div>
        </Box>
      ) : (
        <div className="space-y-5">
          {/* Step 1 Summary */}
          <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-6">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500 shadow-md shadow-emerald-200">
                <i className="bi bi-check-lg text-xl text-white" />
              </div>
              <div>
                <p className="font-semibold text-emerald-800">Employee Information Saved</p>
                <p className="text-xs text-emerald-600">Steps 1–3 completed — ready to create system account</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { label: 'Employee Name', value: savedValues?.employeeName ?? '—', icon: 'bi-person' },
                { label: 'Employee ID', value: savedValues?.employeeId ?? '—', icon: 'bi-tag' },
                { label: 'Department', value: departmentName, icon: 'bi-building' },
                { label: 'Position', value: positionName, icon: 'bi-briefcase' },
              ].map(({ label, value, icon }) => (
                <div key={label} className="rounded-lg border border-emerald-100 bg-white p-3 shadow-sm">
                  <div className="mb-1 flex items-center gap-1.5">
                    <i className={`bi ${icon} text-xs text-emerald-500`} />
                    <span className="text-xs text-slate-400">{label}</span>
                  </div>
                  <p className="truncate text-sm font-semibold text-slate-800">{value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Account Creation Panel */}
          {!accountSuccess ? (
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-5 flex items-center gap-3 border-b border-slate-100 pb-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50">
                  <i className="bi bi-shield-lock text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-800">Create System Account</p>
                  <p className="text-xs text-slate-500">A temporary password will be generated for the employee's first login</p>
                </div>
              </div>
              <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="rounded-lg border border-slate-100 bg-slate-50 p-4">
                  <div className="mb-1 flex items-center gap-1.5">
                    <i className="bi bi-envelope text-xs text-slate-400" />
                    <span className="text-xs text-slate-400">Account Email</span>
                  </div>
                  <p className="text-sm font-semibold text-slate-800">{employeeEmail}</p>
                </div>
                <div className="rounded-lg border border-slate-100 bg-slate-50 p-4">
                  <div className="mb-1 flex items-center gap-1.5">
                    <i className="bi bi-person-badge text-xs text-slate-400" />
                    <span className="text-xs text-slate-400">System Role</span>
                  </div>
                  <p className="text-sm font-semibold text-slate-800">Employee</p>
                </div>
              </div>
              {accountError ? (
                <div className="mb-4">
                  <Alert severity="error">{accountError}</Alert>
                </div>
              ) : null}
              <Button
                variant="contained"
                size="large"
                onClick={() => void handleCreateAccount()}
                disabled={!employeePkId || createAccountState.isLoading}
                sx={{ minWidth: 220 }}
              >
                {createAccountState.isLoading ? 'Creating Account...' : 'Create Employee Account'}
              </Button>
            </div>
          ) : (
            <div className="rounded-xl border border-blue-100 bg-linear-to-br from-blue-50 to-indigo-50 p-6 shadow-sm">
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 shadow-lg shadow-blue-200">
                  <i className="bi bi-shield-check text-xl text-white" />
                </div>
                <div>
                  <p className="font-semibold text-blue-800">Account Created Successfully</p>
                  <p className="text-xs text-blue-600">The employee can now log in using the credentials below</p>
                </div>
              </div>
              <div className="rounded-lg border border-blue-100 bg-white p-5 shadow-sm">
                <div className="mb-3 flex items-center gap-1.5">
                  <i className="bi bi-key text-sm text-blue-400" />
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Temporary Password</span>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <code className="text-xl font-bold tracking-widest text-slate-800">{tempPassword}</code>
                  <p className="text-right text-xs text-slate-400">
                    Share securely with the employee.<br />
                    They must change this on first login.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
