import React, { useState, useEffect } from 'react';
import axios from '../../app/axiosInstance';
import { toast } from 'react-hot-toast';
import {
    Plus,
    Pencil,
    Trash2,
    X,
    AlertTriangle,
    CheckCircle2,
    Layers,
    HelpCircle,
    ChevronRight,
    Search
} from 'lucide-react';

import { APPRAISAL_PRIMARY } from '../../features/appraisals/appraisalTheme';

const PRIMARY = APPRAISAL_PRIMARY;

interface Category {
    id: number;
    name: string;
    description: string;
    status: boolean;
}

interface Question {
    id: number;
    categoryId: number;
    categoryName: string;
    questionText: string;
    answerType: string;
    isRequired: boolean;
    sortOrder: number;
    status: boolean;
}

export default function AppraisalConfigPage() {
    const [activeTab, setActiveTab] = useState<'category' | 'questions'>('category');
    const [categories, setCategories] = useState<Category[]>([]);
    const [questions, setQuestions] = useState<Question[]>([]);
    const [selectedCategoryId, setSelectedCategoryId] = useState<number | ''>('');
    const [isLoading, setIsLoading] = useState(false);

    // Modal states
    const [showCategoryModal, setShowCategoryModal] = useState(false);
    const [showQuestionModal, setShowQuestionModal] = useState(false);
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);
    const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState<{ type: 'category' | 'question', id: number } | null>(null);

    // Form states
    const [categoryForm, setCategoryForm] = useState({ name: '', description: '', status: true });
    const [questionForm, setQuestionForm] = useState({
        categoryId: 0,
        questionText: '',
        answerType: 'Rating (1-5)',
        isRequired: true,
        sortOrder: 0,
        status: true
    });

    useEffect(() => {
        fetchCategories();
    }, []);

    useEffect(() => {
        if (selectedCategoryId) {
            fetchQuestions(selectedCategoryId as number);
        } else {
            setQuestions([]);
        }
    }, [selectedCategoryId]);

    const fetchCategories = async () => {
        try {
            const resp = await axios.get('/appraisal-categories');
            setCategories(resp.data.data || []);
        } catch (err) {
            console.error(err);
            toast.error('Failed to fetch categories');
        }
    };

    const fetchQuestions = async (catId: number) => {
        try {
            const resp = await axios.get(`/appraisal-questions/category/${catId}`);
            setQuestions(resp.data.data || []);
        } catch (err) {
            console.error(err);
            toast.error('Failed to fetch questions');
        }
    };

    // Category Handlers
    const handleOpenCategoryCreate = () => {
        setEditingCategory(null);
        setCategoryForm({ name: '', description: '', status: true });
        setShowCategoryModal(true);
    };

    const handleEditCategory = (cat: Category) => {
        setEditingCategory(cat);
        setCategoryForm({ name: cat.name, description: cat.description || '', status: cat.status });
        setShowCategoryModal(true);
    };

    const handleSaveCategory = async () => {
        if (!categoryForm.name.trim()) {
            toast.error('Category name is required');
            return;
        }
        setIsLoading(true);
        try {
            if (editingCategory) {
                await axios.put(`/appraisal-categories/${editingCategory.id}`, categoryForm);
                toast.success('Category updated');
            } else {
                await axios.post('/appraisal-categories', categoryForm);
                toast.success('Category created');
            }
            setShowCategoryModal(false);
            fetchCategories();
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to save category');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteCategory = async (id: number) => {
        try {
            await axios.delete(`/appraisal-categories/${id}`);
            toast.success('Category deleted');
            setShowDeleteConfirm(null);
            fetchCategories();
            if (selectedCategoryId === id) setSelectedCategoryId('');
        } catch (err) {
            toast.error('Failed to delete category');
        }
    };

    // Question Handlers
    const handleOpenQuestionCreate = () => {
        if (!selectedCategoryId) return;
        setEditingQuestion(null);
        setQuestionForm({
            categoryId: selectedCategoryId as number,
            questionText: '',
            answerType: 'Rating (1-5)',
            isRequired: true,
            sortOrder: questions.length + 1,
            status: true
        });
        setShowQuestionModal(true);
    };

    const handleEditQuestion = (q: Question) => {
        setEditingQuestion(q);
        setQuestionForm({
            categoryId: q.categoryId,
            questionText: q.questionText,
            answerType: q.answerType,
            isRequired: q.isRequired,
            sortOrder: q.sortOrder,
            status: q.status
        });
        setShowQuestionModal(true);
    };

    const handleSaveQuestion = async () => {
        if (!questionForm.questionText.trim()) {
            toast.error('Question text is required');
            return;
        }
        setIsLoading(true);
        try {
            if (editingQuestion) {
                await axios.put(`/appraisal-questions/${editingQuestion.id}`, questionForm);
                toast.success('Question updated');
            } else {
                await axios.post('/appraisal-questions', questionForm);
                toast.success('Question created');
            }
            setShowQuestionModal(false);
            fetchQuestions(selectedCategoryId as number);
        } catch (err) {
            toast.error('Failed to save question');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteQuestion = async (id: number) => {
        try {
            await axios.delete(`/appraisal-questions/${id}`);
            toast.success('Question deleted');
            setShowDeleteConfirm(null);
            fetchQuestions(selectedCategoryId as number);
        } catch (err) {
            toast.error('Failed to delete question');
        }
    };

    return (
        <div className="p-8 space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto">
            {/* Header Section */}
            <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm shadow-slate-200/50">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <h1 className="text-4xl font-black tracking-tight" style={{ color: PRIMARY }}>Appraisal Config</h1>
                        <p className="text-slate-500 mt-2 font-medium">Manage categories and evaluation questions for performance appraisals.</p>
                    </div>
                    <div className="flex bg-slate-100 p-1.5 rounded-2xl">
                        <button
                            onClick={() => setActiveTab('category')}
                            className={`px-6 py-3 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${activeTab === 'category' ? 'bg-white text-[#2463eb] shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            <Layers size={16} />
                            CATEGORIES
                        </button>
                        <button
                            onClick={() => setActiveTab('questions')}
                            className={`px-6 py-3 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${activeTab === 'questions' ? 'bg-white text-[#2463eb] shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            <HelpCircle size={16} />
                            QUESTIONS
                        </button>
                    </div>
                </div>
            </div>

            {/* Content Area */}
            {activeTab === 'category' ? (
                <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm animate-in slide-in-from-bottom-4 duration-500">
                    <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                        <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest pl-2">Appraisal Categories ({categories.length})</h3>
                        <button
                            onClick={handleOpenCategoryCreate}
                            className="flex items-center gap-2 px-4 py-2 bg-[#2463eb] hover:bg-[#1d4ed8] text-white rounded-xl font-bold text-xs transition-all shadow-lg shadow-[#dbeafe] active:scale-95"
                        >
                            <Plus size={16} strokeWidth={3} />
                            ADD CATEGORY
                        </button>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-white text-[10px] font-black uppercase text-slate-400 border-b border-slate-100">
                                    <th className="p-6">Category Name</th>
                                    <th className="p-6">Description</th>
                                    <th className="p-6 w-32 text-center">Status</th>
                                    <th className="p-6 w-40 text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {categories.length === 0 ? (
                                    <tr><td colSpan={4} className="p-16 text-center text-slate-400 italic">No categories found.</td></tr>
                                ) : (
                                    categories.map(cat => (
                                        <tr key={cat.id} className="hover:bg-slate-50/30 transition-colors group">
                                            <td className="p-6">
                                                <div className="text-base font-bold text-slate-700 group-hover:text-slate-900 transition-colors">{cat.name}</div>
                                            </td>
                                            <td className="p-6">
                                                <p className="text-xs text-slate-500 line-clamp-1">{cat.description || '-'}</p>
                                            </td>
                                            <td className="p-6 text-center">
                                                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter border ${cat.status ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-50 text-slate-400 border-slate-100'}`}>
                                                    <div className={`w-1.5 h-1.5 rounded-full ${cat.status ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                                                    {cat.status ? 'Active' : 'Inactive'}
                                                </span>
                                            </td>
                                            <td className="p-6">
                                                <div className="flex justify-center gap-3">
                                                    <button onClick={() => handleEditCategory(cat)} className="w-9 h-9 rounded-lg bg-slate-50 text-slate-400 hover:bg-[#eff6ff] hover:text-[#2463eb] transition-all flex items-center justify-center"><Pencil size={16} /></button>
                                                    <button onClick={() => setShowDeleteConfirm({ type: 'category', id: cat.id })} className="w-9 h-9 rounded-lg bg-slate-50 text-slate-400 hover:bg-red-50 hover:text-red-600 transition-all flex items-center justify-center"><Trash2 size={16} /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="md:col-span-1 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4 h-fit sticky top-8">
                            <div className="space-y-1">
                                <h4 className="text-sm font-black text-slate-800">Select Category</h4>
                                <p className="text-[10px] font-bold text-slate-400 uppercase">To manage questions</p>
                            </div>
                            <div className="space-y-2">
                                {categories.map(cat => (
                                    <button
                                        key={cat.id}
                                        onClick={() => setSelectedCategoryId(cat.id)}
                                        className={`w-full flex items-center justify-between p-4 rounded-2xl border-2 transition-all group ${selectedCategoryId === cat.id ? 'border-[#2463eb] bg-[#eff6ff]/50 text-[#1d4ed8]' : 'border-slate-100 hover:border-slate-200 text-slate-600'}`}
                                    >
                                        <span className="text-xs font-black uppercase text-left">{cat.name}</span>
                                        <ChevronRight size={16} className={`transition-transform ${selectedCategoryId === cat.id ? 'translate-x-1' : 'opacity-0 group-hover:opacity-100'}`} />
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="md:col-span-2 bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm flex flex-col h-fit">
                            <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                                <div>
                                    <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest pl-2">Evaluation Questions ({questions.length})</h3>
                                </div>
                                <button
                                    disabled={!selectedCategoryId}
                                    onClick={handleOpenQuestionCreate}
                                    className="flex items-center gap-2 px-4 py-2 bg-[#2463eb] hover:bg-[#1d4ed8] disabled:opacity-50 disabled:grayscale text-white rounded-xl font-bold text-xs transition-all shadow-lg shadow-[#dbeafe] active:scale-95"
                                >
                                    <Plus size={16} strokeWidth={3} />
                                    ADD QUESTION
                                </button>
                            </div>
                            <div className="overflow-x-auto">
                                {!selectedCategoryId ? (
                                    <div className="p-24 text-center space-y-4">
                                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-300">
                                            <Search size={32} />
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-sm font-black text-slate-400 uppercase">No Category Selected</p>
                                            <p className="text-xs font-medium text-slate-300">Please select a category from the left to manage questions.</p>
                                        </div>
                                    </div>
                                ) : (
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="bg-white text-[10px] font-black uppercase text-slate-400 border-b border-slate-100">
                                                <th className="p-6 w-16 text-center">#</th>
                                                <th className="p-6">Question Text</th>
                                                <th className="p-6 w-32">Type</th>
                                                <th className="p-6 w-40 text-center">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50">
                                            {questions.length === 0 ? (
                                                <tr><td colSpan={4} className="p-16 text-center text-slate-400 italic">No questions found for this category.</td></tr>
                                            ) : (
                                                questions.map(q => (
                                                    <tr key={q.id} className="hover:bg-slate-50/30 transition-colors group">
                                                        <td className="p-6 text-center font-black text-slate-300">#{q.sortOrder}</td>
                                                        <td className="p-6">
                                                            <div className="text-sm font-bold text-slate-700 leading-relaxed">{q.questionText}</div>
                                                            {q.isRequired && <span className="text-[10px] font-black text-red-500 uppercase mt-1 inline-block">* Required</span>}
                                                        </td>
                                                        <td className="p-6">
                                                            <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded-lg text-[10px] font-black uppercase">{q.answerType}</span>
                                                        </td>
                                                        <td className="p-6 text-center">
                                                            <div className="flex justify-center gap-3">
                                                                <button onClick={() => handleEditQuestion(q)} className="w-9 h-9 rounded-lg bg-slate-50 text-slate-400 hover:bg-[#eff6ff] hover:text-[#2463eb] transition-all flex items-center justify-center"><Pencil size={16} /></button>
                                                                <button onClick={() => setShowDeleteConfirm({ type: 'question', id: q.id })} className="w-9 h-9 rounded-lg bg-slate-50 text-slate-400 hover:bg-red-50 hover:text-red-600 transition-all flex items-center justify-center"><Trash2 size={16} /></button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Category Modal */}
            {showCategoryModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => !isLoading && setShowCategoryModal(false)} />
                    <div className="relative bg-white w-full max-w-lg rounded-[32px] shadow-2xl animate-in zoom-in-95 duration-300 overflow-hidden">
                        <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                            <h3 className="font-black text-slate-800 text-lg">{editingCategory ? 'EDIT CATEGORY' : 'NEW CATEGORY'}</h3>
                            <button onClick={() => setShowCategoryModal(false)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
                        </div>
                        <div className="p-8 space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Category Name</label>
                                <input
                                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-3 text-sm font-bold text-slate-700 outline-none focus:border-[#2463eb] transition-all"
                                    value={categoryForm.name}
                                    onChange={e => setCategoryForm({ ...categoryForm, name: e.target.value })}
                                    placeholder="e.g. Core Skills"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Description</label>
                                <textarea
                                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-3 text-sm font-bold text-slate-700 outline-none focus:border-[#2463eb] transition-all h-32"
                                    value={categoryForm.description}
                                    onChange={e => setCategoryForm({ ...categoryForm, description: e.target.value })}
                                    placeholder="Optional description..."
                                />
                            </div>
                            <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border-2 border-slate-100">
                                <div className={`w-10 h-6 rounded-full relative transition-all cursor-pointer ${categoryForm.status ? 'bg-emerald-500' : 'bg-slate-300'}`} onClick={() => setCategoryForm({ ...categoryForm, status: !categoryForm.status })}>
                                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${categoryForm.status ? 'left-5' : 'left-1'}`} />
                                </div>
                                <span className="text-xs font-black uppercase text-slate-500">{categoryForm.status ? 'Active' : 'Inactive'}</span>
                            </div>
                        </div>
                        <div className="p-6 bg-slate-50 border-t border-slate-100 flex gap-3">
                            <button onClick={() => setShowCategoryModal(false)} className="flex-1 py-4 bg-white border border-slate-200 text-slate-500 rounded-2xl font-black text-xs hover:bg-slate-100 transition-all">CANCEL</button>
                            <button onClick={handleSaveCategory} disabled={isLoading} className="flex-[2] py-4 bg-[#2463eb] text-white rounded-2xl font-black text-xs shadow-xl shadow-[#dbeafe] hover:bg-[#1d4ed8] transition-all flex items-center justify-center gap-2">
                                {isLoading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <CheckCircle2 size={16} />}
                                <span>{editingCategory ? 'UPDATE CATEGORY' : 'CREATE CATEGORY'}</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Question Modal */}
            {showQuestionModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => !isLoading && setShowQuestionModal(false)} />
                    <div className="relative bg-white w-full max-w-xl rounded-[32px] shadow-2xl animate-in zoom-in-95 duration-300 overflow-hidden">
                        <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                            <h3 className="font-black text-slate-800 text-lg">{editingQuestion ? 'EDIT QUESTION' : 'NEW QUESTION'}</h3>
                            <button onClick={() => setShowQuestionModal(false)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
                        </div>
                        <div className="p-8 space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Question Content</label>
                                <textarea
                                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-4 text-sm font-bold text-slate-700 outline-none focus:border-[#2463eb] transition-all h-32"
                                    value={questionForm.questionText}
                                    onChange={e => setQuestionForm({ ...questionForm, questionText: e.target.value })}
                                    placeholder="Enter appraisal question..."
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Answer Type</label>
                                    <select
                                        className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-3 text-sm font-bold text-slate-700 outline-none focus:border-[#2463eb] transition-all appearance-none"
                                        value={questionForm.answerType}
                                        onChange={e => setQuestionForm({ ...questionForm, answerType: e.target.value })}
                                    >
                                        <option value="Rating (1-5)">Rating (1-5)</option>
                                        <option value="Yes/No">Yes/No</option>
                                        <option value="Text (Long Answer)">Text (Long Answer)</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Sort Order</label>
                                    <input
                                        type="number"
                                        className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-3 text-sm font-bold text-slate-700 outline-none focus:border-[#2463eb] transition-all"
                                        value={questionForm.sortOrder}
                                        onChange={e => setQuestionForm({ ...questionForm, sortOrder: parseInt(e.target.value) || 0 })}
                                    />
                                </div>
                            </div>
                            <div className="flex items-center justify-between gap-4">
                                <label className="flex-1 flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border-2 border-slate-100 cursor-pointer">
                                    <input type="checkbox" className="w-5 h-5 rounded-lg text-[#2463eb] focus:ring-0" checked={questionForm.isRequired} onChange={e => setQuestionForm({ ...questionForm, isRequired: e.target.checked })} />
                                    <span className="text-xs font-black uppercase text-slate-500">Required</span>
                                </label>
                                <label className="flex-1 flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border-2 border-slate-100 cursor-pointer">
                                    <input type="checkbox" className="w-5 h-5 rounded-lg text-emerald-600 focus:ring-0" checked={questionForm.status} onChange={e => setQuestionForm({ ...questionForm, status: e.target.checked })} />
                                    <span className="text-xs font-black uppercase text-slate-500">Active</span>
                                </label>
                            </div>
                        </div>
                        <div className="p-6 bg-slate-50 border-t border-slate-100 flex gap-3">
                            <button onClick={() => setShowQuestionModal(false)} className="flex-1 py-4 bg-white border border-slate-200 text-slate-500 rounded-2xl font-black text-xs hover:bg-slate-100 transition-all">CANCEL</button>
                            <button onClick={handleSaveQuestion} disabled={isLoading} className="flex-[2] py-4 bg-[#2463eb] text-white rounded-2xl font-black text-xs shadow-xl shadow-[#dbeafe] hover:bg-[#1d4ed8] transition-all flex items-center justify-center gap-2">
                                {isLoading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <CheckCircle2 size={16} />}
                                <span>{editingQuestion ? 'UPDATE QUESTION' : 'CREATE QUESTION'}</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setShowDeleteConfirm(null)} />
                    <div className="relative bg-white w-full max-w-sm rounded-[32px] shadow-2xl p-8 animate-in zoom-in-95 duration-300 text-center space-y-6">
                        <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto shadow-inner">
                            <AlertTriangle size={40} />
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-xl font-black text-slate-800">Confirm Deletion?</h3>
                            <p className="text-sm text-slate-500 font-medium px-4">This action cannot be undone. Are you sure you want to delete this {showDeleteConfirm.type}?</p>
                        </div>
                        <div className="flex gap-3">
                            <button onClick={() => setShowDeleteConfirm(null)} className="flex-1 py-4 bg-slate-50 text-slate-500 rounded-2xl font-black text-xs hover:bg-slate-100 transition-all">NO, CANCEL</button>
                            <button
                                onClick={() => showDeleteConfirm.type === 'category' ? handleDeleteCategory(showDeleteConfirm.id) : handleDeleteQuestion(showDeleteConfirm.id)}
                                className="flex-1 py-4 bg-red-500 text-white rounded-2xl font-black text-xs shadow-lg shadow-red-200 hover:bg-red-600 transition-all active:scale-95"
                            >
                                YES, DELETE
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
