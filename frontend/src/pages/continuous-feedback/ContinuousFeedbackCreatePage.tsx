import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Combobox, ComboboxButton, ComboboxInput, ComboboxOption, ComboboxOptions } from '@headlessui/react';
import { toast } from 'react-hot-toast';
import { ArrowLeft, ChevronDown, Send } from 'lucide-react';
import { continuousFeedbackApi } from '../../features/continuousFeedback/continuousFeedbackApi';
import {
  FEEDBACK_CATEGORY_LABELS,
  type ContinuousFeedbackCategory,
  type ContinuousFeedbackCreateRequest,
} from '../../features/continuousFeedback/types';
import axios from '../../app/axiosInstance';

interface EmployeeOption {
  id: number;
  name: string;
  department?: string;
  position?: string;
}

const CATEGORIES = Object.keys(FEEDBACK_CATEGORY_LABELS) as ContinuousFeedbackCategory[];

export default function ContinuousFeedbackCreatePage() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const feedbackBasePath = useMemo(() => {
    const match = pathname.match(/^\/(hr|manager|audit)\/continuous-feedback/);
    return match ? `/${match[1]}/continuous-feedback` : '/manager/continuous-feedback';
  }, [pathname]);

  const [employees, setEmployees] = useState<EmployeeOption[]>([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | null>(null);
  const [employeeQuery, setEmployeeQuery] = useState('');
  const [category, setCategory] = useState<ContinuousFeedbackCategory>('PRAISE');
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [privateNote, setPrivateNote] = useState('');
  const [isPrivateOnly, setIsPrivateOnly] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadEmployees();
  }, []);

  const loadEmployees = async () => {
    try {
      const resp = await axios.get('/meetings/eligible-employees');
      const data = resp.data?.data || resp.data || [];
      setEmployees(data);
    } catch {
      setEmployees([]);
      toast.error('Failed to load team members');
    }
  };

  const selectedEmployee = useMemo(
    () => employees.find((emp) => emp.id === selectedEmployeeId) ?? null,
    [employees, selectedEmployeeId],
  );

  const filteredEmployees = useMemo(() => {
    const q = employeeQuery.trim().toLowerCase();
    if (!q) return employees;
    return employees.filter(
      (emp) =>
        emp.name.toLowerCase().includes(q) ||
        (emp.position?.toLowerCase().includes(q) ?? false) ||
        (emp.department?.toLowerCase().includes(q) ?? false),
    );
  }, [employees, employeeQuery]);

  const formatEmployeeLabel = (emp: EmployeeOption) =>
    emp.position ? `${emp.name} (${emp.position})` : emp.name;

  const handleCreate = async () => {
    if (!selectedEmployeeId) {
      toast.error('Please select an employee');
      return;
    }
    if (isPrivateOnly && !privateNote) {
      toast.error('Private note is required for private-only feedback');
      return;
    }
    if (!isPrivateOnly && !feedbackMessage) {
      toast.error('Feedback message is required for shared feedback');
      return;
    }

    setSubmitting(true);
    try {
      const request: ContinuousFeedbackCreateRequest = {
        employeeId: selectedEmployeeId,
        category,
        feedbackMessage: isPrivateOnly ? undefined : feedbackMessage,
        privateManagerNote: privateNote || undefined,
        shareImmediately: !isPrivateOnly,
      };
      const created = await continuousFeedbackApi.createFeedback(request);
      toast.success('Feedback created successfully');
      const feedbackId = created.data?.feedbackId;
      if (feedbackId) {
        navigate(`${feedbackBasePath}/${feedbackId}`);
      } else {
        navigate(feedbackBasePath);
      }
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } }).response?.data?.message ||
        'Failed to create feedback';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-6 max-w-3xl">
      <Link
        to={feedbackBasePath}
        className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-indigo-600 mb-4 transition-colors"
      >
        <ArrowLeft size={16} />
        Back to team feedback
      </Link>

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Create Feedback</h1>
        <p className="text-sm text-gray-500 mt-1">Create and manage feedback for your team</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Employee *</label>
            <div className="relative">
              <Combobox
                value={selectedEmployee}
                onChange={(emp: EmployeeOption | null) => {
                  setSelectedEmployeeId(emp ? emp.id : null);
                  setEmployeeQuery('');
                }}
                nullable
              >
                <div className="relative flex rounded-lg border border-gray-300 bg-white focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500">
                  <ComboboxInput
                    className="w-full rounded-lg border-0 bg-transparent px-3 py-2 pr-10 text-sm text-gray-900 focus:ring-0 outline-none placeholder:text-gray-400"
                    displayValue={(emp: EmployeeOption | null) =>
                      emp ? formatEmployeeLabel(emp) : ''
                    }
                    onChange={(e) => setEmployeeQuery(e.target.value)}
                    placeholder="Select employee..."
                    autoComplete="off"
                  />
                  <ComboboxButton className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-400">
                    <ChevronDown size={16} aria-hidden />
                  </ComboboxButton>
                </div>
                <ComboboxOptions
                  anchor="bottom start"
                  className="z-50 mt-1 max-h-60 w-(--anchor-width) overflow-auto rounded-lg border border-gray-200 bg-white py-1 shadow-lg focus:outline-none"
                >
                  {filteredEmployees.length === 0 ? (
                    <div className="px-3 py-2 text-sm text-gray-500">No employees found</div>
                  ) : (
                    filteredEmployees.map((emp) => (
                      <ComboboxOption
                        key={emp.id}
                        value={emp}
                        className="cursor-pointer px-3 py-2 text-sm text-gray-800 data-focus:bg-indigo-50 data-selected:bg-indigo-100 data-selected:text-indigo-800"
                      >
                        <span className="font-medium">{emp.name}</span>
                        {emp.position && <span className="text-gray-500"> ({emp.position})</span>}
                      </ComboboxOption>
                    ))
                  )}
                </ComboboxOptions>
              </Combobox>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as ContinuousFeedbackCategory)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {FEEDBACK_CATEGORY_LABELS[cat]}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isPrivateOnly"
              checked={isPrivateOnly}
              onChange={(e) => setIsPrivateOnly(e.target.checked)}
              className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
            <label htmlFor="isPrivateOnly" className="text-sm text-gray-700">
              Save as private note only (not shared with employee)
            </label>
          </div>

          {!isPrivateOnly && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Feedback Message *
              </label>
              <textarea
                value={feedbackMessage}
                onChange={(e) => setFeedbackMessage(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Enter your feedback message..."
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Private Manager Note
            </label>
            <textarea
              value={privateNote}
              onChange={(e) => setPrivateNote(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Private note (only visible to managers, HR, and audit)..."
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={handleCreate}
              disabled={submitting}
              className="flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              <Send size={18} />
              {submitting ? 'Creating...' : isPrivateOnly ? 'Save Private Note' : 'Create & Share'}
            </button>
            <Link
              to={feedbackBasePath}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors inline-flex items-center"
            >
              Cancel
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
