import { useState, useEffect, useRef } from 'react'
import { Monitor, Moon, Sun, Globe, Bell, Accessibility, Save, Loader2, Image as ImageIcon, Trash2, RotateCcw, Clock, AlertTriangle, X } from 'lucide-react'
import { useGetProfileQuery, useUpdateProfileMutation, useUpdateWallpaperMutation, useDeleteWallpaperMutation } from '../features/user/userApi'

export function SystemSettingsPage() {
  const { data: profileResponse } = useGetProfileQuery()
  const [updateProfile, { isLoading: isUpdating }] = useUpdateProfileMutation()
  const [updateWallpaper, { isLoading: isUploading }] = useUpdateWallpaperMutation()
  const [deleteWallpaper, { isLoading: isDeleting }] = useDeleteWallpaperMutation()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [theme, setTheme] = useState<'light' | 'dark' | 'wallpaper'>('light')
  const [language, setLanguage] = useState('English')
  const [timezone, setTimezone] = useState('UTC+06:30 (Yangon)')
  const [notifications, setNotifications] = useState(true)
  const [compactMode, setCompactMode] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [pendingWallpaper, setPendingWallpaper] = useState<File | 'remove' | null>(null)
  const [currentTime, setCurrentTime] = useState(new Date())
  const [showResetModal, setShowResetModal] = useState(false)
  const [isResetting, setIsResetting] = useState(false)

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const formatTime = (date: Date, offsetHours: number, offsetMinutes: number = 0) => {
    const utc = date.getTime() + (date.getTimezoneOffset() * 60000)
    const newDate = new Date(utc + (3600000 * offsetHours) + (60000 * offsetMinutes))
    return newDate.toLocaleTimeString('en-US', { hour12: true, hour: '2-digit', minute: '2-digit', second: '2-digit' })
  }

  useEffect(() => {
    if (profileResponse?.data?.theme) {
      setTheme(profileResponse.data.theme as any)
    }
    if (profileResponse?.data?.language) {
      setLanguage(profileResponse.data.language)
    }
    if (profileResponse?.data?.timezone) {
      setTimezone(profileResponse.data.timezone)
    }
  }, [profileResponse])

  const handleThemeChange = (newTheme: 'light' | 'dark' | 'wallpaper') => {
    setTheme(newTheme)
    if (newTheme === 'wallpaper') {
        if (!profileResponse?.data?.wallpaperUrl && pendingWallpaper === null) {
           fileInputRef.current?.click()
        }
    }
  }

  const handleWallpaperUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setPendingWallpaper(file)
      setTheme('wallpaper')
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      if (pendingWallpaper === 'remove') {
          await deleteWallpaper().unwrap()
          if (theme === 'wallpaper') {
             await updateProfile({ theme: 'light', language, timezone }).unwrap()
             setTheme('light')
          } else {
             await updateProfile({ theme, language, timezone }).unwrap()
          }
      } else if (pendingWallpaper instanceof File && theme === 'wallpaper') {
        await updateWallpaper(pendingWallpaper).unwrap()
        await updateProfile({ language, timezone }).unwrap()
      } else {
        await updateProfile({ theme, language, timezone }).unwrap()
      }
      setPendingWallpaper(null)
      setSaved(true)

      const previousLang = profileResponse?.data?.language
      if (previousLang !== language) {
         if (language === 'English') {
            document.cookie = 'googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=' + window.location.hostname
            document.cookie = 'googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=localhost'
            document.cookie = 'googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
         }
         setTimeout(() => window.location.reload(), 400)
      } else {
         setTimeout(() => setSaved(false), 3000)
      }
    } catch (err) {
      console.error("Failed to save system settings", err)
      alert("Failed to save settings.")
    } finally {
      setIsSaving(false)
    }
  }

  const handleReset = async () => {
    setIsResetting(true)
    try {
      // Direct save to defaults
      await deleteWallpaper().unwrap()
      await updateProfile({ 
        theme: 'light', 
        language: 'English', 
        timezone: 'UTC+06:30 (Yangon)' 
      }).unwrap()

      // Handle language cookie if resetting from Burmese to English
      if (profileResponse?.data?.language !== 'English') {
        document.cookie = 'googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=' + window.location.hostname
        document.cookie = 'googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=localhost'
        document.cookie = 'googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
        window.location.reload()
      } else {
        setShowResetModal(false)
        setSaved(true)
        setTimeout(() => setSaved(false), 3000)
      }
    } catch (err) {
      console.error("Reset failed", err)
      alert("Failed to reset settings.")
    } finally {
      setIsResetting(false)
    }
  }

  return (
    <>
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
                  {/* Hidden file input for wallpaper */}
                  <input type="file" ref={fileInputRef} onChange={handleWallpaperUpload} accept="image/*" className="hidden" />
                  
                  {[
                    { id: 'light', name: 'Light Mode', icon: <Sun size={18} />, color: 'bg-white border-slate-200' },
                    { id: 'dark', name: 'Dark Mode', icon: <Moon size={18} />, color: 'bg-slate-900 border-slate-800 text-white' },
                    { id: 'wallpaper', name: 'Custom Wallpaper', icon: <ImageIcon size={18} />, color: 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700' }
                  ].map((t) => (
                    <button
                      key={t.id}
                      onClick={() => handleThemeChange(t.id as any)}
                      disabled={isUpdating || (isUploading && t.id === 'wallpaper')}
                      className={`relative flex flex-col items-center gap-3 p-4 rounded-2xl border-2 transition-all ${
                        theme === t.id 
                          ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-900/10 shadow-sm' 
                          : 'border-transparent bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <div className={`w-full aspect-video rounded-lg ${t.color} flex items-center justify-center mb-1 shadow-inner border transition-all ${(t.id === 'wallpaper' && pendingWallpaper !== 'remove' && (pendingWallpaper instanceof File || profileResponse?.data?.wallpaperUrl)) ? 'bg-cover bg-center' : ''}`}
                           style={t.id === 'wallpaper' && pendingWallpaper !== 'remove' && (pendingWallpaper instanceof File || profileResponse?.data?.wallpaperUrl) ? { backgroundImage: `linear-gradient(rgba(248, 250, 252, 0.40), rgba(248, 250, 252, 0.40)), url("${pendingWallpaper instanceof File ? URL.createObjectURL(pendingWallpaper) : profileResponse?.data?.wallpaperUrl}")` } : {}}
                      >
                         {(isUpdating || isUploading || isDeleting) && theme === t.id ? <Loader2 className="animate-spin text-blue-600" /> : t.icon}
                      </div>
                      <span className={`text-xs font-bold ${theme === t.id ? 'text-blue-700 dark:text-blue-400' : 'text-slate-600 dark:text-slate-400'}`}>{t.name}</span>
                      
                      {t.id === 'wallpaper' && (
                         <>
                           <div 
                             className="absolute top-2 left-2 w-6 h-6 bg-white dark:bg-slate-700 rounded-full flex items-center justify-center text-slate-500 shadow-sm border border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors z-10"
                             onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                             title="Upload new wallpaper"
                           >
                              <ImageIcon size={12} className="text-blue-600 dark:text-blue-400" />
                           </div>
                           {(pendingWallpaper !== 'remove' && (pendingWallpaper instanceof File || profileResponse?.data?.wallpaperUrl)) && (
                             <div 
                               className="absolute top-2 right-2 w-6 h-6 bg-red-50 dark:bg-red-900/40 rounded-full flex items-center justify-center text-red-500 shadow-sm border border-red-200 dark:border-red-800 hover:bg-red-100 dark:hover:bg-red-900/60 transition-colors z-10"
                               onClick={(e) => { e.stopPropagation(); setPendingWallpaper('remove'); }}
                               title="Remove wallpaper"
                             >
                                <Trash2 size={12} className="text-red-600 dark:text-red-400" />
                             </div>
                           )}
                         </>
                      )}
                    </button>
                  ))}
                </div>
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
                  </select>
               </div>

               <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest pl-1">Time Zone Preference</label>
                  <select 
                    value={timezone}
                    onChange={(e) => setTimezone(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-4 py-3 text-sm font-bold text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/50 transition-all appearance-none"
                  >
                     <option className="dark:bg-slate-900">UTC+06:30 (Yangon)</option>
                     <option className="dark:bg-slate-900">UTC+00:00 (GMT)</option>
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
             onClick={() => setShowResetModal(true)}
             className="px-6 py-3 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-2xl text-sm font-bold border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-all flex items-center gap-2 transform active:scale-95"
           >
              <RotateCcw size={18} />
              Reset to Defaults
           </button>
           <button 
             onClick={handleSave}
             disabled={isSaving}
             className="px-8 py-3 bg-blue-600 text-white rounded-2xl text-sm font-black shadow-lg shadow-blue-600/30 hover:shadow-xl hover:shadow-blue-600/40 hover:-translate-y-0.5 transition-all flex items-center gap-2 transform active:scale-95 disabled:opacity-50 disabled:hover:translate-y-0"
           >
              {isSaving ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <Save size={18} />
              )}
              Save Settings
           </button>
        </div>
      </div>
    </div>

    {/* Custom Reset Confirmation Modal */}
    {showResetModal && (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
        <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => !isResetting && setShowResetModal(false)} />
        <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-[2.5rem] shadow-2xl border border-white/20 relative z-10 overflow-hidden animate-in zoom-in-95 duration-300">
           <div className="p-8 pb-4 text-center">
              <div className="w-20 h-20 bg-amber-50 dark:bg-amber-900/30 text-amber-500 rounded-3xl flex items-center justify-center mx-auto mb-6 scale-110 shadow-inner">
                 <AlertTriangle size={40} strokeWidth={2.5} />
              </div>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight mb-2">Reset to Defaults?</h3>
              <p className="text-slate-500 dark:text-slate-400 font-medium text-sm leading-relaxed mb-6">
                Are you sure you want to revert all system settings to their original values? This cannot be undone.
              </p>
           </div>
           <div className="p-8 pt-4 flex flex-col gap-3">
              <button 
                onClick={handleReset}
                disabled={isResetting}
                className="w-full py-4 bg-red-600 hover:bg-red-700 text-white rounded-2xl font-black text-sm transition-all shadow-lg shadow-red-600/20 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                 {isResetting ? <Loader2 size={18} className="animate-spin" /> : <RotateCcw size={18} />}
                 Yes, Reset Everything
              </button>
              <button 
                onClick={() => setShowResetModal(false)}
                disabled={isResetting}
                className="w-full py-4 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-2xl font-black text-sm hover:bg-slate-100 dark:hover:bg-slate-700 transition-all active:scale-95 disabled:opacity-50"
              >
                 Cancel
              </button>
           </div>
           <button 
             onClick={() => !isResetting && setShowResetModal(false)}
             className="absolute top-6 right-6 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
           >
              <X size={20} />
           </button>
        </div>
      </div>
    )}
    </>
  )
}
