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
import { Plus, Pencil, Trash2, X, AlertTriangle, CheckCircle2, GripVertical } from 'lucide-react';

const PRIMARY = '#0855BF';

interface Criteria {
    id?: number;
    name: string;
    description: string;
    sortOrder: number;
    active: boolean;
}

interface SortableCriteriaRowProps {
    criteria: Criteria;
    index: number;
    onEdit: (c: Criteria) => void;
    onDelete: (id: number) => void;
}

function SortableCriteriaRow({ criteria, index, onEdit, onDelete }: SortableCriteriaRowProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: criteria.id! });

    const style = {
        transform: CSS.Translate.toString(transform),
        transition,
        zIndex: isDragging ? 20 : 0,
        opacity: isDragging ? 0.3 : 1,
    };

    return (
        <tr 
            ref={setNodeRef} 
            style={style} 
            className={`bg-white border-b border-slate-50 group ${isDragging ? 'shadow-2xl relative z-20' : 'hover:bg-slate-50/50 transition-colors'}`}
        >
            <td className="p-6 text-center">
                <div className="flex items-center justify-center gap-3">
                    <button 
                        {...attributes} 
                        {...listeners}
                        className="cursor-grab active:cursor-grabbing p-2 text-slate-300 hover:text-blue-400 transition-colors"
                    >
                        <GripVertical size={20} />
                    </button>
                    <span className="font-black text-slate-300 text-lg group-hover:text-blue-200 transition-colors">#{index + 1}</span>
                </div>
            </td>
            <td className="p-6">
                <div className="text-base font-bold text-slate-700 group-hover:text-slate-900 transition-colors">{criteria.name}</div>
                {criteria.description && (
                    <div className="text-xs font-medium text-slate-500 mt-1 line-clamp-2">{criteria.description}</div>
                )}
            </td>
            <td className="p-6 text-center">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter shadow-sm border ${criteria.active
                        ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                        : 'bg-slate-50 text-slate-400 border-slate-100'
                    }`}>
                    <div className={`w-1.5 h-1.5 rounded-full ${criteria.active ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                    {criteria.active ? 'Active' : 'Inactive'}
                </span>
            </td>
            <td className="p-6">
                <div className="flex justify-center gap-3">
                    <button
                        onClick={() => onEdit(criteria)}
                        className="w-10 h-10 rounded-xl bg-slate-50 text-slate-400 hover:bg-blue-50 hover:text-blue-600 transition-all flex items-center justify-center group/btn"
                        title="Edit Criteria"
                    >
                        <Pencil size={18} className="group-hover/btn:scale-110 transition-transform" />
                    </button>
                    <button
                        onClick={() => onDelete(criteria.id!)}
                        className="w-10 h-10 rounded-xl bg-slate-50 text-slate-400 hover:bg-red-50 hover:text-red-600 transition-all flex items-center justify-center group/btn"
                        title="Delete Criteria"
                    >
                        <Trash2 size={18} className="group-hover/btn:scale-110 transition-transform" />
                    </button>
                </div>
            </td>
        </tr>
    );
}

export function CriteriaPage() {
    const [criteriaList, setCriteriaList] = useState<Criteria[]>([]);
    const [editingCriteria, setEditingCriteria] = useState<Criteria | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isReordering, setIsReordering] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState<number | null>(null);

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    const [form, setForm] = useState<Criteria>({
        name: '',
        description: '',
        sortOrder: 1,
        active: true
    });

    useEffect(() => {
        fetchCriteria();
    }, []);

    const fetchCriteria = async () => {
        try {
            const resp = await axios.get('/criteria');
            const data = resp.data.data || [];
            // Ensure data is sorted by sortOrder from backend initially
            setCriteriaList([...data].sort((a, b) => a.sortOrder - b.sortOrder));
        } catch (err) {
            console.error(err);
            toast.error('Failed to fetch criteria list');
        }
    };

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;
        if (!over || active.id === over.id) return;

        const oldIndex = criteriaList.findIndex(c => c.id === active.id);
        const newIndex = criteriaList.findIndex(c => c.id === over.id);

        const newList = arrayMove(criteriaList, oldIndex, newIndex).map((item, idx) => ({
            ...item,
            sortOrder: idx + 1
        }));

        setCriteriaList(newList);
        setIsReordering(true);

        try {
            // Persist all sortOrder changes
            await Promise.all(newList.map(item => 
                axios.put(`/criteria/${item.id}`, item)
            ));
            toast.success('Order updated');
        } catch (err) {
            toast.error('Failed to update order');
            fetchCriteria();
        } finally {
            setIsReordering(false);
        }
    };

    const handleOpenCreate = () => {
        setEditingCriteria(null);
        setForm({
            name: '',
            description: '',
            sortOrder: criteriaList.length + 1,
            active: true
        });
        setShowModal(true);
    };

    const handleSave = async () => {
        if (!form.name.trim()) {
            toast.error('Criteria name is required');
            return;
        }

        setIsLoading(true);
        try {
            if (editingCriteria) {
                await axios.put(`/criteria/${editingCriteria.id}`, form);
                toast.success('Criteria updated successfully');
            } else {
                await axios.post('/criteria', form);
                toast.success('New criteria created successfully');
            }
            setShowModal(false);
            fetchCriteria();
        } catch (err) {
            console.error(err);
            toast.error('Failed to save criteria');
        } finally {
            setIsLoading(false);
        }
    };

    const handleEdit = (criteria: Criteria) => {
        setEditingCriteria(criteria);
        // Ensure null description or missing values are handled safely in the UI
        setForm({
            ...criteria,
            description: criteria.description || '',
            sortOrder: criteria.sortOrder || 1
        });
        setShowModal(true);
    };

    const handleDelete = async (id: number) => {
        try {
            await axios.delete(`/criteria/${id}`);
            toast.success('Criteria deleted successfully');
            setShowDeleteConfirm(null);
            fetchCriteria();
        } catch (err) {
            console.error(err);
            toast.error('Failed to delete criteria');
        }
    };

    return (
        <div className="p-8 space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto">
            {/* Header section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-8 rounded-3xl border border-slate-100 shadow-sm shadow-slate-200/50">
                <div>
                    <h1 className="text-4xl font-black tracking-tight" style={{ color: PRIMARY }}>Feedback Criteria</h1>
                    <p className="text-slate-500 mt-2 font-medium">Manage the criteria used for 360-degree feedback performance evaluations.</p>
                </div>
                <button
                    onClick={handleOpenCreate}
                    className="flex items-center gap-2 px-6 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black text-sm transition-all shadow-xl shadow-blue-100 active:scale-95 whitespace-nowrap"
                >
                    <Plus size={20} strokeWidth={3} />
                    <span>ADD NEW CRITERIA</span>
                </button>
            </div>

            {isReordering && (
                <div className="bg-blue-50 border border-blue-200 rounded-2xl px-4 py-3 text-sm text-blue-700 flex items-center gap-2 animate-pulse">
                    <div className="w-4 h-4 border-2 border-blue-300 border-t-blue-600 rounded-full animate-spin" />
                    <span>Synchronizing order with server...</span>
                </div>
            )}

            {/* List section */}
            <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
                <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                    <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest pl-2">Configured Criteria ({criteriaList.length})</h3>
                    <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse"></span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Live Preview</span>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <DndContext 
                        sensors={sensors} 
                        collisionDetection={closestCenter} 
                        onDragEnd={handleDragEnd}
                    >
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-white text-[10px] font-black uppercase text-slate-400 border-b border-slate-100">
                                    <th className="p-6 w-32 text-center">#</th>
                                    <th className="p-6">Criteria Details</th>
                                    <th className="p-6 w-32 text-center">Status</th>
                                    <th className="p-6 w-40 text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {criteriaList.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="p-16 text-center">
                                            <div className="flex flex-col items-center gap-3 grayscale opacity-30">
                                                <div className="w-16 h-16 rounded-3xl bg-slate-100 flex items-center justify-center">
                                                    <Plus size={32} className="text-slate-400" />
                                                </div>
                                                <p className="text-slate-500 font-bold italic">No criteria defined yet.</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    <SortableContext 
                                        items={criteriaList.map(c => c.id!)} 
                                        strategy={verticalListSortingStrategy}
                                    >
                                        {criteriaList.map((criteria, index) => (
                                            <SortableCriteriaRow 
                                                key={criteria.id} 
                                                criteria={criteria} 
                                                index={index} 
                                                onEdit={handleEdit} 
                                                onDelete={(id) => setShowDeleteConfirm(id)} 
                                            />
                                        ))}
                                    </SortableContext>
                                )}
                            </tbody>
                        </table>
                    </DndContext>
                </div>
            </div>

            {/* Form Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div
                        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300"
                        onClick={() => !isLoading && setShowModal(false)}
                    />
                    <div className="relative bg-white w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 fade-in duration-300 border border-slate-100">
                        {/* Modal Header */}
                        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                            <h3 className="font-black text-slate-800 flex items-center gap-2">
                                <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-100">
                                    {editingCriteria ? <Pencil size={16} /> : <Plus size={18} />}
                                </div>
                                <span>{editingCriteria ? 'EDIT CRITERIA' : 'CREATE NEW CRITERIA'}</span>
                            </h3>
                            <button
                                onClick={() => setShowModal(false)}
                                className="w-8 h-8 rounded-full hover:bg-slate-100 text-slate-400 flex items-center justify-center transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-8 space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Criteria Name</label>
                                <input
                                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-3 text-sm font-bold text-slate-700 focus:bg-white focus:border-blue-500 outline-none transition-all placeholder:text-slate-300"
                                    placeholder="e.g. Communication Skills"
                                    value={form.name}
                                    onChange={e => setForm({ ...form, name: e.target.value })}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Description (Optional)</label>
                                <textarea
                                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-4 text-sm font-bold text-slate-700 focus:bg-white focus:border-blue-500 outline-none h-32 transition-all placeholder:text-slate-300 placeholder:italic"
                                    placeholder="Describe what this criteria measures..."
                                    value={form.description}
                                    onChange={e => setForm({ ...form, description: e.target.value })}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Status</label>
                                    <div className="flex flex-col justify-end h-[46px]">
                                        <label className="group flex items-center gap-3 p-3 bg-slate-50 border-2 border-slate-100 rounded-2xl cursor-pointer hover:bg-white hover:border-blue-100 transition-all">
                                            <div className={`w-10 h-6 rounded-full relative transition-all ${form.active ? 'bg-emerald-500' : 'bg-slate-300'}`}>
                                                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${form.active ? 'left-5' : 'left-1'}`} />
                                            </div>
                                            <input
                                                type="checkbox"
                                                className="hidden"
                                                checked={form.active}
                                                onChange={e => setForm({ ...form, active: e.target.checked })}
                                            />
                                            <span className={`text-xs font-black uppercase ${form.active ? 'text-emerald-600' : 'text-slate-400'}`}>
                                                {form.active ? 'Active' : 'Inactive'}
                                            </span>
                                        </label>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="p-6 bg-slate-50 border-t border-slate-100 flex gap-3">
                            <button
                                onClick={() => setShowModal(false)}
                                className="flex-1 py-4 bg-white border-2 border-slate-200 text-slate-500 rounded-2xl font-black text-xs hover:bg-slate-50 transition-all active:scale-95"
                            >
                                DISCARD CHANGES
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
                                <span>{editingCriteria ? 'UPDATE CRITERIA' : 'CONFIRM & CREATE'}</span>
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
                            <p className="text-sm text-slate-500 font-medium px-4">This action cannot be undone. You are about to permanently delete this feedback criteria.</p>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowDeleteConfirm(null)}
                                className="flex-1 py-4 bg-slate-50 text-slate-500 rounded-2xl font-black text-xs hover:bg-slate-100 transition-all"
                            >
                                NO, CANCEL
                            </button>
                            <button
                                onClick={() => showDeleteConfirm && handleDelete(showDeleteConfirm)}
                                className="flex-1 py-4 bg-red-500 text-white rounded-2xl font-black text-xs shadow-lg shadow-red-100 hover:bg-red-600 transition-all active:scale-95"
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
