import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useChangePasswordMutation } from '../features/user/userApi'

export function ChangePasswordPage() {
  const navigate = useNavigate()
  const [changePassword, { isLoading }] = useChangePasswordMutation()

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  
  const [showConfirm, setShowConfirm] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const handleDoneClick = () => {
    setMessage(null)
    if (!currentPassword || !newPassword || !confirmPassword) {
      setMessage({ type: 'error', text: 'Please fill out all password fields' })
      return
    }
    if (newPassword.length < 6) {
      setMessage({ type: 'error', text: 'New password must be at least 6 characters' })
      return
    }
    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'New password and confirm password do not match' })
      return
    }
    setShowConfirm(true)
  }

  const handleConfirm = async () => {
    setShowConfirm(false)
    try {
      await changePassword({ currentPassword, newPassword, confirmPassword }).unwrap()
      setMessage({ type: 'success', text: 'Password changed successfully' })
      setTimeout(() => {
        navigate('/admin/settings/profile')
      }, 1500)
    } catch (err: any) {
      setMessage({ type: 'error', text: err.data?.message || 'Failed to change password' })
    }
  }

  return (
    <div className="max-w-2xl mx-auto py-8 px-4 sm:px-6 lg:px-8 relative">
      <div className="mb-8">
        <Link to="/admin/settings/profile" className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900 mb-4 transition-colors">
          <i className="bi bi-arrow-left"></i>
          Back to Profile Settings
        </Link>
        <h1 className="text-2xl font-bold text-slate-900">Change Password</h1>
        <p className="mt-2 text-sm text-slate-600">
          Update your password to ensure your account remains secure.
        </p>
      </div>

      {message && (
        <div className={`mb-6 p-4 rounded-xl flex items-center gap-3 text-sm font-medium animate-in fade-in ${
          message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          <i className={`bi ${message.type === 'success' ? 'bi-check-circle-fill' : 'bi-exclamation-circle-fill'} text-lg`}></i>
          {message.text}
        </div>
      )}

      <div className="bg-white shadow-[0_4px_24px_rgba(0,0,0,0.02)] rounded-2xl border border-slate-100 p-6 sm:p-8">
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Current Password</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <i className="bi bi-shield-lock text-slate-400"></i>
              </div>
              <input
                type={showCurrentPassword ? "text" : "password"}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow"
                placeholder="Enter current password"
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-blue-600 focus:outline-none transition-colors"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
              >
                <i className={`bi ${showCurrentPassword ? 'bi-eye-slash-fill' : 'bi-eye-fill'} text-lg`}></i>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">New Password</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <i className="bi bi-key text-slate-400"></i>
              </div>
              <input
                type={showNewPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow"
                placeholder="Enter new password (min. 6 characters)"
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-blue-600 focus:outline-none transition-colors"
                onClick={() => setShowNewPassword(!showNewPassword)}
              >
                <i className={`bi ${showNewPassword ? 'bi-eye-slash-fill' : 'bi-eye-fill'} text-lg`}></i>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Confirm New Password</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <i className="bi bi-key-fill text-slate-400"></i>
              </div>
              <input
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow"
                placeholder="Re-enter new password"
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-blue-600 focus:outline-none transition-colors"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                <i className={`bi ${showConfirmPassword ? 'bi-eye-slash-fill' : 'bi-eye-fill'} text-lg`}></i>
              </button>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-end gap-3">
          <Link
            to="/admin/settings/profile"
            className="px-5 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 rounded-lg border border-transparent transition-colors"
          >
            Cancel
          </Link>
          <button
            onClick={handleDoneClick}
            disabled={isLoading}
            className="px-5 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 focus:ring-4 focus:ring-blue-100 transition-all disabled:opacity-50"
          >
            {isLoading ? 'Updating...' : 'Done'}
          </button>
        </div>
      </div>

      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6">
              <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mb-4 mx-auto">
                <i className="bi bi-question-circle text-2xl"></i>
              </div>
              <h3 className="text-lg font-bold text-slate-900 text-center mb-2">Confirm Action</h3>
              <p className="text-sm text-slate-500 text-center">
                Are you sure you want to change your password? You will need to use the new password on your next login!
              </p>
            </div>
            <div className="flex border-t border-slate-100">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors border-r border-slate-100"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                className="flex-1 py-3 text-sm font-semibold text-blue-600 hover:bg-blue-50 transition-colors"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
