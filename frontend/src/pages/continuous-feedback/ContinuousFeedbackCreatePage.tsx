import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Combobox, ComboboxButton, ComboboxInput, ComboboxOption, ComboboxOptions } from '@headlessui/react';
import { toast } from 'react-hot-toast';
import { ArrowLeft, ChevronDown, Send, MessageSquare, Lock, User } from 'lucide-react';
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

const categoryColors: Record<string, string> = {
  PRAISE: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  COACHING: 'bg-blue-50 text-[#1d4ed8] border-[#bfdbfe]',
  IMPROVEMENT_NEEDED: 'bg-amber-50 text-amber-800 border-amber-200',
  GOAL_PROGRESS: 'bg-violet-50 text-violet-700 border-violet-200',
  BEHAVIORAL_NOTE: 'bg-sky-50 text-sky-700 border-sky-200',
  ATTENDANCE: 'bg-orange-50 text-orange-700 border-orange-200',
  COMMUNICATION: 'bg-cyan-50 text-cyan-700 border-cyan-200',
  TEAMWORK: 'bg-pink-50 text-pink-700 border-pink-200',
  PERFORMANCE_RISK: 'bg-rose-50 text-rose-700 border-rose-200',
};

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
    <div className="max-w-4xl mx-auto space-y-6 pb-20 px-4">
      {/* Back Button */}
      <Link
        to={feedbackBasePath}
        className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors font-bold text-sm bg-white px-4 py-2 rounded-xl border border-slate-100 shadow-sm w-fit"
      >
        <ArrowLeft size={16} />
        Back to team feedback
      </Link>

      {/* Header Card */}
      <div className="bg-white p-8 rounded-[32px] shadow-sm border border-slate-100 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-36 h-36 bg-[#dbeafe] rounded-bl-[100px] -mr-10 -mt-10 opacity-50"></div>
        <div className="relative">
          <div className="flex items-center gap-2 text-[#2463eb] mb-3">
            <MessageSquare size={20} />
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Feedback</span>
          </div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">Create Feedback</h1>
          <p className="text-sm font-semibold text-slate-500 mt-2">Create and manage feedback for your team</p>
        </div>
      </div>

      {/* Form Card */}
      <div className="bg-white rounded-[32px] shadow-sm border border-slate-100 p-8">
        <div className="space-y-6">
          {/* Employee Selection */}
          <div>
            <label className="flex items-center gap-2 text-xs font-black text-slate-500 uppercase tracking-widest mb-3 ml-1">
              <User size={14} className="text-[#2463eb]" />
              Employee *
            </label>
            <div className="relative">
              <Combobox
                value={selectedEmployee}
                onChange={(emp: EmployeeOption | null) => {
                  setSelectedEmployeeId(emp ? emp.id : null);
                  setEmployeeQuery('');
                }}
                nullable
              >
                <div className="relative flex rounded-2xl border border-slate-200 bg-white focus-within:border-[#2463eb] focus-within:ring-2 focus-within:ring-[#dbeafe] transition-all shadow-sm">
                  <ComboboxInput
                    className="w-full rounded-2xl border-0 bg-transparent px-4 py-3 pr-10 text-sm font-bold text-slate-900 focus:ring-0 outline-none placeholder:text-slate-400"
                    displayValue={(emp: EmployeeOption | null) =>
                      emp ? formatEmployeeLabel(emp) : ''
                    }
                    onChange={(e) => setEmployeeQuery(e.target.value)}
                    placeholder="Select employee..."
                    autoComplete="off"
                  />
                  <ComboboxButton className="absolute inset-y-0 right-0 flex items-center px-4 text-slate-400">
                    <ChevronDown size={18} aria-hidden />
                  </ComboboxButton>
                </div>
                <ComboboxOptions
                  anchor="bottom start"
                  className="z-50 mt-2 max-h-60 w-(--anchor-width) overflow-auto rounded-2xl border border-slate-200 bg-white py-2 shadow-lg focus:outline-none"
                >
                  {filteredEmployees.length === 0 ? (
                    <div className="px-4 py-3 text-sm font-bold text-slate-400">No employees found</div>
                  ) : (
                    filteredEmployees.map((emp) => (
                      <ComboboxOption
                        key={emp.id}
                        value={emp}
                        className="cursor-pointer px-4 py-3 text-sm font-bold text-slate-700 data-focus:bg-[#ebf4ff] data-selected:bg-[#dbeafe] data-selected:text-[#1d4ed8] transition-colors"
                      >
                        <span>{emp.name}</span>
                        {emp.position && <span className="text-slate-400 font-semibold"> ({emp.position})</span>}
                        {emp.department && <span className="text-slate-400 font-semibold ml-1">· {emp.department}</span>}
                      </ComboboxOption>
                    ))
                  )}
                </ComboboxOptions>
              </Combobox>
            </div>
          </div>

          {/* Category Selection */}
          <div>
            <label className="flex items-center gap-2 text-xs font-black text-slate-500 uppercase tracking-widest mb-3 ml-1">
              <MessageSquare size={14} className="text-[#2463eb]" />
              Category *
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={`px-3 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${
                    category === cat
                      ? 'bg-[#2463eb] text-white border-[#2463eb] shadow-md'
                      : `${categoryColors[cat]} hover:shadow-sm`
                  }`}
                >
                  {FEEDBACK_CATEGORY_LABELS[cat]}
                </button>
              ))}
            </div>
          </div>

          {/* Private Note Toggle */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                id="isPrivateOnly"
                checked={isPrivateOnly}
                onChange={(e) => setIsPrivateOnly(e.target.checked)}
                className="w-5 h-5 rounded-lg border-slate-300 text-[#2463eb] focus:ring-[#dbeafe] focus:ring-2 accent-[#2463eb]"
              />
              <div className="flex items-center gap-2">
                <Lock size={16} className={isPrivateOnly ? 'text-amber-500' : 'text-slate-400'} />
                <span className="text-sm font-bold text-slate-700">Save as private note only (not shared with employee)</span>
              </div>
            </label>
          </div>

          {/* Feedback Message */}
          {!isPrivateOnly && (
            <div className="animate-fade-in-up">
              <label className="flex items-center gap-2 text-xs font-black text-slate-500 uppercase tracking-widest mb-3 ml-1">
                <Send size={14} className="text-[#2463eb]" />
                Feedback Message *
              </label>
              <textarea
                value={feedbackMessage}
                onChange={(e) => setFeedbackMessage(e.target.value)}
                rows={5}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm font-bold focus:border-[#2463eb] focus:ring-1 focus:ring-[#dbeafe] outline-none transition-all resize-none shadow-inner"
                placeholder="Enter your feedback message..."
              />
            </div>
          )}

          {/* Private Manager Note */}
          <div>
            <label className="flex items-center gap-2 text-xs font-black text-slate-500 uppercase tracking-widest mb-3 ml-1">
              <Lock size={14} className="text-[#2463eb]" />
              Private Manager Note
              <span className="text-[10px] font-bold text-slate-400 normal-case tracking-normal">(visible to managers, HR, and audit)</span>
            </label>
            <textarea
              value={privateNote}
              onChange={(e) => setPrivateNote(e.target.value)}
              rows={3}
              className="w-full bg-amber-50/50 border border-amber-200 rounded-2xl px-5 py-4 text-sm font-bold focus:border-[#2463eb] focus:ring-1 focus:ring-[#dbeafe] outline-none transition-all resize-none shadow-inner"
              placeholder="Private note (only visible to managers, HR, and audit)..."
            />
          </div>

          {/* Actions */}
          <div className="flex gap-4 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={handleCreate}
              disabled={submitting}
              className="flex items-center gap-2 px-6 py-3 bg-[#2463eb] hover:bg-[#1d4ed8] text-white rounded-2xl font-bold text-sm transition-all shadow-lg shadow-[#dbeafe] disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
            >
              {submitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Send size={18} />
                  {isPrivateOnly ? 'Save Private Note' : 'Create & Share'}
                </>
              )}
            </button>
            <Link
              to={feedbackBasePath}
              className="px-6 py-3 bg-slate-100 text-slate-600 rounded-2xl font-bold text-sm hover:bg-slate-200 transition-colors inline-flex items-center active:scale-95"
            >
              Cancel
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
