import { useMemo, useState } from 'react'
import { Combobox, ComboboxButton, ComboboxInput, ComboboxOption, ComboboxOptions } from '@headlessui/react'
import { ChevronDown } from 'lucide-react'

export interface PositionOption {
  positionId: number
  positionName: string
}

interface PositionAutocompleteProps {
  positions: PositionOption[]
  value: number | null
  onChange: (id: number | null) => void
  disabled?: boolean
  placeholder?: string
}

export function PositionAutocomplete({
  positions,
  value,
  onChange,
  disabled,
  placeholder = 'Search position…',
}: PositionAutocompleteProps) {
  const [query, setQuery] = useState('')
  const selected = useMemo(
    () => positions.find((p) => p.positionId === value) ?? null,
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
        onChange={(p) => onChange(p ? p.positionId : null)}
        disabled={disabled}
        nullable
      >
        <div className="relative">
          <div className="flex rounded-xl border border-slate-200 bg-white shadow-sm focus-within:border-[#2463eb] focus-within:ring-1 focus-within:ring-[#dbeafe]">
            <ComboboxInput
              className="w-full rounded-xl border-0 bg-transparent px-4 py-2 pr-10 text-sm font-bold text-slate-700 focus:ring-0 disabled:bg-slate-50 disabled:text-slate-400"
              displayValue={(p: PositionOption | null) => p?.positionName ?? ''}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={placeholder}
              autoComplete="off"
            />
            <ComboboxButton className="absolute inset-y-0 right-0 flex items-center px-3 text-slate-400">
              <ChevronDown size={14} aria-hidden />
            </ComboboxButton>
          </div>
          <ComboboxOptions
            anchor="bottom start"
            className="z-50 mt-1 max-h-60 w-(--anchor-width) min-w-[220px] overflow-auto rounded-xl border border-slate-200 bg-white py-1 shadow-lg focus:outline-none"
          >
            {filtered.length === 0 ? (
              <div className="px-3 py-2 text-sm text-slate-500">No positions found</div>
            ) : (
              filtered.map((p) => (
                <ComboboxOption
                  key={p.positionId}
                  value={p}
                  className="cursor-pointer px-3 py-2 text-sm text-slate-800 data-focus:bg-[#eff6ff] data-selected:font-semibold data-selected:text-[#1d4ed8]"
                >
                  {p.positionName}
                </ComboboxOption>
              ))
            )}
          </ComboboxOptions>
        </div>
      </Combobox>
    </div>
  )
}
