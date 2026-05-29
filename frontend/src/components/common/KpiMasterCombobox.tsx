import { useMemo, useState } from 'react';
import { Combobox, ComboboxButton, ComboboxInput, ComboboxOption, ComboboxOptions } from '@headlessui/react';
import { ChevronDown, Plus } from 'lucide-react';

export interface KpiMasterOption {
  id?: number;
  name: string;
}

interface KpiMasterComboboxProps {
  options: KpiMasterOption[];
  value: string;
  onChange: (value: string) => void;
  onAddNew: () => void;
  placeholder?: string;
  addLabel?: string;
  disabled?: boolean;
  allowEmpty?: boolean;
  emptyLabel?: string;
  noResultsLabel?: string;
}

export function KpiMasterCombobox({
  options,
  value,
  onChange,
  onAddNew,
  placeholder = 'Select…',
  addLabel = '+ Add New…',
  disabled = false,
  allowEmpty = false,
  emptyLabel = 'None',
  noResultsLabel = 'No results found',
}: KpiMasterComboboxProps) {
  const [query, setQuery] = useState('');

  const allNames = useMemo(() => {
    const names = options.map((option) => option.name);
    if (value && !names.includes(value)) {
      return [value, ...names];
    }
    return names;
  }, [options, value]);

  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return allNames;
    return allNames.filter((name) => name.toLowerCase().includes(normalizedQuery));
  }, [allNames, query]);

  return (
    <div className="relative">
      <Combobox
        value={value || null}
        onChange={(name: string | null) => {
          onChange(name ?? '');
          setQuery('');
        }}
        disabled={disabled}
        nullable
      >
        <div className="relative">
          <ComboboxInput
            className={`w-full rounded-lg border-none bg-slate-50 px-3 py-2 pr-8 text-sm font-bold text-slate-800 outline-none placeholder:font-medium placeholder:text-slate-400 focus:ring-2 focus:ring-[#dbeafe] ${disabled ? 'cursor-not-allowed opacity-70' : ''}`}
            displayValue={(name: string | null) => name ?? ''}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={placeholder}
            autoComplete="off"
          />
          <ComboboxButton className="absolute inset-y-0 right-0 flex items-center pr-2 text-slate-400">
            <ChevronDown size={14} aria-hidden />
          </ComboboxButton>
          <ComboboxOptions
            anchor="bottom start"
            className="z-50 mt-1 flex max-h-60 w-(--anchor-width) min-w-[220px] flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg focus:outline-none"
          >
            <div className="max-h-48 overflow-y-auto py-1">
              {allowEmpty && (
                <ComboboxOption
                  value={null}
                  className="cursor-pointer px-3 py-2 text-sm text-slate-500 data-focus:bg-[#eff6ff] data-selected:font-semibold data-selected:text-[#1d4ed8]"
                >
                  {emptyLabel}
                </ComboboxOption>
              )}
              {filtered.length === 0 ? (
                <div className="px-3 py-2 text-sm text-slate-500">{noResultsLabel}</div>
              ) : (
                filtered.map((name) => (
                  <ComboboxOption
                    key={name}
                    value={name}
                    className="cursor-pointer px-3 py-2 text-sm text-slate-800 data-focus:bg-[#eff6ff] data-selected:font-semibold data-selected:text-[#1d4ed8]"
                  >
                    {name}
                  </ComboboxOption>
                ))
              )}
            </div>
            {!disabled && (
              <div className="sticky bottom-0 shrink-0 border-t border-slate-100 bg-white">
                <button
                  type="button"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={onAddNew}
                  className="flex w-full items-center gap-1.5 px-3 py-2.5 text-left text-sm font-black text-[#2463eb] transition-colors hover:bg-[#eff6ff]"
                >
                  <Plus size={14} aria-hidden />
                  {addLabel}
                </button>
              </div>
            )}
          </ComboboxOptions>
        </div>
      </Combobox>
    </div>
  );
}
