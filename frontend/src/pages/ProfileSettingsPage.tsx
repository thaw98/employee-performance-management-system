import { useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useGetProfileQuery, useUpdateProfilePictureMutation } from '../features/user/userApi'

export function ProfileSettingsPage() {
  const { data: profileResponse, isLoading } = useGetProfileQuery()
  const [updateProfilePicture, { isLoading: isUpdating }] = useUpdateProfilePictureMutation()

  const user = profileResponse?.data || null
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Quick size validation (e.g. max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'Image size exceeds 5MB' })
      return
    }

    const reader = new FileReader()
    reader.onload = async (event) => {
      const base64String = event.target?.result as string
      try {
        setMessage(null)
        await updateProfilePicture({ profilePictureBase64: base64String }).unwrap()
        setMessage({ type: 'success', text: 'Profile picture updated successfully!' })
        setTimeout(() => setMessage(null), 3000)
      } catch (err: any) {
        setMessage({ type: 'error', text: err.data?.message || 'Failed to update profile picture' })
      }
    }
    reader.readAsDataURL(file)
  }

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto py-16 px-4 flex justify-center items-center">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="h-20 w-20 bg-slate-200 rounded-full"></div>
          <div className="h-4 w-32 bg-slate-200 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Profile Settings</h1>
        <p className="mt-2 text-sm text-slate-600">
          Manage your account information and preferences.
        </p>
      </div>

      {message && (
        <div className={`mb-6 p-4 rounded-xl flex items-center gap-3 text-sm font-medium animate-in fade-in slide-in-from-top-2 ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
          }`}>
          <i className={`bi ${message.type === 'success' ? 'bi-check-circle-fill' : 'bi-exclamation-circle-fill'} text-lg`}></i>
          {message.text}
        </div>
      )}

      <div className="bg-white shadow-[0_4px_24px_rgba(0,0,0,0.02)] rounded-2xl overflow-hidden border border-slate-100">
        <div className="p-6 sm:p-8 flex items-center gap-6 border-b border-slate-100 bg-slate-50/50">
          <div className="relative group">
            <input
              type="file"
              accept="image/*"
              className="hidden"
              ref={fileInputRef}
              onChange={handleFileChange}
            />
            <div
              onClick={() => !isUpdating && fileInputRef.current?.click()}
              className={`h-24 w-24 rounded-full bg-blue-100 text-blue-700 flex flex-shrink-0 items-center justify-center text-4xl font-bold border-4 border-white shadow-sm overflow-hidden 
                ${isUpdating ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              {user?.profilePictureBase64 ? (
                <img src={user.profilePictureBase64} alt="Profile" className="h-full w-full object-cover" />
              ) : (
                user?.name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || 'U'
              )}
            </div>
            {!isUpdating && (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer border-4 border-transparent"
              >
                <i className="bi bi-camera-fill text-white text-xl"></i>
              </div>
            )}
            {isUpdating && (
              <div className="absolute inset-0 rounded-full bg-white/50 flex items-center justify-center">
                <i className="bi bi-arrow-repeat animate-spin text-blue-700 text-2xl"></i>
              </div>
            )}
          </div>

          <div className="flex-1">
            <h2 className="text-xl font-bold text-slate-900">{user?.name || 'User'}</h2>
            <p className="text-sm font-medium text-slate-500 uppercase tracking-wider mt-1">
              {user?.role || 'Admin'}
            </p>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUpdating}
              className="mt-3 text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline disabled:opacity-50 disabled:no-underline"
            >
              Change Profile Picture
            </button>
          </div>
        </div>

        <div className="p-6 sm:p-8">
          <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-6">Personal Information</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-y-8 gap-x-6">
            <div>
              <p className="text-sm font-medium text-slate-500 mb-1">Email Address</p>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-50 text-slate-400">
                  <i className="bi bi-envelope text-lg"></i>
                </div>
                <p className="font-semibold text-slate-900">{user?.email || '—'}</p>
              </div>
            </div>

            <div>
              <p className="text-sm font-medium text-slate-500 mb-1">Employee ID</p>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-50 text-slate-400">
                  <i className="bi bi-person-badge text-lg"></i>
                </div>
                <p className="font-semibold text-slate-900">{user?.employeeId || '—'}</p>
              </div>
            </div>

            <div>
              <p className="text-sm font-medium text-slate-500 mb-1">Role</p>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-50 text-slate-400">
                  <i className="bi bi-shield-check text-lg"></i>
                </div>
                <p className="font-semibold text-slate-900 capitalize">{user?.role || '—'}</p>
              </div>
            </div>

            <div>
              <p className="text-sm font-medium text-slate-500 mb-1">System User ID</p>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-50 text-slate-400">
                  <i className="bi bi-hash text-lg"></i>
                </div>
                <p className="font-semibold text-slate-900">{user?.id?.toString() || '—'}</p>
              </div>
            </div>
          </div>
          
          <div className="mt-10 pt-8 border-t border-slate-100 flex justify-between items-center bg-slate-50/50 -mx-6 sm:-mx-8 -mb-6 sm:-mb-8 px-6 py-6 sm:px-8">
            <div>
              <p className="text-sm font-semibold text-slate-900">Security & Authentication</p>
              <p className="text-xs text-slate-500 mt-1 pb-1">Update your password to keep your account secure.</p>
            </div>
            <Link 
              to="/hr/settings/password"
              className="px-4 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-lg text-sm font-semibold shadow-sm hover:bg-slate-50 hover:text-blue-600 transition-colors flex items-center gap-2 shrink-0"
            >
              <i className="bi bi-shield-lock"></i>
              Change Password
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
