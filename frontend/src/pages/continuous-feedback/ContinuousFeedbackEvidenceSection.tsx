import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { FileText, Check, ClipboardList } from 'lucide-react';
import { continuousFeedbackApi } from '../../features/continuousFeedback/continuousFeedbackApi';
import type { ContinuousFeedbackEvidence } from '../../features/continuousFeedback/types';
import { FEEDBACK_CATEGORY_LABELS } from '../../features/continuousFeedback/types';

interface Props {
  employeeId: number;
  startDate?: string;
  endDate?: string;
}

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

const statusDot: Record<string, string> = {
  OPEN: 'bg-slate-400',
  IN_PROGRESS: 'bg-[#2463eb]',
  COMPLETED: 'bg-emerald-500',
  CANCELLED: 'bg-rose-400',
};

export default function ContinuousFeedbackEvidenceSection({ employeeId, startDate, endDate }: Props) {
  const [evidence, setEvidence] = useState<ContinuousFeedbackEvidence[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (employeeId) loadEvidence();
  }, [employeeId, startDate, endDate]);

  const loadEvidence = async () => {
    try {
      setLoading(true);
      const resp = await continuousFeedbackApi.getEvidenceForEmployee(employeeId, startDate, endDate);
      setEvidence(resp.data);
    } catch {
      toast.error('Failed to load evidence');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-[32px] shadow-sm border border-slate-100 overflow-hidden">
      <div className="p-6 border-b border-slate-100 flex items-center gap-2 text-slate-400">
        <FileText size={18} className="text-[#2463eb]" />
        <h3 className="text-[10px] font-black uppercase tracking-widest">Continuous Feedback Evidence</h3>
        {!loading && evidence.length > 0 && (
          <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2.5 py-0.5 rounded-full ml-auto">
            {evidence.length}
          </span>
        )}
      </div>

      {loading ? (
        <div className="p-8 flex items-center justify-center gap-3">
          <div className="w-6 h-6 border-3 border-slate-200 border-t-[#2463eb] rounded-full animate-spin"></div>
          <p className="text-sm font-bold text-slate-400 animate-pulse">Loading evidence...</p>
        </div>
      ) : evidence.length === 0 ? (
        <div className="p-8 flex flex-col items-center justify-center gap-2">
          <FileText size={32} className="text-slate-200" />
          <p className="text-sm font-bold text-slate-400">No continuous feedback evidence found for this period.</p>
        </div>
      ) : (
        <div className="divide-y divide-slate-50">
          {evidence.map((item) => (
            <div key={item.feedbackId} className="p-5 hover:bg-slate-50/80 transition-colors">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                  categoryColors[item.category] || 'bg-slate-100 text-slate-700 border-slate-200'
                }`}>
                  {FEEDBACK_CATEGORY_LABELS[item.category as keyof typeof FEEDBACK_CATEGORY_LABELS] || item.category}
                </span>
                {item.acknowledged && (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest border bg-blue-50 text-[#1d4ed8] border-[#bfdbfe]">
                    <div className="flex items-center gap-1">
                      <Check size={10} />
                      Acknowledged
                    </div>
                  </span>
                )}
              </div>
              {item.feedbackMessage && (
                <p className="text-sm font-bold text-slate-700 mb-2 leading-relaxed ml-1">{item.feedbackMessage}</p>
              )}
              <div className="flex items-center gap-4 text-[10px] font-bold text-slate-400 ml-1">
                <span>By: {item.managerName}</span>
                <span>
                  {new Date(item.createdAt).toLocaleDateString('en-US', {
                    month: 'short', day: 'numeric', year: 'numeric'
                  })}
                </span>
              </div>
              {item.actionItems.length > 0 && (
                <div className="mt-3 pt-3 border-t border-slate-100 ml-1">
                  <div className="flex items-center gap-1.5 mb-2">
                    <ClipboardList size={12} className="text-slate-400" />
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Action Items</p>
                  </div>
                  <div className="space-y-1.5">
                    {item.actionItems.map((ai) => (
                      <div key={ai.actionItemId} className="flex items-center gap-2 text-xs font-bold text-slate-500">
                        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${statusDot[ai.status] || 'bg-slate-300'}`} />
                        <span>{ai.description}</span>
                        <span className="text-slate-400 font-semibold">({ai.status})</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
