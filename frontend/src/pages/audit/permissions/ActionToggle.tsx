import { Check, X } from 'lucide-react';

interface ActionToggleProps {
  displayName: string;
  allowed: boolean;
  isChanged: boolean;
  disabled?: boolean;
  onToggle: () => void;
}

export function ActionToggle({ displayName, allowed, isChanged, disabled = false, onToggle }: ActionToggleProps) {
  return (
    <button
      onClick={onToggle}
      disabled={disabled}
      className={`relative flex flex-col items-center justify-center gap-1.5 px-2 py-3 rounded-xl border-2 transition-all duration-150 active:scale-95 ${
        allowed
          ? 'bg-emerald-50 border-emerald-400 text-emerald-700 shadow-sm hover:bg-emerald-100 hover:shadow-md dark:bg-emerald-900/20 dark:border-emerald-500 dark:text-emerald-300 dark:hover:bg-emerald-900/30'
          : 'bg-white border-slate-200 text-slate-400 hover:border-slate-300 hover:bg-slate-50 dark:bg-slate-800 dark:border-slate-600 dark:text-slate-500 dark:hover:border-slate-500 dark:hover:bg-slate-700/50'
      } ${isChanged ? 'ring-2 ring-amber-400 dark:ring-amber-500' : ''} ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
      title={`${displayName} - Click to ${allowed ? 'deny' : 'allow'}`}
    >
      {allowed ? (
        <Check className="h-5 w-5 text-emerald-500 dark:text-emerald-400" />
      ) : (
        <X className="h-5 w-5 text-slate-300 dark:text-slate-600" />
      )}
      <span className="text-[11px] font-medium leading-tight text-center">{displayName}</span>
      {isChanged && (
        <span className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-amber-400 rounded-full ring-2 ring-white dark:ring-slate-800 animate-pulse" />
      )}
    </button>
  );
}
