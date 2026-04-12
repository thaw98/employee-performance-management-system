import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Controller,
  useController,
  useForm,
  type FieldPath,
  type Resolver,
  type UseFormSetError,
} from 'react-hook-form'
import { useRef, useState, type FocusEvent, type ReactNode } from 'react'

import {
  employeeEmploymentSchema,
  employeeInfoSchema,
  GENERIC_FIELD_VALIDATION_MESSAGE,
  type EmployeeInfoFormValues,
} from '../schemas/employeeInfoSchema'
import {
  useCreateEmployeeAccountMutation,
  useCreateEmployeeMutation,
  useGetDepartmentsQuery,
  useGetPositionsQuery,
  useGetReligionsQuery,
  useLazyCheckUserEmailQuery,
} from '../services/employeeApi'
import { buildEmployeeCreatePayload } from '../utils/draftPayload'
import { calculateProbationEnd, formatProbationEndDisplay } from '../utils/probation'
import { STAFF_TYPE_PERMANENT, STAFF_TYPE_PROBATION } from '../utils/staffType'
import { EmployeeStepper } from '../components/EmployeeStepper'
import { NrcFields } from '../components/NrcFields'

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
  'contactAddress',
]

const FAMILY_FIELD_NAMES: FieldPath<EmployeeInfoFormValues>[] = [
  'fatherName',
  'fatherNrcStateCode',
  'fatherNrcTownshipCode',
  'fatherNrcType',
  'fatherNrcNumber',
]

const EMERGENCY_FIELD_NAMES: FieldPath<EmployeeInfoFormValues>[] = ['emergencyPhone', 'emergencyRelation']

const EMPLOYMENT_FIELD_NAMES: FieldPath<EmployeeInfoFormValues>[] = [
  'departmentId',
  'positionId',
  'dateOfJoining',
  'staffTypeId',
  'probationDuration',
  'probationStartDate',
  'probationEndDate',
]

/** Step 1 UI: personal, contact, family, and emergency fields. */
const STEP1_ALL_FIELD_NAMES: FieldPath<EmployeeInfoFormValues>[] = [
  ...STEP1_FIELD_NAMES,
  ...FAMILY_FIELD_NAMES,
  ...EMERGENCY_FIELD_NAMES,
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

/** YYYY-MM-DD for `<input type="date" max>` — use local calendar date, not UTC (`toISOString`). */
function today() {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
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

function Alert({
  severity,
  children,
  className = '',
}: {
  severity: 'success' | 'error' | 'info'
  children: ReactNode
  className?: string
}) {
  const tone =
    severity === 'success'
      ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
      : severity === 'error'
        ? 'border-red-200 bg-red-50 text-red-700'
        : 'border-blue-200 bg-blue-50 text-blue-700'
  return <div className={`${className} rounded-lg border px-4 py-3 text-sm ${tone}`}>{children}</div>
}

function Button({
  variant = 'contained',
  className = '',
  children,
  ...props
}: {
  variant?: 'contained' | 'outlined' | 'text'
  className?: string
  children: ReactNode
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const base = 'inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-60'
  const tone =
    variant === 'outlined'
      ? 'border border-slate-300 text-slate-700 hover:bg-slate-50'
      : variant === 'text'
        ? 'text-slate-700 hover:bg-slate-100'
        : 'bg-blue-600 text-white hover:bg-blue-700'
  return (
    <button {...props} className={`${base} ${tone} ${className}`}>
      {children}
    </button>
  )
}

function MenuItem({ value, children }: { value: string; children: ReactNode }) {
  return <option value={value}>{children}</option>
}

function TextField({
  label,
  error,
  helperText,
  select,
  children,
  multiline,
  minRows,
  fullWidth,
  slotProps,
  inputRef,
  ...props
}: {
  label?: string
  error?: boolean
  helperText?: ReactNode
  select?: boolean
  children?: ReactNode
  multiline?: boolean
  minRows?: number
  fullWidth?: boolean
  slotProps?: {
    htmlInput?: React.InputHTMLAttributes<HTMLInputElement>
    input?: { readOnly?: boolean }
    inputLabel?: { shrink?: boolean }
  }
  inputRef?: React.Ref<HTMLInputElement>
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> &
  React.SelectHTMLAttributes<HTMLSelectElement>) {
  const inputBase = `w-full rounded-lg border px-3 py-2 text-sm outline-none transition ${
    error ? 'border-red-400 focus:border-red-500' : 'border-slate-300 focus:border-blue-500'
  }`
  return (
    <div className={fullWidth ? 'w-full' : ''}>
      {label ? <label className="mb-1 block text-sm font-medium text-slate-700">{label}</label> : null}
      {select ? (
        <select className={inputBase} {...(props as React.SelectHTMLAttributes<HTMLSelectElement>)}>
          {children}
        </select>
      ) : multiline ? (
        <textarea
          rows={minRows}
          className={inputBase}
          {...(props as React.TextareaHTMLAttributes<HTMLTextAreaElement>)}
        />
      ) : (
        <input
          className={inputBase}
          ref={inputRef}
          readOnly={slotProps?.input?.readOnly}
          {...slotProps?.htmlInput}
          {...props}
        />
      )}
      {helperText ? (
        <div className={`mt-1 text-xs ${error ? 'text-red-600' : 'text-slate-500'}`}>{helperText}</div>
      ) : null}
    </div>
  )
}

function Radio(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input type="radio" className="h-4 w-4 border-slate-300 text-blue-600" {...props} />
}

function FormControlLabel({
  control,
  label,
  className = '',
}: {
  control: ReactNode
  label: ReactNode
  className?: string
}) {
  return (
    <label className={`inline-flex items-center gap-2 text-sm text-slate-700 ${className}`.trim()}>
      {control}
      <span>{label}</span>
    </label>
  )
}

function Box({
  component = 'div',
  children,
  ...props
}: {
  component?: 'div' | 'form' | 'span'
  children: ReactNode
  [key: string]: unknown
}) {
  if (component === 'form') return <form {...(props as React.FormHTMLAttributes<HTMLFormElement>)}>{children}</form>
  if (component === 'span') return <span {...(props as React.HTMLAttributes<HTMLSpanElement>)}>{children}</span>
  return <div {...(props as React.HTMLAttributes<HTMLDivElement>)}>{children}</div>
}

export function CreateEmployeeAccountPage() {
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [employeePkId, setEmployeePkId] = useState<number | null>(null)
  const [loginEmail, setLoginEmail] = useState('')
  const [loginEmailError, setLoginEmailError] = useState('')
  const [savedValues, setSavedValues] = useState<EmployeeInfoFormValues | null>(null)
  const [accountSuccess, setAccountSuccess] = useState(false)
  const [accountEmailSent, setAccountEmailSent] = useState(true)
  const [accountError, setAccountError] = useState('')
  const [finalSubmitLoading, setFinalSubmitLoading] = useState(false)
  const [formMessage, setFormMessage] = useState('')
  const [formMessageSeverity, setFormMessageSeverity] = useState<'success' | 'error' | 'info'>('info')
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null)
  const [photoError, setPhotoError] = useState('')
  const photoInputRef = useRef<HTMLInputElement>(null)

  const [createEmployee] = useCreateEmployeeMutation()
  const [createAccount] = useCreateEmployeeAccountMutation()
  const [checkEmailUsers] = useLazyCheckUserEmailQuery()

  const religions = useGetReligionsQuery()
  const departments = useGetDepartmentsQuery('')

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
      employeeId: '',
      dateOfJoining: today(),
      staffTypeId: STAFF_TYPE_PERMANENT,
      probationDuration: '3',
      gender: undefined,
      religionId: undefined,
      departmentId: undefined,
      positionId: undefined,
      nationality: '',
      nrcStateCode: '',
      nrcTownshipCode: '',
      nrcType: '',
      nrcNumber: '',
      fatherName: '',
      fatherNrcStateCode: '',
      fatherNrcTownshipCode: '',
      fatherNrcType: '',
      fatherNrcNumber: '',
    },
  })
  const { field: staffTypeField } = useController({ control, name: 'staffTypeId' })

  const departmentIdWatch = watch('departmentId')
  const positions = useGetPositionsQuery(
    { keyword: '', departmentId: departmentIdWatch },
    { skip: !departmentIdWatch, refetchOnMountOrArgChange: true },
  )

  const staffTypeIdWatch = watch('staffTypeId')
  const isProbationStaff = staffTypeIdWatch === STAFF_TYPE_PROBATION
  const probationDurationWatch = watch('probationDuration')
  const probationStartForEnd = watch('probationStartDate') || watch('dateOfJoining')
  const employeeNameLength = (watch('employeeName') ?? '').length
  const computedPresetProbationEndIso =
    isProbationStaff &&
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

  async function handleLoginEmailBlur(event: FocusEvent<HTMLInputElement>) {
    const raw = event.target.value.trim()
    if (!raw) {
      if (loginEmailError === 'Email already exists') {
        setLoginEmailError('')
      }
      return
    }
    const userEmailTaken = await checkEmailUsers(raw).unwrap()
    if (userEmailTaken.data) {
      setLoginEmailError('Email already exists')
      return
    }
    if (loginEmailError === 'Email already exists') {
      setLoginEmailError('')
    }
  }

  async function submitStep1Next() {
    setFormMessage('')
    clearErrors(STEP1_ALL_FIELD_NAMES)
    const email = loginEmail.trim().toLowerCase()
    const emailParsed = z.string().email({ message: 'Enter a valid email address.' }).safeParse(email)
    if (!emailParsed.success) {
      setLoginEmailError(emailParsed.error.issues[0]?.message ?? 'Enter a valid email address.')
      return
    }
    setLoginEmailError('')
    const taken = await checkEmailUsers(email).unwrap()
    if (taken.data) {
      setLoginEmailError('Email already exists')
      return
    }
    setStep(2)
  }

  async function submitStep2Next() {
    setFormMessage('')
    clearErrors(EMPLOYMENT_FIELD_NAMES)
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
    setLoginEmailError('')
    setSavedValues(values as EmployeeInfoFormValues)
    setStep(3)
  }

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setPhotoError('')
    if (!file.type.startsWith('image/')) {
      setPhotoError('Please choose an image file (JPG, PNG, GIF, etc.).')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setPhotoError('Photo must be less than 5 MB.')
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      setProfilePhoto(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  function handlePhotoDrop(e: React.DragEvent) {
    e.preventDefault()
    const file = e.dataTransfer.files?.[0]
    if (!file) return
    setPhotoError('')
    if (!file.type.startsWith('image/')) {
      setPhotoError('Please choose an image file (JPG, PNG, GIF, etc.).')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setPhotoError('Photo must be less than 5 MB.')
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      setProfilePhoto(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  function apiErrorMessage(err: unknown): string {
    if (typeof err === 'object' && err !== null && 'data' in err) {
      const data = (err as { data?: unknown }).data
      if (typeof data === 'object' && data !== null && 'message' in data) {
        const m = (data as { message?: unknown }).message
        if (typeof m === 'string' && m.trim()) return m
      }
    }
    return ''
  }

  async function handleCreateAccount() {
    if (finalSubmitLoading || accountSuccess) return
    setAccountError('')
    setFormMessage('')
    const email = loginEmail.trim().toLowerCase()
    const emailParsed = z.string().email({ message: 'Enter a valid email address.' }).safeParse(email)
    if (!emailParsed.success) {
      setLoginEmailError(emailParsed.error.issues[0]?.message ?? 'Enter a valid email address.')
      return
    }
    setLoginEmailError('')
    const taken = await checkEmailUsers(email).unwrap()
    if (taken.data) {
      setLoginEmailError('Email already exists')
      return
    }
    const values = getValues()
    const fullParsed = employeeInfoSchema.safeParse(values)
    if (!fullParsed.success) {
      applyZodIssues(fullParsed.error.issues, setError)
      setFormMessage('Some information is missing or invalid. Use Back to edit earlier steps.')
      setFormMessageSeverity('error')
      return
    }
    const v = fullParsed.data
    const createPayload = buildEmployeeCreatePayload(v)
    setFinalSubmitLoading(true)
    let employeeCreatedInRequest = false
    try {
      const empRes = await createEmployee(
        profilePhoto ? { ...createPayload, profilePictureBase64: profilePhoto } : createPayload,
      ).unwrap()
      if (!empRes.success || !empRes.data) {
        setFormMessage(empRes.message || 'Unable to save employee information')
        setFormMessageSeverity('error')
        return
      }
      const newPk = empRes.data.id
      employeeCreatedInRequest = true
      setEmployeePkId(newPk)
      setSavedValues(values as EmployeeInfoFormValues)

      const payload: { employeePkId: number; email: string; profilePictureBase64?: string } = {
        employeePkId: newPk,
        email,
      }
      if (profilePhoto) {
        payload.profilePictureBase64 = profilePhoto
      }
      const res = await createAccount(payload).unwrap()
      if (res.success && res.data) {
        setLoginEmail(res.data.email)
        setAccountEmailSent(res.data.emailSent !== false)
        setAccountSuccess(true)
      } else {
        setAccountError(res.message || 'Failed to create account')
      }
    } catch (err: unknown) {
      const msg = apiErrorMessage(err)
      if (!employeeCreatedInRequest) {
        setFormMessage(msg || 'Unable to save employee information')
        setFormMessageSeverity('error')
      } else {
        setAccountError(msg || 'Failed to create account')
      }
    } finally {
      setFinalSubmitLoading(false)
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
            <input
              ref={photoInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handlePhotoChange}
            />
            <div className="w-full space-y-4">
              <div className="w-full">
                <span className="mb-2 block text-center text-sm font-medium text-slate-700">Employee Photo</span>
                {profilePhoto ? (
                  <div className="flex w-full flex-col items-center justify-center gap-3 sm:flex-row sm:items-start sm:justify-center">
                    <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-xl border-2 border-blue-200 shadow-sm">
                      <img
                        src={profilePhoto}
                        alt="Employee photo preview"
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="flex flex-row gap-2 sm:flex-col">
                      <button
                        type="button"
                        className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
                        onClick={() => photoInputRef.current?.click()}
                      >
                        <i className="bi bi-arrow-repeat text-sm" />
                        Change
                      </button>
                      <button
                        type="button"
                        className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 transition hover:bg-red-50"
                        onClick={() => {
                          setProfilePhoto(null)
                          setPhotoError('')
                          if (photoInputRef.current) photoInputRef.current.value = ''
                        }}
                      >
                        <i className="bi bi-trash3 text-sm" />
                        Remove
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    role="button"
                    tabIndex={0}
                    className="flex w-full cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 px-6 py-8 text-center transition hover:border-blue-400 hover:bg-blue-50/50"
                    onClick={() => photoInputRef.current?.click()}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') photoInputRef.current?.click()
                    }}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={handlePhotoDrop}
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
                      <i className="bi bi-camera text-xl text-blue-500" />
                    </div>
                    <p className="text-sm font-medium text-slate-600">Click or drag & drop</p>
                    <p className="text-xs text-slate-400">JPG, PNG — max 5 MB</p>
                  </div>
                )}
                {photoError ? <p className="mt-2 text-center text-xs text-red-600">{photoError}</p> : null}
              </div>
              <div className="w-full">
                <TextField
                  fullWidth
                  label="Employee ID *"
                  autoComplete="off"
                  {...register('employeeId')}
                  error={Boolean(errors.employeeId)}
                  helperText={
                    errors.employeeId?.message ??
                    'Your business employee number (letters, digits, hyphens, etc.). Must be unique — not the database id.'
                  }
                />
              </div>
              <div className="w-full">
                <TextField
                  fullWidth
                  label="Employee Name *"
                  slotProps={{ htmlInput: { maxLength: EMPLOYEE_NAME_MAX_LENGTH } }}
                  {...register('employeeName')}
                  error={Boolean(errors.employeeName)}
                  helperText={
                    <span className="flex w-full items-start justify-between gap-2">
                      <span className={errors.employeeName ? 'text-red-600' : ''}>{errors.employeeName?.message}</span>
                      <span className="shrink-0 text-slate-400">
                        {employeeNameLength}/{EMPLOYEE_NAME_MAX_LENGTH}
                      </span>
                    </span>
                  }
                />
              </div>
            </div>
            <NrcFields
              control={control}
              errors={errors}
              setValue={setValue}
              label="Staff NRC No."
              required
            />
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
                  <TextField
                    select
                    fullWidth
                    label="Religion *"
                    value={field.value ?? ''}
                    onChange={(event) => field.onChange(event.target.value ? Number(event.target.value) : undefined)}
                    onBlur={field.onBlur}
                    error={Boolean(errors.religionId)}
                    helperText={errors.religionId?.message}
                    disabled={religions.isFetching}
                  >
                    <MenuItem value="">Select</MenuItem>
                    {religionsOptions.map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.name}
                      </option>
                    ))}
                  </TextField>
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
              <p className="text-xs text-slate-500">
                Email address is the employee&apos;s login ID (stored on the user account when you create the system
                account in the last step).
              </p>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <TextField
                  fullWidth
                  label="Phone Number *"
                  autoComplete="section-primary tel"
                  slotProps={{ htmlInput: { maxLength: MAX_PHONE_INPUT_LENGTH } }}
                  {...register('phoneNo')}
                  error={Boolean(errors.phoneNo)}
                  helperText={errors.phoneNo?.message}
                />
                <TextField
                  fullWidth
                  type="email"
                  label="Email Address *"
                  autoComplete="email"
                  value={loginEmail}
                  onChange={(e) => {
                    setLoginEmail(e.target.value)
                    if (loginEmailError === 'Email already exists') {
                      setLoginEmailError('')
                    }
                  }}
                  onBlur={(e) => {
                    void handleLoginEmailBlur(e as FocusEvent<HTMLInputElement>)
                  }}
                  error={Boolean(loginEmailError)}
                  helperText={loginEmailError}
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

          {/* Family Information */}
          <FormSection icon="bi-people" title="Family Information">
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <TextField
                  fullWidth
                  label="Father Name"
                  {...register('fatherName')}
                  error={Boolean(errors.fatherName)}
                  helperText={errors.fatherName?.message}
                />
              </div>

              <NrcFields
                control={control}
                errors={errors}
                setValue={setValue}
                prefix="father"
                label="Father NRC"
                required={false}
              />
            </div>
          </FormSection>

          {/* Emergency Contact */}
          <FormSection icon="bi-exclamation-triangle" title="Emergency Contact">
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <TextField
                  fullWidth
                  label="Emergency Mobile No. *"
                  autoComplete="section-emergency tel"
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

          {/* Form Message */}
          {formMessage ? <Alert severity={formMessageSeverity}>{formMessage}</Alert> : null}

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center justify-end gap-3 rounded-xl border border-slate-100 bg-white px-6 py-4 shadow-sm">
            <span className="mr-auto w-full text-xs text-slate-400 sm:w-auto">
              Fields marked with <span className="text-red-400">*</span> are required
            </span>
            <Button type="button" variant="contained" onClick={() => void submitStep1Next()}>
              Next
            </Button>
          </div>
        </Box>
      ) : step === 2 ? (
        <Box component="form" className="space-y-5">
          <FormSection icon="bi-briefcase" title="Employment Details">
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Controller
                  control={control}
                  name="departmentId"
                  render={({ field }) => (
                    <TextField
                      select
                      fullWidth
                      label="Department *"
                      value={field.value ?? ''}
                      onChange={(event) => {
                        const next = event.target.value ? Number(event.target.value) : undefined
                        field.onChange(next)
                        setValue('positionId', undefined as unknown as number)
                        clearErrors('positionId')
                      }}
                      onBlur={field.onBlur}
                      error={Boolean(errors.departmentId)}
                      helperText={errors.departmentId?.message}
                      disabled={departments.isFetching}
                    >
                      <MenuItem value="">Select</MenuItem>
                      {departmentsOptions.map((option) => (
                        <MenuItem key={option.id} value={String(option.id)}>
                          {option.name}
                        </MenuItem>
                      ))}
                    </TextField>
                  )}
                />
                <Controller
                  control={control}
                  name="positionId"
                  render={({ field }) => (
                    <TextField
                      select
                      fullWidth
                      label="Position *"
                      value={field.value ?? ''}
                      onChange={(event) =>
                        field.onChange(event.target.value ? Number(event.target.value) : undefined)
                      }
                      onBlur={field.onBlur}
                      error={Boolean(errors.positionId)}
                      helperText={
                        !departmentIdWatch
                          ? 'Select a department first'
                          : errors.positionId?.message
                      }
                      disabled={!departmentIdWatch || positions.isFetching}
                    >
                      <MenuItem value="">Select</MenuItem>
                      {positionsOptions.map((option) => (
                        <MenuItem key={option.id} value={String(option.id)}>
                          {option.name}
                        </MenuItem>
                      ))}
                    </TextField>
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
              <div className="space-y-3">
                <div className="space-y-3">
                  <span className="block text-sm font-medium text-slate-700">Staff type *</span>
                  <div className="flex flex-col gap-2 sm:flex-row sm:gap-8">
                    <FormControlLabel
                      className="m-0"
                      control={
                        <Radio
                          name="staffType"
                          checked={staffTypeField.value === STAFF_TYPE_PROBATION}
                          onChange={() => {
                            staffTypeField.onChange(STAFF_TYPE_PROBATION)
                            setValue('probationDuration', getValues('probationDuration') ?? '3')
                            if (!getValues('probationStartDate')) {
                              setValue('probationStartDate', getValues('dateOfJoining'))
                            }
                          }}
                        />
                      }
                      label="Probation"
                    />
                    <FormControlLabel
                      className="m-0"
                      control={
                        <Radio
                          name="staffType"
                          checked={staffTypeField.value === STAFF_TYPE_PERMANENT}
                          onChange={() => {
                            staffTypeField.onChange(STAFF_TYPE_PERMANENT)
                            setValue('probationDuration', undefined)
                            setValue('probationStartDate', undefined)
                            setValue('probationEndDate', undefined)
                          }}
                        />
                      }
                      label="Permanent"
                    />
                  </div>
                  {errors.staffTypeId ? (
                    <div className="text-xs text-red-600">{errors.staffTypeId.message}</div>
                  ) : null}
                </div>
                {isProbationStaff ? (
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
            <Button type="button" variant="contained" onClick={() => void submitStep2Next()}>
              Next
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
                <p className="font-semibold text-emerald-800">Review employee details</p>
                <p className="text-xs text-emerald-600">
                  Steps 1–2 completed — submit below to add the employee record and create the system account
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                {
                  label: 'Record ID',
                  value: employeePkId != null ? String(employeePkId) : '—',
                  icon: 'bi-hash',
                },
                {
                  label: 'Employee ID',
                  value: savedValues?.employeeId?.trim() ? savedValues.employeeId : '—',
                  icon: 'bi-person-vcard',
                },
                { label: 'Employee Name', value: savedValues?.employeeName ?? '—', icon: 'bi-person' },
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
                  <p className="text-xs text-slate-500">
                    Enter the login email (stored on the user account). A temporary password will be emailed there. The
                    employee must change it on first login.
                  </p>
                </div>
              </div>
              <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <TextField
                  fullWidth
                  type="email"
                  label="Email Address *"
                  autoComplete="email"
                  value={loginEmail}
                  onChange={(e) => {
                    setLoginEmail(e.target.value)
                    if (loginEmailError === 'Email already exists') {
                      setLoginEmailError('')
                    }
                  }}
                  onBlur={(e) => {
                    void handleLoginEmailBlur(e as FocusEvent<HTMLInputElement>)
                  }}
                  error={Boolean(loginEmailError)}
                  helperText={loginEmailError}
                />
                <div className="rounded-lg border border-slate-100 bg-slate-50 p-4">
                  <div className="mb-1 flex items-center gap-1.5">
                    <i className="bi bi-person-badge text-xs text-slate-400" />
                    <span className="text-xs text-slate-400">System Role</span>
                  </div>
                  <p className="text-sm font-semibold text-slate-800">Employee</p>
                </div>
              </div>

              {formMessage && formMessageSeverity !== 'success' ? (
                <div className="mb-4">
                  <Alert severity={formMessageSeverity === 'info' ? 'info' : 'error'}>{formMessage}</Alert>
                </div>
              ) : null}
              {accountError ? (
                <div className="mb-4">
                  <Alert severity="error">{accountError}</Alert>
                </div>
              ) : null}
              <Button
                variant="contained"
                onClick={() => void handleCreateAccount()}
                disabled={!loginEmail.trim() || finalSubmitLoading}
                className="min-w-[220px]"
              >
                {finalSubmitLoading ? 'Submitting...' : 'Create Employee Account'}
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
                  <p className="text-xs text-blue-600">
                    {accountEmailSent ? (
                      <>
                        A temporary password has been sent to{' '}
                        <span className="font-medium text-blue-800">{loginEmail}</span>. The employee must change it on
                        first login.
                      </>
                    ) : (
                      <>
                        The account is ready for <span className="font-medium text-blue-800">{loginEmail}</span>, but the
                        temporary password email could not be sent (check server mail settings). Use &quot;Forgot
                        password&quot; or have an admin reset the password so the employee can sign in.
                      </>
                    )}
                  </p>
                </div>
              </div>
              <div className="rounded-lg border border-blue-100 bg-white p-5 shadow-sm">
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-100">
                    <i className="bi bi-envelope-check text-lg text-blue-600" />
                  </div>
                  <p className="text-sm text-slate-600">
                    {accountEmailSent
                      ? 'Ask them to check inbox and spam. They sign in with this email and the password from the message.'
                      : 'After the password is reset or resent, they sign in with this email and must change the password on first login.'}
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
