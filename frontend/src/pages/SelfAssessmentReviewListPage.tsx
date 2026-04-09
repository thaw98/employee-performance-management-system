import React, { useState, useEffect } from 'react';
import axios from '../app/axiosInstance';
import { useAppSelector } from '../app/hooks';
import { toast } from 'react-hot-toast';

const PRIMARY = '#0855BF';

export function SelfAssessmentReviewListPage() {
  const [assessments, setAssessments] = useState<any[]>([]);
  const [selectedAsmt, setSelectedAsmt] = useState<any>(null);
  const [comments, setComments] = useState('');
  const [signature, setSignature] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const user = useAppSelector(s => s.auth.user);
  const role = user?.role;
  const isHr = role === 'HR';

  useEffect(() => {
    fetchAssessments();
  }, []);

  const fetchAssessments = async () => {
    try {
      const resp = await axios.get('/api/self-assessments/all');
      setAssessments(resp.data.data || []);
    } catch (err) {
      toast.error('Failed to fetch assessments');
    }
  };

  const handleReview = async () => {
    if (!signature.trim()) {
        toast.error('Signature is required');
        return;
    }
    setIsSubmitting(true);
    try {
        const endpoint = isHr 
            ? `/api/self-assessments/${selectedAsmt.id}/hr-review`
            : `/api/self-assessments/${selectedAsmt.id}/manager-review`;
        await axios.post(endpoint, { comments, signature });
        toast.success('Review submitted successfully');
        setSelectedAsmt(null);
        setComments('');
        setSignature('');
        fetchAssessments();
    } catch (err) {
        toast.error('Failed to submit review');
    } finally {
        setIsSubmitting(false);
    }
  };

  return (
    <div className="p-8 space-y-8">
      <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight" style={{ color: PRIMARY }}>Compliance Review</h1>
            <p className="text-slate-500 mt-1">Verify and approve employee self-assessments</p>
          </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-left">
            <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs font-bold uppercase tracking-wider">
                    <th className="p-4">Employee</th>
                    <th className="p-4 text-center">Score</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Submission Date</th>
                    <th className="p-4 text-center">Action</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
                {assessments.map(sa => (
                    <tr key={sa.id} className="hover:bg-slate-50 transition-colors">
                        <td className="p-4">
                            <div className="font-bold text-slate-700">{sa.employee.employeeName}</div>
                            <div className="text-xs text-slate-400">{sa.employee.department?.name} • {sa.employee.position?.name}</div>
                        </td>
                        <td className="p-4 text-center">
                            <div className="font-black" style={{ color: PRIMARY }}>{sa.totalScore.toFixed(0)}%</div>
                            <div className="text-[10px] text-slate-400 font-bold uppercase">{sa.ratingCategory}</div>
                        </td>
                        <td className="p-4">
                            <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide
                                ${sa.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-700' : 
                                  sa.status === 'SUBMITTED' ? 'bg-amber-100 text-amber-700' : 
                                  'bg-blue-100 text-blue-700'}`}
                            >
                                {sa.status.replace('_', ' ')}
                            </span>
                        </td>
                        <td className="p-4 text-slate-500 text-sm">
                            {new Date(sa.createdAt).toLocaleDateString()}
                        </td>
                        <td className="p-4 text-center">
                            <button 
                                onClick={() => setSelectedAsmt(sa)}
                                className="px-4 py-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition-colors font-semibold text-sm"
                            >
                                Review
                            </button>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
      </div>

      {selectedAsmt && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-6 z-50">
              <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl animate-in zoom-in-95 duration-200">
                  <div className="sticky top-0 bg-white border-b border-slate-100 p-6 flex justify-between items-center z-10">
                      <div>
                          <h2 className="text-xl font-bold text-slate-800">Reviewing {selectedAsmt.employee.employeeName}'s Assessment</h2>
                          <p className="text-sm text-slate-500">Submitted on {new Date(selectedAsmt.createdAt).toLocaleDateString()}</p>
                      </div>
                      <button onClick={() => setSelectedAsmt(null)} className="text-slate-400 hover:text-slate-600 text-2xl">
                        <i className="bi bi-x-lg" />
                      </button>
                  </div>

                  <div className="p-8 space-y-8">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-slate-50 p-6 rounded-2xl border border-slate-200">
                          <div>
                              <label className="text-xs font-bold text-slate-400 uppercase">Total Points</label>
                              <div className="text-3xl font-black text-slate-800">{selectedAsmt.totalPoints}</div>
                          </div>
                          <div className="text-right">
                              <label className="text-xs font-bold text-slate-400 uppercase">Performance Rating</label>
                              <div className="text-3xl font-black" style={{ color: PRIMARY }}>{selectedAsmt.totalScore.toFixed(0)}%</div>
                              <div className="text-sm font-bold text-blue-600 uppercase italic">{selectedAsmt.ratingCategory}</div>
                          </div>
                      </div>

                      <div className="space-y-4">
                          <h3 className="font-bold text-slate-800 border-b pb-2">Employee Responses</h3>
                          <div className="space-y-3">
                              {selectedAsmt.items.map((item: any, idx: number) => (
                                  <div key={idx} className="flex justify-between items-center p-3 bg-white border border-slate-100 rounded-xl">
                                      <div className="text-sm text-slate-600">{item.questionText}</div>
                                      <div className="flex gap-4 items-center">
                                          <span className="text-xs font-bold text-slate-400 uppercase">{item.answerYesNo ? 'Yes' : 'No'}</span>
                                          <span className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold">{item.rating}</span>
                                      </div>
                                  </div>
                              ))}
                          </div>
                      </div>

                      <div className="p-5 bg-amber-50 rounded-xl border border-amber-100">
                          <h4 className="text-xs font-black text-amber-800 uppercase mb-2">Employee Remarks</h4>
                          <p className="text-slate-700 italic">"{selectedAsmt.employeeRemarks || 'No remarks provided.'}"</p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6 border-t border-slate-100">
                          <div className="space-y-4">
                              <label className="block text-sm font-bold text-slate-700 uppercase">{isHr ? 'HR Comments' : 'Manager Comments'}</label>
                              <textarea 
                                  value={comments}
                                  onChange={e => setComments(e.target.value)}
                                  className="w-full h-32 rounded-xl border-slate-200 focus:ring-2 focus:ring-blue-500/20 p-4"
                                  placeholder={`Add feedback for ${selectedAsmt.employee.employeeName}...`}
                              />
                          </div>
                          <div className="space-y-4">
                              <label className="block text-sm font-bold text-slate-700 uppercase">Confirm Signature</label>
                              <input 
                                  type="text" 
                                  value={signature}
                                  onChange={e => setSignature(e.target.value)}
                                  className="w-full font-serif text-2xl border-0 border-b-2 border-slate-200 focus:border-blue-500 px-0 py-2"
                                  placeholder="Type your name"
                              />
                              <button
                                  onClick={handleReview}
                                  disabled={isSubmitting}
                                  className="w-full py-4 bg-blue-600 text-white rounded-xl font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all font-bold"
                              >
                                  {isHr ? 'Approve & Finalize' : 'Submit Review'}
                              </button>
                          </div>
                      </div>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
}
