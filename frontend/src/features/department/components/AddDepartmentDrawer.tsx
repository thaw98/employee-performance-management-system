import { useState } from 'react';
import toast from 'react-hot-toast';
import { useCreateDepartmentMutation } from '../departmentApi';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export function AddDepartmentDrawer({ isOpen, onClose }: Props) {
  const [createDepartment, { isLoading }] = useCreateDepartmentMutation();

  const [departmentCode, setDepartmentCode] = useState('');
  const [departmentName, setDepartmentName] = useState('');
  const [status, setStatus] = useState('ACTIVE');
  const [errorCode, setErrorCode] = useState('');
  const [errorName, setErrorName] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorCode('');
    setErrorName('');

    const code = departmentCode.trim();
    const name = departmentName.trim();

    let hasError = false;
    if (!code) {
      setErrorCode('Department code is required.');
      hasError = true;
    }
    if (!name) {
      setErrorName('Department name is required.');
      hasError = true;
    }

    if (hasError) return;

    try {
      await createDepartment({ departmentCode: code, departmentName: name, status }).unwrap();
      toast.success('Department created successfully.');
      
      // Reset form
      setDepartmentCode('');
      setDepartmentName('');
      setStatus('ACTIVE');
      onClose();
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to create department.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/30 backdrop-blur-sm" 
        onClick={onClose} 
      />
      
      {/* Drawer */}
      <div className="relative w-96 bg-white h-full shadow-2xl flex flex-col animate-[slideIn_.3s_ease-out]">
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <h2 className="text-xl font-bold text-slate-900">Add New Department</h2>
          <button 
            type="button" 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <i className="bi bi-x-lg text-lg"></i>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">
                Department Code <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:outline-none transition-colors ${
                  errorCode ? 'border-red-500 focus:border-red-500 focus:ring-red-200' : 'border-slate-300 focus:border-emerald-500 focus:ring-emerald-200'
                }`}
                placeholder="e.g. HR"
                value={departmentCode}
                onChange={(e) => {
                   setDepartmentCode(e.target.value);
                   if (e.target.value.trim()) setErrorCode('');
                }}
              />
              {errorCode && <p className="mt-1 text-xs text-red-500">{errorCode}</p>}
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">
                Department Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:outline-none transition-colors ${
                  errorName ? 'border-red-500 focus:border-red-500 focus:ring-red-200' : 'border-slate-300 focus:border-emerald-500 focus:ring-emerald-200'
                }`}
                placeholder="e.g. Human Resources"
                value={departmentName}
                onChange={(e) => {
                   setDepartmentName(e.target.value);
                   if (e.target.value.trim()) setErrorName('');
                }}
              />
              {errorName && <p className="mt-1 text-xs text-red-500">{errorName}</p>}
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Status</label>
              <select
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:outline-none focus:border-emerald-500 focus:ring-emerald-200 transition-colors bg-white"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="ACTIVE">ACTIVE</option>
                <option value="INACTIVE">INACTIVE</option>
              </select>
            </div>

          </div>

          <div className="p-6 border-t border-slate-100 flex gap-3 bg-slate-50">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 font-semibold rounded-lg hover:bg-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-4 py-2 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50"
            >
              {isLoading ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
