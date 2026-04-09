import { useState } from 'react'
import {
  useGetCriteriaQuery,
  useCreateCriteriaMutation,
  useUpdateCriteriaMutation,
  useDeleteCriteriaMutation,
  type Criteria,
} from '../features/criteria/api/criteriaApi'
import { Dialog, Transition } from '@headlessui/react'
import { Fragment } from 'react'
import { useForm } from 'react-hook-form'

export function CriteriaPage() {
  const { data: criteriaResponse, isLoading } = useGetCriteriaQuery()
  const [createCriteria] = useCreateCriteriaMutation()
  const [updateCriteria] = useUpdateCriteriaMutation()
  const [deleteCriteria] = useDeleteCriteriaMutation()

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingCriteria, setEditingCriteria] = useState<Criteria | null>(null)

  const { register, handleSubmit, reset } = useForm<Partial<Criteria>>()

  const openModal = (criteria?: Criteria) => {
    if (criteria) {
      setEditingCriteria(criteria)
      reset(criteria)
    } else {
      setEditingCriteria(null)
      reset({ name: '', description: '' })
    }
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setEditingCriteria(null)
  }

  const onSubmit = async (data: Partial<Criteria>) => {
    try {
      if (editingCriteria) {
        await updateCriteria({ id: editingCriteria.id, data }).unwrap()
      } else {
        await createCriteria(data).unwrap()
      }
      closeModal()
    } catch (err) {
      console.error('Failed to save criteria', err)
    }
  }

  const handleDelete = async (id: number) => {
    if (confirm('Are you sure you want to delete this criteria?')) {
      await deleteCriteria(id).unwrap()
    }
  }

  if (isLoading) return <div className="p-8">Loading...</div>

  const criteriaList = criteriaResponse?.data || []

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Criteria Management</h1>
        <button
          onClick={() => openModal()}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg shadow hover:bg-blue-700 transition"
        >
          <i className="bi bi-plus-lg mr-2" />
          Add Criteria
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-sm font-semibold text-slate-600">
              <th className="p-4 w-16">No.</th>
              <th className="p-4">Name</th>
              <th className="p-4">Description</th>
              <th className="p-4">Status</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {criteriaList.map((c, index) => (
              <tr key={c.id} className="hover:bg-slate-50/50 transition">
                <td className="p-4 text-slate-500 font-medium">{index + 1}</td>
                <td className="p-4 font-medium text-slate-800">{c.name}</td>
                <td className="p-4 text-slate-600">{c.description}</td>
                <td className="p-4">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${c.active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {c.active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="p-4 text-right">
                  <button
                    onClick={() => openModal(c)}
                    className="text-blue-600 hover:text-blue-800 p-2 rounded hover:bg-blue-50 transition mr-2"
                  >
                    <i className="bi bi-pencil" />
                  </button>
                  <button
                    onClick={() => handleDelete(c.id)}
                    className="text-red-600 hover:text-red-800 p-2 rounded hover:bg-red-50 transition"
                  >
                    <i className="bi bi-trash" />
                  </button>
                </td>
              </tr>
            ))}
            {criteriaList.length === 0 && (
              <tr>
                <td colSpan={5} className="p-8 text-center text-slate-500">
                  No criteria found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Transition appear show={isModalOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={closeModal}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-slate-900/25 backdrop-blur-sm" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                  <Dialog.Title as="h3" className="text-lg font-semibold leading-6 text-slate-900 mb-4">
                    {editingCriteria ? 'Edit Criteria' : 'Add Criteria'}
                  </Dialog.Title>
                  
                  <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
                      <input
                        {...register('name', { required: true })}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                        placeholder="e.g. Communication Skills"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                      <textarea
                        {...register('description')}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none h-24 resize-none"
                        placeholder="Enter description..."
                      />
                    </div>
                    <div className="mt-6 flex justify-end gap-3">
                      <button
                        type="button"
                        className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
                        onClick={closeModal}
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition"
                      >
                        Save
                      </button>
                    </div>
                  </form>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </div>
  )
}
