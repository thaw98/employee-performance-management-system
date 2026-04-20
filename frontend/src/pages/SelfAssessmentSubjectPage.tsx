import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from '../app/axiosInstance';
import { toast } from 'react-hot-toast';
import {
    Plus, Pencil, Trash2, X, AlertTriangle, CheckCircle2,
    GripVertical, Search, Power, PowerOff
} from 'lucide-react';
import Sortable from 'sortablejs';

const PRIMARY = '#0855BF';

interface Subject {
    id?: number;
    subjectText: string;
    displayOrder: number;
    isActive: boolean;
}

export function SelfAssessmentSubitemPage() {
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState<Subject | null>(null);
    const [isReordering, setIsReordering] = useState(false);

    const tableBodyRef = useRef<HTMLTableSectionElement>(null);
    const sortableRef = useRef<Sortable | null>(null);

    const [form, setForm] = useState<Subject>({
        subjectText: '',
        displayOrder: 1,
        isActive: true
    });

    // Filter subjects based on search term
    const filteredSubjects = subjects.filter(subject =>
        subject.subjectText.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const fetchSubjects = async () => {
        try {
            const resp = await axios.get('/self-assessment-subjects/all');
            const data = resp.data.data || [];
            // Sort by displayOrder for consistent display
            const sorted = data.sort((a: Subject, b: Subject) => a.displayOrder - b.displayOrder);
            setSubjects(sorted);
        } catch (err) {
            toast.error('Failed to fetch questions');
        }
    };

    // Renumber all subjects sequentially based on current array order
    const renumberOrders = async (subjectsList: Subject[]): Promise<Subject[]> => {
        const updates = subjectsList.map((subject, idx) => ({
            ...subject,
            displayOrder: idx + 1
        }));

        // Update each subject's displayOrder in the backend
        await Promise.all(
            updates.map(subject =>
                axios.put(`/self-assessment-subjects/${subject.id}`, {
                    subjectText: subject.subjectText,
                    displayOrder: subject.displayOrder,
                    isActive: subject.isActive
                })
            )
        );

        return updates;
    };

    // Handle drag & drop reorder
    const initSortable = useCallback(() => {
        if (!tableBodyRef.current || searchTerm !== '') return;

        if (sortableRef.current) {
            sortableRef.current.destroy();
        }

        sortableRef.current = new Sortable(tableBodyRef.current, {
            handle: '.drag-handle',
            animation: 250,
            easing: "cubic-bezier(0.4, 0.0, 0.2, 1)",
            ghostClass: 'sortable-ghost',
            dragClass: 'sortable-drag',
            onEnd: async () => {
                if (!tableBodyRef.current) return;

                // Get the new order from DOM
                const rows = Array.from(tableBodyRef.current.querySelectorAll('tr[data-id]'));
                const newOrderIds = rows.map(row => Number(row.getAttribute('data-id')));

                // Create new ordered array of subjects
                const newOrderedSubjects = newOrderIds
                    .map(id => subjects.find(s => s.id === id))
                    .filter((s): s is Subject => s !== undefined);

                if (newOrderedSubjects.length !== subjects.length) return;

                setIsReordering(true);
                try {
                    const updatedSubjects = await renumberOrders(newOrderedSubjects);
                    setSubjects(updatedSubjects);
                    toast.success('Question order updated successfully');
                } catch (error) {
                    toast.error('Failed to update order');
                    await fetchSubjects(); // revert to server order
                } finally {
                    setIsReordering(false);
                }
            }
        });
    }, [searchTerm, subjects, fetchSubjects]);

    // Cleanup sortable on unmount or when search changes
    useEffect(() => {
        if (searchTerm === '') {
            initSortable();
        }
        return () => {
            if (sortableRef.current) {
                sortableRef.current.destroy();
                sortableRef.current = null;
            }
        };
    }, [initSortable, searchTerm]);

    const handleOpenCreate = () => {
        setEditingSubject(null);
        const maxOrder = subjects.length > 0 ? Math.max(...subjects.map(s => s.displayOrder)) : 0;
        setForm({
            subjectText: '',
            displayOrder: maxOrder + 1,
            isActive: true
        });
        setShowModal(true);
    };

    const handleSave = async () => {
        if (!form.subjectText.trim()) {
            toast.error('Question text is required');
            return;
        }

        setIsLoading(true);
        try {
            if (editingSubject) {
                // Update existing subject
                await axios.put(`/self-assessment-subjects/${editingSubject.id}`, {
                    subjectText: form.subjectText,
                    displayOrder: form.displayOrder,
                    isActive: form.isActive
                });
                toast.success('Question updated successfully');
            } else {
                // Create new subject
                await axios.post('/self-assessment-subjects', {
                    subjectText: form.subjectText,
                    displayOrder: form.displayOrder,
                    isActive: form.isActive
                });
                toast.success('New question created successfully');
            }
            setShowModal(false);
            await fetchSubjects();
        } catch (err) {
            toast.error('Failed to save question');
        } finally {
            setIsLoading(false);
        }
    };

    const handleEdit = (subject: Subject) => {
        setEditingSubject(subject);
        setForm({ ...subject });
        setShowModal(true);
    };

    const handleToggleStatus = async (subject: Subject) => {
        try {
            await axios.put(`/self-assessment-subjects/${subject.id}`, {
                subjectText: subject.subjectText,
                displayOrder: subject.displayOrder,
                isActive: !subject.isActive
            });
            toast.success(`Question ${!subject.isActive ? 'activated' : 'deactivated'}`);
            await fetchSubjects();
        } catch (err) {
            toast.error('Failed to update status');
        }
    };

    const handleDelete = async () => {
        if (!showDeleteConfirm?.id) return;

        try {
            await axios.delete(`/self-assessment-subjects/${showDeleteConfirm.id}`);
            toast.success('Question deleted successfully');

            // After deletion, fetch current list and renumber
            await fetchSubjects();

            // Renumber remaining items to keep order sequential
            const remainingSubjects = subjects.filter(s => s.id !== showDeleteConfirm.id);
            if (remainingSubjects.length > 0) {
                try {
                    const renumbered = await renumberOrders(remainingSubjects);
                    setSubjects(renumbered);
                    toast.success('Question order has been renumbered');
                } catch (renumberError) {
                    console.error('Renumber failed', renumberError);
                    await fetchSubjects(); // fallback refresh
                }
            }

            setShowDeleteConfirm(null);
        } catch (err) {
            toast.error('Failed to delete question');
        }
    };

    return (
        <div className="p-8 space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto">
            {/* Header section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-8 rounded-3xl border border-slate-100 shadow-sm shadow-slate-200/50">
                <div>
                    <h1 className="text-4xl font-black tracking-tight" style={{ color: PRIMARY }}>Assessment Questions</h1>
                    <p className="text-slate-500 mt-2 font-medium">Manage dynamic performance criteria used in employee self-assessments.</p>
                </div>
                <button
                    onClick={handleOpenCreate}
                    className="flex items-center gap-2 px-6 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black text-sm transition-all shadow-xl shadow-blue-100 active:scale-95 whitespace-nowrap"
                >
                    <Plus size={20} strokeWidth={3} />
                    <span>ADD NEW QUESTION</span>
                </button>
            </div>

            {/* Search Bar */}
            <div className="relative max-w-md">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                    type="text"
                    placeholder="Search questions..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition-all"
                />
            </div>

            {/* Reorder hint when search is active */}
            {searchTerm !== '' && (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 text-sm text-amber-700 flex items-center gap-2">
                    <AlertTriangle size={16} />
                    <span>Drag & drop reordering is disabled while searching. Clear search to reorder questions.</span>
                </div>
            )}

            {/* List section */}
            <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
                <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                    <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest pl-2">
                        Configured Questions ({filteredSubjects.length})
                    </h3>
                    <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse"></span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Live Preview</span>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-white text-[10px] font-black uppercase text-slate-400 border-b border-slate-100">
                                <th className="p-6 w-24 text-center">Order</th>
                                <th className="p-6">Assessment Question</th>
                                <th className="p-6 w-32 text-center">Status</th>
                                <th className="p-6 w-48 text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody ref={tableBodyRef} className="divide-y divide-slate-50">
                            {filteredSubjects.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="p-16 text-center">
                                        <div className="flex flex-col items-center gap-3 grayscale opacity-30">
                                            <div className="w-16 h-16 rounded-3xl bg-slate-100 flex items-center justify-center">
                                                <Plus size={32} className="text-slate-400" />
                                            </div>
                                            <p className="text-slate-500 font-bold italic">No questions found.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredSubjects.map(subject => (
                                    <tr
                                        key={subject.id}
                                        data-id={subject.id}
                                        className="hover:bg-slate-50/30 transition-colors group"
                                    >
                                        <td className="p-6">
                                            <div className="flex items-center justify-center gap-2">
                                                {searchTerm === '' && (
                                                    <div className="drag-handle cursor-grab active:cursor-grabbing text-slate-300 hover:text-slate-500 transition-colors">
                                                        <GripVertical size={18} />
                                                    </div>
                                                )}
                                                <span className="font-black text-slate-400 text-lg">
                                                    #{subject.displayOrder}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="p-6">
                                            <div className="text-base font-bold text-slate-700 group-hover:text-slate-900 transition-colors">
                                                {subject.subjectText}
                                            </div>
                                        </td>
                                        <td className="p-6 text-center">
                                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter shadow-sm border ${subject.isActive
                                                ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                                                : 'bg-slate-50 text-slate-400 border-slate-100'
                                                }`}>
                                                <div className={`w-1.5 h-1.5 rounded-full ${subject.isActive ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                                                {subject.isActive ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td className="p-6">
                                            <div className="flex justify-center gap-2">
                                                {/* Toggle Active/Inactive Button */}
                                                <button
                                                    onClick={() => handleToggleStatus(subject)}
                                                    className={`w-10 h-10 rounded-xl transition-all flex items-center justify-center ${subject.isActive
                                                        ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                                                        : 'bg-slate-50 text-slate-400 hover:bg-slate-100'
                                                        }`}
                                                    title={subject.isActive ? 'Deactivate Question' : 'Activate Question'}
                                                >
                                                    {subject.isActive ? <Power size={18} /> : <PowerOff size={18} />}
                                                </button>

                                                {/* Edit Button */}
                                                <button
                                                    onClick={() => handleEdit(subject)}
                                                    className="w-10 h-10 rounded-xl bg-slate-50 text-slate-400 hover:bg-blue-50 hover:text-blue-600 transition-all flex items-center justify-center"
                                                    title="Edit Question"
                                                >
                                                    <Pencil size={18} />
                                                </button>

                                                {/* Delete Button */}
                                                <button
                                                    onClick={() => setShowDeleteConfirm(subject)}
                                                    className="w-10 h-10 rounded-xl bg-slate-50 text-slate-400 hover:bg-red-50 hover:text-red-600 transition-all flex items-center justify-center"
                                                    title="Delete Question"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Add/Edit Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div
                        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300"
                        onClick={() => !isLoading && setShowModal(false)}
                    />
                    <div className="relative bg-white w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 fade-in duration-300 border border-slate-100">
                        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                            <h3 className="font-black text-slate-800 flex items-center gap-2">
                                <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-100">
                                    {editingSubject ? <Pencil size={16} /> : <Plus size={18} />}
                                </div>
                                <span>{editingSubject ? 'EDIT QUESTION' : 'CREATE NEW QUESTION'}</span>
                            </h3>
                            <button
                                onClick={() => setShowModal(false)}
                                className="w-8 h-8 rounded-full hover:bg-slate-100 text-slate-400 flex items-center justify-center transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-8 space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                                    Question Text *
                                </label>
                                <textarea
                                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-4 text-sm font-bold text-slate-700 focus:bg-white focus:border-blue-500 outline-none h-40 transition-all placeholder:text-slate-300 placeholder:italic"
                                    placeholder="e.g. Adherence to company policies and professional ethics..."
                                    value={form.subjectText}
                                    onChange={e => setForm({ ...form, subjectText: e.target.value })}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                                        Display Order
                                    </label>
                                    <input
                                        type="number"
                                        min="1"
                                        className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-3 text-sm font-black text-slate-700 focus:bg-white focus:border-blue-500 outline-none transition-all"
                                        value={form.displayOrder}
                                        onChange={e => setForm({ ...form, displayOrder: Math.max(1, parseInt(e.target.value) || 1) })}
                                    />
                                    <p className="text-[10px] text-slate-400 ml-1">Leave as is for auto-positioning</p>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                                        Status
                                    </label>
                                    <select
                                        className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-3 text-sm font-bold text-slate-700 focus:bg-white focus:border-blue-500 outline-none transition-all cursor-pointer"
                                        value={form.isActive ? 'active' : 'inactive'}
                                        onChange={e => setForm({ ...form, isActive: e.target.value === 'active' })}
                                    >
                                        <option value="active">Active</option>
                                        <option value="inactive">Inactive</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 bg-slate-50 border-t border-slate-100 flex gap-3">
                            <button
                                onClick={() => setShowModal(false)}
                                className="flex-1 py-4 bg-white border-2 border-slate-200 text-slate-500 rounded-2xl font-black text-xs hover:bg-slate-50 transition-all active:scale-95"
                            >
                                DISCARD
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={isLoading}
                                className="flex-[2] py-4 bg-blue-600 text-white rounded-2xl font-black text-xs shadow-xl shadow-blue-100 hover:bg-blue-700 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {isLoading ? (
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <CheckCircle2 size={16} />
                                )}
                                <span>{editingSubject ? 'UPDATE QUESTION' : 'CREATE QUESTION'}</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                    <div
                        className="absolute inset-0 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300"
                        onClick={() => setShowDeleteConfirm(null)}
                    />
                    <div className="relative bg-white w-full max-w-sm rounded-3xl shadow-2xl p-8 animate-in zoom-in-95 fade-in duration-300 text-center space-y-6">
                        <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto shadow-inner">
                            <AlertTriangle size={40} />
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-xl font-black text-slate-800">Confirm Deletion?</h3>
                            <p className="text-sm text-slate-500 font-medium">
                                Are you sure you want to delete:
                            </p>
                            <p className="text-sm font-bold text-slate-700 bg-slate-50 p-2 rounded-xl">
                                "{showDeleteConfirm.subjectText.length > 60
                                    ? showDeleteConfirm.subjectText.substring(0, 60) + '...'
                                    : showDeleteConfirm.subjectText}"
                            </p>
                            <p className="text-sm text-amber-600 bg-amber-50 p-2 rounded-xl mt-3">
                                ⚠️ After deletion, all remaining questions will be renumbered automatically (order numbers will become sequential starting from 1).
                            </p>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowDeleteConfirm(null)}
                                className="flex-1 py-4 bg-slate-50 text-slate-500 rounded-2xl font-black text-xs hover:bg-slate-100 transition-all"
                            >
                                CANCEL
                            </button>
                            <button
                                onClick={handleDelete}
                                className="flex-1 py-4 bg-red-500 text-white rounded-2xl font-black text-xs shadow-lg shadow-red-100 hover:bg-red-600 transition-all active:scale-95"
                            >
                                YES, DELETE
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
        .sortable-ghost {
          opacity: 0.4;
          background: #e2e8f0;
        }
        .sortable-drag {
          opacity: 0.9;
          cursor: grabbing;
          box-shadow: 0 10px 25px -5px rgba(0,0,0,0.1);
        }
      `}</style>
        </div>
    );
}