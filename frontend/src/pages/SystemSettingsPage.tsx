import { useState, useEffect, useRef, useMemo } from 'react'
import { Moon, Sun, Globe, Save, Loader2, Image as ImageIcon, Trash2, RotateCcw, Clock, AlertTriangle, X, Calendar } from 'lucide-react'
import axios from '../app/axiosInstance'
import { toast } from 'react-hot-toast'
import { useGetProfileQuery, useUpdateProfileMutation, useUpdateWallpaperMutation, useDeleteWallpaperMutation } from '../features/user/userApi'

type ReviewCycle = {
  id: number | null
  name: string
  cycleType: string
  yearLabel: string
  sequenceNo: number
  startDate: string
  endDate: string
  requiresEmployeeSubmission: boolean
  rollupMethod: string | null
  status: 'UPCOMING' | 'ACTIVE' | 'COMPLETED' | string
  isActive: boolean
}

export function SystemSettingsPage() {
  const { data: profileResponse } = useGetProfileQuery()
  const [updateProfile, { isLoading: isUpdating }] = useUpdateProfileMutation()
  const [updateWallpaper, { isLoading: isUploading }] = useUpdateWallpaperMutation()
  const [deleteWallpaper, { isLoading: isDeleting }] = useDeleteWallpaperMutation()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [theme, setTheme] = useState<'light' | 'dark' | 'wallpaper'>('light')
  const [timezone, setTimezone] = useState('UTC+06:30 (Yangon)')
  const [timeFormat, setTimeFormat] = useState('12h')
  const [isSaving, setIsSaving] = useState(false)
  const [pendingWallpaper, setPendingWallpaper] = useState<File | 'remove' | null>(null)
  const [showResetModal, setShowResetModal] = useState(false)
  const [isResetting, setIsResetting] = useState(false)

  // Global Time Configuration States (HR Only)
  const [yearType, setYearType] = useState('Calendar Year')
  const [appliedYearType, setAppliedYearType] = useState('Calendar Year')
  const [pendingYearType, setPendingYearType] = useState<string | null>(null)
  const [settingsStartDate, setSettingsStartDate] = useState<string | null>(null)
  const [duration, setDuration] = useState('1 Year')
  const [loadingGlobal, setLoadingGlobal] = useState(false)
  const [cyclePreview, setCyclePreview] = useState<ReviewCycle[]>([])
  const [showSaveModal, setShowSaveModal] = useState(false)
  const isHR = profileResponse?.data?.role === 'HR'

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

    if (isHR) {
      fetchGlobalTimeSettings()
    }
  }, [profileResponse, isHR])

  const fetchGlobalTimeSettings = async () => {
    try {
      setLoadingGlobal(true)
      const resp = await axios.get('/feedback/time-settings')
      if (resp.data.success) {
        setYearType(resp.data.data.yearType)
        setAppliedYearType(resp.data.data.yearType)
        setPendingYearType(resp.data.data.pendingYearType ?? null)
        setSettingsStartDate(resp.data.data.startDate ?? null)
        const savedDuration = resp.data.data.duration
        setDuration(savedDuration === 'Both' ? '6 Months' : savedDuration)
      }
      await fetchCyclePreview()
    } catch (err) {
      console.error("Failed to load global time settings", err)
    } finally {
      setLoadingGlobal(false)
    }
  }

  const fetchCyclePreview = async () => {
    const resp = await axios.get('/review-cycles/current-year/preview')
    if (resp.data.success) {
      setCyclePreview(resp.data.data)
    }
  }

  const getPeriodType = () => {
    if (duration === 'Both') return 'SEMI_ANNUAL'
    if (duration === '6 Months') return 'SEMI_ANNUAL'
    if (duration === '1 Year') return 'ANNUAL'
    return null
  }

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

      if (isHR) {
        const resp = await axios.post('/feedback/time-settings', { yearType, duration, periodType: getPeriodType() })
        if (resp.data.success) {
          setYearType(resp.data.data.yearType)
          setAppliedYearType(resp.data.data.yearType)
          setPendingYearType(resp.data.data.pendingYearType ?? null)
          setSettingsStartDate(resp.data.data.startDate ?? null)
          const savedDuration = resp.data.data.duration
          setDuration(savedDuration === 'Both' ? '6 Months' : savedDuration)
        }
        await fetchCyclePreview()
      }

      setPendingWallpaper(null)
      toast.success(isHR ? 'Settings saved. Current duration is applied and future year type is queued when needed.' : 'Changes saved!')
    } catch (err: any) {
      console.error("Failed to save system settings", err)
      const message = err?.response?.data?.message || 'Failed to save settings.'
      toast.error(message)
    } finally {
      setIsSaving(false)
      setShowSaveModal(false)
    }
  }

  const formatDate = (value: string) => new Date(`${value}T00:00:00`).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).replace(',', '')

  const getDisplayStatus = (cycle: ReviewCycle): 'UPCOMING' | 'ACTIVE' | 'COMPLETED' => {
    const rawStatus = String(cycle.status ?? '').toUpperCase()
    if (rawStatus === 'UPCOMING' || rawStatus === 'ACTIVE' || rawStatus === 'COMPLETED') {
      return rawStatus
    }

    const today = new Date()
    const todayDateOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    const start = new Date(`${cycle.startDate}T00:00:00`)
    const end = new Date(`${cycle.endDate}T00:00:00`)

    if (todayDateOnly < start) return 'UPCOMING'
    if (todayDateOnly > end) return 'COMPLETED'
    return 'ACTIVE'
  }

  const buildLocalCyclePreview = (selectedYearType: string, selectedDuration: string): ReviewCycle[] => {
    const today = new Date()
    const todayDateOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate())

    const currentCycleStarted = settingsStartDate
      ? todayDateOnly >= new Date(`${settingsStartDate}T00:00:00`)
      : true
    const previewYearType = currentCycleStarted ? appliedYearType : selectedYearType

    const getCurrentYearStart = () => {
      if (currentCycleStarted && settingsStartDate) {
        return new Date(`${settingsStartDate}T00:00:00`)
      }
      if (previewYearType === 'Budget Year') {
        const aprFirst = new Date(todayDateOnly.getFullYear(), 3, 1)
        return todayDateOnly < aprFirst
          ? new Date(todayDateOnly.getFullYear() - 1, 3, 1)
          : aprFirst
      }
      return new Date(todayDateOnly.getFullYear(), 0, 1)
    }

    const start = getCurrentYearStart()
    const monthsForEnd = selectedDuration.includes('Months')
      ? Math.max(1, Math.min(12, Number.parseInt(selectedDuration.split(' ')[0] ?? '12', 10) || 12))
      : 12
    const end = selectedDuration.includes('Months')
      ? new Date(start.getFullYear(), start.getMonth() + monthsForEnd, start.getDate() - 1)
      : new Date(start.getFullYear() + 1, start.getMonth(), start.getDate() - 1)
    const yearLabel = previewYearType === 'Budget Year'
      ? `${start.getFullYear()}-${start.getFullYear() + 1}`
      : `${start.getFullYear()}`

    const parseMonths = () => {
      if (!selectedDuration.includes('Months')) return 12
      const parsed = Number.parseInt(selectedDuration.split(' ')[0] ?? '', 10)
      if (Number.isNaN(parsed)) return 12
      return Math.max(1, Math.min(12, parsed))
    }

    const getStatus = (s: Date, e: Date): ReviewCycle['status'] => {
      if (todayDateOnly < s) return 'UPCOMING'
      if (todayDateOnly > e) return 'COMPLETED'
      return 'ACTIVE'
    }

    const toISODate = (d: Date) => {
      const year = d.getFullYear()
      const month = String(d.getMonth() + 1).padStart(2, '0')
      const day = String(d.getDate()).padStart(2, '0')
      return `${year}-${month}-${day}`
    }
    const hasChildren = selectedDuration !== '1 Year'
    const baseCycles: ReviewCycle[] = []
    const annualStatus = getStatus(start, end)

    baseCycles.push({
      id: null,
      name: `Annual Cycle ${start.getMonth() === 0 ? start.getFullYear() : yearLabel}`,
      cycleType: 'ANNUAL',
      yearLabel,
      sequenceNo: 0,
      startDate: toISODate(start),
      endDate: toISODate(end),
      requiresEmployeeSubmission: !hasChildren,
      rollupMethod: 'AVERAGE',
      status: annualStatus,
      isActive: annualStatus === 'ACTIVE',
    })

    if (selectedDuration === '1 Year') {
      return baseCycles
    }

    const months = parseMonths()
    const childCount = Math.max(1, Math.ceil(12 / months))
    const children: ReviewCycle[] = []

    for (let i = 0; i < childCount; i += 1) {
      const childStart = new Date(start.getFullYear(), start.getMonth() + (i * months), start.getDate())
      let childEnd = new Date(childStart.getFullYear(), childStart.getMonth() + months, childStart.getDate() - 1)
      if (childEnd > end) childEnd = end

      const status = getStatus(childStart, childEnd)
      const cycleType = months === 3 ? 'QUARTERLY' : months === 6 ? 'SEMI_ANNUAL' : 'CUSTOM'
      const name = (months === 3 || months === 6)
        ? `Q${i + 1} ${yearLabel}`
        : `Cycle ${i + 1} ${yearLabel}`

      children.push({
        id: null,
        name,
        cycleType,
        yearLabel,
        sequenceNo: i + 1,
        startDate: toISODate(childStart),
        endDate: toISODate(childEnd),
        requiresEmployeeSubmission: true,
        rollupMethod: null,
        status,
        isActive: status === 'ACTIVE',
      })

      if (childEnd >= end) break
    }

    return [...baseCycles, ...children]
  }

  const cycles = useMemo(() => {
    if (loadingGlobal && cyclePreview.length > 0) {
      return cyclePreview
    }
    return buildLocalCyclePreview(yearType, duration)
  }, [yearType, duration, loadingGlobal, cyclePreview, appliedYearType, settingsStartDate])

  const displayCycles = useMemo(() => {
    if (cycles.length === 0) return cycles
    if (cycles.some((cycle) => getDisplayStatus(cycle) === 'UPCOMING')) return cycles

    const sorted = [...cycles].sort((a, b) => {
      const aEnd = new Date(`${a.endDate}T00:00:00`).getTime()
      const bEnd = new Date(`${b.endDate}T00:00:00`).getTime()
      return aEnd - bEnd
    })

    const baseCycle =
      [...sorted].reverse().find((c) => c.requiresEmployeeSubmission) ??
      sorted[sorted.length - 1]

    if (!baseCycle) return cycles

    const baseStart = new Date(`${baseCycle.startDate}T00:00:00`)
    const baseEnd = new Date(`${baseCycle.endDate}T00:00:00`)
    const oneDayMs = 24 * 60 * 60 * 1000
    const spanMs = Math.max(oneDayMs, baseEnd.getTime() - baseStart.getTime() + oneDayMs)
    const nextStart = new Date(baseEnd.getTime() + oneDayMs)
    const nextEnd = new Date(nextStart.getTime() + spanMs - oneDayMs)
    const toISODate = (d: Date) => d.toISOString().slice(0, 10)

    const qMatch = baseCycle.name.match(/^Q(\d+)\s+(.+)$/i)
    const nextName = qMatch
      ? `Q${Number(qMatch[1]) + 1} ${qMatch[2]}`
      : `Next ${baseCycle.name}`

    const syntheticUpcoming: ReviewCycle = {
      ...baseCycle,
      id: null,
      sequenceNo: (baseCycle.sequenceNo ?? 0) + 1,
      name: nextName,
      startDate: toISODate(nextStart),
      endDate: toISODate(nextEnd),
      status: 'UPCOMING',
      isActive: false,
    }

    return [...cycles, syntheticUpcoming]
  }, [cycles])

  const savedCycleStarted = settingsStartDate
    ? new Date() >= new Date(`${settingsStartDate}T00:00:00`)
    : true
  const yearTypeWillBePending = isHR && yearType !== appliedYearType && savedCycleStarted

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
      toast.success('Changes saved!')
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
                  {loadingGlobal ? <Loader2 size={20} className="animate-spin" /> : <Calendar size={20} />}
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
                    {(yearTypeWillBePending || pendingYearType) && (
                      <p className="text-[11px] font-bold text-amber-600 dark:text-amber-400 pl-1">
                        Pending for next cycle: {yearTypeWillBePending ? yearType : pendingYearType}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest pl-1">Duration Cycle</label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {['6 Months', '1 Year', 'Custom'].map((dur) => (
                        <button
                          key={dur}
                          onClick={() => {
                            if (dur === 'Custom') {
                              setDuration('3 Months')
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
                      
                      <div className="flex items-center">
                         <div className="flex items-center gap-3">
                            <div className="p-2 bg-white/20 rounded-xl">
                               <Clock size={16} />
                            </div>
                            <div className="text-[10px] font-black uppercase tracking-widest">Review Cycles</div>
                         </div>
                      </div>

                      <div className="space-y-3 relative z-10">
                         {displayCycles.map((c, idx) => {
                           const displayStatus = getDisplayStatus(c)

                           return (
                           <div
                             key={idx} 
                             className={`p-4 rounded-2xl transition-all duration-300 flex items-center justify-between border ${
                               displayStatus === 'ACTIVE'
                               ? 'bg-white text-emerald-900 border-white shadow-lg scale-[1.02]'
                               : displayStatus === 'UPCOMING'
                               ? 'bg-emerald-950/35 border-emerald-500/20 text-emerald-100/75 backdrop-blur-[1px]'
                               : 'bg-emerald-800/40 border-emerald-700/50 text-emerald-100/60'
                             }`}
                           >
                              <div className="flex flex-col">
                                 <span className={`text-[10px] font-black uppercase tracking-tighter ${
                                   displayStatus === 'ACTIVE'
                                     ? 'text-emerald-600'
                                     : displayStatus === 'UPCOMING'
                                     ? 'text-emerald-300/55'
                                     : 'text-emerald-400/50'
                                 }`}>
                                    {c.name}
                                 </span>
                                 <span className={`text-sm font-black tracking-tight ${displayStatus === 'UPCOMING' ? 'text-emerald-100/75' : ''}`}>
                                   {formatDate(c.startDate)} - {formatDate(c.endDate)}
                                 </span>
                                 <span className={`text-[9px] font-black uppercase tracking-widest ${displayStatus === 'UPCOMING' ? 'text-emerald-200/45' : 'opacity-70'}`}>
                                   {c.requiresEmployeeSubmission ? 'Employee submission' : 'Annual roll-up'} - {c.cycleType}
                                 </span>
                              </div>
                              <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full ${
                                displayStatus === 'ACTIVE' ? 'bg-emerald-100 text-emerald-600' :
                                displayStatus === 'UPCOMING' ? 'bg-sky-50 text-sky-700 shadow-sm' : 'bg-slate-100 text-slate-500'
                              }`}>
                                 <div className={`w-1.5 h-1.5 rounded-full ${
                                   displayStatus === 'ACTIVE' ? 'bg-emerald-500' :
                                   displayStatus === 'UPCOMING' ? 'bg-sky-500' : 'bg-slate-400'
                                 }`} />
                                 <span className="text-[9px] font-black uppercase tracking-widest">{displayStatus}</span>
                              </div>
                           </div>
                         )})}
                         {displayCycles.length === 0 && (
                           <div className="p-4 rounded-2xl bg-emerald-800/40 border border-emerald-700/50 text-emerald-100/70 text-xs font-bold">
                             Save time settings to refresh the API preview.
                           </div>
                         )}
                      </div>
                    </div>
                  </div>
              </div>
            </div>
          </div>
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
             onClick={() => isHR ? setShowSaveModal(true) : handleSave()}
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

    {showSaveModal && (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
        <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => !isSaving && setShowSaveModal(false)} />
        <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-[2.5rem] shadow-2xl border border-white/20 relative z-10 overflow-hidden animate-in zoom-in-95 duration-300">
          <div className="p-8 pb-4 text-center">
            <div className="w-20 h-20 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-500 rounded-3xl flex items-center justify-center mx-auto mb-6 scale-110 shadow-inner">
              <Calendar size={40} strokeWidth={2.5} />
            </div>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight mb-2">Save Time Settings?</h3>
            <p className="text-slate-500 dark:text-slate-400 font-medium text-sm leading-relaxed mb-6">
              Duration changes apply to the current cycle after save. {yearTypeWillBePending ? `${yearType} will be queued for the next generated cycle.` : 'The selected year type will be saved with the current rules.'}
            </p>
          </div>
          <div className="p-8 pt-4 flex flex-col gap-3">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black text-sm transition-all shadow-lg shadow-emerald-600/20 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
              Confirm Save
            </button>
            <button
              onClick={() => setShowSaveModal(false)}
              disabled={isSaving}
              className="w-full py-4 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-2xl font-black text-sm hover:bg-slate-100 dark:hover:bg-slate-700 transition-all active:scale-95 disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
          <button
            onClick={() => !isSaving && setShowSaveModal(false)}
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
