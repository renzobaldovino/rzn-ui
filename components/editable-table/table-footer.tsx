import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { NextPageIcon, PreviousPageIcon } from "./icons";

interface TableFooterProps {
  /** Total number of rows after filtering (used for the row-count label). */
  totalRows: number;
  /** Number of currently selected rows. */
  selectedCount: number;
  /** Whether a new draft row is pending save. */
  hasDraft: boolean;
  /** Whether an active filter is applied. */
  isFiltered: boolean;
  /** Whether pagination controls should be shown. */
  showPagination: boolean;
  /** Current page number (1-based). */
  currentPage: number;
  /** Total number of pages. */
  totalPages: number;
  /** Currently active page size. */
  currentPageSize: number;
  /** Selectable page-size options. */
  pageSizeOptions: number[];
  /** Called when the user navigates to a different page. */
  onPageChange: (page: number) => void;
  /** Called when the user picks a new page size. */
  onPageSizeChange: (size: number) => void;
}

/**
 * Footer rendered below the table.
 *
 * Shows a summary line (row count, selection state, draft state, filter
 * indicator) and, when enabled, pagination controls.
 */
export function TableFooter({
  totalRows,
  selectedCount,
  hasDraft,
  isFiltered,
  showPagination,
  currentPage,
  totalPages,
  currentPageSize,
  pageSizeOptions,
  onPageChange,
  onPageSizeChange,
}: TableFooterProps) {
  return (
    <div className="pl-2 py-2 text-xs text-muted-foreground flex flex-wrap items-center justify-between gap-2">
      {/* Left side: row / selection / draft / filter summary */}
      <div className="flex items-center gap-3">
        <span>
          {totalRows} row{totalRows !== 1 ? "s" : ""}
        </span>

        {selectedCount > 0 && (
          <>
            <Bullet />
            <span>{selectedCount} selected</span>
          </>
        )}

        {hasDraft && (
          <>
            <Bullet />
            <span>1 pending</span>
          </>
        )}

        {isFiltered && <span>· filtered</span>}
      </div>

      {/* Right side: pagination controls */}
      {showPagination && totalPages > 0 && (
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span>Rows per page:</span>
            <Select
              value={String(currentPageSize)}
              onValueChange={(val) => onPageSizeChange(Number(val))}
            >
              <SelectTrigger className="h-7 w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {pageSizeOptions.map((size) => (
                  <SelectItem key={size} value={String(size)}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-1">
            <span>
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="icon"
              className="h-7 w-7"
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <PreviousPageIcon size={14} />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-7 w-7"
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              <NextPageIcon size={14} />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Internal helpers ──────────────────────────────────────────────────────────

/** Small decorative bullet used as a separator in the summary line. */
function Bullet() {
  return <span className="w-1 h-1 rounded-full bg-muted-foreground" />;
}
