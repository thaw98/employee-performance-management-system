import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useUpdateDepartmentMutation } from '../departmentApi';
import type { DepartmentDto } from '../../../types/department';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  department: DepartmentDto | null;
}

export function EditDepartmentModal({ isOpen, onClose, department }: Props) {
  const [updateDepartment, { isLoading }] = useUpdateDepartmentMutation();

  const [departmentCode, setDepartmentCode] = useState('');
  const [departmentName, setDepartmentName] = useState('');
  const [status, setStatus] = useState('');
  const [errorCode, setErrorCode] = useState('');
  const [errorName, setErrorName] = useState('');

  useEffect(() => {
    if (department && isOpen) {
      setDepartmentCode(department.departmentCode);
      setDepartmentName(department.departmentName);
      setStatus(department.status);
      setErrorCode('');
      setErrorName('');
    }
  }, [department, isOpen]);

  if (!isOpen || !department) return null;

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
      await updateDepartment({
        id: department.departmentId, 
        data: { departmentCode: code, departmentName: name, status }
      }).unwrap();
      
      toast.success('Department updated successfully.');
      onClose();
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to update department.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/30 backdrop-blur-sm" 
        onClick={onClose} 
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md animate-[zoomIn_.2s_ease-out]">
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <h2 className="text-xl font-bold text-slate-900">Edit Department</h2>
          <button 
            type="button" 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <i className="bi bi-x-lg text-lg"></i>
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-5">
            
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">
                Department Code <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:outline-none transition-colors ${
                  errorCode ? 'border-red-500 focus:border-red-500 focus:ring-red-200' : 'border-slate-300 focus:border-emerald-500 focus:ring-emerald-200'
                }`}
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

          <div className="p-6 border-t border-slate-100 flex gap-3 bg-slate-50 rounded-b-2xl">
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
              className="flex-1 px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {isLoading ? 'Updating...' : 'Update'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
