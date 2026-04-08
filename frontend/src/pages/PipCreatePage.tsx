import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCreatePipMutation } from '../features/pip/pipApi'

export default function PipCreatePage() {
  const navigate = useNavigate()
  const [createPip, { isLoading }] = useCreatePipMutation()

  const [formData, setFormData] = useState({
    employeeId: '',
    startDate: '',
    endDate: '',
    totalHours: 0,
  })

  const [objectives, setObjectives] = useState([''])

  const handleAddObjective = () => setObjectives([...objectives, ''])
  const handleObjectiveChange = (index: number, value: string) => {
    const newObjectives = [...objectives]
    newObjectives[index] = value
    setObjectives(newObjectives)
  }
  const handleRemoveObjective = (index: number) => {
    if (objectives.length > 1) {
      setObjectives(objectives.filter((_, i) => i !== index))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await createPip({
        ...formData,
        objectives: objectives.filter((obj) => obj.trim() !== ''),
      }).unwrap()
      navigate('/admin/pip-monitoring')
    } catch (err) {
      console.error('Failed to create PIP:', err)
      alert('Failed to create PIP. Please check employee ID and try again.')
    }
  }

  return (
    <div className="mx-auto max-w-2xl p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Create New PIP</h1>
        <p className="text-slate-500">Initiate a Performance Improvement Plan for an employee.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700">Employee ID</label>
            <input
              type="text"
              required
              className="mt-1 block w-full rounded-lg border border-slate-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="E.g. EMP001"
              value={formData.employeeId}
              onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
            />
          </div>
 
          <div>
            <label className="block text-sm font-medium text-slate-700">Total Hours</label>
            <input
              type="number"
              required
              min="1"
              className="mt-1 block w-full rounded-lg border border-slate-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="E.g. 100"
              value={formData.totalHours}
              onChange={(e) => setFormData({ ...formData, totalHours: parseInt(e.target.value) })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700">Start Date</label>
              <input
                type="date"
                required
                className="mt-1 block w-full rounded-lg border border-slate-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">End Date</label>
              <input
                type="date"
                required
                className="mt-1 block w-full rounded-lg border border-slate-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-3">
            <label className="block text-sm font-medium text-slate-700">Improvement Objectives</label>
            {objectives.map((obj, index) => (
              <div key={index} className="flex gap-2">
                <input
                  type="text"
                  required
                  className="block w-full rounded-lg border border-slate-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder={`Objective ${index + 1}`}
                  value={obj}
                  onChange={(e) => handleObjectiveChange(index, e.target.value)}
                />
                {objectives.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveObjective(index)}
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-red-200 bg-red-50 text-red-600 hover:bg-red-100"
                  >
                    <i className="bi bi-trash" />
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={handleAddObjective}
              className="flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-700"
            >
              <i className="bi bi-plus-lg" /> Add Objective
            </button>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <button
            type="button"
            onClick={() => navigate('/admin/pip-monitoring')}
            className="rounded-lg border border-slate-300 px-6 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="rounded-lg bg-blue-600 px-6 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 disabled:opacity-50"
          >
            {isLoading ? 'Creating...' : 'Create PIP'}
          </button>
        </div>
      </form>
    </div>
  )
}
