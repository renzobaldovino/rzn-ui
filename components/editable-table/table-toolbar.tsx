import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface TableToolbarProps {
  title: string;
  caption: string;
  /** Current value of the search/filter input. */
  filterValue: string;
  /** Called whenever the filter input changes. */
  onFilterChange: (value: string) => void;
  /** Number of currently selected rows. Controls visibility of the delete button. */
  selectedCount: number;
  /** Called when the user clicks the bulk-delete button. */
  onDeleteSelected: () => void;
  /** Optional extra content rendered between the search input and the delete button. */
  children?: React.ReactNode;
}

/**
 * Toolbar rendered above the table.
 *
 * Contains:
 * - A search/filter input (always visible).
 * - An optional slot for custom actions passed via `children`.
 * - A bulk-delete button that appears only when rows are selected.
 */
export function TableToolbar({
  title,
  caption,
  filterValue,
  onFilterChange,
  selectedCount,
  onDeleteSelected,
  children,
}: TableToolbarProps) {
  return (
    <div className="py-2.5 flex flex-col gap-8">
      {title && caption ? (
        <div className="flex items-center justify-between gap-2">
          <div className="flex flex-col gap-1">
            <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
            <p className="text-muted-foreground">{caption}</p>
          </div>
        </div>
      ) : null}

      <div className="flex items-center gap-2 flex-wrap">
        <Input
          type="search"
          placeholder="Search…"
          value={filterValue}
          onChange={(e) => onFilterChange(e.target.value)}
          className="px-3 py-1 h-8 w-37.5 lg:w-62.5"
        />

        {/* Spacer — pushes custom actions and the delete button to the right */}
        <div className="flex-1" />

        {children}

        {selectedCount > 0 && (
          <Button variant="destructive" onClick={onDeleteSelected}>
            Delete {selectedCount}
          </Button>
        )}
      </div>
    </div>
  );
}
