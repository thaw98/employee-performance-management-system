import toast from 'react-hot-toast';
import { useDisbandDepartmentMutation } from '../departmentApi';
import type { DepartmentDto } from '../../../types/department';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  department: DepartmentDto | null;
}

export function DeleteDepartmentConfirmModal({ isOpen, onClose, department }: Props) {
  const [disbandDepartment, { isLoading }] = useDisbandDepartmentMutation();

  if (!isOpen || !department) return null;

  const handleConfirm = async () => {
    try {
      await disbandDepartment(department.departmentId).unwrap();
      toast.success('Department disbanded successfully.');
      onClose();
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to disband department.');
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
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm animate-[zoomIn_.2s_ease-out] text-center">
        <div className="p-6">
          <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <i className="bi bi-exclamation-triangle text-3xl"></i>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Disband Department</h2>
          <p className="text-slate-500 text-sm mb-6">
            Are you sure you want to disband this department?
          </p>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 font-semibold rounded-lg hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={isLoading}
              className="flex-1 px-4 py-2 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
            >
              {isLoading ? 'Disbanding...' : 'Disband'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
