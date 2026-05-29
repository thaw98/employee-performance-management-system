import { ShieldCheck } from 'lucide-react'
import { SetNewPasswordForm } from '../../components/auth/SetNewPasswordForm'

/** First-login password change (temporary password → new password). */
export function FirstLoginPasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F3F6FA] p-4 sm:p-6 font-sans">
      <div className="flex w-full max-w-[1080px] md:h-[640px] flex-col md:flex-row overflow-hidden rounded-[32px] bg-white shadow-[0_20px_50px_rgba(0,0,0,0.08)]">

        {/* Left Branding Panel (40% width) */}
        <div className="relative flex w-full md:w-[40%] flex-col justify-between bg-gradient-to-b from-[#2563EB] to-[#3730A3] p-8 md:p-10 text-white text-center">
          <div className="absolute -left-16 -top-16 h-48 w-48 rounded-full bg-white/5 blur-2xl pointer-events-none" />
          <div className="absolute -bottom-16 -right-16 h-48 w-48 rounded-full bg-white/5 blur-2xl pointer-events-none" />

          <div className="relative flex flex-col items-center justify-center flex-grow">
            <div className="mb-6 flex h-[120px] w-[120px] items-center justify-center rounded-[24px] bg-white p-4 shadow-lg hover:scale-105 transition-transform duration-300">
              <img src="/ace-logo.png" alt="Ace Data Systems Logo" className="h-full w-full object-contain" />
            </div>

            <h1 className="text-3xl md:text-4xl font-extrabold tracking-wider text-white">EPMS</h1>
            <p className="mt-3 text-xs md:text-sm text-blue-100/90 leading-relaxed font-semibold max-w-[260px]">
              Employee Performance Management System
            </p>
          </div>

          <div className="relative text-center text-xs font-semibold text-blue-200/90 tracking-wide mt-4 md:mt-0">
            Ace Data Systems Co., Ltd.
          </div>
        </div>

        {/* Right Form Panel (60% width) */}
        <div className="w-full md:w-[60%] bg-white p-8 sm:p-12 flex flex-col justify-between">
          <div className="flex-grow flex flex-col justify-center max-w-[500px] w-full mx-auto">
            {/* Mobile Logo Header */}
            <div className="mb-8 flex flex-col items-center md:hidden">
              <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-[18px] bg-[#EAF1FB] p-2 shadow-sm border border-[#D8E2F0]">
                <img src="/ace-logo.png" alt="Ace Data Systems Logo" className="h-full w-full object-contain" />
              </div>
              <h1 className="text-2xl font-black tracking-tight text-slate-900">EPMS</h1>
              <p className="text-xs text-slate-500 font-medium">Employee Performance Management System</p>
            </div>

            <div className="mb-8">
              <h2 className="text-3xl font-extrabold tracking-tight text-slate-900">Set New Password</h2>
              <p className="mt-2 text-sm text-slate-500 font-medium">
                Create a new password to secure your account.
              </p>
            </div>

            {/* Security notice badge */}
            <div className="mb-6 flex items-center gap-3 rounded-[14px] border border-[#FEF3C7] bg-[#FFFBEB] px-4 py-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#FEF3C7]">
                <ShieldCheck className="h-5 w-5 text-[#D97706]" />
              </div>
              <div>
                <p className="text-sm font-semibold text-[#92400E]">Security Required</p>
                <p className="text-xs text-[#B45309]">
                  Please set a new password to secure your account.
                </p>
              </div>
            </div>

            {/* Password Form */}
            <SetNewPasswordForm variant="loginPanel" />
          </div>

          {/* Footer under form */}
          <div className="mt-8 text-center border-t border-slate-100 pt-4">
            <p className="text-xs text-slate-400 font-semibold tracking-wide">
              © 2026 ACE Data Systems. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
