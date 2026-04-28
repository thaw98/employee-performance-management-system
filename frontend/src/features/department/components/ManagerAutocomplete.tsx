import { useMemo, useState } from 'react'
import { Combobox, ComboboxButton, ComboboxInput, ComboboxOption, ComboboxOptions } from '@headlessui/react'
import { ChevronsUpDown, X } from 'lucide-react'

import type { ManagerOption } from '../types'

interface ManagerAutocompleteProps {
  managers: ManagerOption[]
  value: number | null
  onChange: (id: number | null) => void
  disabled?: boolean
  error?: string
  placeholder?: string
}

const getManagerLabel = (manager: ManagerOption | null): string => {
  if (!manager) return ''
  return manager.staffNo ? `${manager.fullName} (${manager.staffNo})` : manager.fullName
}

export default function ManagerAutocomplete({
  managers,
  value,
  onChange,
  disabled,
  error,
  placeholder = 'Search manager...',
}: ManagerAutocompleteProps) {
  const [query, setQuery] = useState('')
  const selected = useMemo(
    () => managers.find((manager) => manager.employeeId === value) ?? null,
    [managers, value],
  )

  const filteredManagers = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return managers

    return managers.filter((manager) => {
      const searchable = [
        manager.fullName,
        manager.staffNo,
        manager.email,
        manager.departmentName,
        manager.positionName,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()

      return searchable.includes(q)
    })
  }, [managers, query])

  return (
    <div className="relative">
      <Combobox
        value={selected}
        onChange={(manager) => onChange(manager ? manager.employeeId : null)}
        disabled={disabled}
        nullable
      >
        <div className="relative">
          <div className="flex rounded-xl border border-slate-200 bg-slate-50 shadow-sm transition-all focus-within:border-blue-400 focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-100">
            <ComboboxInput
              className="w-full rounded-xl border-0 bg-transparent py-2.5 pl-4 pr-16 text-sm font-medium text-slate-800 placeholder:font-normal placeholder:text-slate-400 focus:ring-0 disabled:cursor-not-allowed disabled:text-slate-400"
              displayValue={(manager: ManagerOption | null) => getManagerLabel(manager)}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={placeholder}
              autoComplete="off"
            />
            {selected && !disabled ? (
              <button
                type="button"
                onClick={() => {
                  setQuery('')
                  onChange(null)
                }}
                className="absolute inset-y-0 right-8 flex items-center px-1.5 text-slate-400 hover:text-slate-600"
              >
                <X size={14} aria-hidden />
              </button>
            ) : null}
            <ComboboxButton className="absolute inset-y-0 right-0 flex items-center px-3 text-slate-400">
              <ChevronsUpDown size={15} aria-hidden />
            </ComboboxButton>
          </div>
          <ComboboxOptions className="absolute z-30 mt-1 max-h-60 w-full overflow-auto rounded-xl border border-slate-200 bg-white py-1 text-sm shadow-lg focus:outline-none">
            {filteredManagers.length === 0 ? (
              <div className="px-3 py-2 text-sm text-slate-500">No managers found</div>
            ) : (
              filteredManagers.map((manager) => (
                <ComboboxOption
                  key={manager.employeeId}
                  value={manager}
                  className="cursor-pointer px-3 py-2 text-slate-800 data-focus:bg-blue-50 data-selected:font-semibold data-selected:text-blue-800"
                >
                  <span className="block truncate">{getManagerLabel(manager)}</span>
                  <span className="block truncate text-xs font-normal text-slate-500">
                    {manager.departmentName || 'No department'}
                    {manager.positionName ? ` - ${manager.positionName}` : ''}
                  </span>
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
