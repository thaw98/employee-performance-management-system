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
import { Controller, useController, useForm } from 'react-hook-form'
import { useState, type FocusEvent, type ReactNode } from 'react'

import { employeeInfoSchema, type EmployeeInfoFormValues } from '../schemas/employeeInfoSchema'
import {
  useCreateDraftMutation,
  useCreateEmployeeAccountMutation,
  useCreateEmployeeMutation,
  useGetDepartmentsQuery,
  useGetNationalitiesQuery,
  useGetPositionsQuery,
  useGetReligionsQuery,
  useLazyCheckEmailInEmployeesQuery,
  useLazyCheckEmployeeIdQuery,
  useLazyCheckUserEmailQuery,
} from '../services/employeeApi'
import { calculateProbationEnd } from '../utils/probation'
import { EmployeeStepper } from '../components/EmployeeStepper'
import { NrcFields } from '../components/NrcFields'
import type { EmployeeInfoPayload, MasterOption } from '../types/employee'

const MAX_PHONE_INPUT_LENGTH = 16 // optional "+" plus up to 15 digits

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
  const [step, setStep] = useState<1 | 2>(1)
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
  const nationalities = useGetNationalitiesQuery()
  const departments = useGetDepartmentsQuery('')
  const positions = useGetPositionsQuery('')

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    setError,
    clearErrors,
    formState: { errors },
  } = useForm<EmployeeInfoFormValues>({
    resolver: zodResolver(employeeInfoSchema) as never,
    defaultValues: {
      dateOfJoining: today(),
      onProbation: false,
      gender: undefined,
      religionId: undefined,
      departmentId: undefined,
      positionId: undefined,
      nationalityId: nationalities.data?.data?.find((n) => n.name === 'Burmese')?.id,
    },
  })
  const { field: probationField } = useController({ control, name: 'onProbation' })

  const onProbation = watch('onProbation')
  const probationStartDate = watch('probationStartDate') || watch('dateOfJoining')
  const probationEndDate = onProbation && probationStartDate ? calculateProbationEnd(probationStartDate) : ''
  const religionsOptions = religions.data?.data ?? []
  const departmentsOptions = departments.data?.data ?? []
  const positionsOptions = positions.data?.data ?? []
  const nationalitiesOptions = nationalities.data?.data ?? []

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

  const submitCompleted = handleSubmit(async (values) => {
    setFormMessage('')
    const [idTaken, employeeEmailTaken, userEmailTaken] = await Promise.all([
      checkEmployeeId(values.employeeId).unwrap(),
      checkEmailEmployees(values.emailAddress).unwrap(),
      checkEmailUsers(values.emailAddress).unwrap(),
    ])
    if (idTaken.data) {
      setError('employeeId', { message: 'Employee ID already exists' })
      return
    }
    if (employeeEmailTaken.data || userEmailTaken.data) {
      setError('emailAddress', { message: 'Email already exists' })
      return
    }
    const res = await createEmployee(values as unknown as EmployeeInfoPayload).unwrap()
    if (!res.success || !res.data) {
      setFormMessage(res.message || 'Unable to save employee information')
      setFormMessageSeverity('error')
      return
    }
    setEmployeePkId(res.data.id)
    setEmployeeEmail(res.data.emailAddress)
    setSavedValues(values as EmployeeInfoFormValues)
    setStep(2)
  })

  const submitDraft = handleSubmit(async (values) => {
    setFormMessage('')
    const res = await createDraft(values as unknown as EmployeeInfoPayload).unwrap()
    setFormMessage(res.success ? 'Draft saved successfully.' : res.message)
    setFormMessageSeverity(res.success ? 'success' : 'error')
  })

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

      <EmployeeStepper currentStep={step} step1Completed={Boolean(employeePkId)} />

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
                slotProps={{ htmlInput: { maxLength: 50 } }}
                {...register('employeeName')}
                error={Boolean(errors.employeeName)}
                helperText={errors.employeeName?.message}
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
              <Controller
                control={control}
                name="nationalityId"
                render={({ field }) => (
                  <Autocomplete
                    options={nationalitiesOptions}
                    loading={nationalities.isFetching}
                    value={selectedOption(nationalitiesOptions, field.value)}
                    isOptionEqualToValue={(option, value) => option.id === value.id}
                    getOptionLabel={(option) => option.name}
                    onChange={(_, value) => field.onChange(value?.id)}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Nationality *"
                        error={Boolean(errors.nationalityId)}
                        helperText={errors.nationalityId?.message}
                      />
                    )}
                  />
                )}
              />
            </div>
            </div>
          </FormSection>

          {/* Contact Information */}
          <FormSection icon="bi-telephone" title="Contact Information">
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
          </FormSection>

          {/* Employment Details */}
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
                      onChange={(event) => probationField.onChange(event.target.checked)}
                    />
                  }
                  label="On Probation"
                />
              </div>
              {onProbation ? (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <TextField
                    fullWidth
                    label="Probation Start Date"
                    type="date"
                    slotProps={{ inputLabel: { shrink: true } }}
                    {...register('probationStartDate')}
                    error={Boolean(errors.probationStartDate)}
                    helperText={errors.probationStartDate?.message}
                  />
                  <TextField fullWidth label="Probation End Date" value={probationEndDate} slotProps={{ input: { readOnly: true } }} />
                </div>
              ) : null}
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
            <Button
              type="button"
              variant="contained"
              onClick={() => void submitCompleted()}
              disabled={createEmployeeState.isLoading}
            >
              {createEmployeeState.isLoading ? 'Saving...' : 'Save & Continue'}
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
                <p className="text-xs text-emerald-600">Step 1 completed — ready to create system account</p>
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
