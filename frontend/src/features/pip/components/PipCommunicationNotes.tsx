import { useState } from 'react'
import type { PipCommunicationNote } from '../pipApi'
import {
  useAddPipNoteMutation,
  useDeletePipNoteMutation,
  useGetPipNotesQuery,
  useUpdatePipNoteMutation,
} from '../pipApi'
import { formatDateTime } from '../../../utils/dateUtils'

type PipNoteType = 'COMMUNICATION' | 'FOLLOWUP'

type PipCommunicationNotesProps = {
  pipId: number
  pipStatus: string
  canAdd: boolean
  currentUserId?: number
  isHr?: boolean
  onError?: (message: string) => void
}

const NOTE_SECTIONS: Array<{ type: PipNoteType; label: string; emptyLabel: string }> = [
  { type: 'COMMUNICATION', label: 'Communication', emptyLabel: 'No communication notes yet.' },
  { type: 'FOLLOWUP', label: 'Followup', emptyLabel: 'No followup notes yet.' },
]

const INITIAL_SIZE = 4

const getAuthorName = (note: PipCommunicationNote) => {
  return note.author.employee?.employeeName || note.author.email || 'Unknown author'
}

const getVisibleLabel = (shown: number, total: number) => {
  if (total === 0) return 'No notes'
  return `Showing ${Math.min(shown, total)} of ${total}`
}

export function PipCommunicationNotes({
  pipId,
  pipStatus,
  canAdd,
  currentUserId,
  isHr = false,
  onError,
}: PipCommunicationNotesProps) {
  const [visibleSizes, setVisibleSizes] = useState<Record<PipNoteType, number>>({
    COMMUNICATION: INITIAL_SIZE,
    FOLLOWUP: INITIAL_SIZE,
  })
  const [showModal, setShowModal] = useState(false)
  const [content, setContent] = useState('')
  const [selectedNoteType, setSelectedNoteType] = useState<PipNoteType>('COMMUNICATION')
  const [editingNoteId, setEditingNoteId] = useState<number | null>(null)
  const [editingContent, setEditingContent] = useState('')

  const communicationQuery = useGetPipNotesQuery({
    pipId,
    noteType: 'COMMUNICATION',
    page: 0,
    size: visibleSizes.COMMUNICATION,
  })
  const followupQuery = useGetPipNotesQuery({
    pipId,
    noteType: 'FOLLOWUP',
    page: 0,
    size: visibleSizes.FOLLOWUP,
  })
  const notePages = {
    COMMUNICATION: communicationQuery.data,
    FOLLOWUP: followupQuery.data,
  }
  const loadingByType = {
    COMMUNICATION: communicationQuery.isLoading || communicationQuery.isFetching,
    FOLLOWUP: followupQuery.isLoading || followupQuery.isFetching,
  }

  const [addPipNote, { isLoading: isAdding }] = useAddPipNoteMutation()
  const [deletePipNote, { isLoading: isDeleting }] = useDeletePipNoteMutation()
  const [updatePipNote, { isLoading: isUpdating }] = useUpdatePipNoteMutation()

  const openAddModal = (noteType: PipNoteType) => {
    setSelectedNoteType(noteType)
    setShowModal(true)
  }

  const handleAdd = async () => {
    const trimmedContent = content.trim()
    if (!trimmedContent) {
      onError?.('Note content is required.')
      return
    }

    try {
      await addPipNote({ pipId, content: trimmedContent, noteType: selectedNoteType }).unwrap()
      setContent('')
      setShowModal(false)
    } catch (error: any) {
      onError?.(error?.data?.message || error?.error || 'Failed to add note.')
    }
  }

  const handleDelete = async (note: PipCommunicationNote) => {
    try {
      await deletePipNote({ noteId: note.id, pipId }).unwrap()
      if (editingNoteId === note.id) {
        setEditingNoteId(null)
        setEditingContent('')
      }
    } catch (error: any) {
      onError?.(error?.data?.message || error?.error || 'Failed to delete note.')
    }
  }

  const openEdit = (note: PipCommunicationNote) => {
    setEditingNoteId(note.id)
    setEditingContent(note.content)
  }

  const cancelEdit = () => {
    setEditingNoteId(null)
    setEditingContent('')
  }

  const handleUpdate = async (note: PipCommunicationNote) => {
    const trimmedContent = editingContent.trim()
    if (!trimmedContent) {
      onError?.('Note content is required.')
      return
    }

    try {
      await updatePipNote({ noteId: note.id, pipId, content: trimmedContent }).unwrap()
      cancelEdit()
    } catch (error: any) {
      onError?.(error?.data?.message || error?.error || 'Failed to update note.')
    }
  }

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900">PIP Notes</h2>
          <p className="mt-1 text-xs font-medium text-slate-400">{pipStatus.replace(/_/g, ' ')}</p>
        </div>
        {canAdd && (
          <button
            type="button"
            onClick={() => openAddModal('COMMUNICATION')}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#2463eb] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1d4ed8]"
          >
            <i className="bi bi-plus-lg" />
            Add Note
          </button>
        )}
      </div>

      <div className="overflow-auto">
        <div className="grid min-w-[760px] grid-cols-1 gap-6 xl:grid-cols-2">
          {NOTE_SECTIONS.map((section) => {
            const page = notePages[section.type]
            const notes = page?.content ?? []
            const isLoading = loadingByType[section.type]
            const totalElements = page?.totalElements ?? 0
            const visibleSize = visibleSizes[section.type]
            return (
              <div key={section.type} className="max-h-[640px] overflow-auto rounded-lg border border-slate-100 bg-slate-50/60 p-4">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      {section.label} ({totalElements})
                    </h3>
                    <p className="mt-1 text-xs font-semibold text-slate-400">{getVisibleLabel(visibleSize, totalElements)}</p>
                  </div>
                </div>

                {isLoading && <p className="py-4 text-center text-slate-500">Loading notes...</p>}

                {!isLoading && notes.length === 0 && (
                  <p className="py-4 text-center text-slate-500">{section.emptyLabel}</p>
                )}

                {!isLoading && notes.length > 0 && (
                  <div className="space-y-4">
                    {notes.map((note) => {
                      const canDelete = isHr || note.author.id === currentUserId
                      const canEdit = canDelete
                      const isEditing = editingNoteId === note.id
                      return (
                        <div key={note.id} className="rounded-lg border border-slate-100 bg-white p-4 shadow-sm">
                          <div className="mb-3 flex items-start justify-between gap-4">
                            <div>
                              <p className="text-sm font-bold text-slate-900">{getAuthorName(note)}</p>
                              <p className="text-xs font-medium text-slate-400">{formatDateTime(note.createdAt)}</p>
                            </div>
                            {(canEdit || canDelete) && (
                              <div className="flex shrink-0 items-center gap-1">
                                {canEdit && !isEditing && (
                                  <button
                                    type="button"
                                    onClick={() => openEdit(note)}
                                    className="rounded-md px-2 py-1 text-xs font-semibold text-[#2463eb] hover:bg-[#eff6ff]"
                                  >
                                    Edit
                                  </button>
                                )}
                                {canDelete && (
                                  <button
                                    type="button"
                                    onClick={() => handleDelete(note)}
                                    disabled={isDeleting || isUpdating}
                                    className="rounded-md px-2 py-1 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:text-red-300"
                                  >
                                    Delete
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                          {isEditing ? (
                            <div className="space-y-3">
                              <textarea
                                rows={4}
                                value={editingContent}
                                onChange={(event) => setEditingContent(event.target.value)}
                                className="block w-full rounded-lg border border-slate-300 p-3 text-sm text-slate-800 focus:border-[#2463eb] focus:outline-none"
                                placeholder="Write the PIP note..."
                              />
                              <div className="flex justify-end gap-2">
                                <button
                                  type="button"
                                  onClick={cancelEdit}
                                  disabled={isUpdating}
                                  className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-300"
                                >
                                  Cancel
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleUpdate(note)}
                                  disabled={isUpdating || !editingContent.trim()}
                                  className="rounded-lg bg-[#2463eb] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#1d4ed8] disabled:cursor-not-allowed disabled:bg-[#93c5fd]"
                                >
                                  {isUpdating ? 'Saving...' : 'Save'}
                                </button>
                              </div>
                            </div>
                          ) : (
                            <p className="whitespace-pre-wrap break-words text-sm leading-6 text-slate-700">{note.content}</p>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}

                {!isLoading && notes.length > 0 && (page?.hasNext || visibleSize > INITIAL_SIZE) && (
                  <div className="mt-4 flex justify-center gap-2">
                    {page?.hasNext && (
                      <button
                        type="button"
                        onClick={() => setVisibleSizes((sizes) => ({ ...sizes, [section.type]: sizes[section.type] + INITIAL_SIZE }))}
                        className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-[#2463eb] hover:bg-[#eff6ff]"
                      >
                        See More
                      </button>
                    )}
                    {visibleSize > INITIAL_SIZE && (
                      <button
                        type="button"
                        onClick={() => setVisibleSizes((sizes) => ({ ...sizes, [section.type]: Math.max(INITIAL_SIZE, sizes[section.type] - INITIAL_SIZE) }))}
                        className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100"
                      >
                        Hide 4
                      </button>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl">
            <h3 className="mb-4 text-lg font-bold text-slate-900">Add PIP Note</h3>
            <div className="mb-4 inline-flex rounded-lg border border-slate-200 bg-slate-50 p-1">
              {NOTE_SECTIONS.map((section) => (
                <button
                  key={section.type}
                  type="button"
                  onClick={() => setSelectedNoteType(section.type)}
                  className={`rounded-md px-3 py-1.5 text-xs font-semibold ${selectedNoteType === section.type ? 'bg-white text-[#1d4ed8] shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                >
                  {section.label}
                </button>
              ))}
            </div>
            <textarea
              rows={6}
              value={content}
              onChange={(event) => setContent(event.target.value)}
              className="block w-full rounded-lg border border-slate-300 p-3 text-sm text-slate-800 focus:border-[#2463eb] focus:outline-none"
              placeholder="Write the PIP note..."
            />
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowModal(false)
                  setContent('')
                }}
                className="px-4 py-2 text-sm font-medium text-slate-600"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAdd}
                disabled={isAdding || !content.trim()}
                className="rounded-lg bg-[#2463eb] px-4 py-2 text-sm font-medium text-white hover:bg-[#1d4ed8] disabled:cursor-not-allowed disabled:bg-[#93c5fd]"
              >
                {isAdding ? 'Saving...' : 'Save Note'}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
