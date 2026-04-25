import React, { useState, useEffect } from 'react';
import axios from '../../app/axiosInstance';
import { toast } from 'react-hot-toast';
import {
    DndContext,
    PointerSensor,
    KeyboardSensor,
    closestCenter,
    useSensor,
    useSensors,
    type DragEndEvent,
} from '@dnd-kit/core';
import {
    SortableContext,
    useSortable,
    arrayMove,
    verticalListSortingStrategy,
    sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Plus, Pencil, Trash2, X, CheckCircle2, ChevronRight, HelpCircle, GripVertical, Download, RotateCcw } from 'lucide-react';

const PRIMARY = '#0855BF';

interface Category {
    id?: number;
    name: string;
    description: string;
    status: boolean;
    sortOrder: number;
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

interface SortableCategoryRowProps {
    category: Category;
    index: number;
    isConfirmed: boolean;
    onConfirm: (id: number) => void;
    onEdit: (c: Category) => void;
    onDelete: (id: number) => void;
}

function SortableCategoryRow({ category, index, isConfirmed, onConfirm, onEdit, onDelete }: SortableCategoryRowProps) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: category.id! });
    const style = { transform: CSS.Translate.toString(transform), transition, zIndex: isDragging ? 20 : 0, opacity: isDragging ? 0.3 : 1 };

    return (
        <tr ref={setNodeRef} style={style} className={`bg-white hover:bg-slate-50 border-b border-slate-50 group ${isDragging ? 'shadow-2xl relative z-20' : ''}`}>
            <td className="p-6 text-center">
                <div className="flex items-center justify-center gap-3">
                    <button {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing p-2 text-slate-300 hover:text-blue-400 transition-colors">
                        <GripVertical size={20} />
                    </button>
                    <span className="font-black text-slate-300 text-lg group-hover:text-blue-200">#{index + 1}</span>
                </div>
            </td>
            <td className="p-6">
                <div className="font-black text-slate-700 group-hover:text-blue-600 transition-colors uppercase tracking-tight">{category.name}</div>
                <div className="text-xs text-slate-400 mt-1 font-medium">{category.description}</div>
            </td>
            <td className="p-6 text-center">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tight shadow-sm border ${category.status ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-50 text-slate-400 border-slate-100'}`}>
                    <div className={`w-1.5 h-1.5 rounded-full ${category.status ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                    {category.status ? 'Active' : 'Inactive'}
                </span>
            </td>
            <td className="p-6 text-center">
                <div className="flex items-center justify-center gap-2">
                    <button
                        onClick={() => onConfirm(category.id!)}
                        className={`w-10 h-10 rounded-xl transition-all flex items-center justify-center ${isConfirmed ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-200' : 'bg-slate-50 text-slate-400 hover:bg-emerald-50 hover:text-emerald-600'}`}
                        title={isConfirmed ? "Confirmed" : "Add to Appraisal"}
                    >
                        <CheckCircle2 size={18} />
                    </button>
                    <button onClick={() => onEdit(category)} className="w-10 h-10 rounded-xl bg-slate-50 text-slate-400 hover:bg-blue-50 hover:text-blue-600 transition-all flex items-center justify-center"><Pencil size={18} /></button>
                    <button onClick={() => onDelete(category.id!)} className="w-10 h-10 rounded-xl bg-slate-50 text-slate-400 hover:bg-red-50 hover:text-red-600 transition-all flex items-center justify-center"><Trash2 size={18} /></button>
                </div>
            </td>
        </tr>
    );
}


interface SortableQuestionRowProps {
    question: Question;
    index: number;
    onEdit: (q: Question) => void;
    onDelete: (id: number) => void;
}

function SortableQuestionRow({ question, index, onEdit, onDelete }: SortableQuestionRowProps) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: question.id! });
    const style = { transform: CSS.Translate.toString(transform), transition, zIndex: isDragging ? 20 : 0, opacity: isDragging ? 0.3 : 1 };

    return (
        <tr ref={setNodeRef} style={style} className={`bg-white hover:bg-slate-50 border-b border-slate-50 group ${isDragging ? 'shadow-2xl relative z-20' : ''}`}>
            <td className="p-6 text-center">
                <div className="flex items-center justify-center gap-3">
                    <button {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing p-2 text-slate-300 hover:text-blue-400 transition-colors">
                        <GripVertical size={20} />
                    </button>
                    <span className="font-black text-slate-300 text-lg group-hover:text-blue-200">#{index + 1}</span>
                </div>
            </td>
            <td className="p-6">
                <div className="font-bold text-slate-700 leading-relaxed">{question.questionText}</div>
            </td>
            <td className="p-6 text-center">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tight shadow-sm border ${question.status ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-50 text-slate-400 border-slate-100'}`}>
                    <div className={`w-1.5 h-1.5 rounded-full ${question.status ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                    {question.status ? 'Active' : 'Inactive'}
                </span>
            </td>
            <td className="p-6 text-center">
                <div className="flex items-center justify-center gap-2">
                    <button onClick={() => onEdit(question)} className="w-10 h-10 rounded-xl bg-slate-50 text-slate-400 hover:bg-blue-50 hover:text-blue-600 transition-all flex items-center justify-center"><Pencil size={18} /></button>
                    <button onClick={() => onDelete(question.id!)} className="w-10 h-10 rounded-xl bg-slate-50 text-slate-400 hover:bg-red-50 hover:text-red-600 transition-all flex items-center justify-center"><Trash2 size={18} /></button>
                </div>
            </td>
        </tr>
    );
}

interface ConfirmedAppraisalViewProps {
    categories: Category[]; // Selected categories
    allAvailableCategories: Category[]; // All categories in system
    onAdd: (id: number) => void;
    onRemove: (id: number) => void;
    onConfirm: () => void;
    isFinalizedView?: boolean;
    onReset?: () => void;
}

function ConfirmedAppraisalView({ categories, allAvailableCategories, onAdd, onRemove, onConfirm, onReset, isFinalizedView = false }: ConfirmedAppraisalViewProps) {
    const [allQuestions, setAllQuestions] = useState<Record<number, Question[]>>({});
    const [showPicker, setShowPicker] = useState(false);

    // Filter out already selected categories
    const availableToPick = allAvailableCategories.filter(ac => !categories.find(c => c.id === ac.id));

    useEffect(() => {
        // Fetch questions for each category
        categories.forEach(async (cat) => {
            if (!allQuestions[cat.id!]) {
                try {
                    const resp = await axios.get(`/appraisal-questions/category/${cat.id}`);
                    setAllQuestions(prev => ({
                        ...prev,
                        [cat.id!]: resp.data.data || []
                    }));
                } catch (err) {
                    console.error("Failed to fetch questions for category", cat.id, err);
                }
            }
        });
    }, [categories]);

    let globalIndex = 1;

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Print Title (Optional, just the name of the form) */}
            <div className="hidden print:block mb-6 text-center">
                <h1 className="text-xl font-black text-slate-900 uppercase">Performance Appraisal Form</h1>
            </div>

            {/* Action Bar - Hidden in Print */}
            <div className="flex flex-col md:flex-row justify-between items-center bg-white p-6 rounded-3xl border border-slate-100 shadow-sm gap-4 print:hidden">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center">
                        <CheckCircle2 size={24} />
                    </div>
                    <div>
                        <h3 className="font-black text-slate-800 uppercase tracking-tight">Review Appraisal</h3>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                            {categories.length} Categories Selected • {Object.values(allQuestions).flat().length} Questions Total
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto">
                    {!isFinalizedView && (
                        <div className="relative flex-1 md:w-64">
                            <button
                                onClick={() => setShowPicker(!showPicker)}
                                className="w-full flex items-center justify-between px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl font-black text-[10px] text-slate-400 uppercase tracking-widest hover:border-blue-400 hover:bg-white hover:text-blue-500 transition-all group"
                            >
                                <span>Pick a Category...</span>
                                <Plus size={16} className="text-slate-300 group-hover:text-blue-500 transition-colors" />
                            </button>

                            {showPicker && (
                                <div className="absolute top-full left-0 right-0 mt-3 bg-white/90 backdrop-blur-xl border border-slate-200 rounded-[2rem] shadow-2xl z-50 max-h-64 overflow-y-auto animate-in fade-in slide-in-from-top-2 p-2">
                                    {availableToPick.length === 0 ? (
                                        <p className="p-4 text-[10px] font-black text-slate-300 uppercase text-center">All categories picked</p>
                                    ) : (
                                        availableToPick.map(ac => (
                                            <button
                                                key={ac.id}
                                                onClick={() => { onAdd(ac.id!); setShowPicker(false); }}
                                                className="w-full text-left p-4 hover:bg-blue-600 hover:text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all mb-1 last:mb-0"
                                            >
                                                {ac.name}
                                            </button>
                                        ))
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {!isFinalizedView ? (
                        <button
                            onClick={onConfirm}
                            disabled={categories.length === 0}
                            className="flex items-center gap-3 px-8 py-3.5 bg-gradient-to-r from-emerald-500 via-teal-600 to-blue-600 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest hover:scale-[1.02] hover:shadow-[0_20px_40px_rgba(16,185,129,0.2)] active:scale-[0.98] transition-all shadow-xl shadow-emerald-100 disabled:opacity-50 disabled:grayscale group"
                        >
                            <CheckCircle2 size={18} strokeWidth={3} className="group-hover:rotate-12 transition-transform" /> 
                            <span>Confirm & Finalize</span>
                        </button>
                    ) : (
                        <div className="flex items-center gap-3">
                            <button
                                onClick={onReset}
                                className="flex items-center gap-3 px-8 py-3.5 bg-white border-2 border-slate-100 text-slate-400 rounded-2xl font-black text-[11px] uppercase tracking-widest hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50/50 transition-all shadow-sm"
                            >
                                <RotateCcw size={18} /> <span>Modify / Edit</span>
                            </button>
                            <button
                                onClick={() => window.print()}
                                className="flex items-center gap-3 px-8 py-3.5 bg-slate-900 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-slate-800 hover:shadow-[0_20px_40px_rgba(15,23,42,0.2)] active:scale-[0.98] transition-all shadow-xl shadow-slate-100 whitespace-nowrap"
                            >
                                <Download size={18} /> <span>Export PDF</span>
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Premium Table Container */}
            <div className="bg-white rounded-[2rem] border border-slate-200 overflow-hidden shadow-[0_20px_50px_rgba(8,117,191,0.05)] print:border-slate-800 print:rounded-none print:shadow-none print:border-2">
                <table className="w-full border-separate border-spacing-0">
                    <thead>
                        <tr className="bg-gradient-to-r from-[#0855BF] to-[#0a66e6] print:from-white print:to-white print:text-black">
                            <th className="p-5 text-[11px] font-black uppercase tracking-[0.2em] text-blue-100 text-center w-28 border-b border-blue-400/20 print:text-slate-900 print:border-slate-800 print:border-b-2">Category</th>
                            <th className="p-5 text-[11px] font-black uppercase tracking-[0.2em] text-blue-100 text-center w-16 border-b border-blue-400/20 border-l border-blue-400/10 print:text-slate-900 print:border-slate-800 print:border-b-2 print:border-l-2">No.</th>
                            <th className="p-5 text-[11px] font-black uppercase tracking-[0.2em] text-blue-100 text-left border-b border-blue-400/20 border-l border-blue-400/10 print:text-slate-900 print:border-slate-800 print:border-b-2 print:border-l-2">Evaluation Criteria & Performance Indicators</th>
                            {!isFinalizedView && (
                                <th className="p-5 text-[11px] font-black uppercase tracking-[0.2em] text-blue-100 text-center w-24 border-b border-blue-400/20 border-l border-blue-400/10">Action</th>
                            )}
                        </tr>
                    </thead>
                    <tbody className="">
                        {categories.length === 0 ? (
                            <tr>
                                <td colSpan={4} className="p-24 text-center">
                                    <div className="flex flex-col items-center gap-4">
                                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-200">
                                            <HelpCircle size={32} />
                                        </div>
                                        <p className="text-sm font-black text-slate-300 uppercase tracking-widest italic">
                                            No categories selected. Go to CATEGORY tab to select.
                                        </p>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            categories.map((cat) => {
                                const qList = allQuestions[cat.id!] || [];
                                return (
                                    <React.Fragment key={cat.id}>
                                        {qList.length > 0 ? (
                                            qList.map((q, idx) => {
                                                const currentIndex = globalIndex++;
                                                return (
                                                    <tr key={q.id} className="group transition-all hover:bg-blue-50/30">
                                                        {idx === 0 && (
                                                            <td
                                                                rowSpan={qList.length}
                                                                className="p-0 border-r border-slate-100 bg-slate-50/40 align-middle w-28 relative group-hover:bg-blue-50/50 transition-colors print:border-slate-800 print:border-r-2"
                                                            >
                                                                <div className="flex items-center justify-center h-full min-h-[120px]">
                                                                    <div className="rotate-[-90deg] whitespace-nowrap">
                                                                        <span className="font-black text-[#0855BF] text-[10px] uppercase tracking-[0.3em] opacity-60 print:text-slate-900 print:opacity-100 italic">
                                                                            {cat.name}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                                {/* Accent Line for Category Section */}
                                                                <div className="absolute left-0 top-4 bottom-4 w-1 bg-blue-500 rounded-r-full print:hidden" />
                                                            </td>
                                                        )}
                                                        <td className="p-6 text-center border-r border-slate-100 border-b border-slate-50 font-black text-slate-400 group-hover:text-blue-500 transition-colors w-16 print:border-slate-800 print:border-r-2 print:border-b-2 print:text-slate-900">
                                                            {currentIndex.toString().padStart(2, '0')}
                                                        </td>
                                                        <td className="p-6 text-sm font-bold text-slate-700 leading-relaxed border-b border-slate-50 print:border-slate-800 print:border-b-2 print:text-black">
                                                            <div className="flex items-start gap-4">
                                                                <div className="min-w-[4px] h-4 mt-1 bg-slate-200 rounded-full group-hover:bg-blue-300 transition-colors print:hidden" />
                                                                {q.questionText}
                                                            </div>
                                                        </td>
                                                        {!isFinalizedView && idx === 0 && (
                                                            <td 
                                                                rowSpan={qList.length} 
                                                                className="p-6 text-center border-l border-slate-100 align-middle w-24 bg-slate-50/20 group-hover:bg-blue-50/40 transition-colors"
                                                            >
                                                                <button
                                                                    onClick={() => onRemove(cat.id!)}
                                                                    className="w-12 h-12 rounded-[1.25rem] bg-white border border-slate-200 text-slate-300 hover:bg-red-50 hover:text-red-500 hover:border-red-200 hover:scale-110 active:scale-95 transition-all flex items-center justify-center mx-auto shadow-sm group/btn"
                                                                    title="Remove Entire Category"
                                                                >
                                                                    <Trash2 size={20} className="group-hover/btn:animate-pulse" />
                                                                </button>
                                                                <div className="mt-2 text-[8px] font-black text-slate-300 uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                                                                    Remove
                                                                </div>
                                                            </td>
                                                        )}
                                                    </tr>
                                                );
                                            })
                                        ) : (
                                            <tr key={`empty-${cat.id}`}>
                                                <td className="p-6 border-r border-slate-100 bg-slate-50/40 text-center relative">
                                                    <div className="rotate-[-90deg] whitespace-nowrap">
                                                         <span className="font-black text-slate-300 text-[10px] uppercase tracking-[0.3em]">
                                                            {cat.name}
                                                        </span>
                                                    </div>
                                                    <div className="absolute left-0 top-4 bottom-4 w-1 bg-slate-200 rounded-r-full" />
                                                </td>
                                                <td colSpan={3} className="p-12 text-center border-b border-slate-50">
                                                    <div className="flex flex-col items-center gap-2 opacity-30">
                                                        <HelpCircle size={20} className="text-slate-400" />
                                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">No questions added</p>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>


        </div>
    );
}

export function AppraisalsPage() {
    const [activeTab, setActiveTab] = useState<'category' | 'questions' | 'confirmed' | 'finalized'>('category');

    // Category State
    const [categories, setCategories] = useState<Category[]>([]);
    const [confirmedCategories, setConfirmedCategories] = useState<number[]>([]); // Current selection (Draft)
    const [finalizedCategories, setFinalizedCategories] = useState<number[]>([]); // Locked selection
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
    const [isReorderingCat, setIsReorderingCat] = useState(false);
    const [isReorderingQue, setIsReorderingQue] = useState(false);

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

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
            const data = resp.data.data || [];
            setCategories([...data].sort((a, b) => a.sortOrder - b.sortOrder));
        } catch (err) {
            toast.error('Failed to load categories');
        }
    };

    const fetchQuestions = async (catId: number) => {
        try {
            const resp = await axios.get(`/appraisal-questions/category/${catId}`);
            const data = resp.data.data || [];
            setQuestions([...data].sort((a, b) => a.sortOrder - b.sortOrder));
        } catch (err) {
            toast.error('Failed to load questions');
        }
    };

    const handleDragEndCategory = async (event: DragEndEvent) => {
        const { active, over } = event;
        if (!over || active.id === over.id) return;

        const oldIndex = categories.findIndex(c => c.id === active.id);
        const newIndex = categories.findIndex(c => c.id === over.id);

        const newList = arrayMove(categories, oldIndex, newIndex).map((item, idx) => ({
            ...item,
            sortOrder: idx + 1
        }));

        setCategories(newList);
        setIsReorderingCat(true);

        try {
            await Promise.all(newList.map(item => axios.put(`/appraisal-categories/${item.id}`, item)));
            toast.success('Category order updated');
        } catch (err) {
            toast.error('Failed to update category order');
            fetchCategories();
        } finally {
            setIsReorderingCat(false);
        }
    };

    const handleDragEndQuestion = async (event: DragEndEvent) => {
        const { active, over } = event;
        if (!over || active.id === over.id) return;

        const oldIndex = questions.findIndex(q => q.id === active.id);
        const newIndex = questions.findIndex(q => q.id === over.id);

        const newList = arrayMove(questions, oldIndex, newIndex).map((item, idx) => ({
            ...item,
            sortOrder: idx + 1
        }));

        setQuestions(newList);
        setIsReorderingQue(true);

        try {
            await Promise.all(newList.map(item => axios.put(`/appraisal-questions/${item.id}`, item)));
            toast.success('Question order updated');
        } catch (err) {
            toast.error('Failed to update question order');
            if (selectedCategoryId) fetchQuestions(Number(selectedCategoryId));
        } finally {
            setIsReorderingQue(false);
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
            const data = { 
                ...catForm, 
                sortOrder: editingCategory ? editingCategory.sortOrder : categories.length + 1 
            };
            if (editingCategory) {
                await axios.put(`/appraisal-categories/${editingCategory.id}`, data);
                toast.success('Category updated');
            } else {
                await axios.post('/appraisal-categories', data);
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
            const payload = { 
                ...queForm, 
                categoryId: Number(selectedCategoryId),
                sortOrder: editingQuestion ? editingQuestion.sortOrder : questions.length + 1
            };
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
            {/* Header - Hidden in Print */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-8 rounded-3xl border border-slate-100 shadow-sm shadow-slate-200/50 print:hidden">
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
                    <button
                        onClick={() => setActiveTab('confirmed')}
                        className={`px-6 py-3 rounded-xl text-xs font-black transition-all ${activeTab === 'confirmed' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        REVIEW APPRAISAL
                    </button>
                    <button
                        onClick={() => setActiveTab('finalized')}
                        className={`px-6 py-3 rounded-xl text-xs font-black transition-all ${activeTab === 'finalized' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        CONFIRMED APPRAISAL
                    </button>
                </div>
            </div>

            {activeTab === 'finalized' ? (
                <ConfirmedAppraisalView
                    categories={categories.filter(c => finalizedCategories.includes(c.id!))}
                    allAvailableCategories={categories}
                    onAdd={() => {}}
                    onRemove={() => {}}
                    onConfirm={() => {}}
                    onReset={() => {
                        setActiveTab('confirmed');
                    }}
                    isFinalizedView={true}
                />
            ) : activeTab === 'confirmed' ? (
                <ConfirmedAppraisalView
                    categories={categories.filter(c => confirmedCategories.includes(c.id!))}
                    allAvailableCategories={categories}
                    onAdd={(id) => setConfirmedCategories(prev => [...prev, id])}
                    onRemove={(id) => setConfirmedCategories(prev => prev.filter(cid => cid !== id))}
                    onConfirm={() => {
                        setFinalizedCategories([...confirmedCategories]);
                        setActiveTab('finalized');
                        toast.success('Appraisal Confirmed Successfully!');
                    }}
                />
            ) : activeTab === 'category' ? (
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
                        {isReorderingCat && (
                            <div className="px-6 py-3 bg-blue-50 border-b border-blue-100 text-[10px] font-bold text-blue-600 uppercase tracking-widest animate-pulse">
                                Reordering categories...
                            </div>
                        )}
                        <div className="overflow-x-auto">
                            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEndCategory}>
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-slate-50 text-[10px] font-black uppercase text-slate-400 border-b border-slate-100">
                                            <th className="p-6 w-32 text-center">#</th>
                                            <th className="p-6">Category Details</th>
                                            <th className="p-6 text-center w-32">Status</th>
                                            <th className="p-6 text-center w-40">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        <SortableContext items={categories.map(c => c.id!)} strategy={verticalListSortingStrategy}>
                                            {categories.map((cat, index) => (
                                                <SortableCategoryRow
                                                    key={cat.id}
                                                    category={cat}
                                                    index={index}
                                                    isConfirmed={confirmedCategories.includes(cat.id!)}
                                                    onConfirm={(id) => {
                                                        setConfirmedCategories(prev =>
                                                            prev.includes(id) ? prev.filter(v => v !== id) : [...prev, id]
                                                        );
                                                    }}
                                                    onEdit={(cat) => { setEditingCategory(cat); setCatForm({ name: cat.name, description: cat.description, status: cat.status }); setShowCatModal(true); }}
                                                    onDelete={handleDeleteCategory}
                                                />
                                            ))}
                                        </SortableContext>
                                    </tbody>
                                </table>
                            </DndContext>
                        </div>
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
                            {isReorderingQue && (
                                <div className="px-6 py-3 bg-blue-50 border-b border-blue-100 text-[10px] font-bold text-blue-600 uppercase tracking-widest animate-pulse">
                                    Syncing question sequence...
                                </div>
                            )}
                            <div className="overflow-x-auto">
                                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEndQuestion}>
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="bg-slate-50 text-[10px] font-black uppercase text-slate-400 border-b border-slate-100">
                                                <th className="p-6 w-32 text-center">#</th>
                                                <th className="p-6">Question Text</th>
                                                <th className="p-6 text-center w-32">Status</th>
                                                <th className="p-6 text-center w-40">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50">
                                            {questions.length === 0 ? (
                                                <tr><td colSpan={4} className="p-20 text-center text-slate-400 font-bold italic">No questions found for this category.</td></tr>
                                            ) : (
                                                <SortableContext items={questions.map(q => q.id!)} strategy={verticalListSortingStrategy}>
                                                    {questions.map((q, index) => (
                                                        <SortableQuestionRow
                                                            key={q.id}
                                                            question={q}
                                                            index={index}
                                                            onEdit={(q) => { setEditingQuestion(q); setQueForm(q); setShowQueModal(true); }}
                                                            onDelete={handleDeleteQuestion}
                                                        />
                                                    ))}
                                                </SortableContext>
                                            )}
                                        </tbody>
                                    </table>
                                </DndContext>
                            </div>
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
