import { useMemo, useState } from 'react'
import type { PipCommunicationNote } from '../pipApi'
import {
  useAddPipNoteMutation,
  useDeletePipNoteMutation,
  useGetPipNotesQuery,
  useUpdatePipNoteMutation,
} from '../pipApi'
import { formatDateTime } from '../../../utils/dateUtils'

type PipNoteType = 'COMMUNICATION' | 'FOLLOWUP'
type TimelineFilter = 'ALL' | PipNoteType

type PipCommunicationNotesProps = {
  pipId: number
  pipStatus: string
  canAdd: boolean
  currentUserId?: number
  isHr?: boolean
  onError?: (message: string) => void
}

const NOTE_PAGE_SIZE = 100

const COMPOSER_TABS: Array<{
  type: PipNoteType
  label: string
  shortLabel: string
  placeholder: string
  icon: string
}> = [
  {
    type: 'COMMUNICATION',
    label: 'Communication note',
    shortLabel: 'Communication',
    placeholder: 'Share progress, questions, or context for your manager and HR…',
    icon: 'bi-chat-left-text',
  },
  {
    type: 'FOLLOWUP',
    label: 'Follow-up note',
    shortLabel: 'Follow-up',
    placeholder: 'Capture outcomes and action items from your follow-up meeting…',
    icon: 'bi-calendar2-check',
  },
]

const FILTER_OPTIONS: Array<{ value: TimelineFilter; label: string }> = [
  { value: 'ALL', label: 'All' },
  { value: 'COMMUNICATION', label: 'Communication' },
  { value: 'FOLLOWUP', label: 'Follow-up' },
]

const getAuthorName = (note: PipCommunicationNote) => {
  return note.author.employee?.employeeName || note.author.email || 'Unknown author'
}

const getInitials = (name: string) => {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase()
  return `${parts[0].charAt(0)}${parts[parts.length - 1].charAt(0)}`.toUpperCase()
}

const formatStatusLabel = (status: string) => status.replace(/_/g, ' ')

const noteMatchesFilter = (noteTypeLabel: string, filter: TimelineFilter) => {
  if (filter === 'ALL') return true
  if (filter === 'COMMUNICATION') {
    return noteTypeLabel.toLowerCase().includes('communication') || noteTypeLabel.toLowerCase().includes('meeting')
  }
  return noteTypeLabel.toLowerCase().includes('follow-up') || noteTypeLabel.toLowerCase().includes('followup')
}

export function PipCommunicationNotes({
  pipId,
  pipStatus,
  canAdd,
  currentUserId,
  isHr = false,
  onError,
}: PipCommunicationNotesProps) {
  const [activeComposer, setActiveComposer] = useState<PipNoteType>('COMMUNICATION')
  const [draftContents, setDraftContents] = useState<Record<PipNoteType, string>>({
    COMMUNICATION: '',
    FOLLOWUP: '',
  })
  const [editingNoteId, setEditingNoteId] = useState<number | null>(null)
  const [editingContent, setEditingContent] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [timelineFilter, setTimelineFilter] = useState<TimelineFilter>('ALL')

  const communicationQuery = useGetPipNotesQuery({
    pipId,
    noteType: 'COMMUNICATION',
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

  const nextFollowUpMeeting = useMemo(() => {
    const now = Date.now()
    return followUpMeetings
      .map((meeting) => {
        const startValue = meeting.startMeetingTime || meeting.meetingTime
        const endValue = meeting.endMeetingTime
        if (!startValue) return null
        const start = new Date(startValue).getTime()
        const end = endValue ? new Date(endValue).getTime() : start
        return { meeting, start, end }
      })
      .filter((entry): entry is { meeting: FollowUpMeeting; start: number; end: number } => entry !== null)
      .filter((entry) => entry.end >= now)
      .sort((a, b) => a.start - b.start)[0]?.meeting
  }, [followUpMeetings])

  const handleAdd = async (noteType: PipNoteType) => {
    const trimmedContent = draftContents[noteType].trim()
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
    const followupNotes = (followupQuery.data?.content ?? []).map((note) => ({
      id: `pip-${note.id}`,
      source: 'pip' as const,
      note,
      noteType: 'Follow-up Note',
      authorName: getAuthorName(note),
      createdAt: note.createdAt,
      content: note.content,
    }))
    const linkedMeetingNotes = meetingNotes.map((note) => ({
      id: note.id,
      source: 'meeting' as const,
      note: null,
      noteType: note.noteType,
      authorName: note.authorName,
      createdAt: note.createdAt,
      content: note.content,
    }))

    return [...communicationNotes, ...followupNotes, ...linkedMeetingNotes].sort((a, b) => {
      const bTime = new Date(b.createdAt).getTime()
      const aTime = new Date(a.createdAt).getTime()
      return (Number.isFinite(bTime) ? bTime : 0) - (Number.isFinite(aTime) ? aTime : 0)
    })
  }, [communicationQuery.data?.content, followupQuery.data?.content, meetingNotes])

  const filteredTimelineNotes = useMemo(() => {
    const normalizedSearch = searchQuery.trim().toLowerCase()
    return timelineNotes.filter((entry) => {
      if (!noteMatchesFilter(entry.noteType, timelineFilter)) return false
      if (!normalizedSearch) return true
      return (
        entry.content.toLowerCase().includes(normalizedSearch)
        || entry.authorName.toLowerCase().includes(normalizedSearch)
        || entry.noteType.toLowerCase().includes(normalizedSearch)
      )
    })
  }, [timelineNotes, searchQuery, timelineFilter])

  const isLoadingNotes =
    communicationQuery.isLoading
    || communicationQuery.isFetching
    || followupQuery.isLoading
    || followupQuery.isFetching

  const activeTab = COMPOSER_TABS.find((tab) => tab.type === activeComposer) ?? COMPOSER_TABS[0]
  const followUpComposerDisabled = activeComposer === 'FOLLOWUP' && !isFollowUpWindowOpen

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-lg font-black tracking-tight text-slate-900">
            <i className="bi bi-journal-text mr-2 text-blue-600" />
            PIP Notes
          </h2>
          <p className="mt-1 text-sm font-medium text-slate-500">
            Communication with your manager and documented follow-up meeting notes.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center rounded-xl bg-slate-100 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-slate-600">
            {formatStatusLabel(pipStatus)}
          </span>
          <span
            className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-[10px] font-black uppercase tracking-widest ${
              isFollowUpWindowOpen
                ? 'bg-emerald-50 text-emerald-700'
                : 'bg-amber-50 text-amber-700'
            }`}
          >
            <i className={`bi ${isFollowUpWindowOpen ? 'bi-unlock-fill' : 'bi-lock-fill'}`} />
            Follow-up {isFollowUpWindowOpen ? 'open' : 'closed'}
          </span>
        </div>
      </div>

      {!isFollowUpWindowOpen && (
        <div className="flex gap-3 rounded-2xl border border-amber-100 bg-amber-50/80 px-4 py-3.5">
          <i className="bi bi-info-circle mt-0.5 shrink-0 text-amber-600" />
          <div className="min-w-0 text-sm">
            <p className="font-bold text-amber-900">Follow-up notes are only available during scheduled meetings</p>
            <p className="mt-0.5 font-medium text-amber-800/90">
              {nextFollowUpMeeting
                ? `Next follow-up: ${formatDateTime(nextFollowUpMeeting.startMeetingTime || nextFollowUpMeeting.meetingTime)}`
                : 'No upcoming follow-up meeting is scheduled on this PIP.'}
            </p>
          </div>
        </div>
      )}

      {canAdd && (
        <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4 sm:p-5">
          <div className="mb-4 inline-flex w-full flex-wrap gap-1 rounded-2xl border border-slate-100 bg-white p-1 sm:w-auto">
            {COMPOSER_TABS.map((tab) => {
              const isActive = activeComposer === tab.type
              const isDisabled = tab.type === 'FOLLOWUP' && !isFollowUpWindowOpen
              return (
                <button
                  key={tab.type}
                  type="button"
                  onClick={() => setActiveComposer(tab.type)}
                  className={`inline-flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs font-black transition-all sm:flex-none ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                  } ${isDisabled && !isActive ? 'opacity-60' : ''}`}
                >
                  <i className={`bi ${tab.icon}`} />
                  {tab.shortLabel}
                </button>
              )
            })}
          </div>

          <form
            onSubmit={(event) => {
              event.preventDefault()
              void handleAdd(activeComposer)
            }}
          >
            <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-slate-400">
              {activeTab.label}
            </label>
            <div className="relative">
              <textarea
                rows={4}
                value={draftContents[activeComposer]}
                onChange={(event) =>
                  setDraftContents((drafts) => ({ ...drafts, [activeComposer]: event.target.value }))}
                disabled={followUpComposerDisabled}
                className="block w-full resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3.5 pr-14 text-sm font-medium leading-6 text-slate-800 shadow-inner focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
                placeholder={activeTab.placeholder}
              />
              <button
                type="submit"
                disabled={
                  isAdding
                  || !draftContents[activeComposer].trim()
                  || followUpComposerDisabled
                }
                className="absolute bottom-3 right-3 inline-flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white shadow-md transition-all hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
                aria-label={`Post ${activeTab.shortLabel.toLowerCase()} note`}
              >
                <i className="bi bi-send-fill text-sm" />
              </button>
            </div>
            <p className="mt-2 text-xs font-medium text-slate-400">
              {activeComposer === 'FOLLOWUP'
                ? 'Visible to you, your manager, and HR when the follow-up meeting window is active.'
                : 'Use communication notes for ongoing updates between follow-up meetings.'}
            </p>
          </form>
        </div>
      )}

      <div className="rounded-2xl border border-slate-100 bg-white">
        <div className="flex flex-col gap-3 border-b border-slate-100 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <div>
            <h3 className="text-sm font-black text-slate-900">Note history</h3>
            <p className="text-xs font-medium text-slate-400">
              {filteredTimelineNotes.length} of {timelineNotes.length} note{timelineNotes.length === 1 ? '' : 's'}
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="relative min-w-[220px]">
              <i className="bi bi-search absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search notes…"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm font-medium text-slate-800 outline-none transition-colors focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20"
                aria-label="Search PIP notes"
              />
            </div>
            <div className="inline-flex flex-wrap gap-1 rounded-xl border border-slate-100 bg-slate-50 p-1">
              {FILTER_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setTimelineFilter(option.value)}
                  className={`rounded-lg px-3 py-1.5 text-[10px] font-black uppercase tracking-wider transition-all ${
                    timelineFilter === option.value
                      ? 'bg-white text-blue-700 shadow-sm'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="max-h-[min(520px,60vh)] overflow-y-auto px-4 py-5 sm:px-5">
          {isLoadingNotes && (
            <div className="flex items-center justify-center gap-3 py-12">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
              <span className="text-sm font-bold text-slate-500">Loading notes…</span>
            </div>
          )}

          {!isLoadingNotes && filteredTimelineNotes.length === 0 && (
            <div className="flex flex-col items-center justify-center py-14 text-center">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-300">
                <i className="bi bi-chat-square-text text-2xl" />
              </div>
              <p className="text-sm font-black text-slate-600">
                {timelineNotes.length === 0 ? 'No notes yet' : 'No notes match your search'}
              </p>
              <p className="mt-1 max-w-sm text-xs font-medium text-slate-400">
                {timelineNotes.length === 0
                  ? canAdd
                    ? 'Post a communication note above, or add a follow-up note during your next scheduled meeting.'
                    : 'Notes from your manager, HR, and meetings will appear here.'
                  : 'Try a different search term or filter.'}
              </p>
            </div>
          )}

          {!isLoadingNotes && filteredTimelineNotes.length > 0 && (
            <div className="relative space-y-5 before:absolute before:bottom-2 before:left-5 before:top-2 before:w-0.5 before:bg-slate-100">
              {filteredTimelineNotes.map((entry) => {
                const note = entry.note
                const canDelete = note ? isHr || note.author.id === currentUserId : false
                const canEdit = canDelete
                const isEditing = note ? editingNoteId === note.id : false
                const isFollowUp = entry.noteType.toLowerCase().includes('follow-up')
                const isMeeting = entry.source === 'meeting'

                return (
                  <article key={entry.id} className="relative pl-12">
                    <div
                      className={`absolute left-0 top-1 flex h-10 w-10 items-center justify-center rounded-2xl border-4 border-white text-xs font-black shadow-sm ${
                        isFollowUp
                          ? 'bg-violet-50 text-violet-600'
                          : isMeeting
                            ? 'bg-emerald-50 text-emerald-600'
                            : 'bg-blue-50 text-blue-600'
                      }`}
                    >
                      {getInitials(entry.authorName)}
                    </div>

                    <div className="rounded-2xl border border-slate-100 bg-slate-50/40 p-4 transition-shadow hover:shadow-sm">
                      <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="mb-2 flex flex-wrap items-center gap-2">
                            <span
                              className={`inline-flex rounded-lg px-2.5 py-1 text-[10px] font-black uppercase tracking-wider ${
                                isFollowUp
                                  ? 'bg-violet-100 text-violet-700'
                                  : isMeeting
                                    ? 'bg-emerald-100 text-emerald-700'
                                    : 'bg-blue-100 text-blue-700'
                              }`}
                            >
                              {entry.noteType}
                            </span>
                            {isMeeting && (
                              <span className="inline-flex rounded-lg bg-slate-200/80 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-slate-600">
                                From meeting
                              </span>
                            )}
                          </div>
                          <p className="text-sm font-black text-slate-900">{entry.authorName}</p>
                          <p className="text-xs font-medium text-slate-400">{formatDateTime(entry.createdAt)}</p>
                        </div>
                        {(canEdit || canDelete) && note && (
                          <div className="flex shrink-0 items-center gap-1">
                            {canEdit && !isEditing && (
                              <button
                                type="button"
                                onClick={() => openEdit(note)}
                                className="rounded-lg px-2.5 py-1 text-xs font-black text-blue-600 hover:bg-blue-50"
                              >
                                Edit
                              </button>
                            )}
                            {canDelete && (
                              <button
                                type="button"
                                onClick={() => handleDelete(note)}
                                disabled={isDeleting || isUpdating}
                                className="rounded-lg px-2.5 py-1 text-xs font-black text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:text-red-300"
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
                            className="block w-full rounded-xl border border-slate-200 bg-white p-3 text-sm font-medium text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                            placeholder="Update note content…"
                          />
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={cancelEdit}
                              disabled={isUpdating}
                              className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-black text-slate-600 hover:bg-white disabled:cursor-not-allowed disabled:text-slate-300"
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              onClick={() => handleUpdate(note)}
                              disabled={isUpdating || !editingContent.trim()}
                              className="rounded-xl bg-blue-600 px-3 py-1.5 text-xs font-black text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
                            >
                              {isUpdating ? 'Saving…' : 'Save'}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <p className="whitespace-pre-wrap break-words text-sm font-medium leading-6 text-slate-700">
                          {entry.content}
                        </p>
                      )}
                    </div>
                  </article>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
