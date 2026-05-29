import { useMemo, useState } from 'react'
import type { FollowUpMeeting, PipCommunicationNote } from '../pipApi'
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
  followUpMeetings?: FollowUpMeeting[]
  meetingNotes?: Array<{
    id: string
    noteType: string
    content: string
    authorName: string
    createdAt: string
  }>
  onError?: (message: string) => void
}

const NOTE_SECTIONS: Array<{ type: PipNoteType; label: string; emptyLabel: string }> = [
  { type: 'COMMUNICATION', label: 'Communication', emptyLabel: 'No communication notes yet.' },
  { type: 'FOLLOWUP', label: 'Follow-up', emptyLabel: 'No follow-up notes yet.' },
]

const NOTE_PAGE_SIZE = 100

const getAuthorName = (note: PipCommunicationNote) => {
  return note.author.employee?.employeeName || note.author.email || 'Unknown author'
}

export function PipCommunicationNotes({
  pipId,
  pipStatus,
  canAdd,
  currentUserId,
  isHr = false,
  followUpMeetings = [],
  meetingNotes = [],
  onError,
}: PipCommunicationNotesProps) {
  const [draftContents, setDraftContents] = useState<Record<PipNoteType, string>>({
    COMMUNICATION: '',
    FOLLOWUP: '',
  })
  const [editingNoteId, setEditingNoteId] = useState<number | null>(null)
  const [editingContent, setEditingContent] = useState('')

  const communicationQuery = useGetPipNotesQuery({
    pipId,
    noteType: 'COMMUNICATION',
    page: 0,
    size: NOTE_PAGE_SIZE,
  })
  const followupQuery = useGetPipNotesQuery({
    pipId,
    noteType: 'FOLLOWUP',
    page: 0,
    size: NOTE_PAGE_SIZE,
  })

  const [addPipNote, { isLoading: isAdding }] = useAddPipNoteMutation()
  const [deletePipNote, { isLoading: isDeleting }] = useDeletePipNoteMutation()
  const [updatePipNote, { isLoading: isUpdating }] = useUpdatePipNoteMutation()
  const isFollowUpWindowOpen = useMemo(() => {
    const now = Date.now()
    return followUpMeetings.some((meeting) => {
      const startValue = meeting.startMeetingTime || meeting.meetingTime
      const endValue = meeting.endMeetingTime
      if (!startValue || !endValue) return false
      const start = new Date(startValue).getTime()
      const end = new Date(endValue).getTime()
      return Number.isFinite(start) && Number.isFinite(end) && now >= start && now <= end
    })
  }, [followUpMeetings])

  const handleAdd = async (noteType: PipNoteType) => {
    const trimmedContent = draftContents[noteType].trim()
    if (!trimmedContent) {
      onError?.('Note content is required.')
      return
    }
    if (noteType === 'FOLLOWUP' && !isFollowUpWindowOpen) {
      onError?.('Follow-up notes can only be added during a scheduled follow-up meeting time.')
      return
    }

    try {
      await addPipNote({ pipId, content: trimmedContent, noteType }).unwrap()
      setDraftContents((drafts) => ({ ...drafts, [noteType]: '' }))
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
    if (note.noteType === 'FOLLOWUP' && !isFollowUpWindowOpen) {
      onError?.('Follow-up notes can only be edited during a scheduled follow-up meeting time.')
      return
    }

    try {
      await updatePipNote({ noteId: note.id, pipId, content: trimmedContent }).unwrap()
      cancelEdit()
    } catch (error: any) {
      onError?.(error?.data?.message || error?.error || 'Failed to update note.')
    }
  }

  const timelineNotes = useMemo(() => {
    const communicationNotes = (communicationQuery.data?.content ?? []).map((note) => ({
      id: `pip-${note.id}`,
      source: 'pip' as const,
      note,
      noteType: note.noteType === 'FOLLOWUP' ? 'Follow-up Note' : 'Communication Note',
      authorName: getAuthorName(note),
      createdAt: note.createdAt,
      content: note.content,
    }))
    const followupNotes = (followupQuery.data?.content ?? []).map((note) => ({
      id: `pip-${note.id}`,
      source: 'pip' as const,
      note,
      noteType: note.noteType === 'FOLLOWUP' ? 'Follow-up Note' : 'Communication Note',
      authorName: getAuthorName(note),
      createdAt: note.createdAt,
      content: note.content,
    }))
    const normalizedMeetingNotes = meetingNotes.map((note) => ({
      id: note.id,
      source: 'meeting' as const,
      note: null,
      noteType: note.noteType,
      authorName: note.authorName,
      createdAt: note.createdAt,
      content: note.content,
    }))

    return [...communicationNotes, ...followupNotes, ...normalizedMeetingNotes].sort((a, b) => {
      const bTime = new Date(b.createdAt).getTime()
      const aTime = new Date(a.createdAt).getTime()
      return (Number.isFinite(bTime) ? bTime : 0) - (Number.isFinite(aTime) ? aTime : 0)
    })
  }, [communicationQuery.data?.content, followupQuery.data?.content, meetingNotes])

  const isLoadingNotes =
    communicationQuery.isLoading ||
    communicationQuery.isFetching ||
    followupQuery.isLoading ||
    followupQuery.isFetching

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900">PIP Notes</h2>
          <p className="mt-1 text-xs font-medium text-slate-400">
            {pipStatus.replace(/_/g, ' ')}
            {!isFollowUpWindowOpen && ' - follow-up notes open only during scheduled meeting time'}
          </p>
        </div>
      </div>

      {canAdd && (
        <div className="mb-5 grid grid-cols-1 gap-4 xl:grid-cols-2">
          {NOTE_SECTIONS.map((section) => {
            return (
              <form
                key={section.type}
                className="rounded-lg border border-slate-100 bg-slate-50/60 p-4"
                onSubmit={(event) => {
                  event.preventDefault()
                  void handleAdd(section.type)
                }}
              >
                <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">
                  {section.type === 'FOLLOWUP' ? 'Follow-up Note' : 'Communication / PIP Note'}
                </label>
                <div className="relative">
                  <textarea
                    rows={3}
                    value={draftContents[section.type]}
                    onChange={(event) => setDraftContents((drafts) => ({ ...drafts, [section.type]: event.target.value }))}
                    disabled={section.type === 'FOLLOWUP' && !isFollowUpWindowOpen}
                    className="block w-full resize-none rounded-lg border border-slate-300 bg-white p-3 pr-12 text-sm text-slate-800 focus:border-[#2463eb] focus:outline-none disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
                    placeholder={section.type === 'FOLLOWUP' ? 'Add a follow-up note...' : 'Add a PIP note...'}
                  />
                  <button
                    type="submit"
                    disabled={isAdding || !draftContents[section.type].trim() || (section.type === 'FOLLOWUP' && !isFollowUpWindowOpen)}
                    className="absolute bottom-3 right-3 flex h-8 w-8 items-center justify-center rounded-lg bg-[#2463eb] text-white hover:bg-[#1d4ed8] disabled:cursor-not-allowed disabled:bg-[#93c5fd]"
                    aria-label={`Save ${section.label.toLowerCase()} note`}
                  >
                    <i className="bi bi-send" />
                  </button>
                </div>
              </form>
            )
          })}
        </div>
      )}

      <div className="h-[420px] overflow-y-auto rounded-lg border border-slate-100 bg-slate-50/60 p-4 pr-2">
        {isLoadingNotes && <p className="py-4 text-center text-slate-500">Loading notes...</p>}

        {!isLoadingNotes && timelineNotes.length === 0 && (
          <p className="py-4 text-center text-slate-500">No PIP notes yet.</p>
        )}

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
    </section>
  )
}
