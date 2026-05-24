import { useMemo, useState } from 'react'
import { Combobox, ComboboxButton, ComboboxInput, ComboboxOption, ComboboxOptions } from '@headlessui/react'

import type { PositionOptionDto } from '../../../features/hrCreateEmployee/hrEmployeeAccountApi'

interface PositionAutocompleteProps {
  positions: PositionOptionDto[]
  value: number | null
  onChange: (id: number | null) => void
  disabled?: boolean
  error?: string
  placeholder?: string
}

export function PositionAutocomplete({
  positions,
  value,
  onChange,
  disabled,
  error,
  placeholder = 'Search position…',
}: PositionAutocompleteProps) {
  const [query, setQuery] = useState('')
  const selected = useMemo(
    () => positions.find((p) => p.id === value) ?? null,
    [positions, value],
  )

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return positions
    return positions.filter((p) => p.positionName.toLowerCase().includes(q))
  }, [positions, query])

  return (
    <div className="relative">
      <Combobox
        value={selected}
        onChange={(p) => onChange(p ? p.id : null)}
        disabled={disabled}
        nullable
      >
        <div className="relative">
          <div className="flex rounded-lg border border-slate-300 bg-white shadow-sm focus-within:border-[#2463eb] focus-within:ring-2 focus-within:ring-[#2463eb]/20">
            <ComboboxInput
              className="w-full rounded-lg border-0 bg-transparent py-2.5 pr-10 pl-3 text-sm text-slate-900 focus:ring-0 disabled:bg-slate-100 disabled:text-slate-400"
              displayValue={(p: PositionOptionDto | null) => p?.positionName ?? ''}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={placeholder}
              autoComplete="off"
            />
            <ComboboxButton className="absolute inset-y-0 right-0 flex items-center px-2 text-slate-400">
              <i className="bi bi-chevron-expand" aria-hidden />
            </ComboboxButton>
          </div>
          <ComboboxOptions className="absolute z-30 mt-1 max-h-60 w-full overflow-auto rounded-lg border border-slate-200 bg-white py-1 shadow-lg focus:outline-none">
            {filtered.length === 0 ? (
              <div className="px-3 py-2 text-sm text-slate-500">No positions</div>
            ) : (
              filtered.map((p) => (
                <ComboboxOption
                  key={p.id}
                  value={p}
                  className="cursor-pointer px-3 py-2 text-sm text-slate-800 data-focus:bg-[#eff6ff] data-selected:font-semibold data-selected:text-[#1d4ed8]"
                >
                  {p.positionName} ({p.positionCode})
                </ComboboxOption>
              ))
            )}
          </ComboboxOptions>
        </div>
      </Combobox>
      {error ? <p className="mt-1 text-xs text-red-600">{error}</p> : null}
    </div>
  )
}
