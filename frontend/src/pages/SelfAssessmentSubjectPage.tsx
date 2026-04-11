import React, { useState, useEffect } from 'react';
import axios from '../app/axiosInstance';
import { toast } from 'react-hot-toast';

const PRIMARY = '#0855BF';

interface Subject {
    id?: number;
    subjectText: string;
    displayOrder: number;
    isActive: boolean;
}

export function SelfAssessmentSubjectPage() {
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const [form, setForm] = useState<Subject>({
        subjectText: '',
        displayOrder: 1,
        isActive: true
    });

    useEffect(() => {
        fetchSubjects();
    }, []);

    const fetchSubjects = async () => {
        try {
            const resp = await axios.get('/api/self-assessment-subjects/all');
            setSubjects(resp.data.data || []);
        } catch (err) {
            toast.error('Failed to fetch subjects');
        }
    };

    const handleSave = async () => {
        if (!form.subjectText.trim()) {
            toast.error('Subject text is required');
            return;
        }

        setIsLoading(true);
        try {
            if (editingSubject) {
                await axios.put(`/api/self-assessment-subjects/${editingSubject.id}`, form);
                toast.success('Subject updated');
            } else {
                await axios.post('/api/self-assessment-subjects', form);
                toast.success('Subject created');
            }
            setForm({ subjectText: '', displayOrder: subjects.length + 1, isActive: true });
            setEditingSubject(null);
            fetchSubjects();
        } catch (err) {
            toast.error('Failed to save subject');
        } finally {
            setIsLoading(false);
        }
    };

    const handleEdit = (sub: Subject) => {
        setEditingSubject(sub);
        setForm({ ...sub });
    };

    const handleDelete = async (id: number) => {
        if (!window.confirm('Are you sure you want to delete this subject?')) return;
        try {
            await axios.delete(`/api/self-assessment-subjects/${id}`);
            toast.success('Subject deleted');
            fetchSubjects();
        } catch (err) {
            toast.error('Failed to delete subject');
        }
    };

    return (
        <div className="p-8 space-y-8 animate-in fade-in duration-500">
            <div>
                <h1 className="text-3xl font-extrabold tracking-tight" style={{ color: PRIMARY }}>Assessment Subjects</h1>
                <p className="text-slate-500 mt-1">Manage dynamic questions for employee self-assessments.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1">
                    <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm sticky top-8">
                        <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
                            <i className={`bi ${editingSubject ? 'bi-pencil-square' : 'bi-plus-circle-fill'} text-blue-600`}></i>
                            {editingSubject ? 'Edit Subject' : 'New Subject'}
                        </h3>

                        <div className="space-y-4">
                            <div>
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Question / Subject Text</label>
                                <textarea
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none h-32"
                                    placeholder="Enter question text..."
                                    value={form.subjectText}
                                    onChange={e => setForm({ ...form, subjectText: e.target.value })}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Display Order</label>
                                    <input
                                        type="number"
                                        min="1"
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm outline-none"
                                        value={form.displayOrder}
                                        onChange={e => setForm({ ...form, displayOrder: Math.max(1, parseInt(e.target.value) || 1) })}
                                    />
                                </div>
                                <div className="flex flex-col justify-end pb-2">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={form.isActive}
                                            onChange={e => setForm({ ...form, isActive: e.target.checked })}
                                            className="w-4 h-4 rounded text-blue-600"
                                        />
                                        <span className="text-xs font-bold text-slate-600">Active</span>
                                    </label>
                                </div>
                            </div>

                            <div className="flex gap-2 pt-2">
                                <button
                                    onClick={handleSave}
                                    disabled={isLoading}
                                    className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-blue-100 hover:bg-blue-700 transition"
                                >
                                    {isLoading ? 'Saving...' : editingSubject ? 'Update Subject' : 'Create Subject'}
                                </button>
                                {editingSubject && (
                                    <button
                                        onClick={() => {
                                            setEditingSubject(null);
                                            setForm({ subjectText: '', displayOrder: subjects.length + 1, isActive: true });
                                        }}
                                        className="px-4 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold text-sm"
                                    >
                                        Cancel
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-2 space-y-4">
                    <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest pl-2">Subject List</h3>
                    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 text-[10px] font-black uppercase text-slate-400 border-b border-slate-100">
                                    <th className="p-4 w-16">Order</th>
                                    <th className="p-4">Subject Text</th>
                                    <th className="p-4 w-24 text-center">Status</th>
                                    <th className="p-4 w-28 text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {subjects.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="p-8 text-center text-slate-400 italic">No subjects defined yet.</td>
                                    </tr>
                                ) : (
                                    subjects.map(sub => (
                                        <tr key={sub.id} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="p-4 font-bold text-slate-400">#{sub.displayOrder}</td>
                                            <td className="p-4">
                                                <div className="text-sm font-medium text-slate-700">{sub.subjectText}</div>
                                            </td>
                                            <td className="p-4 text-center">
                                                <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${sub.isActive ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                                                    {sub.isActive ? 'Active' : 'Inactive'}
                                                </span>
                                            </td>
                                            <td className="p-4">
                                                <div className="flex justify-center gap-2">
                                                    <button
                                                        onClick={() => handleEdit(sub)}
                                                        className="p-2 text-slate-400 hover:text-blue-600 transition-colors"
                                                    >
                                                        <i className="bi bi-pencil-square" />
                                                    </button>
                                                    <button
                                                        onClick={() => sub.id && handleDelete(sub.id)}
                                                        className="p-2 text-slate-400 hover:text-red-600 transition-colors"
                                                    >
                                                        <i className="bi bi-trash3" />
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
            </div>
        </div>
    );
}
