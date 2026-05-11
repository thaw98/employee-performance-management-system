import React from 'react';

type PageToken = number | 'ellipsis';

function buildPageTokens(pageIndex: number, pageCount: number, delta = 2): PageToken[] {
  if (pageCount <= 0) return [];
  if (pageCount <= 7) return Array.from({ length: pageCount }, (_v, i) => i);

  const tokens: PageToken[] = [];
  tokens.push(0);

  const left = Math.max(1, pageIndex - delta);
  const right = Math.min(pageCount - 2, pageIndex + delta);

  if (left > 1) tokens.push('ellipsis');
  for (let i = left; i <= right; i++) tokens.push(i);
  if (right < pageCount - 2) tokens.push('ellipsis');

  tokens.push(pageCount - 1);
  return tokens;
}

function formatRangeLabel(opts: {
  pageIndex: number;
  pageSize: number;
  totalItems: number;
  itemLabel: string;
}): React.ReactNode {
  const { pageIndex, pageSize, totalItems, itemLabel } = opts;

  if (totalItems <= 0) {
    return (
      <>
        Showing <span className="font-semibold text-slate-700 dark:text-slate-200">0</span> of{' '}
        <span className="font-semibold text-slate-700 dark:text-slate-200">0</span> {itemLabel}
      </>
    );
  }

  const start = pageIndex * pageSize + 1;
  const end = Math.min((pageIndex + 1) * pageSize, totalItems);
  return (
    <>
      Showing <span className="font-semibold text-slate-700 dark:text-slate-200">{start}</span>
      {' – '}
      <span className="font-semibold text-slate-700 dark:text-slate-200">{end}</span> of{' '}
      <span className="font-semibold text-slate-700 dark:text-slate-200">{totalItems}</span> {itemLabel}
    </>
  );
}

export type PaginationBarProps = {
  pageIndex: number;
  pageSize: number;
  pageCount: number;
  totalItems: number;
  itemLabel: string;
  rowsPerPageOptions?: number[];
  onPageIndexChange: (nextPageIndex: number) => void;
  onPageSizeChange: (nextPageSize: number) => void;
  className?: string;
};

export const PaginationBar: React.FC<PaginationBarProps> = ({
  pageIndex,
  pageSize,
  pageCount,
  totalItems,
  itemLabel,
  rowsPerPageOptions = [5, 10, 20, 50],
  onPageIndexChange,
  onPageSizeChange,
  className,
}) => {
  const canPrev = pageIndex > 0;
  const canNext = pageIndex < Math.max(0, pageCount - 1);
  const pageTokens = buildPageTokens(pageIndex, pageCount);

  return (
    <div
      className={[
        'mt-4 flex flex-col items-center justify-between gap-3 rounded-xl border border-slate-200/70 bg-white px-5 py-3.5 shadow-sm',
        'dark:border-slate-700/60 dark:bg-slate-800/70',
        'sm:flex-row',
        className ?? '',
      ].join(' ')}
    >
      <div className="order-2 flex items-center gap-4 sm:order-1">
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {formatRangeLabel({ pageIndex, pageSize, totalItems, itemLabel })}
        </p>
        <div className="flex items-center gap-1.5">
          <span className="text-sm text-slate-400 dark:text-slate-500">Rows:</span>
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="cursor-pointer rounded-lg border border-slate-200 bg-white px-2 py-1 text-sm font-medium text-slate-700 transition-all hover:border-[#5D5FEF]/50 focus:outline-none focus:ring-2 focus:ring-[#5D5FEF]/20 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:hover:border-[#5D5FEF]/60"
            aria-label="Rows per page"
          >
            {rowsPerPageOptions.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="order-1 flex items-center gap-1 sm:order-2">
        <button
          type="button"
          onClick={() => onPageIndexChange(Math.max(0, pageIndex - 1))}
          disabled={!canPrev}
          className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-600 transition-all hover:bg-slate-50 hover:border-slate-300 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
        >
          <span className="text-xs" aria-hidden>
            ‹
          </span>
          <span>Prev</span>
        </button>

        {pageTokens.map((token, idx) =>
          token === 'ellipsis' ? (
            <span key={`ellipsis-${idx}`} className="select-none px-2 text-sm text-slate-400 dark:text-slate-500">
              …
            </span>
          ) : (
            <button
              key={token}
              type="button"
              onClick={() => onPageIndexChange(token)}
              className={[
                'h-9 min-w-[36px] rounded-lg border text-sm font-semibold transition-all',
                pageIndex === token
                  ? 'border-[#5D5FEF] bg-[#5D5FEF] text-white shadow-sm shadow-[#5D5FEF]/15'
                  : 'border-slate-200 bg-white text-slate-600 hover:border-[#5D5FEF]/30 hover:bg-[#5D5FEF]/6 hover:text-[#5D5FEF] dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:border-[#5D5FEF]/40 dark:hover:bg-[#5D5FEF]/10 dark:hover:text-[#8b8ef7]',
              ].join(' ')}
              aria-current={pageIndex === token ? 'page' : undefined}
            >
              {token + 1}
            </button>
          )
        )}

        <button
          type="button"
          onClick={() => onPageIndexChange(Math.min(Math.max(0, pageCount - 1), pageIndex + 1))}
          disabled={!canNext}
          className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-600 transition-all hover:bg-slate-50 hover:border-slate-300 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
        >
          <span>Next</span>
          <span className="text-xs" aria-hidden>
            ›
          </span>
        </button>
      </div>
    </div>
  );
};

