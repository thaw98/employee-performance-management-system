import { useMemo, useState } from 'react'
import { Combobox, ComboboxButton, ComboboxInput, ComboboxOption, ComboboxOptions } from '@headlessui/react'
import { ChevronDown } from 'lucide-react'

import type { EmployeeListItem } from '../../features/hrEmployeeList/hrEmployeeApi'

function formatEmployeeLabel(emp: EmployeeListItem): string {
  return `${emp.employeeName} (${emp.staffNo})`
}

interface EmployeeAutocompleteProps {
  employees: EmployeeListItem[]
  value: number | null
  onChange: (id: number | null) => void
  disabled?: boolean
  placeholder?: string
  /** Compact styling for inline filter bars (e.g. KPI Modeler header). */
  variant?: 'default' | 'inline'
}

export function EmployeeAutocomplete({
  employees,
  value,
  onChange,
  disabled,
  placeholder = 'Search employee…',
  variant = 'default',
}: EmployeeAutocompleteProps) {
  const [query, setQuery] = useState('')
  const selected = useMemo(
    () => employees.find((e) => e.employeeId === value) ?? null,
    [employees, value],
  )

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return employees
    return employees.filter((e) => {
      const label = formatEmployeeLabel(e).toLowerCase()
      return (
        label.includes(q) ||
        e.employeeName.toLowerCase().includes(q) ||
        e.staffNo.toLowerCase().includes(q) ||
        (e.departmentName?.toLowerCase().includes(q) ?? false) ||
        (e.positionName?.toLowerCase().includes(q) ?? false)
      )
    })
  }, [employees, query])

  const isInline = variant === 'inline'

  return (
    <div className="relative min-w-[200px]">
      <Combobox
        value={selected}
        onChange={(e) => onChange(e ? e.employeeId : null)}
        disabled={disabled}
        nullable
      >
        <div className="relative">
          <div
            className={
              isInline
                ? 'relative flex items-center'
                : 'flex rounded-lg border border-slate-300 bg-white shadow-sm focus-within:border-[#2463eb] focus-within:ring-2 focus-within:ring-[#2463eb]/20'
            }
          >
            <ComboboxInput
              className={
                isInline
                  ? 'w-full min-w-[200px] border-0 bg-transparent py-0 pr-8 pl-0 text-sm font-bold text-slate-900 focus:ring-0 outline-none placeholder:font-medium placeholder:text-slate-400'
                  : 'w-full rounded-lg border-0 bg-transparent py-2.5 pr-10 pl-3 text-sm text-slate-900 focus:ring-0 disabled:bg-slate-100 disabled:text-slate-400'
              }
              displayValue={(e: EmployeeListItem | null) => (e ? formatEmployeeLabel(e) : '')}
              onChange={(ev) => setQuery(ev.target.value)}
              placeholder={placeholder}
              autoComplete="off"
            />
            <ComboboxButton
              className={
                isInline
                  ? 'absolute inset-y-0 right-0 flex items-center text-slate-400'
                  : 'absolute inset-y-0 right-0 flex items-center px-2 text-slate-400'
              }
            >
              <ChevronDown size={14} aria-hidden />
            </ComboboxButton>
          </div>
          <ComboboxOptions
            anchor="bottom start"
            className="z-50 mt-1 max-h-60 w-(--anchor-width) min-w-[240px] overflow-auto rounded-xl border border-slate-200 bg-white py-1 shadow-lg focus:outline-none"
          >
            {filtered.length === 0 ? (
              <div className="px-3 py-2 text-sm text-slate-500">No employees found</div>
            ) : (
              filtered.map((e) => (
                <ComboboxOption
                  key={e.employeeId}
                  value={e}
                  className="cursor-pointer px-3 py-2 text-sm text-slate-800 data-focus:bg-[#eff6ff] data-selected:font-semibold data-selected:text-[#1d4ed8]"
                >
                  <span className="font-semibold">{e.employeeName}</span>
                  <span className="text-slate-500"> ({e.staffNo})</span>
                </ComboboxOption>
              ))
            )}
          </ComboboxOptions>
        </div>
      </Combobox>
    </div>
  )
}
