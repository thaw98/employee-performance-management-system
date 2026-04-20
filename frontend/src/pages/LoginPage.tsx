import { Navigate } from 'react-router-dom'
import { useState } from 'react'

import { LoginForm } from '../components/auth/LoginForm'
import { useAppSelector } from '../app/hooks'
import { FIRST_LOGIN_SET_PASSWORD_PATH } from '../routes/paths'

export function LoginPage() {
  const isAuthenticated = useAppSelector((s) => s.auth.isAuthenticated)
  const user = useAppSelector((s) => s.auth.user)
  const mustChangePassword = useAppSelector((s) => s.auth.user?.mustChangePassword === true)
  const [activeTable, setActiveTable] = useState<'HR' | 'MANAGER' | 'EMPLOYEE'>('HR')

  if (isAuthenticated) {
    const dashboardPath = user?.roleId === 1 
      ? '/hr/dashboard' 
      : user?.roleId === 2 
        ? '/manager/dashboard' 
        : '/dashboard'
        
    return (
      <Navigate to={mustChangePassword ? FIRST_LOGIN_SET_PASSWORD_PATH : dashboardPath} replace />
    )
  }

  const demoUsers = {
    HR: [
      { name: 'Phyu Phyu Thin', email: 'hr.phyu@acedatasystems.com', role: 'HR Manager' },
      { name: 'Kyaw Kyaw', email: 'hr.kyaw@acedatasystems.com', role: 'HR Specialist' },
    ],
    MANAGER: [
      { name: 'Aung Ko Oo', email: 'aungkooo@acedatasystems.com', role: 'Engineering Dept Head' },
      { name: 'Su Su Lwin', email: 'susulwin@acedatasystems.com', role: 'Project Manager' },
    ],
    EMPLOYEE: [
      { name: 'Thura Linn', email: 'thura@acedatasystems.com', role: 'Senior Developer' },
      { name: 'Aye Myat Nyein', email: 'ayemyat@acedatasystems.com', role: 'QA Engineer' },
    ]
  }

  return (
    <div className="epms-login-page">
      <div className="epms-login-bg" aria-hidden>
        <div className="epms-login-bg-circle epms-login-bg-circle-1" />
        <div className="epms-login-bg-circle epms-login-bg-circle-2" />
        <div className="epms-login-bg-circle epms-login-bg-circle-3" />
      </div>

      <div className="epms-login-container">
        <div className="epms-login-brand">
          <div className="epms-login-brand-content">
            <div className="epms-login-brand-icon">
              <i className="bi bi-bar-chart-line-fill" aria-hidden />
            </div>
            <h1 className="epms-login-brand-title">EPMS</h1>
            <p className="epms-login-brand-subtitle">
              Employee Performance Management System
            </p>
            <div className="epms-login-brand-divider" />
            
            <div className="mt-8">
               <h3 className="text-sm font-bold uppercase tracking-wider text-white/60 mb-4">Quick Login Demo</h3>
               <div className="flex gap-2 mb-4 bg-white/10 p-1 rounded-lg">
                  {(['HR', 'MANAGER', 'EMPLOYEE'] as const).map(tab => (
                    <button
                      key={tab}
                      onClick={() => setActiveTable(tab)}
                      className={`flex-1 py-1.5 text-[10px] font-bold rounded-md transition-all ${activeTable === tab ? 'bg-white text-blue-800 shadow-sm' : 'text-white/70 hover:text-white hover:bg-white/5'}`}
                    >
                      {tab}
                    </button>
                  ))}
               </div>
               
               <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1 custom-scrollbar">
                  {demoUsers[activeTable].map(u => (
                    <div key={u.email} className="bg-white/5 border border-white/10 p-2.5 rounded-xl hover:bg-white/10 transition-colors cursor-pointer group">
                      <div className="flex justify-between items-start mb-1">
                        <span className="text-[11px] font-bold text-white leading-tight">{u.name}</span>
                        <span className="text-[9px] px-1.5 py-0.5 bg-blue-500/20 text-blue-200 rounded-full font-medium">{u.role}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px] text-white/50 group-hover:text-white/80 transition-colors">
                        <i className="bi bi-envelope text-[9px]"></i>
                        <span>{u.email}</span>
                      </div>
                    </div>
                  ))}
               </div>
               <p className="mt-4 text-[10px] text-white/40 italic">
                 * All passwords are set to "ACE12345"
               </p>
            </div>
          </div>
          <div className="epms-login-brand-footer">
            © {new Date().getFullYear()} ACE Data Systems Co., Ltd.
          </div>
        </div>

        <div className="epms-login-form-panel">
          <LoginForm />
        </div>
      </div>
      
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.2); }
      `}</style>
    </div>
  )
}
