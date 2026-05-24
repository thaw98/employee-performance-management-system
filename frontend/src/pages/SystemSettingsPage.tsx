import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { Moon, Sun, Globe, Save, Loader2, Image as ImageIcon, Trash2, RotateCcw, AlertTriangle, X, Calendar, ChevronRight } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { useGetProfileQuery, useUpdateProfileMutation, useUpdateWallpaperMutation, useDeleteWallpaperMutation } from '../features/user/userApi'
import {
  applyLanguagePreference,
  isLanguageApplied,
  setGoogleTranslateWidgetVisible,
} from '../utils/googleTranslatePreference'


export function SystemSettingsPage() {
  const { data: profileResponse } = useGetProfileQuery()
  const [updateProfile, { isLoading: isUpdating }] = useUpdateProfileMutation()
  const [updateWallpaper, { isLoading: isUploading }] = useUpdateWallpaperMutation()
  const [deleteWallpaper, { isLoading: isDeleting }] = useDeleteWallpaperMutation()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const initialLanguageRef = useRef<'Myanmar' | 'English'>('English')
  const profileLanguageSyncedRef = useRef(false)

  const [theme, setTheme] = useState<'light' | 'dark' | 'wallpaper'>('light')
  const [language, setLanguage] = useState<'Myanmar' | 'English'>('English')
  const [timezone, setTimezone] = useState('UTC+06:30 (Yangon)')
  const [timeFormat, setTimeFormat] = useState('12h')
  const [isSaving, setIsSaving] = useState(false)
  const [pendingWallpaper, setPendingWallpaper] = useState<File | 'remove' | null>(null)
  const [showResetModal, setShowResetModal] = useState(false)
  const [isResetting, setIsResetting] = useState(false)

  const isHR = profileResponse?.data?.role === 'HR'

  useEffect(() => {
    if (profileResponse?.data?.theme) {
      setTheme(profileResponse.data.theme as any)
    }
    if (profileResponse?.data?.language && !profileLanguageSyncedRef.current) {
      const profileLanguage = profileResponse.data.language.toLowerCase().includes('myanmar') || profileResponse.data.language.toLowerCase().includes('burmese')
        ? 'Myanmar'
        : 'English'
      setLanguage(profileLanguage)
      initialLanguageRef.current = profileLanguage
      profileLanguageSyncedRef.current = true
    }
    if (profileResponse?.data?.timezone) {
      setTimezone(profileResponse.data.timezone)
    }
    if (profileResponse?.data?.timeFormat) {
      setTimeFormat(profileResponse.data.timeFormat)
    }
  }, [profileResponse])

  useEffect(() => {
    setGoogleTranslateWidgetVisible(false)
  }, [])

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
      const languageChanged = language !== initialLanguageRef.current
      const needsLanguageApply = languageChanged || !isLanguageApplied(language)

      if (pendingWallpaper === 'remove') {
          await deleteWallpaper().unwrap()
          if (theme === 'wallpaper') {
             await updateProfile({ theme: 'light', language, timezone, timeFormat }).unwrap()
             setTheme('light')
          } else {
             await updateProfile({ theme, language, timezone, timeFormat }).unwrap()
          }
      } else if (pendingWallpaper instanceof File && theme === 'wallpaper') {
        await updateWallpaper(pendingWallpaper).unwrap()
        await updateProfile({ language, timezone, timeFormat }).unwrap()
      } else {
        await updateProfile({ theme, language, timezone, timeFormat }).unwrap()
      }

      setPendingWallpaper(null)
      initialLanguageRef.current = language
      toast.success('Changes saved!')
      if (needsLanguageApply) {
        applyLanguagePreference(language, { reload: true })
      }
    } catch (err: any) {
      console.error("Failed to save system settings", err)
      const message = err?.response?.data?.message || 'Failed to save settings.'
      toast.error(message)
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
        timezone: 'UTC+06:30 (Yangon)',
        timeFormat: '12h' 
      }).unwrap()

      setShowResetModal(false)
      initialLanguageRef.current = 'English'
      setLanguage('English')
      toast.success('Changes saved!')
      applyLanguagePreference('English', { reload: true })
    } catch (err) {
      console.error("Reset failed", err)
      toast.error('Failed to reset settings.')
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

        {/* Language and Region Section */}
        <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden transition-all hover:shadow-md">
          <div className="p-8">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-xl flex items-center justify-center">
                <Globe size={20} />
              </div>
              <h2 className="text-lg font-black text-slate-900 dark:text-slate-200 tracking-tight">Language and Region</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
               <div className="space-y-2 notranslate" translate="no">
                  <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest pl-1">Language</label>
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value as 'Myanmar' | 'English')}
                    className="notranslate w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-4 py-3 text-sm font-bold text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/50 transition-all appearance-none"
                  >
                     <option className="dark:bg-slate-900 notranslate" value="Myanmar">Myanmar</option>
                     <option className="dark:bg-slate-900 notranslate" value="English">English</option>
                  </select>
                  <p className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 leading-relaxed">
                    Applies across the application after you click Save Settings.
                  </p>
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
        {isHR && (
          <Link
            to="/hr/settings/system/time"
            className="block bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden transition-all hover:shadow-md hover:border-[#2463eb]/30 dark:hover:border-[#2463eb]/40 group"
          >
                        <div className="p-8 flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-[#dbeafe] dark:bg-[#2463eb]/20 text-[#2463eb] dark:text-[#60a5fa] rounded-xl flex items-center justify-center">
                  <Calendar size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-black text-slate-900 dark:text-slate-200 tracking-tight">Time Settings</h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                    Configure organization year type, review cycles, and duration.
                  </p>
                </div>
              </div>
              <ChevronRight size={20} className="text-slate-300 group-hover:text-[#2463eb] transition-colors" />
            </div>
          </Link>
        )}

        {/* Action Bar */}
        <div className="pt-6 flex justify-end gap-3">
           <button 
             onClick={() => setShowResetModal(true)}
             className="px-6 py-3 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-2xl text-sm font-bold border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-all flex items-center gap-2 transform active:scale-95"
           >
              <RotateCcw size={18} />
              Reset to Defaults
           </button>
           <button 
             onClick={() => handleSave()}
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
