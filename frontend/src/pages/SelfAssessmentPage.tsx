import React, { useState, useEffect, useRef } from 'react';
import { useAppSelector } from '../app/hooks';
import axios from '../app/axiosInstance';
import { toast } from 'react-hot-toast';
import { formatDate } from '../utils/dateUtils';
import SignatureCanvas from 'react-signature-canvas';

const PRIMARY = '#0855BF';

interface Question {
  id: number;
  subjectText: string;
}

interface Response {
  questionId: number;
  questionText: string;
  answerYesNo: boolean | null;
  rating: number | null;
}

export function SelfAssessmentPage() {
  const user = useAppSelector((state) => state.auth.user);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [responses, setResponses] = useState<Response[]>([]);
  const [remarks, setRemarks] = useState('');
  const [signature, setSignature] = useState('');
  const [signatureType, setSignatureType] = useState<'draw' | 'upload'>('draw');
  const sigCanvas = useRef<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [existingAsmt, setExistingAsmt] = useState<any>(null);

  const handleClearSignature = () => {
    if (sigCanvas.current) {
      sigCanvas.current.clear();
      setSignature('');
    }
  };

  const handleSignatureEnd = () => {
    if (sigCanvas.current) {
      setSignature(sigCanvas.current.getCanvas().toDataURL('image/png'));
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSignature(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const renderSignature = (sig: string) => {
    if (!sig) return null;
    if (sig.startsWith('data:image')) {
      return <img src={sig} alt="Signature" className="max-h-16 inline-block" />;
    }
    if (sig.startsWith('data:')) {
      return (
        <div className="flex items-center gap-2 text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100">
          <i className="bi bi-shield-lock-fill text-lg"></i>
          <span className="text-sm font-semibold">Digital Certificate</span>
        </div>
      );
    }
    return <span className="font-serif text-xl italic">{sig}</span>;
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // 1. Fetch Dynamic Subjects
      const subResp = await axios.get('/api/self-assessment-subjects');
      const subjects: Question[] = subResp.data.data || [];
      setQuestions(subjects);

      // 2. Fetch Latest Assessment
      const resp = await axios.get('/api/self-assessments/me');
      if (resp.data.data) {
        const asmt = resp.data.data;
        setExistingAsmt(asmt);

        // If it was already started or assigned, populate fields from items
        if (asmt.items && asmt.items.length > 0) {
          setResponses(asmt.items.map((item: any, idx: number) => ({
            questionId: idx + 1,
            questionText: item.questionText,
            answerYesNo: item.answerYesNo,
            rating: item.rating
          })));
          setRemarks(asmt.employeeRemarks || '');
          setSignature(asmt.employeeSignature || '');
        } else {
          // Initialize responses from dynamic subjects
          setResponses(subjects.map((q, idx) => ({
            questionId: idx + 1,
            questionText: q.subjectText,
            answerYesNo: null,
            rating: null
          })));
        }
      }
    } catch (err) {
      console.error('Failed to fetch data', err);
      toast.error('Failed to load assessment data');
    }
  };

  const isEditable = existingAsmt?.status === 'UNLOCKED';

  const handleAnswerChange = (qId: number, yesNo: boolean) => {
    if (!isEditable) return;
    setResponses(prev => prev.map(r =>
      r.questionId === qId ? { ...r, answerYesNo: yesNo, rating: null } : r
    ));
  };

  const handleRatingChange = (qId: number, rating: number) => {
    if (!isEditable) return;
    const response = responses.find(r => r.questionId === qId);
    if (!response || response.answerYesNo === null) {
      toast.error('Please select Yes or No first');
      return;
    }

    if (response.answerYesNo && ![3, 4, 5].includes(rating)) {
      toast.error('For Yes, rating must be 3, 4, or 5');
      return;
    }
    if (!response.answerYesNo && ![1, 2].includes(rating)) {
      toast.error('For No, rating must be 1 or 2');
      return;
    }

    setResponses(prev => prev.map(r =>
      r.questionId === qId ? { ...r, rating } : r
    ));
  };

  const totalPoints = responses.reduce((acc, r) => acc + (r.rating || 0), 0);
  const totalScore = responses.length > 0 ? (totalPoints / (responses.length * 5)) * 100 : 0;

  const getRatingCategory = (score: number) => {
    if (score >= 86) return 'Outstanding';
    if (score >= 71) return 'Good';
    if (score >= 60) return 'Meets Requirements';
    if (score >= 40) return 'Needs Improvement';
    return 'Unsatisfactory';
  };

  const handleSubmit = async () => {
    if (!isEditable) return;
    if (responses.length === 0) {
      toast.error('No assessment subjects defined.');
      return;
    }
    if (responses.some(r => r.answerYesNo === null || r.rating === null)) {
      toast.error('Please complete all questions');
      return;
    }
    if (!signature.trim()) {
      toast.error('Signature is required');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        id: existingAsmt.id,
        employeeRemarks: remarks,
        employeeSignature: signature,
        items: responses.map(r => ({
          questionText: r.questionText,
          answerYesNo: r.answerYesNo,
          rating: r.rating
        }))
      };
      await axios.post('/api/self-assessments/submit', payload);
      toast.success('Self-assessment submitted successfully');
      fetchData();
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || err.message || 'Submission failed';
      if (err.response?.status === 401) {
        toast.error('Session expired. Please log out and back in.');
      } else {
        toast.error(`Error: ${errorMsg}`);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!existingAsmt) {
    return (
      <div className="p-8 text-center text-slate-500">
        <i className="bi bi-journal-x text-6xl mb-4 block" />
        <h2 className="text-xl font-bold">No Self-Assessment Assigned</h2>
        <p>Please contact HR if you believe this is an error.</p>
      </div>
    );
  }

  if (existingAsmt && existingAsmt.status !== 'UNLOCKED') {
    return (
      <div className="p-8 space-y-6">
        <h1 className="text-2xl font-bold" style={{ color: PRIMARY }}>Your Self-Assessment</h1>
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 overflow-hidden">
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <label className="text-slate-500 text-sm">Status</label>
              <div className="font-semibold">{existingAsmt.status}</div>
            </div>
            <div>
              <label className="text-slate-500 text-sm">Score</label>
              <div className="font-semibold text-lg" style={{ color: PRIMARY }}>{existingAsmt.totalScore.toFixed(2)}% ({existingAsmt.ratingCategory})</div>
            </div>
          </div>

          <table className="w-full text-left border-collapse mb-8">
            <thead>
              <tr className="bg-slate-50 text-slate-600 border-b border-slate-200">
                <th className="py-3 px-4 font-semibold">Assessment Subject</th>
                <th className="py-3 px-4 font-semibold text-center">Yes/No</th>
                <th className="py-3 px-4 font-semibold text-center">Rating</th>
              </tr>
            </thead>
            <tbody>
              {existingAsmt.items.map((item: any, idx: number) => (
                <tr key={idx} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50">
                  <td className="py-3 px-4">{item.questionText}</td>
                  <td className="py-3 px-4 text-center">{item.answerYesNo ? 'Yes' : 'No'}</td>
                  <td className="py-3 px-4 text-center font-bold text-blue-600">{item.rating}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-4 bg-slate-50 rounded-lg flex flex-col">
              <div>
                <h3 className="font-bold text-slate-700 mb-2">My Remarks</h3>
                <p className="text-slate-600 italic">"{existingAsmt.employeeRemarks || 'No remarks provided'}"</p>
              </div>
              {existingAsmt.employeeSignature && (
                <div className="mt-auto border-t border-slate-200 pt-4">
                  <div className="text-[10px] font-bold text-slate-400 uppercase mb-1">Digitally Signed By</div>
                  <div className="min-h-[4rem] flex items-center">{renderSignature(existingAsmt.employeeSignature)}</div>
                  <div className="mt-2 text-xs text-slate-400">{existingAsmt.employee?.employeeName} on {formatDate(existingAsmt.employeeSignedAt)}</div>
                </div>
              )}
            </div>
            <div className="p-4 bg-blue-50/50 rounded-lg flex flex-col">
              <div>
                <h3 className="font-bold text-blue-800 mb-2">Manager Feedback</h3>
                <p className="text-blue-700 italic">"{existingAsmt.managerComments || 'Waiting for review...'}"</p>
              </div>
              {existingAsmt.managerSignature && (
                <div className="mt-auto border-t border-blue-200/50 pt-4">
                  <div className="text-[10px] font-bold text-blue-400 uppercase mb-1">Digitally Signed By</div>
                  <div className="min-h-[4rem] flex items-center">{renderSignature(existingAsmt.managerSignature)}</div>
                  <div className="mt-2 text-xs text-blue-500">on {formatDate(existingAsmt.managerSignedAt)}</div>
                </div>
              )}
            </div>
            <div className="p-4 bg-purple-50/50 rounded-lg flex flex-col">
              <div>
                <h3 className="font-bold text-purple-800 mb-2">HR Feedback</h3>
                <p className="text-purple-700 italic">"{existingAsmt.hrComments || 'Waiting for final approval...'}"</p>
              </div>
              {existingAsmt.hrSignature && (
                <div className="mt-auto border-t border-purple-200/50 pt-4">
                  <div className="text-[10px] font-bold text-purple-400 uppercase mb-1">Digitally Signed By</div>
                  <div className="min-h-[4rem] flex items-center">{renderSignature(existingAsmt.hrSignature)}</div>
                  <div className="mt-2 text-xs text-purple-500">on {formatDate(existingAsmt.hrSignedAt)}</div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="header bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
        <h1 className="text-3xl font-extrabold tracking-tight mb-2" style={{ color: PRIMARY }}>Employee Self-assessment Form</h1>
        <p className="text-slate-500">ACE Data Systems Ltd.,</p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Employee Name</span>
            <div className="font-medium text-slate-700">{existingAsmt.employee?.employeeName}</div>
          </div>
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Employee ID</span>
            <div className="font-medium text-slate-700">{user?.employeeId ?? '—'}</div>
          </div>
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Department</span>
            <div className="font-medium text-slate-700">{existingAsmt.employee?.department?.name || 'N/A'}</div>
          </div>
        </div>
      </div>

      <div className="form-container bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 border-b border-slate-200">
                <th className="py-4 px-6 text-left font-semibold" rowSpan={2}>Assessment Subject</th>
                <th className="py-2 px-4 text-center border-l border-slate-200" colSpan={2}>Selection</th>
                <th className="py-2 px-4 text-center border-l border-slate-200" colSpan={5}>Rating</th>
              </tr>
              <tr className="bg-slate-50 text-slate-400 border-b border-slate-200">
                <th className="py-2 px-4 text-center border-l border-slate-200 w-16">Yes</th>
                <th className="py-2 px-4 text-center w-16">No</th>
                <th className="py-2 px-2 text-center border-l border-slate-200 w-10">5</th>
                <th className="py-2 px-2 text-center w-10">4</th>
                <th className="py-2 px-2 text-center w-10">3</th>
                <th className="py-2 px-2 text-center w-10">2</th>
                <th className="py-2 px-2 text-center w-10">1</th>
              </tr>
            </thead>
            <tbody>
              {responses.map((resp) => (
                <tr key={resp.questionId} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                  <td className="py-4 px-6 text-slate-700 font-medium">
                    <div className="flex gap-4">
                      <span className="text-slate-300 font-mono w-4">{resp.questionId}</span>
                      {resp.questionText}
                    </div>
                  </td>
                  <td className="py-2 px-4 text-center border-l border-slate-100">
                    <input
                      type="radio"
                      name={`yn-${resp.questionId}`}
                      checked={resp.answerYesNo === true}
                      onChange={() => handleAnswerChange(resp.questionId, true)}
                      className="w-4 h-4 cursor-pointer accent-blue-600"
                    />
                  </td>
                  <td className="py-2 px-4 text-center border-r border-slate-100">
                    <input
                      type="radio"
                      name={`yn-${resp.questionId}`}
                      checked={resp.answerYesNo === false}
                      onChange={() => handleAnswerChange(resp.questionId, false)}
                      className="w-4 h-4 cursor-pointer accent-red-500"
                    />
                  </td>
                  {[5, 4, 3, 2, 1].map((r) => {
                    const isAllowed = resp.answerYesNo === true ? [3, 4, 5].includes(r) :
                      resp.answerYesNo === false ? [1, 2].includes(r) : false;
                    return (
                      <td key={r} className={`py-2 px-2 text-center ${r === 3 ? 'border-r border-slate-100' : ''}`}>
                        <button
                          disabled={!isAllowed}
                          onClick={() => handleRatingChange(resp.questionId, r)}
                          className={`w-8 h-8 rounded-full border transition-all flex items-center justify-center
                                                ${resp.rating === r
                              ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-200'
                              : isAllowed
                                ? 'border-slate-200 text-slate-400 hover:border-blue-400 hover:text-blue-500'
                                : 'bg-slate-50 border-transparent text-slate-200 cursor-not-allowed'
                            }`}
                        >
                          {r}
                        </button>
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="footer bg-slate-50 p-8 border-t border-slate-200">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-slate-700 uppercase tracking-wide mb-3">Other Remarks</label>
                <textarea
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  className="w-full min-h-[120px] rounded-xl border-slate-300 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 p-4 transition-all"
                  placeholder="Add context for your self-assessment scores..."
                />
              </div>
            </div>

            <div className="space-y-6 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm self-start">
              <div className="flex justify-between items-end border-b border-slate-100 pb-4">
                <div className="space-y-1">
                  <span className="text-slate-400 text-xs font-bold uppercase">Summary</span>
                  <div className="text-2xl font-black text-slate-800">{totalPoints} <span className="text-slate-300 font-normal">Points</span></div>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-black" style={{ color: PRIMARY }}>{totalScore.toFixed(0)}%</div>
                  <div className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">{getRatingCategory(totalScore)}</div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 uppercase tracking-wide mb-3">Employee Signature</label>
                {signature ? (
                  <div className="border border-slate-200 rounded-xl p-4 bg-slate-50 flex items-center justify-between">
                    {renderSignature(signature)}
                    <button onClick={() => { setSignature(''); if (sigCanvas.current) sigCanvas.current.clear(); }} className="text-red-500 text-sm font-medium hover:underline">Clear</button>
                  </div>
                ) : (
                  <div className="border border-slate-200 rounded-xl overflow-hidden">
                    <div className="flex border-b border-slate-200 bg-slate-50">
                      <button onClick={() => setSignatureType('draw')} className={`flex-1 py-2 text-sm font-medium ${signatureType === 'draw' ? 'bg-white text-blue-600 border-b-2 border-blue-600' : 'text-slate-500 hover:text-slate-700'}`}>Draw Signature</button>
                      <button onClick={() => setSignatureType('upload')} className={`flex-1 py-2 text-sm font-medium ${signatureType === 'upload' ? 'bg-white text-blue-600 border-b-2 border-blue-600' : 'text-slate-500 hover:text-slate-700'}`}>Upload File</button>
                    </div>
                    <div className="p-4 bg-white">
                      {signatureType === 'draw' ? (
                        <div className="border border-slate-200 rounded bg-slate-50 relative">
                          <SignatureCanvas 
                            ref={sigCanvas} 
                            onEnd={handleSignatureEnd}
                            canvasProps={{ className: 'w-full h-32 cursor-crosshair' }} 
                          />
                          <button onClick={handleClearSignature} className="absolute top-2 right-2 text-xs text-slate-400 hover:text-red-500 bg-white px-2 py-1 rounded border border-slate-200 shadow-sm">Reset</button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center w-full">
                          <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-slate-300 border-dashed rounded-lg cursor-pointer bg-slate-50 hover:bg-slate-100 transition-colors">
                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                              <i className="bi bi-cloud-arrow-up text-2xl text-slate-400 mb-2"></i>
                              <p className="text-sm text-slate-500"><span className="font-semibold">Click to upload</span> signature file</p>
                              <p className="text-xs text-slate-400 mt-1">Image or Certificate file</p>
                            </div>
                            <input type="file" className="hidden" accept="image/*,.pdf,.p12,.cer,.pem" onChange={handleFileUpload} />
                          </label>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                <p className="mt-2 text-[10px] text-slate-400 italic">By signing above, you confirm that this self-assessment is an honest reflection of your performance.</p>
              </div>

              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="w-full py-4 rounded-xl font-bold text-white transition-all transform active:scale-95 shadow-xl shadow-blue-200"
                style={{ backgroundColor: PRIMARY }}
              >
                {isSubmitting ? 'Submitting...' : 'Finalize & Submit Assessment'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="ratings-legend grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {[
          { range: '86–100', label: 'Outstanding', color: 'bg-emerald-500' },
          { range: '71–85', label: 'Good', color: 'bg-blue-500' },
          { range: '60–70', label: 'Meets Req', color: 'bg-sky-500' },
          { range: '40–59', label: 'Needs Improv', color: 'bg-amber-500' },
          { range: '00–39', label: 'Unsatisfactory', color: 'bg-rose-500' },
        ].map((item) => (
          <div key={item.label} className="bg-white p-4 rounded-xl border border-slate-100 flex items-center gap-4">
            <div className={`w-3 h-3 rounded-full ${item.color}`} />
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{item.range}</div>
              <div className="text-xs font-bold text-slate-700">{item.label}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
