import React, { useState, useRef, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import SignatureCanvas from 'react-signature-canvas'
import { useGetProfileQuery, useUpdateProfilePictureMutation, useUpdateProfileMutation, useDeleteProfilePictureMutation, useGetDefaultSignatureQuery, useSaveDrawnSignatureMutation, useUploadSignatureMutation } from '../features/user/userApi'
import { resolveMediaSrc, resolveProfilePictureSrc } from '../utils/mediaUrl'
import { User, Mail, Shield, BadgeCheck, Hash, Camera, Lock, Loader2, Save, Trash2, PenLine, Upload, Image as ImageIcon, RotateCcw } from 'lucide-react'

function getErrorMessage(error: unknown, fallback: string): string {
  if (typeof error === 'object' && error !== null && 'data' in error) {
    const data = (error as { data?: { message?: unknown } }).data
    if (typeof data?.message === 'string' && data.message.trim()) {
      return data.message
    }
  }
  return fallback
}

export function ProfileSettingsPage() {
  const { data: profileResponse, isLoading } = useGetProfileQuery()
  const { data: signatureResponse, isLoading: isLoadingSignature } = useGetDefaultSignatureQuery()
  const [updateProfilePicture, { isLoading: isUpdatingPic }] = useUpdateProfilePictureMutation()
  const [deleteProfilePicture, { isLoading: isDeletingPic }] = useDeleteProfilePictureMutation()
  const [updateProfile, { isLoading: isSaving }] = useUpdateProfileMutation()
  const [saveDrawnSignature, { isLoading: isSavingDrawnSignature }] = useSaveDrawnSignatureMutation()
  const [uploadSignature, { isLoading: isUploadingSignature }] = useUploadSignatureMutation()

  const user = profileResponse?.data || null
  const pictureSrc = resolveProfilePictureSrc(user?.profilePictureUrl)
  const defaultSignature = signatureResponse?.data || null
  const defaultSignatureSrc = resolveMediaSrc(defaultSignature?.signatureData)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const signatureCanvasRef = useRef<SignatureCanvas | null>(null)
  const signatureFileInputRef = useRef<HTMLInputElement>(null)

  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [signatureMessage, setSignatureMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [signatureMode, setSignatureMode] = useState<'draw' | 'upload'>('draw')
  const [signatureFile, setSignatureFile] = useState<File | null>(null)
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: ''
  })

  const [pendingPicture, setPendingPicture] = useState<File | 'remove' | null>(null)
  const displaySrc = pendingPicture === 'remove' ? null : (pendingPicture ? URL.createObjectURL(pendingPicture) : pictureSrc)
  const isProcessActive = isUpdatingPic || isDeletingPic || isSaving
  const isSignatureSaving = isSavingDrawnSignature || isUploadingSignature
  const signaturePreview = useMemo(() => signatureFile ? URL.createObjectURL(signatureFile) : null, [signatureFile])

  useEffect(() => {
    if (user) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFormData({
        name: user.name || '',
        email: user.email || ''
      })
    }
  }, [user])

  useEffect(() => {
    if (!signaturePreview) return
    return () => URL.revokeObjectURL(signaturePreview)
  }, [signaturePreview])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'Image size exceeds 5MB' })
      return
    }

    setPendingPicture(file)
    setMessage(null)
  }

  const handleRemovePicture = () => {
    setPendingPicture('remove')
    setMessage(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setMessage(null)
      await updateProfile({ name: formData.name }).unwrap()
      
      if (pendingPicture === 'remove') {
         await deleteProfilePicture().unwrap()
      } else if (pendingPicture) {
         await updateProfilePicture(pendingPicture).unwrap()
      }
      
      setPendingPicture(null)
      setMessage({ type: 'success', text: 'Profile updated successfully!' })
      setTimeout(() => setMessage(null), 3000)
    } catch (err: unknown) {
      setMessage({ type: 'error', text: getErrorMessage(err, 'Failed to save changes') })
    }
  }

  const handleSignatureFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setSignatureMessage({ type: 'error', text: 'Please choose an image file.' })
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setSignatureMessage({ type: 'error', text: 'Signature image size exceeds 5MB.' })
      return
    }

    setSignatureFile(file)
    setSignatureMessage(null)
  }

  const handleClearSignatureCanvas = () => {
    signatureCanvasRef.current?.clear()
    setSignatureMessage(null)
  }

  const handleSaveDrawnSignature = async () => {
    try {
      setSignatureMessage(null)
      if (!signatureCanvasRef.current || signatureCanvasRef.current.isEmpty()) {
        setSignatureMessage({ type: 'error', text: 'Draw your signature before saving.' })
        return
      }
      const dataUrl = signatureCanvasRef.current.getTrimmedCanvas().toDataURL('image/png')
      await saveDrawnSignature(dataUrl).unwrap()
      signatureCanvasRef.current.clear()
      setSignatureMessage({ type: 'success', text: 'Default signature saved.' })
    } catch (err: unknown) {
      setSignatureMessage({ type: 'error', text: getErrorMessage(err, 'Failed to save signature.') })
    }
  }

  const handleSaveUploadedSignature = async () => {
    try {
      setSignatureMessage(null)
      if (!signatureFile) {
        setSignatureMessage({ type: 'error', text: 'Choose a signature image before saving.' })
        return
      }
      await uploadSignature(signatureFile).unwrap()
      setSignatureFile(null)
      if (signatureFileInputRef.current) {
        signatureFileInputRef.current.value = ''
      }
      setSignatureMessage({ type: 'success', text: 'Default signature uploaded.' })
    } catch (err: unknown) {
      setSignatureMessage({ type: 'error', text: getErrorMessage(err, 'Failed to upload signature.') })
    }
  }

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto py-16 px-4 flex justify-center items-center">
        <div className="animate-pulse flex flex-col items-center gap-6">
          <div className="h-24 w-24 bg-slate-200 rounded-full"></div>
          <div className="space-y-3">
             <div className="h-4 w-48 bg-slate-200 rounded"></div>
             <div className="h-3 w-32 bg-slate-200 rounded mx-auto"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8 animate-in fade-in duration-500">
      <div className="mb-10">
        <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Account Settings</h1>
        <p className="mt-2 text-sm font-medium text-slate-500 dark:text-slate-400">
          Manage your professional profile and authentication preferences.
        </p>
      </div>

      {message && (
        <div className={`mb-8 p-4 rounded-2xl flex items-center gap-3 text-sm font-bold animate-in slide-in-from-top-4 duration-300 ${
          message.type === 'success' 
            ? 'bg-emerald-50 text-emerald-700 border border-emerald-100 shadow-sm shadow-emerald-100/50' 
            : 'bg-red-50 text-red-700 border border-red-100 shadow-sm shadow-red-100/50'
        }`}>
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
            message.type === 'success' ? 'bg-emerald-100' : 'bg-red-100'
          }`}>
             <BadgeCheck size={18} />
          </div>
          {message.text}
        </div>
      )}

      <div className="space-y-8">
        {/* Profile Card */}
        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden transition-all hover:shadow-xl hover:border-blue-50 dark:hover:border-blue-900/30">
          <div className="p-8 sm:p-10 flex flex-col md:flex-row items-center gap-8 border-b border-slate-50 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-800/10">
            <div className="relative group">
              <input
                type="file"
                accept="image/*"
                className="hidden"
                ref={fileInputRef}
                onChange={handleFileChange}
              />
              <div
                onClick={() => !isProcessActive && fileInputRef.current?.click()}
                className={`h-32 w-32 rounded-[2.5rem] bg-blue-100 text-blue-700 flex flex-shrink-0 items-center justify-center text-5xl font-black border-4 border-white shadow-xl overflow-hidden transition-all transform group-hover:scale-105 
                  ${isProcessActive ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
              >
                {displaySrc ? (
                  <img src={displaySrc} alt="Profile" className="h-full w-full object-cover" />
                ) : (
                  user?.name?.charAt(0).toUpperCase() || 'U'
                )}
              </div>
              {!isProcessActive && (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute inset-0 rounded-[2.5rem] bg-slate-900/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all cursor-pointer backdrop-blur-[2px]"
                >
                  <Camera className="text-white" size={32} />
                </div>
              )}
              {isProcessActive && (
                <div className="absolute inset-0 rounded-[2.5rem] bg-white/60 flex items-center justify-center backdrop-blur-sm">
                  <Loader2 className="animate-spin text-blue-700" size={32} />
                </div>
              )}
            </div>

            <div className="flex-1 text-center md:text-left space-y-2">
              <div className="flex flex-col md:flex-row md:items-center gap-3">
                 <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">{user?.name}</h2>
                 <span className="inline-flex px-3 py-1 bg-blue-600 text-white rounded-full text-[10px] font-black uppercase tracking-widest mx-auto md:mx-0 shadow-lg shadow-blue-500/20">
                    {user?.role}
                 </span>
              </div>
              <p className="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center justify-center md:justify-start gap-2">
                 <Mail size={14} className="text-slate-300 dark:text-slate-600" />
                 {user?.email}
              </p>
              <div className="pt-2 flex flex-wrap justify-center md:justify-start gap-2">
                 <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isProcessActive}
                    className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-black shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700 hover:border-blue-200 dark:hover:border-blue-600 transition-all disabled:opacity-50"
                 >
                    Update Photo
                 </button>
                 <button 
                    type="button"
                    onClick={handleRemovePicture}
                    disabled={isProcessActive || !displaySrc}
                    className="px-4 py-2 bg-white dark:bg-slate-800 border border-red-100 dark:border-red-900/30 text-red-500 dark:text-red-400 rounded-xl text-xs font-black shadow-sm hover:bg-red-50 dark:hover:bg-red-900/20 transition-all flex items-center gap-2 disabled:opacity-50"
                 >
                    <Trash2 size={14} />
                    Remove
                 </button>
              </div>
            </div>
          </div>

          <div className="p-8 sm:p-10">
            <form onSubmit={handleSubmit} className="space-y-8">
               <div className="flex items-center gap-3 mb-2">
                  <User size={18} className="text-blue-600 dark:text-blue-400" />
                  <h3 className="text-sm font-black text-slate-900 dark:text-slate-200 uppercase tracking-widest">Personal Details</h3>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                     <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest pl-1">Display Name</label>
                     <div className="relative group">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 dark:text-slate-600 group-focus-within:text-blue-500 transition-colors" size={18} />
                        <input
                           type="text"
                           value={formData.name}
                           onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                           className="w-full bg-slate-50 dark:bg-slate-800/50 border-2 border-transparent rounded-[1.25rem] pl-12 pr-4 py-4 text-sm font-bold text-slate-700 dark:text-slate-200 focus:bg-white dark:focus:bg-slate-800 focus:border-blue-100 dark:focus:border-blue-900/30 focus:ring-4 focus:ring-blue-50 dark:focus:ring-blue-900/10 transition-all"
                           placeholder="Enter your full name"
                           required
                        />
                     </div>
                  </div>

                  <div className="space-y-2 opacity-60 grayscale-[0.5]">
                     <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest pl-1">Email Address (Read-only)</label>
                     <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 dark:text-slate-600" size={18} />
                        <input
                           type="email"
                           value={formData.email}
                           className="w-full bg-slate-50 dark:bg-slate-800/50 border-2 border-slate-100 dark:border-slate-700 rounded-[1.25rem] pl-12 pr-4 py-4 text-sm font-bold text-slate-400 dark:text-slate-500 cursor-not-allowed"
                           readOnly
                        />
                     </div>
                  </div>

                  <div className="space-y-2 opacity-60">
                     <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest pl-1">Designation</label>
                     <div className="relative">
                        <Shield className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 dark:text-slate-600" size={18} />
                        <input
                           type="text"
                           value={user?.role || ''}
                           className="w-full bg-slate-50 dark:bg-slate-800/50 border-2 border-slate-100 dark:border-slate-700 rounded-[1.25rem] pl-12 pr-4 py-4 text-sm font-bold text-slate-400 dark:text-slate-500 cursor-not-allowed uppercase"
                           readOnly
                        />
                     </div>
                  </div>

                  <div className="space-y-2 opacity-60">
                     <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest pl-1">Employee ID</label>
                     <div className="relative">
                        <Hash className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 dark:text-slate-600" size={18} />
                        <input
                           type="text"
                           value={user?.employeeId || ''}
                           className="w-full bg-slate-50 dark:bg-slate-800/50 border-2 border-slate-100 dark:border-slate-700 rounded-[1.25rem] pl-12 pr-4 py-4 text-sm font-bold text-slate-400 dark:text-slate-500 cursor-not-allowed"
                           readOnly
                        />
                     </div>
                  </div>
               </div>

               <div className="pt-4 flex justify-end">
                  <button
                     type="submit"
                     disabled={isProcessActive}
                     className="px-8 py-3 bg-blue-600 text-white rounded-2xl text-sm font-black shadow-lg shadow-blue-600/30 hover:shadow-xl hover:shadow-blue-600/40 hover:-translate-y-0.5 transition-all flex items-center gap-2 disabled:opacity-50 disabled:hover:translate-y-0"
                  >
                     {isProcessActive ? (
                        <Loader2 size={18} className="animate-spin" />
                     ) : (
                        <Save size={18} />
                     )}
                     Save Changes
                  </button>
               </div>
            </form>
          </div>
        </div>

        {/* Signature Section */}
        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden transition-all hover:shadow-xl hover:border-blue-50 dark:hover:border-blue-900/30">
          <div className="p-8 sm:p-10 border-b border-slate-50 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-800/10">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <PenLine size={20} className="text-blue-600 dark:text-blue-400" />
                  <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Default Signature</h2>
                </div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                  Save the signature that will be used for reviews, approvals, and exports.
                </p>
              </div>

              <div className="w-full lg:w-72 min-h-28 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 flex items-center justify-center p-4">
                {isLoadingSignature ? (
                  <Loader2 className="animate-spin text-blue-600 dark:text-blue-400" size={24} />
                ) : defaultSignatureSrc ? (
                  <img src={defaultSignatureSrc} alt="Current default signature" className="max-h-24 max-w-full object-contain" />
                ) : (
                  <div className="text-center text-xs font-black uppercase tracking-widest text-slate-300 dark:text-slate-600">
                    No signature
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="p-8 sm:p-10 space-y-6">
            {signatureMessage && (
              <div className={`p-4 rounded-2xl flex items-center gap-3 text-sm font-bold ${
                signatureMessage.type === 'success'
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                  : 'bg-red-50 text-red-700 border border-red-100'
              }`}>
                <BadgeCheck size={18} />
                {signatureMessage.text}
              </div>
            )}

            <div className="inline-flex rounded-2xl bg-slate-100 dark:bg-slate-800 p-1">
              <button
                type="button"
                onClick={() => setSignatureMode('draw')}
                className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 ${
                  signatureMode === 'draw'
                    ? 'bg-white dark:bg-slate-950 text-blue-600 dark:text-blue-400 shadow-sm'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                }`}
              >
                <PenLine size={14} />
                Draw
              </button>
              <button
                type="button"
                onClick={() => setSignatureMode('upload')}
                className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 ${
                  signatureMode === 'upload'
                    ? 'bg-white dark:bg-slate-950 text-blue-600 dark:text-blue-400 shadow-sm'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                }`}
              >
                <Upload size={14} />
                Upload
              </button>
            </div>

            {signatureMode === 'draw' ? (
              <div className="space-y-4">
                <div className="rounded-2xl border-2 border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 overflow-hidden">
                  <SignatureCanvas
                    ref={signatureCanvasRef}
                    penColor="#0f172a"
                    canvasProps={{
                      className: 'w-full h-56 bg-white dark:bg-slate-900',
                    }}
                  />
                </div>
                <div className="flex flex-wrap justify-end gap-3">
                  <button
                    type="button"
                    onClick={handleClearSignatureCanvas}
                    disabled={isSignatureSaving}
                    className="px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-2xl text-xs font-black shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-all flex items-center gap-2 disabled:opacity-50"
                  >
                    <RotateCcw size={15} />
                    Clear
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveDrawnSignature}
                    disabled={isSignatureSaving}
                    className="px-5 py-3 bg-blue-600 text-white rounded-2xl text-xs font-black shadow-lg shadow-blue-600/30 hover:shadow-xl hover:shadow-blue-600/40 hover:-translate-y-0.5 transition-all flex items-center gap-2 disabled:opacity-50 disabled:hover:translate-y-0"
                  >
                    {isSavingDrawnSignature ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                    Save as Default
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <input
                  ref={signatureFileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleSignatureFileChange}
                />
                <button
                  type="button"
                  onClick={() => signatureFileInputRef.current?.click()}
                  disabled={isSignatureSaving}
                  className="w-full min-h-44 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 hover:bg-white dark:hover:bg-slate-900 transition-all flex items-center justify-center p-6 disabled:opacity-50"
                >
                  {signaturePreview ? (
                    <img src={signaturePreview} alt="Signature upload preview" className="max-h-36 max-w-full object-contain" />
                  ) : (
                    <span className="flex flex-col items-center gap-3 text-slate-400 dark:text-slate-500">
                      <ImageIcon size={28} />
                      <span className="text-xs font-black uppercase tracking-widest">Choose signature image</span>
                    </span>
                  )}
                </button>
                <div className="flex flex-wrap justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setSignatureFile(null)
                      if (signatureFileInputRef.current) signatureFileInputRef.current.value = ''
                    }}
                    disabled={isSignatureSaving || !signatureFile}
                    className="px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-2xl text-xs font-black shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-all flex items-center gap-2 disabled:opacity-50"
                  >
                    <RotateCcw size={15} />
                    Clear
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveUploadedSignature}
                    disabled={isSignatureSaving}
                    className="px-5 py-3 bg-blue-600 text-white rounded-2xl text-xs font-black shadow-lg shadow-blue-600/30 hover:shadow-xl hover:shadow-blue-600/40 hover:-translate-y-0.5 transition-all flex items-center gap-2 disabled:opacity-50 disabled:hover:translate-y-0"
                  >
                    {isUploadingSignature ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                    Save as Default
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Security Summary Section */}
        <div className="bg-slate-900 dark:bg-slate-950 rounded-[2.5rem] p-10 text-white shadow-2xl relative overflow-hidden group border border-transparent dark:border-slate-800 transition-all">
           <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
              <div className="space-y-3">
                 <div className="flex items-center gap-3">
                    <Lock size={24} className="text-blue-400" />
                    <h2 className="text-xl font-black tracking-tight">Security & Privacy</h2>
                 </div>
                 <p className="text-slate-400 font-bold max-w-md text-sm leading-relaxed">
                    Personalize your security settings, update your primary password, and manage linked devices.
                 </p>
              </div>
              <Link 
                to="/hr/settings/password"
                className="px-6 py-4 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-2xl text-sm font-black shadow-xl hover:bg-blue-50 dark:hover:bg-slate-700 transition-colors flex items-center justify-center gap-2"
              >
                Change System Password
              </Link>
           </div>
           {/* Decorative bg */}
           <div className="absolute top-0 right-0 h-64 w-64 bg-blue-600/10 rounded-full blur-[100px] -mr-32 -mt-32"></div>
           <div className="absolute bottom-0 left-0 h-32 w-32 bg-indigo-600/10 rounded-full blur-[60px] -ml-16 -mb-16"></div>
        </div>
      </div>
    </div>
  )
}

