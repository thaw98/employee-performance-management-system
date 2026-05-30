import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Combobox, ComboboxButton, ComboboxInput, ComboboxOption, ComboboxOptions } from '@headlessui/react';
import { toast } from 'react-hot-toast';
import type { RootState } from '../../app/store';
import { getRoleGroup } from '../../utils/dashboardRedirect';
import { ChevronDown, MessageSquare, Plus, Send, Eye } from 'lucide-react';
import { continuousFeedbackApi } from '../../features/continuousFeedback/continuousFeedbackApi';
import type { ContinuousFeedback, ContinuousFeedbackCreateRequest } from '../../features/continuousFeedback/types';
import axios from '../../app/axiosInstance';

interface EmployeeOption {
  id: number;
  name: string;
  department?: string;
  position?: string;
}

const CATEGORIES = [
  'PRAISE', 'COACHING', 'IMPROVEMENT_NEEDED', 'GOAL_PROGRESS',
  'BEHAVIORAL_NOTE', 'ATTENDANCE', 'COMMUNICATION', 'TEAMWORK', 'PERFORMANCE_RISK',
];

const CATEGORY_LABELS: Record<string, string> = {
  PRAISE: 'Praise',
  COACHING: 'Coaching',
  IMPROVEMENT_NEEDED: 'Improvement Needed',
  GOAL_PROGRESS: 'Goal Progress',
  BEHAVIORAL_NOTE: 'Behavioral Note',
  ATTENDANCE: 'Attendance',
  COMMUNICATION: 'Communication',
  TEAMWORK: 'Teamwork',
  PERFORMANCE_RISK: 'Performance Risk',
};

export default function ContinuousFeedbackPage() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { user } = useSelector((state: RootState) => state.auth);
  const roleGroup = user ? getRoleGroup(user) : null;
  const canCreateFeedback = roleGroup === 'MANAGER';
  const feedbackBasePath = useMemo(() => {
    const match = pathname.match(/^\/(hr|manager|audit)\/continuous-feedback/);
    return match ? `/${match[1]}/continuous-feedback` : '/manager/continuous-feedback';
  }, [pathname]);
  const [feedbacks, setFeedbacks] = useState<ContinuousFeedback[]>([]);
  const [employees, setEmployees] = useState<EmployeeOption[]>([]);
  const [loading, setLoading] = useState(true);

  const [showForm, setShowForm] = useState(false);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | null>(null);
  const [employeeQuery, setEmployeeQuery] = useState('');
  const [category, setCategory] = useState('PRAISE');
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [privateNote, setPrivateNote] = useState('');
  const [isPrivateOnly, setIsPrivateOnly] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadData();
    if (canCreateFeedback) {
      loadEmployees();
    }
  }, [canCreateFeedback]);

  const loadData = async () => {
    try {
      setLoading(true);
      const resp = await continuousFeedbackApi.getTeamFeedback();
      setFeedbacks(resp.data);
    } catch {
      toast.error('Failed to load feedback');
    } finally {
      setLoading(false);
    }
  };

  const loadEmployees = async () => {
    try {
      const resp = await axios.get('/meetings/eligible-employees');
      const data = resp.data?.data || resp.data || [];
      setEmployees(data);
    } catch {
      setEmployees([]);
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
      await continuousFeedbackApi.createFeedback(request);
      toast.success('Feedback created successfully');
      setShowForm(false);
      setSelectedEmployeeId(null);
      setEmployeeQuery('');
      setCategory('PRAISE');
      setFeedbackMessage('');
      setPrivateNote('');
      setIsPrivateOnly(false);
      loadData();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } }).response?.data?.message || 'Failed to create feedback';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleShare = async (feedbackId: number) => {
    try {
      await continuousFeedbackApi.shareFeedback(feedbackId);
      toast.success('Feedback shared');
      loadData();
    } catch {
      toast.error('Failed to share feedback');
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Continuous Feedback</h1>
          <p className="text-sm text-gray-500 mt-1">
            {canCreateFeedback
              ? 'Create and manage feedback for your team'
              : 'Review continuous feedback across the organization'}
          </p>
        </div>
        {canCreateFeedback && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            {showForm ? (
              <>
                <MessageSquare size={18} />
                View Feedback
              </>
            ) : (
              <>
                <Plus size={18} />
                New Feedback
              </>
            )}
          </button>
        )}
      </div>

      {showForm && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Create New Feedback</h2>
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
                          {emp.position && (
                            <span className="text-gray-500"> ({emp.position})</span>
                          )}
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
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {CATEGORY_LABELS[cat]}
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
                  Feedback Message {!isPrivateOnly && '*'}
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Private Manager Note</label>
              <textarea
                value={privateNote}
                onChange={(e) => setPrivateNote(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Private note (only visible to managers, HR, and audit)..."
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleCreate}
                disabled={submitting}
                className="flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
              >
                <Send size={18} />
                {submitting ? 'Creating...' : isPrivateOnly ? 'Save Private Note' : 'Create & Share'}
              </button>
              <button
                onClick={() => setShowForm(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800">
            {canCreateFeedback ? 'Team Feedback Timeline' : 'Organization Feedback Timeline'}
          </h2>
        </div>
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading...</div>
        ) : feedbacks.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No feedback records yet</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {feedbacks.map((fb) => (
              <div key={fb.feedbackId} className="p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-indigo-100 text-indigo-700">
                        {CATEGORY_LABELS[fb.category] || fb.category}
                      </span>
                      {fb.shared ? (
                        <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-green-100 text-green-700">
                          Shared
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-yellow-100 text-yellow-700">
                          Private Note
                        </span>
                      )}
                      {fb.acknowledged && (
                        <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-blue-100 text-blue-700">
                          Acknowledged
                        </span>
                      )}
                      {fb.pipSuggested && (
                        <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-red-100 text-red-700">
                          PIP Warning
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-800 font-medium">
                      {fb.employeeName} — {fb.employeeBusinessId}
                    </p>
                    {fb.feedbackMessage && (
                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">{fb.feedbackMessage}</p>
                    )}
                    {fb.privateManagerNote && (
                      <p className="text-xs text-gray-400 mt-1 italic">
                        Private note: {fb.privateManagerNote}
                      </p>
                    )}
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(fb.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <button
                      onClick={() => navigate(`${feedbackBasePath}/${fb.feedbackId}`)}
                      className="p-2 text-gray-400 hover:text-indigo-600 transition-colors"
                      title="View details"
                    >
                      <Eye size={18} />
                    </button>
                    {canCreateFeedback && !fb.shared && (
                      <button
                        onClick={() => handleShare(fb.feedbackId)}
                        className="p-2 text-gray-400 hover:text-green-600 transition-colors"
                        title="Share feedback"
                      >
                        <Send size={18} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
