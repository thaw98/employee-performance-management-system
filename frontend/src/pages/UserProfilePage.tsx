import React, { useRef } from 'react'
import toast from 'react-hot-toast'
import { CalendarDays, IdCard, Mail, ShieldCheck, User, UsersRound, BriefcaseBusiness, LockKeyhole, Camera, Loader2, Trash2 } from 'lucide-react'

import { SetNewPasswordForm } from '../components/auth/SetNewPasswordForm'
import { useGetProfileQuery, useUpdateProfilePictureMutation, useDeleteProfilePictureMutation } from '../features/user/userApi'
import { resolveProfilePictureSrc } from '../utils/mediaUrl'

function displayValue(value: string | number | null | undefined) {
  if (value === null || value === undefined || value === '') {
    return '-'
  }
  return String(value)
}

function formatLabel(value: string | null | undefined) {
  if (!value) {
    return '-'
  }
  return value
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

function formatDate(value: string | null | undefined) {
  if (!value) {
    return '-'
  }
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) {
    return value
  }
  return parsed.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
  })
}

export function UserProfilePage() {
  const { data: profileResponse, isLoading, isError } = useGetProfileQuery()
  const [updateProfilePicture, { isLoading: isUpdating }] = useUpdateProfilePictureMutation()
  const [deleteProfilePicture, { isLoading: isDeleting }] = useDeleteProfilePictureMutation()
  const user = profileResponse?.data ?? null
  const pictureSrc = resolveProfilePictureSrc(user?.profilePictureUrl)
  const displayName = user?.fullName || user?.name || 'User'
  const fileInputRef = useRef<HTMLInputElement>(null)

  const isProcessActive = isUpdating || isDeleting

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size exceeds 5MB')
      return
    }

    try {
      await updateProfilePicture(file).unwrap()
      toast.success('Profile picture updated successfully!')
    } catch (err: any) {
      const errMsg = err?.data?.message || err?.message || 'Failed to update profile picture'
      toast.error(errMsg)
    }
  }

  const handleRemovePicture = async () => {
    try {
      await deleteProfilePicture().unwrap()
      toast.success('Profile picture removed successfully!')
    } catch (err: any) {
      const errMsg = err?.data?.message || err?.message || 'Failed to remove profile picture'
      toast.error(errMsg)
    }
  }

  const profileFields = [
    { label: 'Staff No', value: displayValue(user?.staffNo), icon: <IdCard size={18} /> },
    { label: 'Full Name', value: displayValue(user?.fullName || user?.name), icon: <User size={18} /> },
    { label: 'Department', value: displayValue(user?.departmentName), icon: <UsersRound size={18} /> },
    { label: 'Position', value: displayValue(user?.positionName), icon: <BriefcaseBusiness size={18} /> },
    { label: 'Employment Status', value: formatLabel(user?.employmentStatus), icon: <ShieldCheck size={18} /> },
    { label: 'Email', value: displayValue(user?.email), icon: <Mail size={18} /> },
    { label: 'Gender', value: formatLabel(user?.gender), icon: <User size={18} /> },
    { label: 'NRC No', value: displayValue(user?.nrcNo), icon: <IdCard size={18} /> },
    { label: 'Hire Date', value: formatDate(user?.hireDate), icon: <CalendarDays size={18} /> },
  ]

  if (isLoading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="animate-pulse space-y-6">
          <div className="h-36 rounded-2xl bg-slate-100 dark:bg-slate-800" />
          <div className="grid gap-4 md:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="h-28 rounded-2xl bg-slate-100 dark:bg-slate-800" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-10">
        <div className="rounded-2xl border border-red-100 bg-red-50 px-5 py-4 text-sm font-semibold text-red-700">
          Could not load your profile.
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">User Profile</h1>
        <p className="mt-2 text-sm font-medium text-slate-500 dark:text-slate-400">
          Your current account and employee details.
        </p>
      </div>

      <div className="space-y-6">
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex flex-col gap-6 bg-slate-50 px-6 py-6 dark:bg-slate-800/40 sm:flex-row sm:items-center sm:px-8">
            <div className="relative group">
              <input
                type="file"
                accept="image/*"
                className="hidden"
                ref={fileInputRef}
                onChange={handleFileChange}
                disabled={isProcessActive}
              />
              <div
                onClick={() => !isProcessActive && fileInputRef.current?.click()}
                className={`flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-blue-100 text-4xl font-black text-blue-700 shadow-sm border-2 border-white transition-all transform group-hover:scale-105 ${
                  isProcessActive ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                }`}
              >
                {pictureSrc ? (
                  <img src={pictureSrc} alt="Profile" className="h-full w-full object-cover" />
                ) : (
                  displayName.charAt(0).toUpperCase()
                )}
              </div>
              {!isProcessActive && (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute inset-0 rounded-2xl bg-slate-900/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all cursor-pointer backdrop-blur-[2px]"
                >
                  <Camera className="text-white" size={24} />
                </div>
              )}
              {isProcessActive && (
                <div className="absolute inset-0 rounded-2xl bg-white/60 flex items-center justify-center backdrop-blur-sm">
                  <Loader2 className="animate-spin text-blue-700" size={24} />
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="truncate text-2xl font-black text-slate-900 dark:text-white">{displayName}</h2>
                <span className="rounded-full bg-blue-600 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-white">
                  {displayValue(user?.role)}
                </span>
              </div>
              <p className="mt-2 flex items-center gap-2 text-sm font-bold text-slate-500 dark:text-slate-400">
                <Mail size={16} />
                {displayValue(user?.email)}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                 <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isProcessActive}
                    className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-black shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700 hover:border-blue-200 dark:hover:border-blue-600 transition-all disabled:opacity-50"
                 >
                    Update Photo
                 </button>
                 <button 
                    type="button"
                    onClick={handleRemovePicture}
                    disabled={isProcessActive || !pictureSrc}
                    className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-red-100 dark:border-red-900/30 text-red-500 dark:text-red-400 rounded-xl text-xs font-black shadow-sm hover:bg-red-50 dark:hover:bg-red-900/20 transition-all flex items-center gap-1.5 disabled:opacity-50"
                 >
                    <Trash2 size={12} />
                    Remove
                 </button>
              </div>
            </div>
          </div>

          <div className="grid gap-px bg-slate-100 dark:bg-slate-800 sm:grid-cols-2 lg:grid-cols-3">
            {profileFields.map((field) => (
              <div key={field.label} className="bg-white p-6 dark:bg-slate-900">
                <div className="mb-3 flex items-center gap-2 text-blue-600 dark:text-blue-400">
                  {field.icon}
                  <span className="text-[11px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
                    {field.label}
                  </span>
                </div>
                <p className="break-words text-sm font-bold text-slate-900 dark:text-slate-100">{field.value}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-8">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white dark:bg-slate-800">
              <LockKeyhole size={20} />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 dark:text-white">Change Password</h2>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Update your account password.</p>
            </div>
          </div>
          <SetNewPasswordForm variant="settingsPage" />
        </section>
      </div>
    </div>
  )
}
