import { Check, X, Minus } from 'lucide-react';

interface TriStateToggleProps {
  displayName: string;
  effective: boolean | null;
  override: boolean | null;
  isChanged: boolean;
  disabled?: boolean;
  onCycle: () => void;
}

export function TriStateToggle({
  displayName,
  effective,
  override,
  isChanged,
  disabled = false,
  onCycle,
}: TriStateToggleProps) {
  const effectiveState = effective === true ? 'allowed' : effective === false ? 'denied' : 'unknown';
  const overrideLabel = override !== null ? 'Employee override' : 'Inherited from position';

  const borderColor = () => {
    if (effective === true)
      return 'border-emerald-400 bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:border-emerald-500 dark:text-emerald-300';
    if (effective === false)
      return 'border-red-400 bg-red-50 text-red-700 dark:bg-red-900/20 dark:border-red-500 dark:text-red-300';
    return 'border-slate-200 bg-white text-slate-400 dark:bg-slate-800 dark:border-slate-600 dark:text-slate-500';
  };

  return (
    <button
      onClick={onCycle}
      disabled={disabled}
      className={`relative flex flex-col items-center justify-center gap-1 px-2 py-3 rounded-xl border-2 transition-all duration-150 active:scale-95 ${borderColor()} ${isChanged ? 'ring-2 ring-amber-400 dark:ring-amber-500' : ''} ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
      title={`${displayName} - ${effectiveState}${override !== null ? ' (employee override)' : ' (inherited from position)'} - Click to cycle`}
    >
      {effective === true && <Check className="h-5 w-5 text-emerald-500 dark:text-emerald-400" />}
      {effective === false && <X className="h-5 w-5 text-red-500 dark:text-red-400" />}
      {effective === null && (
        <Minus className="h-4 w-4 text-slate-300 dark:text-slate-600" />
      )}
      <span className="text-[11px] font-medium leading-tight text-center">{displayName}</span>
      <span className="text-[10px] text-slate-400 dark:text-slate-500 leading-tight text-center">
        {overrideLabel}
      </span>
      {isChanged && (
        <span className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-amber-400 rounded-full ring-2 ring-white dark:ring-slate-800 animate-pulse" />
      )}
    </button>
  );
}
