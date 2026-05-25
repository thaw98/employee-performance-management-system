import { useMemo, useState } from 'react'
import { Combobox, ComboboxButton, ComboboxInput, ComboboxOption, ComboboxOptions } from '@headlessui/react'

import type { DepartmentOptionDto } from '../../../features/hrCreateEmployee/hrEmployeeAccountApi'

interface DepartmentAutocompleteProps {
  departments: DepartmentOptionDto[]
  value: number | null
  onChange: (id: number | null) => void
  disabled?: boolean
  error?: string
  placeholder?: string
}

export function DepartmentAutocomplete({
  departments,
  value,
  onChange,
  disabled,
  error,
  placeholder = 'Search department…',
}: DepartmentAutocompleteProps) {
  const [query, setQuery] = useState('')
  const selected = useMemo(
    () => departments.find((d) => d.departmentId === value) ?? null,
    [departments, value],
  )

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return departments
    return departments.filter((d) => d.departmentName.toLowerCase().includes(q))
  }, [departments, query])

  return (
    <div className="relative">
      <Combobox
        value={selected}
        onChange={(d) => onChange(d ? d.departmentId : null)}
        disabled={disabled}
        nullable
      >
        <div className="relative">
          <div className="flex rounded-lg border border-slate-300 bg-white shadow-sm focus-within:border-[#2463eb] focus-within:ring-2 focus-within:ring-[#2463eb]/20">
            <ComboboxInput
              className="w-full rounded-lg border-0 bg-transparent py-2.5 pr-10 pl-3 text-sm text-slate-900 focus:ring-0"
              displayValue={(d: DepartmentOptionDto | null) => d?.departmentName ?? ''}
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
              <div className="px-3 py-2 text-sm text-slate-500">No departments</div>
            ) : (
              filtered.map((d) => (
                <ComboboxOption
                  key={d.departmentId}
                  value={d}
                  className="cursor-pointer px-3 py-2 text-sm text-slate-800 data-focus:bg-[#eff6ff] data-selected:font-semibold data-selected:text-[#1d4ed8]"
                >
                  {d.departmentName}
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
