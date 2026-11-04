import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationControlsProps {
  currentPage: number;
  limit: number;
  totalItems?: number;
  hasNextPage?: boolean;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
}

export function PaginationControls({
  currentPage,
  limit,
  totalItems,
  hasNextPage,
  onPageChange,
  onLimitChange,
}: PaginationControlsProps) {
  const isTotalKnown = totalItems !== undefined;
  const totalPages = isTotalKnown ? Math.max(1, Math.ceil(totalItems / limit)) : undefined;
  const limits = [10, 25, 50, 100];

  const canGoNext = isTotalKnown
    ? (totalPages !== undefined && currentPage < totalPages)
    : Boolean(hasNextPage);

  const windowSize = 5;
  let startPage = 1;
  let endPage = 1;

  if (totalPages !== undefined) {
    if (totalPages <= windowSize) {
      startPage = 1;
      endPage = totalPages;
    } else if (currentPage <= 3) {
      startPage = 1;
      endPage = windowSize;
    } else if (currentPage >= totalPages - 2) {
      startPage = totalPages - (windowSize - 1);
      endPage = totalPages;
    } else {
      startPage = currentPage - 2;
      endPage = currentPage + 2;
    }
  }

  const pages: number[] = [];
  if (isTotalKnown && totalPages !== undefined) {
    for (let p = startPage; p <= endPage; p++) {
      pages.push(p);
    }
  }

  const pageLabel = isTotalKnown
    ? `Page ${currentPage} of ${totalPages}`
    : `Page ${currentPage}`;

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 p-3 sm:p-4 border-t border-gray-100 bg-white">
      <div className="flex items-center gap-2">
        <span className="text-xs sm:text-sm text-gray-700">Rows per page:</span>
        <select
          value={limit}
          onChange={(e) => {
            const nextLimit = Number(e.target.value);
            onLimitChange(nextLimit);
            onPageChange(1);
          }}
          className="border border-gray-200 rounded-lg px-2.5 py-1 bg-white text-xs sm:text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#d85b30]/30 focus:border-[#d85b30]"
          aria-label="Rows per page"
        >
          {limits.map((l) => (
            <option key={l} value={l}>
              {l}
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        <span className="text-xs sm:text-sm text-gray-700 order-2 sm:order-1 whitespace-nowrap">
          {pageLabel}
        </span>

        {isTotalKnown && totalPages !== undefined && (
          <div className="hidden sm:flex items-center gap-1 sm:order-2">
            {startPage > 1 && (
              <span
                className="h-8 w-8 flex items-center justify-center text-xs text-gray-400 select-none"
                aria-hidden="true"
              >
                ...
              </span>
            )}
            {pages.map((pageNum) => {
              const isActive = pageNum === currentPage;
              return (
                <button
                  key={pageNum}
                  type="button"
                  onClick={() => onPageChange(pageNum)}
                  aria-current={isActive ? 'page' : undefined}
                  className={
                    isActive
                      ? 'h-8 w-8 rounded-lg bg-[#d85b30] text-white text-xs font-semibold flex items-center justify-center transition-colors'
                      : 'h-8 w-8 rounded-lg text-gray-700 text-xs font-medium hover:bg-gray-100 flex items-center justify-center transition-colors'
                  }
                >
                  {pageNum}
                </button>
              );
            })}
            {endPage < totalPages && (
              <span
                className="h-8 w-8 flex items-center justify-center text-xs text-gray-400 select-none"
                aria-hidden="true"
              >
                ...
              </span>
            )}
          </div>
        )}

        <button
          type="button"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 min-h-[36px] min-w-[36px] rounded-lg border border-gray-200 text-xs sm:text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors order-1 sm:order-3"
          aria-label="Previous page"
        >
          <ChevronLeft className="w-4 h-4 shrink-0" aria-hidden="true" />
          <span className="hidden sm:inline">Previous</span>
        </button>

        <button
          type="button"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={!canGoNext}
          className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 min-h-[36px] min-w-[36px] rounded-lg border border-gray-200 text-xs sm:text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors order-3 sm:order-4"
          aria-label="Next page"
        >
          <span className="hidden sm:inline">Next</span>
          <ChevronRight className="w-4 h-4 shrink-0" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
