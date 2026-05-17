import type { ReactNode } from 'react';
import { formatRemarkDateTime } from '../../../utils/dateUtils';

type RemarkCommentHeaderProps = {
  title: string;
  dateTime?: string | null;
  titleClassName?: string;
  dateClassName?: string;
  leading?: ReactNode;
};

export function RemarkCommentHeader({
  title,
  dateTime,
  titleClassName = 'text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400',
  dateClassName = 'text-xs font-semibold tabular-nums text-slate-700 dark:text-slate-200',
  leading,
}: RemarkCommentHeaderProps) {
  return (
    <div className="mb-2 flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
      <div className="flex min-w-0 items-center gap-2">
        {leading}
        <h4 className={titleClassName}>{title}</h4>
      </div>
      {dateTime ? (
        <span className={`shrink-0 whitespace-nowrap ${dateClassName}`}>{formatRemarkDateTime(dateTime)}</span>
      ) : null}
    </div>
  );
}
