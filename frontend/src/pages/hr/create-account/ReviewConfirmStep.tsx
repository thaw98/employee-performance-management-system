import { UserCheck, Briefcase, ShieldCheck, HeartHandshake } from 'lucide-react'
import type { CreateEmployeeAccountFormValues } from '../../../features/hrCreateEmployee/schemas/createEmployeeAccountSchema'
import { toTitleCasePersonName } from '../../../utils/personName'

interface ReviewConfirmStepProps {
  values: CreateEmployeeAccountFormValues
  nrcPreview: string
  fatherNrcPreview: string
  /** Role name from selected position (API); account role is always derived on the server from position. */
  linkedRoleName?: string | null
}

function formatLongDate(dateValue?: string): string {
  if (!dateValue) return '—'
  const date = new Date(dateValue)
  if (Number.isNaN(date.getTime())) return dateValue
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(date)
}

function ReviewRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="group rounded-lg px-3 py-2.5 transition-colors hover:bg-slate-50/80">
      <dt className="text-xs font-bold uppercase tracking-wider text-slate-400">{label}</dt>
      <dd className={`mt-0.5 text-sm font-medium text-slate-800 ${mono ? 'font-mono' : ''}`}>
        {value || '—'}
      </dd>
    </div>
  )
}

export function ReviewConfirmStep({ values, nrcPreview, fatherNrcPreview, linkedRoleName }: ReviewConfirmStepProps) {
  const perm = values.staffType === 'PERMANENT'
  const roleLabel = linkedRoleName?.trim() || 'the role linked to the selected position'
  return (
    <div className="space-y-6">
      {/* ── Employee Information ── */}
      <section className="overflow-hidden rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white px-6 py-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-50 text-teal-600">
            <UserCheck size={18} />
          </div>
          <h3 className="text-base font-bold text-slate-900">Employee Information</h3>
        </div>
        <div className="p-4">
          <dl className="grid gap-1 sm:grid-cols-2">
            <ReviewRow label="Staff Number" value={values.staffNo.trim()} mono />
            <ReviewRow label="Email" value={values.email} />
            <ReviewRow label="Full Name" value={toTitleCasePersonName(values.employeeName ?? '') || '—'} />
            <ReviewRow label="Gender" value={values.gender || '—'} />
            <ReviewRow label="Date of Birth" value={formatLongDate(values.dateOfBirth)} />
            <ReviewRow label="Phone" value={values.phoneNo} />
            <ReviewRow label="Nationality" value={values.nationality} />
            <div className="sm:col-span-2">
              <ReviewRow label="Address" value={values.address?.trim() || '—'} />
            </div>
            <ReviewRow label="Religion" value={values.religion?.trim() || '—'} />
            <div className="sm:col-span-2">
              <ReviewRow label="NRC Number" value={nrcPreview || '—'} mono />
            </div>
          </dl>
        </div>
      </section>

      {/* ── Father Information & emergency contact ── */}
      <section className="overflow-hidden rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white px-6 py-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-50 text-violet-600">
            <HeartHandshake size={18} />
          </div>
          <h3 className="text-base font-bold text-slate-900">Father Information and emergency contact</h3>
        </div>
        <div className="p-4">
          <dl className="grid gap-1 sm:grid-cols-2">
            <ReviewRow label="Father's name" value={toTitleCasePersonName(values.fatherName ?? '') || '—'} />
            <ReviewRow label="Father's occupation" value={values.fatherOccupation?.trim() || '—'} />
            <div className="sm:col-span-2">
              <ReviewRow label="Father's NRC" value={fatherNrcPreview || '—'} mono />
            </div>
            <ReviewRow label="Emergency phone" value={values.emergencyPhone?.trim() || '—'} />
            <ReviewRow label="Relationship" value={values.emergencyRelation?.trim() || '—'} />
          </dl>
        </div>
      </section>

      {/* ── Employment Information ── */}
      <section className="overflow-hidden rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white px-6 py-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
            <Briefcase size={18} />
          </div>
          <h3 className="text-base font-bold text-slate-900">Employment Information</h3>
        </div>
        <div className="p-4">
          <dl className="grid gap-1 sm:grid-cols-2">
            <ReviewRow
              label="Staff Type"
              value={perm ? 'Permanent' : 'Probation'}
            />
            <ReviewRow label="Hire Date" value={formatLongDate(values.hireDate)} />
            {!perm ? (
              <>
                <ReviewRow label="Probation Start" value={formatLongDate(values.probationStartDate)} />
                <ReviewRow label="Probation End" value={formatLongDate(values.probationEndDate)} />
              </>
            ) : (
              <div className="sm:col-span-2">
                <ReviewRow label="Probation" value="N/A (permanent staff)" />
              </div>
            )}
          </dl>
        </div>
      </section>

      {/* ── Account Summary ── */}
      <section className="overflow-hidden rounded-xl border border-teal-200/60 bg-gradient-to-r from-teal-50 to-emerald-50 shadow-sm">
        <div className="flex items-start gap-4 px-6 py-5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-500 text-white shadow-md shadow-teal-500/25">
            <ShieldCheck size={20} />
          </div>
          <div>
            <h3 className="text-base font-bold text-teal-900">Account Summary</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-teal-800/80">
              A new login will be created for <strong className="text-teal-900">{values.email}</strong> with
              the access role for this position: <strong className="text-teal-900">{roleLabel}</strong> (set from the
              position; not editable here).
            </p>
            <p className="mt-1 text-sm leading-relaxed text-teal-800/80">
              A temporary password will be generated and emailed — it is not shown on this screen.
            </p>
            <div className="mt-3 flex items-center gap-2 rounded-lg bg-white/60 px-3 py-2">
              <ShieldCheck size={14} className="text-teal-600" />
              <p className="text-xs font-medium text-teal-700">
                The employee must change their password on first login.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
