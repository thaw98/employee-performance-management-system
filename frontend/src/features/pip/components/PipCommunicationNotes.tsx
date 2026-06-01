import { useMemo, useState } from 'react'
import type { PipCommunicationNote } from '../pipApi'
import {
  useAddPipNoteMutation,
  useDeletePipNoteMutation,
  useGetPipNotesQuery,
  useUpdatePipNoteMutation,
} from '../pipApi'
import { formatDateTime } from '../../../utils/dateUtils'

type PipCommunicationNotesProps = {
  pipId: number
  pipStatus: string
  canAdd: boolean
  currentUserId?: number
  isHr?: boolean
  onError?: (message: string) => void
}

const NOTE_PAGE_SIZE = 100

const getAuthorName = (note: PipCommunicationNote) => {
  return note.author.employee?.employeeName || note.author.email || 'Unknown author'
}

const getNoteErrorMessage = (error: unknown, fallback: string) => {
  if (typeof error !== 'object' || error === null) return fallback
  const apiError = error as { data?: { message?: string }; error?: string }
  return apiError.data?.message || apiError.error || fallback
}

export function PipCommunicationNotes({
  pipId,
  pipStatus,
  canAdd,
  currentUserId,
  isHr = false,
  onError,
}: PipCommunicationNotesProps) {
  const [draftContent, setDraftContent] = useState('')
  const [editingNoteId, setEditingNoteId] = useState<number | null>(null)
  const [editingContent, setEditingContent] = useState('')

  const communicationQuery = useGetPipNotesQuery({
    pipId,
    noteType: 'COMMUNICATION',
    page: 0,
    size: NOTE_PAGE_SIZE,
  })

  const [addPipNote, { isLoading: isAdding }] = useAddPipNoteMutation()
  const [deletePipNote, { isLoading: isDeleting }] = useDeletePipNoteMutation()
  const [updatePipNote, { isLoading: isUpdating }] = useUpdatePipNoteMutation()
  const handleAdd = async () => {
    const trimmedContent = draftContent.trim()
    if (!trimmedContent) {
      onError?.('Note content is required.')
      return
    }

    try {
      await addPipNote({ pipId, content: trimmedContent, noteType: 'COMMUNICATION' }).unwrap()
      setDraftContent('')
    } catch (error: unknown) {
      onError?.(getNoteErrorMessage(error, 'Failed to add note.'))
    }
  }

  const handleDelete = async (note: PipCommunicationNote) => {
    try {
      await deletePipNote({ noteId: note.id, pipId }).unwrap()
      if (editingNoteId === note.id) {
        setEditingNoteId(null)
        setEditingContent('')
      }
    } catch (error: unknown) {
      onError?.(getNoteErrorMessage(error, 'Failed to delete note.'))
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
    } catch (error: unknown) {
      onError?.(getNoteErrorMessage(error, 'Failed to update note.'))
    }
  }

  const timelineNotes = useMemo(() => {
    const communicationNotes = (communicationQuery.data?.content ?? []).map((note) => ({
      id: `pip-${note.id}`,
      source: 'pip' as const,
      note,
      noteType: 'Communication Note',
      authorName: getAuthorName(note),
      createdAt: note.createdAt,
      content: note.content,
    }))

    return communicationNotes.sort((a, b) => {
      const bTime = new Date(b.createdAt).getTime()
      const aTime = new Date(a.createdAt).getTime()
      return (Number.isFinite(bTime) ? bTime : 0) - (Number.isFinite(aTime) ? aTime : 0)
    })
  }, [communicationQuery.data?.content])

  const isLoadingNotes =
    communicationQuery.isLoading ||
    communicationQuery.isFetching

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900">PIP Notes</h2>
          <p className="mt-1 text-xs font-medium text-slate-400">
            {pipStatus.replace(/_/g, ' ')}
          </p>
        </div>
      </div>

      {canAdd && (
        <form
          className="mb-5 rounded-lg border border-slate-100 bg-slate-50/60 p-4"
          onSubmit={(event) => {
            event.preventDefault()
            void handleAdd()
          }}
        >
          <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">
            Communication / PIP Note
          </label>
          <div className="relative">
            <textarea
              rows={3}
              value={draftContent}
              onChange={(event) => setDraftContent(event.target.value)}
              className="block w-full resize-none rounded-lg border border-slate-300 bg-white p-3 pr-12 text-sm text-slate-800 focus:border-[#2463eb] focus:outline-none disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
              placeholder="Add a PIP note..."
            />
            <button
              type="submit"
              disabled={isAdding || !draftContent.trim()}
              className="absolute bottom-3 right-3 flex h-8 w-8 items-center justify-center rounded-lg bg-[#2463eb] text-white hover:bg-[#1d4ed8] disabled:cursor-not-allowed disabled:bg-[#93c5fd]"
              aria-label="Save communication note"
            >
              <i className="bi bi-send" />
            </button>
          </div>
        </form>
      )}

      {(isLoadingNotes || timelineNotes.length > 0) && (
        <div className="h-[420px] overflow-y-auto rounded-lg border border-slate-100 bg-slate-50/60 p-4 pr-2">
          {isLoadingNotes && <p className="py-4 text-center text-slate-500">Loading notes...</p>}

          {!isLoadingNotes && timelineNotes.length > 0 && (
          <div className="space-y-4">
            {timelineNotes.map((entry) => {
              const note = entry.note
              const canDelete = note ? isHr || note.author.id === currentUserId : false
              const canEdit = canDelete
              const isEditing = note ? editingNoteId === note.id : false
              return (
                <div key={entry.id} className="rounded-lg border border-slate-100 bg-white p-4 shadow-sm">
                  <div className="mb-3 flex items-start justify-between gap-4">
                    <div>
                      <span className="mb-2 inline-flex rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-blue-700">
                        {entry.noteType}
                      </span>
                      <p className="text-sm font-bold text-slate-900">{entry.authorName}</p>
                      <p className="text-xs font-medium text-slate-400">{formatDateTime(entry.createdAt)}</p>
                    </div>
                    {(canEdit || canDelete) && note && (
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
                  {isEditing && note ? (
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
                    <p className="whitespace-pre-wrap break-words text-sm leading-6 text-slate-700">{entry.content}</p>
                  )}
                </div>
              )
            })}
          </div>
          )}
        </div>
      )}
    </section>
  )
}
