import React, { useState, useEffect } from 'react';
import axios from '../../app/axiosInstance';
import { toast } from 'react-hot-toast';
import { Plus, Pencil, Trash2, X, CheckCircle2, ChevronRight, Hash, Type, HelpCircle } from 'lucide-react';

const PRIMARY = '#0855BF';

interface Category {
    id: number;
    name: string;
    description: string;
    status: boolean;
}

interface Question {
    id?: number;
    categoryId: number;
    questionText: string;
    answerType: string;
    isRequired: boolean;
    sortOrder: number;
    status: boolean;
}

export function AppraisalsPage() {
    const [activeTab, setActiveTab] = useState<'category' | 'questions'>('category');
    
    // Category State
    const [categories, setCategories] = useState<Category[]>([]);
    const [showCatModal, setShowCatModal] = useState(false);
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);
    const [catForm, setCatForm] = useState({ name: '', description: '', status: true });
    
    // Questions State
    const [questions, setQuestions] = useState<Question[]>([]);
    const [selectedCategoryId, setSelectedCategoryId] = useState<number | ''>('');
    const [showQueModal, setShowQueModal] = useState(false);
    const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
    const [queForm, setQueForm] = useState<Question>({
        categoryId: 0,
        questionText: '',
        answerType: 'TEXT',
        isRequired: true,
        sortOrder: 0,
        status: true
    });

    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        fetchCategories();
    }, []);

    useEffect(() => {
        if (selectedCategoryId) {
            fetchQuestions(Number(selectedCategoryId));
        } else {
            setQuestions([]);
        }
    }, [selectedCategoryId]);

    const fetchCategories = async () => {
        try {
            const resp = await axios.get('/appraisal-categories');
            setCategories(resp.data.data || []);
        } catch (err) {
            toast.error('Failed to fetch categories');
        }
    };

    const fetchQuestions = async (catId: number) => {
        try {
            const resp = await axios.get(`/appraisal-questions/category/${catId}`);
            setQuestions(resp.data.data || []);
        } catch (err) {
            toast.error('Failed to fetch questions');
        }
    };

    // Category Handlers
    const handleSaveCategory = async () => {
        if (!catForm.name.trim()) {
            toast.error('Category name is required');
            return;
        }
        setIsLoading(true);
        try {
            if (editingCategory) {
                await axios.put(`/appraisal-categories/${editingCategory.id}`, catForm);
                toast.success('Category updated');
            } else {
                await axios.post('/appraisal-categories', catForm);
                toast.success('Category created');
            }
            setShowCatModal(false);
            fetchCategories();
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to save category');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteCategory = async (id: number) => {
        if (!window.confirm('Delete this category and all its questions?')) return;
        try {
            await axios.delete(`/appraisal-categories/${id}`);
            toast.success('Category deleted');
            fetchCategories();
            if (selectedCategoryId === id) setSelectedCategoryId('');
        } catch (err) {
            toast.error('Failed to delete category');
        }
    };

    // Question Handlers
    const handleSaveQuestion = async () => {
        if (!queForm.questionText.trim()) {
            toast.error('Question text is required');
            return;
        }
        setIsLoading(true);
        try {
            const payload = { ...queForm, categoryId: Number(selectedCategoryId) };
            if (editingQuestion) {
                await axios.put(`/appraisal-questions/${editingQuestion.id}`, payload);
                toast.success('Question updated');
            } else {
                await axios.post('/appraisal-questions', payload);
                toast.success('Question added');
            }
            setShowQueModal(false);
            fetchQuestions(Number(selectedCategoryId));
        } catch (err) {
            toast.error('Failed to save question');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteQuestion = async (id: number) => {
        if (!window.confirm('Delete this question?')) return;
        try {
            await axios.delete(`/appraisal-questions/${id}`);
            toast.success('Question deleted');
            fetchQuestions(Number(selectedCategoryId));
        } catch (err) {
            toast.error('Failed to delete question');
        }
    };

    return (
        <div className="p-8 space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-8 rounded-3xl border border-slate-100 shadow-sm shadow-slate-200/50">
                <div>
                    <h1 className="text-4xl font-black tracking-tight" style={{ color: PRIMARY }}>Appraisals Management</h1>
                    <p className="text-slate-500 mt-2 font-medium">Configure performance appraisal categories and their specific questions.</p>
                </div>
                <div className="flex bg-slate-100 p-1.5 rounded-2xl">
                    <button 
                        onClick={() => setActiveTab('category')}
                        className={`px-6 py-3 rounded-xl text-xs font-black transition-all ${activeTab === 'category' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        CATEGORY
                    </button>
                    <button 
                        onClick={() => setActiveTab('questions')}
                        className={`px-6 py-3 rounded-xl text-xs font-black transition-all ${activeTab === 'questions' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        QUESTIONS
                    </button>
                </div>
            </div>

            {activeTab === 'category' ? (
                <div className="space-y-6">
                    <div className="flex justify-end">
                        <button 
                            onClick={() => { setEditingCategory(null); setCatForm({ name: '', description: '', status: true }); setShowCatModal(true); }}
                            className="flex items-center gap-2 px-5 py-3 bg-blue-600 text-white rounded-2xl font-black text-xs hover:bg-blue-700 transition-all shadow-lg shadow-blue-100"
                        >
                            <Plus size={16} /> ADD CATEGORY
                        </button>
                    </div>

                    <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 text-[10px] font-black uppercase text-slate-400 border-b border-slate-100">
                                    <th className="p-6 w-20 text-center">#</th>
                                    <th className="p-6">Category Name</th>
                                    <th className="p-6">Description</th>
                                    <th className="p-6 text-center">Status</th>
                                    <th className="p-6 text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {categories.map((cat, index) => (
                                    <tr key={cat.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="p-6 text-center font-black text-slate-300">#{index + 1}</td>
                                        <td className="p-6 font-bold text-slate-700">{cat.name}</td>
                                        <td className="p-6 text-xs text-slate-500">{cat.description}</td>
                                        <td className="p-6 text-center">
                                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${cat.status ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                                                {cat.status ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td className="p-6 flex justify-center gap-2">
                                            <button onClick={() => { setEditingCategory(cat); setCatForm({ ...cat }); setShowCatModal(true); }} className="p-2 hover:bg-blue-50 text-slate-400 hover:text-blue-600 rounded-lg transition-colors"><Pencil size={16}/></button>
                                            <button onClick={() => handleDeleteCategory(cat.id)} className="p-2 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded-lg transition-colors"><Trash2 size={16}/></button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                        <div className="relative group">
                            <select 
                                value={selectedCategoryId}
                                onChange={(e) => setSelectedCategoryId(e.target.value ? Number(e.target.value) : '')}
                                className="w-full bg-white border-2 border-slate-100 rounded-2xl px-5 py-4 text-sm font-bold text-slate-700 appearance-none focus:border-blue-500 transition-all outline-none pr-12 shadow-sm"
                            >
                                <option value="">Select Category to View Questions...</option>
                                {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                            </select>
                            <ChevronRight className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 rotate-90" size={18} />
                        </div>
                        <div className="flex justify-end">
                            <button 
                                disabled={!selectedCategoryId}
                                onClick={() => { setEditingQuestion(null); setQueForm({ categoryId: Number(selectedCategoryId), questionText: '', answerType: 'TEXT', isRequired: true, sortOrder: questions.length + 1, status: true }); setShowQueModal(true); }}
                                className="flex items-center gap-2 px-5 py-4 bg-blue-600 text-white rounded-2xl font-black text-xs hover:bg-blue-700 transition-all shadow-xl shadow-blue-100 disabled:opacity-50 disabled:shadow-none"
                            >
                                <Plus size={18} /> ADD NEW QUESTION
                            </button>
                        </div>
                    </div>

                    {!selectedCategoryId ? (
                        <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-[32px] p-24 text-center space-y-4">
                            <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center mx-auto shadow-sm text-slate-300">
                                <HelpCircle size={40} />
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-slate-400">No Category Selected</h3>
                                <p className="text-slate-400 font-medium">Please select a category from the dropdown above to manage its questions.</p>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50 text-[10px] font-black uppercase text-slate-400 border-b border-slate-100">
                                        <th className="p-6 w-16 text-center">#</th>
                                        <th className="p-6">Question Text</th>
                                        <th className="p-6 text-center">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {questions.length === 0 ? (
                                        <tr><td colSpan={3} className="p-12 text-center text-slate-400 font-bold italic">No questions found for this category.</td></tr>
                                    ) : (
                                        questions.map((q, index) => (
                                            <tr key={q.id} className="hover:bg-slate-50/50 transition-colors">
                                                <td className="p-6 text-center font-black text-slate-300">#{index + 1}</td>
                                                <td className="p-6 font-bold text-slate-700">{q.questionText}</td>
                                                <td className="p-6 flex justify-center gap-2">
                                                    <button onClick={() => { setEditingQuestion(q); setQueForm({ ...q }); setShowQueModal(true); }} className="p-2 hover:bg-blue-50 text-slate-400 hover:text-blue-600 rounded-lg transition-colors"><Pencil size={16}/></button>
                                                    <button onClick={() => handleDeleteQuestion(q.id!)} className="p-2 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded-lg transition-colors"><Trash2 size={16}/></button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* Category Modal */}
            {showCatModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
                    <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95">
                        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                            <h3 className="font-black text-slate-800">{editingCategory ? 'EDIT CATEGORY' : 'NEW CATEGORY'}</h3>
                            <button onClick={() => setShowCatModal(false)} className="text-slate-400 hover:text-slate-600"><X size={20}/></button>
                        </div>
                        <div className="p-8 space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Name</label>
                                <input className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-3 text-sm font-bold outline-none focus:border-blue-500 transition-all" value={catForm.name} onChange={e => setCatForm({...catForm, name: e.target.value})} />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Description</label>
                                <textarea className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-4 text-sm font-bold outline-none focus:border-blue-500 transition-all h-24" value={catForm.description} onChange={e => setCatForm({...catForm, description: e.target.value})} />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Status</label>
                                <div className="flex flex-col justify-end h-[46px]">
                                    <label className="group flex items-center gap-3 p-3 bg-slate-50 border-2 border-slate-100 rounded-2xl cursor-pointer hover:bg-white hover:border-blue-100 transition-all">
                                        <div className={`w-10 h-6 rounded-full relative transition-all ${catForm.status ? 'bg-emerald-500' : 'bg-slate-300'}`}>
                                            <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${catForm.status ? 'left-5' : 'left-1'}`} />
                                        </div>
                                        <input
                                            type="checkbox"
                                            className="hidden"
                                            checked={catForm.status}
                                            onChange={e => setCatForm({ ...catForm, status: e.target.checked })}
                                        />
                                        <span className={`text-xs font-black uppercase ${catForm.status ? 'text-emerald-600' : 'text-slate-400'}`}>
                                            {catForm.status ? 'Active' : 'Inactive'}
                                        </span>
                                    </label>
                                </div>
                            </div>
                        </div>
                        <div className="p-6 bg-slate-50 border-t border-slate-100 flex gap-3">
                            <button onClick={() => setShowCatModal(false)} className="flex-1 py-3 bg-white border-2 border-slate-100 rounded-2xl font-black text-xs">CANCEL</button>
                            <button onClick={handleSaveCategory} disabled={isLoading} className="flex-[2] py-3 bg-blue-600 text-white rounded-2xl font-black text-xs shadow-lg shadow-blue-100">SAVE CATEGORY</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Question Modal */}
            {showQueModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
                    <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95">
                        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                            <h3 className="font-black text-slate-800">{editingQuestion ? 'EDIT QUESTION' : 'NEW QUESTION'}</h3>
                            <button onClick={() => setShowQueModal(false)} className="text-slate-400 hover:text-slate-600"><X size={20}/></button>
                        </div>
                        <div className="p-8 space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Question Text</label>
                                <textarea className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-4 text-sm font-bold outline-none focus:border-blue-500 transition-all h-24" value={queForm.questionText} onChange={e => setQueForm({...queForm, questionText: e.target.value})} />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Status</label>
                                <div className="flex flex-col justify-end h-[46px]">
                                    <label className="group flex items-center gap-3 p-3 bg-slate-50 border-2 border-slate-100 rounded-2xl cursor-pointer hover:bg-white hover:border-blue-100 transition-all">
                                        <div className={`w-10 h-6 rounded-full relative transition-all ${queForm.status ? 'bg-emerald-500' : 'bg-slate-300'}`}>
                                            <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${queForm.status ? 'left-5' : 'left-1'}`} />
                                        </div>
                                        <input
                                            type="checkbox"
                                            className="hidden"
                                            checked={queForm.status}
                                            onChange={e => setQueForm({ ...queForm, status: e.target.checked })}
                                        />
                                        <span className={`text-xs font-black uppercase ${queForm.status ? 'text-emerald-600' : 'text-slate-400'}`}>
                                            {queForm.status ? 'Active' : 'Inactive'}
                                        </span>
                                    </label>
                                </div>
                            </div>
                        </div>
                        <div className="p-6 bg-slate-50 border-t border-slate-100 flex gap-3">
                            <button onClick={() => setShowQueModal(false)} className="flex-1 py-3 bg-white border-2 border-slate-100 rounded-2xl font-black text-xs">CANCEL</button>
                            <button onClick={handleSaveQuestion} disabled={isLoading} className="flex-[2] py-3 bg-blue-600 text-white rounded-2xl font-black text-xs shadow-lg shadow-blue-100">SAVE QUESTION</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
