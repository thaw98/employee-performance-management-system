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
import { Plus, Pencil, Trash2, X, CheckCircle2, ChevronRight, ChevronDown, HelpCircle, GripVertical, Download, RotateCcw, Calendar, ArrowRight, Clock, Users, Filter, FileSpreadsheet, FileText, Send, Building2, Check, RefreshCcw, History } from 'lucide-react';
import * as XLSX from 'xlsx';

const PRIMARY = '#0855BF';

interface Category {
    id?: number;
    name: string;
    description: string;
    status: boolean;
    sortOrder: number;
}

interface DepartmentPositionMapping {
    id: number;
    departmentId: number;
    departmentName: string;
    positionId: number;
    positionCode: string;
    positionName: string;
    levelCodeId: number;
    levelCodeName: string;
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

interface AppraisalTemplateDto {
    id: number;
    name: string;
    assessmentDate: string;
    effectiveDate: string;
    isActive: boolean;
    categoryIds: number[];
    positionIds: number[];
    maxRating: number;
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
                        className={`w-10 h-10 rounded-xl transition-all flex items-center justify-center ${isConfirmed ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-200' : 'bg-slate-100 text-slate-600 border border-slate-200 hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-200'}`}
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
    assessmentDate: string;
    effectiveDate: string;
    maxRating: number;
    selectedPositionIds: number[];
    allPositions: DepartmentPositionMapping[];
}

function ConfirmedAppraisalView({ categories, allAvailableCategories, onAdd, onRemove, onConfirm, onReset, assessmentDate, effectiveDate, maxRating, selectedPositionIds, allPositions, isFinalizedView = false }: ConfirmedAppraisalViewProps) {
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

    const handleExportExcel = () => {
        const data: any[] = [];
        
        // Form Info
        data.push(['PERFORMANCE APPRAISAL FORM']);
        data.push(['Assessment Date:', assessmentDate]);
        data.push(['Effective Date:', effectiveDate]);
        data.push([]); // Spacer

        // Table Headers
        const ratingHeaders = Array.from({ length: maxRating }, (_, i) => `Rating: ${maxRating - i}`);
        data.push(['Category', 'No.', 'Evaluation Criteria & Performance Indicators', ...ratingHeaders]);
        
        let localGlobalIndex = 1;
        categories.forEach(cat => {
            const qList = allQuestions[cat.id!] || [];
            qList.forEach((q, idx) => {
                data.push([
                    idx === 0 ? cat.name : '',
                    (localGlobalIndex++).toString().padStart(2, '0'),
                    q.questionText,
                    ...Array(maxRating).fill('')
                ]);
            });
        });
        
        const ws = XLSX.utils.aoa_to_sheet(data);
        
        // Basic styling/merging could be done here if using a more advanced library, 
        // but simple AOA is good for basic Excel.
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Appraisal");
        XLSX.writeFile(wb, `Appraisal_Form_${assessmentDate}.xlsx`);
        toast.success('Excel file generated successfully');
    };

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
                        {isFinalizedView && (
                            <div className="flex gap-4 mt-2">
                                <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-2 py-1 rounded-md uppercase tracking-tight">ASMT: {assessmentDate}</span>
                                <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md uppercase tracking-tight">EFF: {effectiveDate}</span>
                                <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md uppercase tracking-tight">SCALE: 1-{maxRating}</span>
                            </div>
                        )}
                        {/* Target Audience Summary */}
                        {selectedPositionIds.length > 0 && (
                            <div className="mt-3 p-3 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col gap-2">
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                                    <Users size={12} /> Target Audience
                                </p>
                                <div className="flex flex-wrap gap-1.5">
                                    {Array.from(new Set(allPositions.filter(p => selectedPositionIds.includes(p.id)).map(p => p.departmentName))).map(deptName => (
                                        <div key={deptName} className="flex flex-col gap-1">
                                            <div className="text-[10px] font-bold text-slate-600 bg-white px-2 py-1 rounded-lg border border-slate-100 shadow-sm">
                                                {deptName}
                                            </div>
                                            <div className="flex flex-wrap gap-1 pl-1">
                                                {allPositions
                                                    .filter(p => selectedPositionIds.includes(p.id) && p.departmentName === deptName)
                                                    .map(pos => (
                                                        <span key={pos.id} className="text-[8px] font-black text-blue-500 bg-blue-50/50 px-1.5 py-0.5 rounded border border-blue-100/30 whitespace-nowrap">
                                                            {pos.positionName} ({pos.levelCodeName})
                                                        </span>
                                                    ))
                                                }
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto">
                    {!isFinalizedView && (
                        <div className="relative flex-1 md:w-64">
                            <button
                                onClick={() => setShowPicker(!showPicker)}
                                className="w-full flex items-center justify-between px-5 py-3.5 bg-white border-2 border-slate-200 rounded-2xl font-black text-[10px] text-slate-700 uppercase tracking-widest hover:border-blue-400 hover:bg-blue-50/30 hover:text-blue-600 transition-all group shadow-sm"
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
                                                className="w-full text-left p-4 bg-slate-50/50 hover:bg-blue-600 text-slate-700 hover:text-white rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all mb-2 last:mb-0 border border-transparent hover:border-blue-400 hover:shadow-lg hover:shadow-blue-100 flex items-center justify-between group/item"
                                            >
                                                <span>{ac.name}</span>
                                                <Plus size={14} className="text-slate-300 group-hover/item:text-white transition-colors" />
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
                                className="flex items-center gap-3 px-6 py-3.5 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-800 hover:shadow-[0_20px_40px_rgba(15,23,42,0.2)] active:scale-[0.98] transition-all shadow-xl shadow-slate-100 whitespace-nowrap"
                            >
                                <FileText size={18} /> <span>PDF</span>
                            </button>
                            <button
                                onClick={handleExportExcel}
                                className="flex items-center gap-3 px-6 py-3.5 bg-emerald-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-700 hover:shadow-[0_20px_40px_rgba(16,185,129,0.2)] active:scale-[0.98] transition-all shadow-xl shadow-emerald-100 whitespace-nowrap"
                            >
                                <FileSpreadsheet size={18} /> <span>Excel</span>
                            </button>
                            <button
                                onClick={async () => {
                                    try {
                                        await axios.post('/appraisal-categories/distribute', {});
                                        toast.success('Sent to Managers successfully');
                                    } catch (err: any) {
                                        const msg = err.response?.data?.message || 'Failed to send to managers';
                                        toast.error(msg);
                                    }
                                }}
                                className="flex items-center gap-3 px-6 py-3.5 bg-blue-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-700 hover:shadow-[0_20px_40px_rgba(37,99,235,0.2)] active:scale-[0.98] transition-all shadow-xl shadow-blue-100 whitespace-nowrap"
                            >
                                <Send size={18} /> <span>To Manager</span>
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Premium Table Container */}
            <div className="bg-white rounded-[2rem] border border-slate-200 overflow-x-auto shadow-[0_20px_50px_rgba(8,117,191,0.05)] print:border-slate-800 print:rounded-none print:shadow-none print:border-2 custom-scrollbar">
                <table className="w-full border-separate border-spacing-0 min-w-[1000px]">
                    <thead>
                        <tr className="bg-gradient-to-r from-[#0855BF] to-[#0a66e6] print:from-white print:to-white print:text-black">
                            <th className="p-5 text-[11px] font-black uppercase tracking-[0.2em] text-blue-100 text-center w-28 border-b border-blue-400/20 print:text-slate-900 print:border-slate-800 print:border-b-2">Category</th>
                            <th className="p-5 text-[11px] font-black uppercase tracking-[0.2em] text-blue-100 text-center w-16 border-b border-blue-400/20 border-l border-blue-400/10 print:text-slate-900 print:border-slate-800 print:border-b-2 print:border-l-2">No.</th>
                            <th className="p-5 text-[11px] font-black uppercase tracking-[0.2em] text-blue-100 text-left border-b border-blue-400/20 border-l border-blue-400/10 print:text-slate-900 print:border-slate-800 print:border-b-2 print:border-l-2">Evaluation Criteria & Performance Indicators</th>
                            {/* DYNAMIC RATING COLUMNS */}
                            {Array.from({ length: maxRating }, (_, i) => maxRating - i).map(num => (
                                <th key={num} className="p-5 text-[11px] font-black uppercase tracking-[0.2em] text-blue-100 text-center w-12 border-b border-blue-400/20 border-l border-blue-400/10 print:text-slate-900 print:border-slate-800 print:border-b-2 print:border-l-2">{num}</th>
                            ))}
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
                                                        {/* DYNAMIC RATING BOXES */}
                                                        {Array.from({ length: maxRating }, (_, i) => maxRating - i).map(num => (
                                                            <td key={num} className="p-6 text-center border-l border-slate-50 border-b border-slate-50 group-hover:bg-blue-50/20 transition-all print:border-slate-800 print:border-l-2 print:border-b-2">
                                                                <div className="w-6 h-6 rounded-lg border-2 border-slate-200 mx-auto transition-all group-hover:border-blue-200 print:border-slate-900 print:w-5 print:h-5 print:rounded-sm" />
                                                            </td>
                                                        ))}
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

                {/* SCORING SUMMARY - Premium UI style matching Image 1 */}
                <div className="p-10 bg-slate-50/50 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-12 print:border-t-2 print:border-slate-800 print:bg-white print:p-6">
                    <div className="space-y-4 max-w-md">
                        <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                            <div className="w-1.5 h-6 bg-blue-600 rounded-full" />
                            Scoring Methodology
                        </h4>
                        <p className="text-xs text-slate-500 font-medium leading-relaxed">
                            Total score is calculated as a percentage of achieved points relative to the maximum possible points (number of questions × 5). 
                            Final rating category is determined based on the percentage achieved.
                        </p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-6 w-full md:w-auto">
                        <div className="flex-1 bg-white p-6 rounded-3xl border border-shadow-sm border-slate-200 shadow-sm shadow-blue-100/50 min-w-[200px] flex flex-col items-center justify-center text-center space-y-1 print:border-2 print:border-slate-800 print:rounded-none">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Total Points</span>
                            <div className="text-3xl font-black text-slate-800 italic">
                                {Object.values(allQuestions).flat().length > 0 ? "Sum" : "0"}
                                <span className="text-slate-300 mx-2 text-xl font-normal">/</span>
                                <span className="text-slate-400 text-2xl">{Object.values(allQuestions).flat().length * maxRating}</span>
                            </div>
                        </div>

                        <div className="flex-1 bg-gradient-to-br from-blue-600 to-blue-800 p-6 rounded-3xl min-w-[220px] flex flex-col items-center justify-center text-center space-y-1 shadow-2xl shadow-blue-200 border-2 border-blue-500/20 print:bg-white print:border-2 print:border-slate-800 print:text-black print:rounded-none print:shadow-none">
                            <span className="text-[10px] font-black text-blue-100 uppercase tracking-[0.2em] print:text-slate-500">Total Score Rate</span>
                            <div className="text-4xl font-black text-white flex items-baseline gap-1 print:text-slate-900 italic">
                                0.0<span className="text-xl opacity-60">%</span>
                            </div>
                            <div className="px-3 py-1 bg-blue-500/30 rounded-lg text-[9px] font-black text-white uppercase tracking-widest border border-white/10 mt-2 print:text-slate-900 print:border-slate-800">
                                Result Category
                            </div>
                        </div>
                    </div>
                </div>
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
    const [allTemplates, setAllTemplates] = useState<AppraisalTemplateDto[]>([]);
    const [selectedTemplateId, setSelectedTemplateId] = useState<number | null>(null);
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
    const [assessmentDate, setAssessmentDate] = useState<string>(new Date().toISOString().split('T')[0]);
    const [effectiveDate, setEffectiveDate] = useState<string>(new Date().toISOString().split('T')[0]);
    const [maxRating, setMaxRating] = useState(10);
    const [selectedPositionIds, setSelectedPositionIds] = useState<number[]>([]);
    
    // Finalized (History) View States - Separate from Review states
    const [historyAssessmentDate, setHistoryAssessmentDate] = useState('');
    const [historyEffectiveDate, setHistoryEffectiveDate] = useState('');
    const [historyMaxRating, setHistoryMaxRating] = useState(10);
    const [historyPositionIds, setHistoryPositionIds] = useState<number[]>([]);
    const [selectedDeptId, setSelectedDeptId] = useState<number | null>(null);
    const [historySearchTerm, setHistorySearchTerm] = useState('');
    const [historyYearFilter, setHistoryYearFilter] = useState('All');

    const [isReorderingCat, setIsReorderingCat] = useState(false);
    const [isReorderingQue, setIsReorderingQue] = useState(false);

    // Target Audience State
    const [allPositions, setAllPositions] = useState<DepartmentPositionMapping[]>([]);

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    const fetchCategories = async () => {
        try {
            const resp = await axios.get('/appraisal-categories');
            const data = resp.data.data || [];
            const sorted = [...data].sort((a, b) => a.sortOrder - b.sortOrder);
            setCategories(sorted);

            // Sync from Backend (Source of Truth)
            const backendFinalized = sorted.filter((c: any) => c.isFinalized).map((c: any) => c.id);
            if (backendFinalized.length > 0) {
                setFinalizedCategories(backendFinalized);
                setConfirmedCategories([]); // Keep review tab empty if finalized
                if (activeTab === 'category') setActiveTab('finalized');
            }
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

    const handleFinalize = async () => {
        setIsLoading(true);
        try {
            const payload = {
                assessmentDate: assessmentDate,
                effectiveDate: effectiveDate,
                categoryIds: confirmedCategories,
                positionIds: selectedPositionIds,
                maxRating: maxRating
            };
            await axios.post('/appraisal-categories/finalize', payload);
            setFinalizedCategories([...confirmedCategories]);
            setConfirmedCategories([]); // Clear review tab on finalize
            setActiveTab('finalized');
            toast.success('Appraisal Configuration Saved to Database!');
            fetchAllTemplates(); // Refresh the list
        } catch (err) {
            toast.error('Failed to save to database');
        } finally {
            setIsLoading(false);
        }
    };

    const fetchAllTemplates = async () => {
        try {
            const resp = await axios.get('/appraisal-categories/templates');
            const data = resp.data.data || [];
            setAllTemplates(data);
            if (data.length > 0 && !selectedTemplateId) {
                // By default select the active one or the latest one
                const active = data.find((t: any) => t.isActive);
                const toSelect = active || data[0];
                setSelectedTemplateId(toSelect.id);
                setFinalizedCategories(toSelect.categoryIds);
                setAssessmentDate(toSelect.assessmentDate);
                setEffectiveDate(toSelect.effectiveDate);
                setMaxRating(toSelect.maxRating || 10);
            }
        } catch (err) {
            console.error('Failed to load all templates');
        }
    };

    const fetchPositionsAndLevels = async () => {
        try {
            const posResp = await axios.get('/lookups/department-positions/active');
            setAllPositions(posResp.data.data || []);
        } catch (err) {
            console.error('Failed to fetch criteria');
        }
    };

    useEffect(() => {
        fetchCategories();
        fetchAllTemplates();
        fetchPositionsAndLevels();
    }, []);

    useEffect(() => {
        if (selectedCategoryId) {
            fetchQuestions(Number(selectedCategoryId));
        } else {
            setQuestions([]);
        }
    }, [selectedCategoryId]);

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
                <div className="space-y-8 animate-in fade-in duration-500">
                    {/* History Explorer Header */}
                    <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm space-y-6">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                            <div className="flex items-center gap-5">
                                <div className="w-14 h-14 bg-blue-600 text-white rounded-[22px] flex items-center justify-center shadow-lg shadow-blue-100">
                                    <History size={28} />
                                </div>
                                <div>
                                    <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Appraisal Archive</h3>
                                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Explore and reuse historical performance frameworks</p>
                                </div>
                            </div>

                            {selectedTemplateId && (
                                <button 
                                    onClick={() => setSelectedTemplateId(null)}
                                    className="flex items-center gap-2 px-6 py-3 bg-slate-100 text-slate-600 rounded-2xl font-black text-[11px] hover:bg-slate-200 transition-all uppercase tracking-widest"
                                >
                                    <ChevronRight size={16} className="rotate-180" /> Back to Archive
                                </button>
                            )}
                        </div>

                        {!selectedTemplateId && (
                            <div className="flex flex-wrap items-center gap-4 pt-4 border-t border-slate-50">
                                <div className="flex-1 min-w-[300px] relative">
                                    <input 
                                        type="text"
                                        placeholder="SEARCH TEMPLATES BY NAME..."
                                        value={historySearchTerm}
                                        onChange={(e) => setHistorySearchTerm(e.target.value)}
                                        className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl px-6 py-4 text-xs font-black text-slate-700 focus:bg-white focus:border-blue-500 transition-all outline-none uppercase tracking-widest"
                                    />
                                    <Filter className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                                </div>
                                <select 
                                    value={historyYearFilter}
                                    onChange={(e) => setHistoryYearFilter(e.target.value)}
                                    className="bg-slate-50 border-2 border-slate-50 rounded-2xl px-6 py-4 text-xs font-black text-slate-700 outline-none focus:border-blue-500 transition-all uppercase tracking-widest"
                                >
                                    <option value="All">All Years</option>
                                    {Array.from(new Set(allTemplates.map(t => t.assessmentDate.split('-')[0]))).sort().reverse().map(year => (
                                        <option key={year} value={year}>{year}</option>
                                    ))}
                                </select>
                            </div>
                        )}
                    </div>

                    {!selectedTemplateId ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {allTemplates
                                .filter(t => {
                                    const matchesSearch = t.name.toLowerCase().includes(historySearchTerm.toLowerCase());
                                    const matchesYear = historyYearFilter === 'All' || t.assessmentDate.startsWith(historyYearFilter);
                                    return matchesSearch && matchesYear;
                                })
                                .map(t => (
                                    <div 
                                        key={t.id}
                                        className="group bg-white rounded-[32px] border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-blue-900/5 hover:translate-y-[-4px] transition-all overflow-hidden relative"
                                    >
                                        <div className="p-7 space-y-6">
                                            <div className="flex items-start justify-between">
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded uppercase">{t.assessmentDate.split('-')[0]}</span>
                                                        {t.isActive && <span className="text-[10px] font-black text-white bg-emerald-500 px-2 py-0.5 rounded uppercase animate-pulse">Active</span>}
                                                    </div>
                                                    <h4 className="text-sm font-black text-slate-800 uppercase leading-tight group-hover:text-blue-600 transition-colors">{t.name}</h4>
                                                </div>
                                                <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-300 group-hover:bg-blue-50 group-hover:text-blue-400 transition-all">
                                                    <FileText size={20} />
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="p-3 bg-slate-50/50 rounded-2xl border border-transparent group-hover:border-slate-100 transition-all">
                                                    <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Categories</div>
                                                    <div className="text-lg font-black text-slate-700">{t.categoryIds.length}</div>
                                                </div>
                                                <div className="p-3 bg-slate-50/50 rounded-2xl border border-transparent group-hover:border-slate-100 transition-all">
                                                    <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Rating Scale</div>
                                                    <div className="text-lg font-black text-slate-700">1-{t.maxRating || 5}</div>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2 pt-2">
                                                <button 
                                                    onClick={() => {
                                                        setSelectedTemplateId(t.id);
                                                        setFinalizedCategories(t.categoryIds);
                                                        setHistoryAssessmentDate(t.assessmentDate);
                                                        setHistoryEffectiveDate(t.effectiveDate);
                                                        setHistoryPositionIds(t.positionIds || []);
                                                        setHistoryMaxRating(t.maxRating || 10);
                                                    }}
                                                    className="flex-1 py-3.5 bg-slate-800 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.1em] hover:bg-blue-600 transition-all shadow-md shadow-slate-200"
                                                >
                                                    View Details
                                                </button>
                                                <button 
                                                    onClick={() => {
                                                        setConfirmedCategories([...t.categoryIds]);
                                                        setAssessmentDate(t.assessmentDate);
                                                        setEffectiveDate(t.effectiveDate);
                                                        setMaxRating(t.maxRating || 10);
                                                        setSelectedPositionIds(t.positionIds || []);
                                                        setActiveTab('confirmed');
                                                        toast.success('Template cloned as draft!');
                                                    }}
                                                    className="w-12 h-12 bg-white border-2 border-slate-100 text-slate-400 rounded-2xl flex items-center justify-center hover:border-blue-200 hover:text-blue-500 transition-all group/btn"
                                                    title="Use as Draft"
                                                >
                                                    <RefreshCcw size={18} className="group-hover/btn:rotate-180 transition-transform duration-500" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            }
                            {allTemplates.length === 0 && (
                                <div className="lg:col-span-3 p-20 text-center bg-slate-50/50 border-2 border-dashed border-slate-100 rounded-[48px]">
                                    <HelpCircle size={48} className="mx-auto text-slate-200 mb-4" />
                                    <p className="text-slate-400 font-black uppercase tracking-widest">No history records found</p>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-6 animate-in slide-in-from-bottom-8 duration-500">
                             <ConfirmedAppraisalView
                                categories={categories.filter(c => finalizedCategories.includes(c.id!))}
                                allAvailableCategories={categories}
                                assessmentDate={historyAssessmentDate}
                                effectiveDate={historyEffectiveDate}
                                onAdd={() => {}}
                                onRemove={() => {}}
                                onConfirm={() => {}}
                                onReset={() => {
                                    setConfirmedCategories([...finalizedCategories]);
                                    setFinalizedCategories([]);
                                    setAssessmentDate(historyAssessmentDate);
                                    setEffectiveDate(historyEffectiveDate);
                                    setMaxRating(historyMaxRating);
                                    setSelectedPositionIds(historyPositionIds);
                                    setActiveTab('confirmed');
                                }}
                                maxRating={historyMaxRating}
                                isFinalizedView={true}
                                selectedPositionIds={historyPositionIds}
                                allPositions={allPositions}
                            />
                        </div>
                    )}
                </div>
            ) : activeTab === 'confirmed' ? (
                <div className="space-y-6">
                    <div className="bg-white p-2 rounded-[28px] border border-slate-100 shadow-sm flex flex-wrap items-center gap-2 px-2 animate-in fade-in slide-in-from-top-4 print:hidden">
                        {/* Assessment Date Card */}
                        <div className="flex-1 min-w-[240px] flex items-center gap-5 p-5 bg-slate-50/50 rounded-[22px] border border-transparent hover:border-blue-100 hover:bg-white transition-all group">
                            <div className="w-12 h-12 bg-white text-blue-600 rounded-2xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                                <Calendar size={22} />
                            </div>
                            <div className="flex-1">
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.15em] mb-1">Assessment Date</p>
                                <div className="relative">
                                    <input 
                                        type="date" 
                                        value={assessmentDate}
                                        onChange={(e) => setAssessmentDate(e.target.value)}
                                        className="w-full text-base font-black text-slate-800 bg-transparent border-none p-0 focus:ring-0 cursor-pointer"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Connection Arrow/Line */}
                        <div className="hidden lg:flex items-center justify-center w-10 text-slate-200">
                            <ArrowRight size={20} strokeWidth={3} />
                        </div>

                        {/* Effective Date Card */}
                        <div className="flex-1 min-w-[240px] flex items-center gap-5 p-5 bg-slate-50/50 rounded-[22px] border border-transparent hover:border-emerald-100 hover:bg-white transition-all group">
                            <div className="w-12 h-12 bg-white text-emerald-600 rounded-2xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                                <Clock size={22} />
                            </div>
                            <div className="flex-1">
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.15em] mb-1">Effective Date</p>
                                <div className="relative">
                                    <input 
                                        type="date" 
                                        value={effectiveDate}
                                        min={assessmentDate}
                                        onChange={(e) => setEffectiveDate(e.target.value)}
                                        className="w-full text-base font-black text-slate-800 bg-transparent border-none p-0 focus:ring-0 cursor-pointer"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Connection Arrow/Line */}
                        <div className="hidden lg:flex items-center justify-center w-10 text-slate-200">
                            <ArrowRight size={20} strokeWidth={3} />
                        </div>

                        {/* Rating Scale Selection */}
                        <div className="flex-1 min-w-[240px] flex items-center gap-5 p-5 bg-slate-50/50 rounded-[22px] border border-transparent hover:border-blue-100 hover:bg-white transition-all group">
                            <div className="w-12 h-12 bg-white text-[#0855BF] rounded-2xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                                <FileSpreadsheet size={22} />
                            </div>
                            <div className="flex-1">
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.15em] mb-1">Rating Scale (1 to ?)</p>
                                <div className="relative">
                                    <select 
                                        value={maxRating}
                                        onChange={(e) => setMaxRating(Number(e.target.value))}
                                        className="w-full text-base font-black text-slate-800 bg-transparent border-none p-0 focus:ring-0 cursor-pointer appearance-none"
                                    >
                                        <option value={10}>1 to 10 Scale</option>
                                        <option value={5}>1 to 5 Scale</option>
                                        <option value={4}>1 to 4 Scale</option>
                                        <option value={3}>1 to 3 Scale</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* TARGET AUDIENCE SELECTION - Premium UI */}
                    <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm space-y-6 animate-in fade-in slide-in-from-bottom-4">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
                                    <Users size={24} />
                                </div>
                                <div className="space-y-1">
                                    <h3 className="font-black text-slate-800 uppercase tracking-tight">Target Audience</h3>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Assign this form to specific organizational positions</p>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col lg:flex-row gap-0 bg-slate-50/50 rounded-[32px] border border-slate-100 overflow-hidden min-h-[500px]">
                            {/* Left Side: Departments List */}
                            <div className="w-full lg:w-1/3 bg-white border-r border-slate-100 flex flex-col">
                                <div className="p-6 border-b border-slate-50 bg-slate-50/30">
                                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">1. Choose Department</h4>
                                </div>
                                <div className="flex-1 overflow-y-auto p-3 space-y-1">
                                    {Array.from(new Set(allPositions.map(p => p.departmentId))).map(deptId => {
                                        const deptName = allPositions.find(p => p.departmentId === deptId)?.departmentName || 'General';
                                        const isSelected = selectedDeptId === deptId;
                                        const deptPositions = allPositions.filter(p => p.departmentId === deptId);
                                        const selectedCount = deptPositions.filter(p => selectedPositionIds.includes(p.id)).length;
                                        const isAllSelected = selectedCount === deptPositions.length && deptPositions.length > 0;

                                        return (
                                            <button
                                                key={deptId}
                                                onClick={() => setSelectedDeptId(deptId)}
                                                className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all group ${isSelected ? 'bg-blue-600 text-white shadow-lg shadow-blue-100 scale-[1.02] z-10' : 'hover:bg-slate-50 text-slate-600'}`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors ${isSelected ? 'bg-white/20' : 'bg-slate-100 group-hover:bg-white shadow-sm'}`}>
                                                        <Building2 size={16} className={isSelected ? 'text-white' : 'text-slate-400'} />
                                                    </div>
                                                    <div className="text-left">
                                                        <div className={`text-[11px] font-black uppercase tracking-tight ${isSelected ? 'text-white' : 'text-slate-700'}`}>{deptName}</div>
                                                        <div className={`text-[9px] font-bold ${isSelected ? 'text-blue-100' : 'text-slate-400'}`}>{deptPositions.length} Positions</div>
                                                    </div>
                                                </div>
                                                {selectedCount > 0 && (
                                                    <div className={`px-2 py-1 rounded-lg text-[9px] font-black border transition-colors ${isSelected ? 'bg-white text-blue-600 border-white' : 'bg-blue-50 text-blue-600 border-blue-100'}`}>
                                                        {isAllSelected ? 'ALL' : selectedCount}
                                                    </div>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Right Side: Position Selection */}
                            <div className="flex-1 flex flex-col bg-slate-50/30">
                                {selectedDeptId ? (
                                    <>
                                        <div className="p-6 border-b border-slate-100 bg-white flex items-center justify-between">
                                            <div>
                                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">2. Select Positions</h4>
                                                <div className="text-sm font-black text-slate-800 uppercase mt-1">
                                                    {allPositions.find(p => p.departmentId === selectedDeptId)?.departmentName}
                                                </div>
                                            </div>
                                            
                                            {/* Select All Position */}
                                            <button 
                                                onClick={() => {
                                                    const deptPosIds = allPositions.filter(p => p.departmentId === selectedDeptId).map(p => p.id);
                                                    const allCurrentlySelected = deptPosIds.every(id => selectedPositionIds.includes(id));
                                                    
                                                    if (allCurrentlySelected) {
                                                        setSelectedPositionIds(prev => prev.filter(id => !deptPosIds.includes(id)));
                                                    } else {
                                                        setSelectedPositionIds(prev => Array.from(new Set([...prev, ...deptPosIds])));
                                                    }
                                                }}
                                                className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                                            >
                                                {allPositions.filter(p => p.departmentId === selectedDeptId).every(pos => selectedPositionIds.includes(pos.id)) 
                                                    ? 'Deselect All' : 'Select All Position'}
                                            </button>
                                        </div>
                                        
                                        <div className="flex-1 overflow-y-auto p-6">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                {allPositions
                                                    .filter(p => p.departmentId === selectedDeptId)
                                                    .map(pos => (
                                                        <label 
                                                            key={pos.id}
                                                            className={`flex items-center gap-4 p-4 rounded-2xl border-2 cursor-pointer transition-all bg-white group ${selectedPositionIds.includes(pos.id) ? 'border-blue-500 shadow-md translate-y-[-2px]' : 'border-transparent hover:border-slate-200 hover:shadow-sm'}`}
                                                        >
                                                            <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${selectedPositionIds.includes(pos.id) ? 'bg-blue-600 border-blue-600' : 'border-slate-200 group-hover:border-blue-300'}`}>
                                                                {selectedPositionIds.includes(pos.id) && <Check size={12} className="text-white" strokeWidth={4} />}
                                                                <input 
                                                                    type="checkbox"
                                                                    className="hidden"
                                                                    checked={selectedPositionIds.includes(pos.id)}
                                                                    onChange={() => {
                                                                        setSelectedPositionIds(prev => 
                                                                            prev.includes(pos.id) ? prev.filter(id => id !== pos.id) : [...prev, pos.id]
                                                                        );
                                                                    }}
                                                                />
                                                            </div>
                                                            <div className="flex-1">
                                                                <div className="text-[11px] font-black text-slate-700 leading-tight mb-1 uppercase group-hover:text-blue-600 transition-colors">{pos.positionName}</div>
                                                                <div className="flex items-center gap-2">
                                                                    <span className="text-[8px] font-black text-blue-500 bg-blue-50 px-1.5 py-0.5 rounded uppercase tracking-wider">{pos.levelCodeName}</span>
                                                                    <span className="text-[8px] font-bold text-slate-400">ID: {pos.id}</span>
                                                                </div>
                                                            </div>
                                                        </label>
                                                    ))
                                                }
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <div className="flex-1 flex flex-col items-center justify-center p-12 text-center space-y-4">
                                        <div className="w-20 h-20 bg-white rounded-[28px] flex items-center justify-center shadow-sm text-slate-200">
                                            <Building2 size={40} />
                                        </div>
                                        <div>
                                            <h4 className="text-slate-400 font-black uppercase tracking-widest text-[11px]">No Department Selected</h4>
                                            <p className="text-slate-300 font-bold text-[10px] mt-1 max-w-[200px] mx-auto">Please pick a department from the left list to manage its positions</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="pt-4 border-t border-slate-50 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-2">
                                    <Filter size={14} className="text-blue-500" />
                                    <p className="text-[10px] font-black text-slate-700 uppercase tracking-widest">
                                        Total Selected: {selectedPositionIds.length}
                                    </p>
                                </div>
                                {selectedPositionIds.length > 0 && (
                                    <div className="flex -space-x-2">
                                        {Array.from(new Set(allPositions.filter(p => selectedPositionIds.includes(p.id)).map(p => p.departmentId))).slice(0, 3).map(deptId => (
                                            <div key={deptId} className="w-6 h-6 rounded-full bg-blue-100 border-2 border-white flex items-center justify-center text-[8px] font-black text-blue-600 uppercase" title={allPositions.find(p => p.departmentId === deptId)?.departmentName}>
                                                {allPositions.find(p => p.departmentId === deptId)?.departmentName?.charAt(0)}
                                            </div>
                                        ))}
                                        {Array.from(new Set(allPositions.filter(p => selectedPositionIds.includes(p.id)).map(p => p.departmentId))).length > 3 && (
                                            <div className="w-6 h-6 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center text-[8px] font-black text-slate-400">
                                                +{Array.from(new Set(allPositions.filter(p => selectedPositionIds.includes(p.id)).map(p => p.departmentId))).length - 3}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                            <button 
                                onClick={() => {
                                    setSelectedPositionIds([]);
                                    setSelectedDeptId(null);
                                }}
                                className="text-[10px] font-black text-red-400 hover:text-red-600 uppercase tracking-widest transition-colors flex items-center gap-2"
                            >
                                <RefreshCcw size={12} /> Reset Selection
                            </button>
                        </div>
                    </div>

                    <ConfirmedAppraisalView
                        categories={categories.filter(c => confirmedCategories.includes(c.id!))}
                        allAvailableCategories={categories}
                        assessmentDate={assessmentDate}
                        effectiveDate={effectiveDate}
                        onAdd={(id) => setConfirmedCategories(prev => [...prev, id])}
                        onRemove={(id) => setConfirmedCategories(prev => prev.filter(cid => cid !== id))}
                        onConfirm={handleFinalize}
                        onReset={() => setActiveTab('confirmed')}
                        maxRating={maxRating}
                        selectedPositionIds={selectedPositionIds}
                        allPositions={allPositions}
                    />
                </div>
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
