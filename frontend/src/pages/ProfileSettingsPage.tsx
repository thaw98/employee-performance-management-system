import { useState, useRef } from 'react'
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
                user?.email?.charAt(0).toUpperCase() || 'U'
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
            <h2 className="text-xl font-bold text-slate-900">{user?.email || 'User'}</h2>
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
              <div className="relative opacity-70">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <i className="bi bi-envelope text-slate-400"></i>
                </div>
                <input
                  type="email"
                  readOnly
                  value={user?.email || ''}
                  className="w-full pl-10 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-600 cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Employee ID</label>
              <div className="relative opacity-70">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <i className="bi bi-person-badge text-slate-400"></i>
                </div>
                <input
                  type="text"
                  readOnly
                  value={user?.employeeId || ''}
                  className="w-full pl-10 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-600 cursor-not-allowed focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Role</label>
              <div className="relative opacity-70">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <i className="bi bi-shield-check text-slate-400"></i>
                </div>
                <input
                  type="text"
                  readOnly
                  value={user?.role || ''}
                  className="w-full pl-10 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-600 cursor-not-allowed focus:outline-none capitalize"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">System User ID</label>
              <div className="relative opacity-70">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <i className="bi bi-hash text-slate-400"></i>
                </div>
                <input
                  type="text"
                  readOnly
                  value={user?.id?.toString() || ''}
                  className="w-full pl-10 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-600 cursor-not-allowed focus:outline-none"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
