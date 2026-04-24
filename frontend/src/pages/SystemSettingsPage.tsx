import { useState, useEffect } from 'react'
import { Monitor, Moon, Sun, Globe, Bell, Accessibility, Save, Loader2 } from 'lucide-react'
import { useGetProfileQuery, useUpdateProfileMutation } from '../features/user/userApi'

export function SystemSettingsPage() {
  const { data: profileResponse } = useGetProfileQuery()
  const [updateProfile, { isLoading: isUpdating }] = useUpdateProfileMutation()

  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('light')
  const [language, setLanguage] = useState('English')
  const [notifications, setNotifications] = useState(true)
  const [compactMode, setCompactMode] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (profileResponse?.data?.theme) {
      setTheme(profileResponse.data.theme as any)
    }
  }, [profileResponse])

  const handleThemeChange = async (newTheme: 'light' | 'dark' | 'system') => {
    setTheme(newTheme)
    
    // Instant UI feedback
    const isSystemDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    if (newTheme === 'dark' || (newTheme === 'system' && isSystemDark)) {
        document.documentElement.classList.add('dark')
        document.body.classList.add('dark')
    } else {
        document.documentElement.classList.remove('dark')
        document.body.classList.remove('dark')
    }

    try {
       await updateProfile({ theme: newTheme }).unwrap()
       setSaved(true)
       setTimeout(() => setSaved(false), 2000)
    } catch (err) {
       console.error("Failed to update theme", err)
    }
  }

  const handleSave = () => {
    setIsSaving(true)
    // Simulate API call
    setTimeout(() => {
      setIsSaving(false)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    }, 800)
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8 animate-in fade-in duration-500">
      <div className="mb-8">
        <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">System Settings</h1>
        <p className="mt-2 text-sm font-medium text-slate-500 dark:text-slate-400">
          Customize your application experience and preferences.
        </p>
      </div>

      <div className="space-y-6">
        {/* Appearance Section */}
        <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden transition-all hover:shadow-md">
          <div className="p-8">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl flex items-center justify-center">
                <Sun size={20} />
              </div>
              <h2 className="text-lg font-black text-slate-900 dark:text-slate-200 tracking-tight">Appearance</h2>
            </div>

            <div className="space-y-8">
              <div>
                <p className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-4 uppercase tracking-widest text-[10px]">Interface Theme</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {[
                    { id: 'light', name: 'Light Mode', icon: <Sun size={18} />, color: 'bg-white border-slate-200' },
                    { id: 'dark', name: 'Dark Mode', icon: <Moon size={18} />, color: 'bg-slate-900 border-slate-800 text-white' },
                    { id: 'system', name: 'System Default', icon: <Monitor size={18} />, color: 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700' }
                  ].map((t) => (
                    <button
                      key={t.id}
                      onClick={() => handleThemeChange(t.id as any)}
                      disabled={isUpdating}
                      className={`relative flex flex-col items-center gap-3 p-4 rounded-2xl border-2 transition-all ${
                        theme === t.id 
                          ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-900/10 shadow-sm' 
                          : 'border-transparent bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <div className={`w-full aspect-video rounded-lg ${t.color} flex items-center justify-center mb-1 shadow-inner border transition-all`}>
                         {(isUpdating && theme === t.id) ? <Loader2 className="animate-spin text-blue-600" /> : t.icon}
                      </div>
                      <span className={`text-xs font-bold ${theme === t.id ? 'text-blue-700 dark:text-blue-400' : 'text-slate-600 dark:text-slate-400'}`}>{t.name}</span>
                      {theme === t.id && !isUpdating && (
                        <div className="absolute top-2 right-2 w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center text-white shadow-sm border-2 border-white">
                           <Save size={10} />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                 <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-white dark:bg-slate-900 rounded-xl flex items-center justify-center text-slate-400 dark:text-slate-500 border border-slate-100 dark:border-slate-800 shadow-sm">
                       <Accessibility size={20} />
                    </div>
                    <div>
                       <p className="text-sm font-bold text-slate-900 dark:text-slate-200 leading-none mb-1">Compact Mode</p>
                       <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-tight">Reduce whitespace across the UI</p>
                    </div>
                 </div>
                 <button 
                   onClick={() => setCompactMode(!compactMode)}
                   className={`relative w-12 h-6 rounded-full transition-colors duration-300 ${compactMode ? 'bg-blue-600' : 'bg-slate-200 dark:bg-slate-700'}`}
                 >
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform duration-300 ${compactMode ? 'left-7' : 'left-1'}`} />
                 </button>
              </div>
            </div>
          </div>
        </div>

        {/* Preferences Section */}
        <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden transition-all hover:shadow-md">
          <div className="p-8">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-xl flex items-center justify-center">
                <Globe size={20} />
              </div>
              <h2 className="text-lg font-black text-slate-900 dark:text-slate-200 tracking-tight">Regional & Preferences</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest pl-1">Primary Language</label>
                  <select 
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-4 py-3 text-sm font-bold text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/50 transition-all appearance-none"
                  >
                     <option className="dark:bg-slate-900">English</option>
                     <option className="dark:bg-slate-900">Myanmar (Burmese)</option>
                     <option className="dark:bg-slate-900">Japanese</option>
                  </select>
               </div>

               <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Time Zone</label>
                  <select 
                    className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-blue-100 transition-all appearance-none"
                  >
                     <option>UTC+06:30 (Yangon)</option>
                     <option>UTC+00:00 (GMT)</option>
                     <option>UTC+09:00 (Tokyo)</option>
                  </select>
               </div>
            </div>
          </div>
        </div>

        {/* Notification Settings */}
        <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden transition-all hover:shadow-md">
          <div className="p-8">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-xl flex items-center justify-center">
                <Bell size={20} />
              </div>
              <h2 className="text-lg font-black text-slate-900 dark:text-slate-200 tracking-tight">Notification Feed</h2>
            </div>

            <div className="space-y-4">
               {[
                 { id: 'browser', label: 'Browser Notifications', desc: 'Alerts on the desktop', enabled: notifications },
                 { id: 'email', label: 'Email Summaries', desc: 'Weekly performance updates', enabled: true },
                 { id: 'slack', label: 'Slack Integration', desc: 'Activity feed in channels', enabled: false }
               ].map(n => (
                 <div key={n.id} className="flex items-center justify-between p-4 bg-slate-50/50 rounded-2xl border border-slate-100/50">
                    <div>
                       <p className="text-sm font-bold text-slate-900 mb-0.5">{n.label}</p>
                       <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">{n.desc}</p>
                    </div>
                    <button 
                      onClick={() => n.id === 'browser' && setNotifications(!notifications)}
                      className={`relative w-10 h-5 rounded-full transition-colors duration-300 ${n.enabled ? 'bg-blue-600' : 'bg-slate-200'}`}
                    >
                       <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform duration-300 ${n.enabled ? 'left-5.5' : 'left-0.5'}`} />
                    </button>
                 </div>
               ))}
            </div>
          </div>
        </div>
        
        {/* Action Bar */}
        <div className="pt-6 flex justify-end gap-3">
           {saved && (
             <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-sm bg-emerald-50 dark:bg-emerald-900/20 px-4 py-2 rounded-xl animate-in slide-in-from-right-4">
                <Save size={16} />
                Changes saved!
             </div>
           )}
           <button 
             onClick={handleSave}
             disabled={isSaving}
             className="px-8 py-3 bg-slate-900 dark:bg-blue-600 text-white rounded-2xl text-sm font-black shadow-lg hover:shadow-xl hover:bg-slate-800 dark:hover:bg-blue-700 transition-all flex items-center gap-2 transform active:scale-95 disabled:opacity-50"
           >
              {isSaving ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Save size={18} />
              )}
              Save Settings
           </button>
        </div>
      </div>
    </div>
  )
}
