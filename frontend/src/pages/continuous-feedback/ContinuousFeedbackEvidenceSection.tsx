import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { FileText } from 'lucide-react';
import { continuousFeedbackApi } from '../../features/continuousFeedback/continuousFeedbackApi';
import type { ContinuousFeedbackEvidence } from '../../features/continuousFeedback/types';
import { FEEDBACK_CATEGORY_LABELS } from '../../features/continuousFeedback/types';

interface Props {
  employeeId: number;
  startDate?: string;
  endDate?: string;
}

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

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Continuous Feedback Evidence</h3>
        <p className="text-sm text-gray-400">Loading evidence...</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center gap-2 mb-4">
        <FileText size={20} className="text-indigo-600" />
        <h3 className="text-lg font-semibold text-gray-800">Continuous Feedback Evidence</h3>
      </div>

      {evidence.length === 0 ? (
        <p className="text-sm text-gray-400">No continuous feedback evidence found for this period.</p>
      ) : (
        <div className="space-y-4">
          {evidence.map((item) => (
            <div key={item.feedbackId} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-indigo-100 text-indigo-700">
                  {FEEDBACK_CATEGORY_LABELS[item.category as keyof typeof FEEDBACK_CATEGORY_LABELS] || item.category}
                </span>
                {item.acknowledged && (
                  <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-blue-100 text-blue-700">
                    Acknowledged
                  </span>
                )}
              </div>
              {item.feedbackMessage && (
                <p className="text-sm text-gray-700 mb-1">{item.feedbackMessage}</p>
              )}
              <div className="flex items-center gap-4 text-xs text-gray-500">
                <span>By: {item.managerName}</span>
                <span>{new Date(item.createdAt).toLocaleDateString()}</span>
              </div>
              {item.actionItems.length > 0 && (
                <div className="mt-2 pt-2 border-t border-gray-100">
                  <p className="text-xs font-medium text-gray-600 mb-1">Action Items:</p>
                  {item.actionItems.map((ai) => (
                    <div key={ai.actionItemId} className="flex items-center gap-2 text-xs text-gray-500">
                      <span className="w-2 h-2 rounded-full bg-gray-400" />
                      <span>{ai.description}</span>
                      <span className="text-gray-400">({ai.status})</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
