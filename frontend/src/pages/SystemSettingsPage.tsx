import { useState, useEffect, useRef } from 'react'
import { Monitor, Moon, Sun, Globe, Accessibility, Save, Loader2, Image as ImageIcon, Trash2, RotateCcw, Clock, AlertTriangle, X, Calendar, Info, CheckCircle2 } from 'lucide-react'
import axios from '../app/axiosInstance'
import { toast } from 'react-hot-toast'
import { useGetProfileQuery, useUpdateProfileMutation, useUpdateWallpaperMutation, useDeleteWallpaperMutation } from '../features/user/userApi'

export function SystemSettingsPage() {
  const { data: profileResponse } = useGetProfileQuery()
  const [updateProfile, { isLoading: isUpdating }] = useUpdateProfileMutation()
  const [updateWallpaper, { isLoading: isUploading }] = useUpdateWallpaperMutation()
  const [deleteWallpaper, { isLoading: isDeleting }] = useDeleteWallpaperMutation()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [theme, setTheme] = useState<'light' | 'dark' | 'wallpaper'>('light')
  const [timezone, setTimezone] = useState('UTC+06:30 (Yangon)')
  const [timeFormat, setTimeFormat] = useState('12h')
  const [compactMode, setCompactMode] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [pendingWallpaper, setPendingWallpaper] = useState<File | 'remove' | null>(null)
  const [currentTime, setCurrentTime] = useState(new Date())
  const [showResetModal, setShowResetModal] = useState(false)
  const [isResetting, setIsResetting] = useState(false)

  // Global Time Configuration States (HR Only)
  const [yearType, setYearType] = useState('Calendar Year')
  const [duration, setDuration] = useState('1 Year')
  const [customMonths, setCustomMonths] = useState(3)
  const [loadingGlobal, setLoadingGlobal] = useState(false)
  const userRole = profileResponse?.data?.role || ''
  const roleId = profileResponse?.data?.roleId
  const isHR = userRole === 'HR' || roleId === 1

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const formatTime = (date: Date, offsetHours: number, offsetMinutes: number = 0) => {
    const utc = date.getTime() + (date.getTimezoneOffset() * 60000)
    const newDate = new Date(utc + (3600000 * offsetHours) + (60000 * offsetMinutes))
    return newDate.toLocaleTimeString('en-US', { 
        hour12: timeFormat === '12h', 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit' 
    })
  }

  useEffect(() => {
    if (profileResponse?.data?.theme) {
      setTheme(profileResponse.data.theme as any)
    }
    if (profileResponse?.data?.timezone) {
      setTimezone(profileResponse.data.timezone)
    }
    if (profileResponse?.data?.timeFormat) {
      setTimeFormat(profileResponse.data.timeFormat)
    }

    if (isHR && !isSaving) {
      fetchGlobalTimeSettings()
    }
  }, [profileResponse, isHR])

  const fetchGlobalTimeSettings = async () => {
    try {
      setLoadingGlobal(true)
      const resp = await axios.get('/feedback/time-settings')
      if (resp.data.success && resp.data.data) {
        setYearType(resp.data.data.yearType)
        setDuration(resp.data.data.duration)
      }
    } catch (err) {
      console.error("Failed to load global time settings", err)
    } finally {
      setLoadingGlobal(false)
    }
  }

  const getAllCycles = () => {
    const isBudget = yearType === 'Budget Year'
    const durationMonths = duration.includes('Months') ? (parseInt(duration.split(' ')[0]) || 12) : 12
    const startMonth = isBudget ? 3 : 0 // April is 3, Jan is 0
    
// ... (omitting intermediate lines for brevity if tool allows, but I'll provide full block)
    const cycles = []
    const today = new Date()
    const currentYear = today.getFullYear()
    
    let orgYearStart = new Date(currentYear, startMonth, 1)
    if (isBudget && today < orgYearStart) {
      orgYearStart.setFullYear(currentYear - 1)
    }
    
    for (let i = 0; i < 12; i += durationMonths) {
      const cycleStart = new Date(orgYearStart)
      cycleStart.setMonth(orgYearStart.getMonth() + i)
      
      const cycleEnd = new Date(cycleStart)
      cycleEnd.setMonth(cycleStart.getMonth() + durationMonths)
      cycleEnd.setDate(0)
      
      const isCurrent = today >= cycleStart && today <= cycleEnd
      
      cycles.push({
        start: cycleStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        end: cycleEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        isCurrent
      })
      
      if (durationMonths >= 12) break
    }
    
    return cycles
  }

  const cycles = getAllCycles()

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
      // 1. Save Global Time Settings first (HR Only)
      if (isHR) {
        await axios.post('/feedback/time-settings', { yearType, duration })
      }

      // 2. Then save Personal Profile Settings
      if (pendingWallpaper === 'remove') {
          await deleteWallpaper().unwrap()
          if (theme === 'wallpaper') {
             await updateProfile({ theme: 'light', timezone, timeFormat }).unwrap()
             setTheme('light')
          } else {
             await updateProfile({ theme, timezone, timeFormat }).unwrap()
          }
      } else if (pendingWallpaper instanceof File && theme === 'wallpaper') {
        await updateWallpaper(pendingWallpaper).unwrap()
        await updateProfile({ timezone, timeFormat }).unwrap()
      } else {
        await updateProfile({ theme, timezone, timeFormat }).unwrap()
      }

      setPendingWallpaper(null)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err) {
      console.error("Failed to save system settings", err)
      toast.error("Failed to save settings.")
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
        timezone: 'UTC+06:30 (Yangon)',
        timeFormat: '12h' 
      }).unwrap()

      setShowResetModal(false)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
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

               <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest pl-1">Clock Display Format</label>
                  <select 
                    value={timeFormat}
                    onChange={(e) => setTimeFormat(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-4 py-3 text-sm font-bold text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/50 transition-all appearance-none"
                  >
                     <option className="dark:bg-slate-900" value="12h">12-Hour Clock (AM/PM)</option>
                     <option className="dark:bg-slate-900" value="24h">24-Hour Clock (Military)</option>
                  </select>
               </div>
            </div>
          </div>
        </div>

        {/* Global Time Configuration Section - visible only to HR */}
        {isHR && (
          <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden transition-all hover:shadow-md animate-in slide-in-from-bottom-4">
            <div className="p-8">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-xl flex items-center justify-center">
                  <Calendar size={20} />
                </div>
                <h2 className="text-lg font-black text-slate-900 dark:text-slate-200 tracking-tight">Time Settings Configuration <span className="ml-2 text-[10px] bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-400 px-2 py-0.5 rounded-full uppercase tracking-tighter">Global</span></h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest pl-1">Organization Year Type</label>
                    <div className="grid grid-cols-2 gap-3">
                      {['Budget Year', 'Calendar Year'].map((type) => (
                        <button
                          key={type}
                          onClick={() => setYearType(type)}
                          className={`p-4 rounded-xl border-2 text-left transition-all ${
                            yearType === type 
                              ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-900/10' 
                              : 'border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900'
                          }`}
                        >
                          <div className="font-bold text-xs text-slate-700 dark:text-slate-300">{type}</div>
                          <div className="text-[9px] uppercase font-black text-slate-400 dark:text-slate-500 tracking-tight mt-1">
                            {type === 'Budget Year' ? 'Apr 1 – Mar 31' : 'Jan 1 – Dec 31'}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest pl-1">Duration Cycle</label>
                    <div className="grid grid-cols-3 gap-3">
                      {['6 Months', '1 Year', 'Custom'].map((dur) => (
                        <button
                          key={dur}
                          onClick={() => {
                            if (dur === 'Custom') {
                              setDuration(`${customMonths} Months`)
                            } else {
                              setDuration(dur)
                            }
                          }}
                          className={`py-3 rounded-xl border-2 font-bold text-xs transition-all ${
                            (dur === 'Custom' && duration !== '6 Months' && duration !== '1 Year') || (duration === dur)
                              ? 'border-emerald-600 bg-emerald-600 text-white shadow-lg shadow-emerald-100 dark:shadow-none' 
                              : 'border-slate-100 dark:border-slate-800 text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800'
                          }`}
                        >
                          {dur}
                        </button>
                      ))}
                    </div>

                    {/* Custom input visible only when Custom is chosen */}
                    {(duration !== '6 Months' && duration !== '1 Year') && (
                      <div className="mt-3 flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                        <input 
                          type="number" 
                          min="1" 
                          max="12"
                          value={duration.includes('Months') && duration.split(' ')[0] !== '' ? duration.split(' ')[0] : ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val === '') {
                              setDuration(' Months');
                              return;
                            }
                            let num = parseInt(val);
                            if (isNaN(num)) return;
                            if (num > 12) num = 12;
                            if (num < 1) num = 1;
                            setDuration(`${num} Months`);
                          }}
                          onBlur={() => {
                            if (duration === ' Months' || parseInt(duration.split(' ')[0]) < 1) {
                              setDuration('1 Months');
                            }
                          }}
                          className="w-24 bg-slate-50 dark:bg-slate-800 border-2 border-emerald-500/30 rounded-xl px-4 py-2 text-sm font-bold text-slate-700 dark:text-slate-200 focus:border-emerald-500 outline-none transition-all"
                        />
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Months Range (1-12)</span>
                      </div>
                    )}
                  </div>
                </div>

                  <div className="flex flex-col justify-center">
                    <div className="bg-[#115e59] text-white p-8 rounded-3xl space-y-6 shadow-xl shadow-emerald-900/20 relative overflow-hidden">
                      {/* Decorative Background Element */}
                      <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 -mr-10 -mt-10 rounded-full blur-2xl" />
                      
                      <div className="flex items-center justify-between">
                         <div className="flex items-center gap-3">
                            <div className="p-2 bg-white/20 rounded-xl">
                               <Clock size={16} />
                            </div>
                            <div className="text-[10px] font-black uppercase tracking-widest">Active Cycle Summary</div>
                         </div>
                         <div className="text-[10px] bg-emerald-400/20 text-emerald-200 px-2 py-1 rounded-lg font-bold border border-emerald-400/20">
                            {yearType}
                         </div>
                      </div>

                      <div className="space-y-3 relative z-10">
                         {cycles.map((c, idx) => (
                           <div 
                             key={idx} 
                             className={`p-4 rounded-2xl transition-all duration-300 flex items-center justify-between border ${
                               c.isCurrent 
                               ? 'bg-white text-emerald-900 border-white shadow-lg scale-[1.02]' 
                               : 'bg-emerald-800/40 border-emerald-700/50 text-emerald-100/60'
                             }`}
                           >
                              <div className="flex flex-col">
                                 <span className={`text-[10px] font-black uppercase tracking-tighter ${c.isCurrent ? 'text-emerald-600' : 'text-emerald-400/50'}`}>
                                    Cycle {idx + 1}
                                 </span>
                                 <span className="text-sm font-black tracking-tight">{c.start} — {c.end}</span>
                              </div>
                              {c.isCurrent && (
                                <div className="flex items-center gap-1.5 bg-emerald-100 text-emerald-600 px-2.5 py-1 rounded-full animate-pulse">
                                   <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                                   <span className="text-[9px] font-black uppercase tracking-widest">Active Now</span>
                                </div>
                              )}
                           </div>
                         ))}
                      </div>
                    </div>
                  </div>
              </div>
            </div>
          </div>
        )}

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
