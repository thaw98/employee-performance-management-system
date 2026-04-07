import { useAppSelector } from '../app/hooks'

export function ProfileSettingsPage() {
  const user = useAppSelector((s) => s.auth.user)

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Profile Settings</h1>
        <p className="mt-2 text-sm text-slate-600">
          Manage your account information and preferences.
        </p>
      </div>

      <div className="bg-white shadow-[0_4px_24px_rgba(0,0,0,0.02)] rounded-2xl overflow-hidden border border-slate-100">
        <div className="p-6 sm:p-8 flex items-start gap-6 border-b border-slate-100 bg-slate-50/50">
          <div className="h-20 w-20 rounded-full bg-blue-100 text-blue-700 flex flex-shrink-0 items-center justify-center text-3xl font-bold border-4 border-white shadow-sm">
            {user?.email?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div className="pt-2 flex-1">
            <h2 className="text-xl font-bold text-slate-900">{user?.email || 'User'}</h2>
            <p className="text-sm font-medium text-slate-500 uppercase tracking-wider mt-1">
              {user?.role || 'Admin'}
            </p>
          </div>
        </div>

        <div className="p-6 sm:p-8">
          <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-6">Personal Information</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <i className="bi bi-envelope text-slate-400"></i>
                </div>
                <input
                  type="email"
                  readOnly
                  value={user?.email || ''}
                  className="w-full pl-10 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-600 cursor-not-allowed focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Employee ID</label>
              <div className="relative">
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
              <div className="relative">
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
              <div className="relative">
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

          <div className="mt-8 pt-6 border-t border-slate-100 flex justify-end gap-3">
            <button type="button" disabled className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium opacity-50 cursor-not-allowed">
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
