"use client";

/**
 * EditableTable
 *
 * A fully-featured data table with:
 * - Inline cell editing with optional Zod validation
 * - Draft-row creation (Add new row)
 * - Multi-row selection and bulk delete
 * - Client-side or server-side (controlled) pagination
 * - Client-side filtering and sorting
 * - Drag-and-drop row reordering via @dnd-kit
 *
 * Pagination and filtering can each be run in "controlled" mode by supplying
 * the relevant external props; otherwise the component manages them internally.
 *
 * Dependencies:
 * - npx shadcn@latest add button, checkbox, input, select, table
 * - npm install zod
 * - npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities @dnd-kit/modifiers
 */

import React, { useCallback, useState, useMemo } from "react";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  arrayMove,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { DragHandleIcon, SortDir, SortIcon } from "./icons";
import { ColumnType, EditableTableProps } from "./types";
import { EditableTableCell } from "./editable-table-cell";
import { TableToolbar } from "./table-toolbar";
import { TableFooter } from "./table-footer";

// ─── SortableTableRow ──────────────────────────────────────────────────────────

interface SortableTableRowProps {
  id: string;
  /** When false, renders a same-size invisible placeholder to keep the column stable. */
  showDragHandle: boolean;
  className?: string;
  children: React.ReactNode;
}

/**
 * A `<TableRow>` that participates in the @dnd-kit sortable context.
 * The drag handle is always rendered (even as a placeholder) to avoid
 * layout shifts and hydration mismatches.
 */
function SortableTableRow({
  id,
  showDragHandle,
  className,
  children,
}: SortableTableRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <TableRow ref={setNodeRef} style={style} className={className}>
      {showDragHandle && (
        <TableCell className="w-8 px-2">
          <div
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing"
          >
            <DragHandleIcon className="h-3 w-3 text-muted-foreground" />
          </div>
        </TableCell>
      )}

      {children}
    </TableRow>
  );
}

// ─── EmptyState ────────────────────────────────────────────────────────────────

interface EmptyStateProps {
  isFiltered: boolean;
}

/** Displayed when there are no rows (and no draft row is open). */
function EmptyState({ isFiltered }: EmptyStateProps) {
  return (
    <TableRow>
      <TableCell colSpan={999} className="py-12 text-center">
        <div className="flex flex-col items-center justify-center text-center">
          <div className="rounded-full bg-muted p-3 mb-4">
            <InboxIcon />
          </div>
          <p className="text-sm font-medium">
            {isFiltered ? "No results found" : "No data yet"}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {isFiltered
              ? "Try adjusting your search or filter."
              : 'Click "+ Add new row" to get started.'}
          </p>
        </div>
      </TableCell>
    </TableRow>
  );
}

/** Inbox / empty-box SVG icon used by EmptyState. */
function InboxIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="h-6 w-6 text-muted-foreground"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
      />
    </svg>
  );
}

// ─── EditableTable ─────────────────────────────────────────────────────────────

export default function EditableTable<TRow extends Record<string, unknown>>({
  title,
  caption,
  columns,
  rows,
  rowKey,
  onChange,
  onAdd,
  newRowDefaults = {},
  toolbar,
  className,
  validationSchema,
  defaultSort,
  filterValue: externalFilterValue,
  onFilterChange,
  pagination = { enabled: false },
  page: externalPage,
  totalRows: externalTotalRows,
  onPageChange,
  onPageSizeChange,
  enableReorder = false,
  sortKey,
  onReorder,
}: EditableTableProps<TRow>) {
  // ─── State ───────────────────────────────────────────────────────────────

  const [internalSort, setInternalSort] = useState<{
    key: string | null;
    dir: SortDir;
  }>(() =>
    defaultSort
      ? { key: defaultSort.key, dir: defaultSort.dir }
      : { key: null, dir: null },
  );

  const [internalFilter, setInternalFilter] = useState("");
  const [internalCurrentPage, setInternalCurrentPage] = useState(1);
  const [internalPageSize, setInternalPageSize] = useState(
    pagination.pageSize ?? 10,
  );

  /** Currently active edit cell, or null when no cell is being edited. */
  const [editCell, setEditCell] = useState<{
    rowId: string;
    colKey: string;
    isDraft: boolean;
  } | null>(null);

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  /** The unsaved row being created via "Add new row", or null when inactive. */
  const [draftRow, setDraftRow] = useState<
    (Partial<TRow> & { _draftId: string }) | null
  >(null);

  /** Map of `"rowId:colKey"` → error message for inline validation feedback. */
  const [fieldErrors, setFieldErrors] = useState<Map<string, string>>(
    new Map(),
  );

  // ─── Controlled / uncontrolled flags ────────────────────────────────────

  const isControlledFilter = externalFilterValue !== undefined;
  const isControlledPagination = externalPage !== undefined;

  const currentFilter = isControlledFilter
    ? externalFilterValue
    : internalFilter;
  const currentPage = isControlledPagination
    ? (externalPage ?? 1)
    : internalCurrentPage;
  const currentPageSize = isControlledPagination
    ? (pagination.pageSize ?? 10)
    : internalPageSize;
  const pageSizeOptions = pagination.pageSizeOptions ?? [10, 25, 50, 100];

  /** Columns the user is allowed to edit (non-readOnly). Used for Tab navigation. */
  const editableCols = useMemo(
    () => columns.filter((c) => !c.readOnly),
    [columns],
  );

  // ─── Data pipeline: filter → sort → paginate ────────────────────────────

  const filteredRows = useMemo(() => {
    if (!currentFilter) return rows;
    const lower = currentFilter.toLowerCase();
    return rows.filter((r) =>
      columns.some((c) => {
        const v = r[c.key];
        return v != null && String(v).toLowerCase().includes(lower);
      }),
    );
  }, [rows, currentFilter, columns]);

  const sortedRows = useMemo(() => {
    const { key, dir } = internalSort;
    if (!key || !dir) return filteredRows;
    return [...filteredRows].sort((a, b) => {
      const av = a[key];
      const bv = b[key];
      const cmp =
        av == null ? -1 : bv == null ? 1 : av < bv ? -1 : av > bv ? 1 : 0;
      return dir === "asc" ? cmp : -cmp;
    });
  }, [filteredRows, internalSort]);

  const clientPaginatedRows = useMemo(() => {
    if (isControlledPagination || !pagination.enabled) return sortedRows;
    const start = (internalCurrentPage - 1) * internalPageSize;
    return sortedRows.slice(start, start + internalPageSize);
  }, [
    sortedRows,
    internalCurrentPage,
    internalPageSize,
    pagination.enabled,
    isControlledPagination,
  ]);

  /**
   * The rows actually rendered in the table body.
   * - Controlled pagination: parent supplies the already-sliced `rows` prop.
   * - Client pagination: the locally-sliced page.
   */
  const displayedRows = isControlledPagination ? rows : clientPaginatedRows;

  const totalPages = isControlledPagination
    ? Math.ceil((externalTotalRows ?? 0) / currentPageSize)
    : Math.ceil(sortedRows.length / internalPageSize);

  // ─── Sort ────────────────────────────────────────────────────────────────

  /** Cycles through: asc → desc → none (and resets to page 1). */
  const toggleSort = (key: string) => {
    setInternalSort((prev) => {
      if (prev.key !== key) return { key, dir: "asc" };
      if (prev.dir === "asc") return { key, dir: "desc" };
      return { key: null, dir: null };
    });
    if (!isControlledPagination) setInternalCurrentPage(1);
  };

  // ─── Filter ──────────────────────────────────────────────────────────────

  const handleFilterChange = (value: string) => {
    if (isControlledFilter) {
      onFilterChange?.(value);
    } else {
      setInternalFilter(value);
      if (!isControlledPagination) setInternalCurrentPage(1);
    }
  };

  // ─── Pagination ──────────────────────────────────────────────────────────

  const handlePageChange = (page: number) => {
    if (isControlledPagination) {
      onPageChange?.(page);
    } else {
      setInternalCurrentPage(page);
    }
  };

  const handlePageSizeChange = (newSize: number) => {
    if (isControlledPagination) {
      onPageSizeChange?.(newSize);
    } else {
      setInternalPageSize(newSize);
      setInternalCurrentPage(1);
    }
  };

  // ─── Validation helpers ──────────────────────────────────────────────────

  /** Type-guard that narrows a ZodSchema to a ZodObject (which has `.shape`). */
  const isZodObject = (
    schema: z.ZodTypeAny,
  ): schema is z.ZodObject<z.ZodRawShape> => schema instanceof z.ZodObject;

  /** Coerces a raw string value to the type expected by the given column. */
  const coerceValue = (type: ColumnType, raw: string): unknown => {
    if (type === "number") return raw === "" ? "" : Number(raw);
    if (type === "checkbox") return raw === "true";
    return raw;
  };

  /**
   * Validates a single field against the Zod schema.
   * Returns an error message string, or null when valid.
   */
  const validateField = useCallback(
    (
      rowData: Partial<TRow> & { _draftId?: string },
      fieldKey: string,
      rawValue: string,
    ): string | null => {
      if (!validationSchema || !isZodObject(validationSchema)) return null;

      const fieldSchema = validationSchema.shape[fieldKey];
      if (!fieldSchema) return null;

      const col = columns.find((c) => c.key === fieldKey)!;
      const result = (fieldSchema as z.ZodSchema).safeParse(
        coerceValue(col.type, rawValue),
      );

      return result.success
        ? null
        : (result.error.issues[0]?.message ?? "Invalid value");
    },
    [validationSchema, columns],
  );

  // ─── Shared error-map helpers ────────────────────────────────────────────

  /**
   * Removes all fieldErrors whose key starts with `${prefix}:`.
   * Used when a draft row is cancelled or committed.
   */
  const clearErrorsForRow = (rowId: string) => {
    setFieldErrors((prev) => {
      const next = new Map(prev);
      for (const key of next.keys()) {
        if (key.startsWith(`${rowId}:`)) next.delete(key);
      }
      return next;
    });
  };

  /**
   * Applies a validation result to the fieldErrors map.
   * Removes the key on success; sets the error message on failure.
   * Returns whether validation passed.
   */
  const applyFieldValidation = (
    errorKey: string,
    error: string | null,
  ): boolean => {
    setFieldErrors((prev) => {
      const next = new Map(prev);
      if (error) {
        next.set(errorKey, error);
      } else {
        next.delete(errorKey);
      }
      return next;
    });
    return error === null;
  };

  // ─── Existing-row cell commit ────────────────────────────────────────────

  const commitExistingCell = useCallback(
    (rowId: string, colKey: string, rawValue: string) => {
      const row = rows.find((r) => String(r[rowKey]) === rowId);
      if (!row) return;

      const error = validateField(row, colKey, rawValue);
      const valid = applyFieldValidation(`${rowId}:${colKey}`, error);
      if (!valid) return;

      const col = columns.find((c) => c.key === colKey)!;
      onChange(
        rows.map((r) =>
          String(r[rowKey]) === rowId
            ? { ...r, [colKey]: coerceValue(col.type, rawValue) }
            : r,
        ),
      );
      setEditCell(null);
    },
    [columns, rows, rowKey, onChange, validateField],
  );

  // ─── Draft-row operations ────────────────────────────────────────────────

  /** Opens the draft row and focuses the first editable column. */
  const showDraftRow = () => {
    if (draftRow) return;
    const draft = {
      ...newRowDefaults,
      _draftId: crypto.randomUUID(),
    } as Partial<TRow> & { _draftId: string };
    setDraftRow(draft);
    if (editableCols.length) {
      setEditCell({
        rowId: draft._draftId,
        colKey: editableCols[0].key,
        isDraft: true,
      });
    }
  };

  /** Validates and commits a single cell edit within the draft row. */
  const commitDraftCell = (
    draftId: string,
    colKey: string,
    rawValue: string,
  ) => {
    if (!draftRow) return;

    const error = validateField(draftRow, colKey, rawValue);
    const valid = applyFieldValidation(`${draftId}:${colKey}`, error);
    if (!valid) return;

    const col = columns.find((c) => c.key === colKey)!;
    setDraftRow((prev) =>
      prev ? { ...prev, [colKey]: coerceValue(col.type, rawValue) } : null,
    );
    setEditCell(null);
  };

  /** Runs full-row validation, then calls `onAdd` if it passes. */
  const saveDraftRow = () => {
    if (!draftRow) return;

    if (validationSchema && isZodObject(validationSchema)) {
      const { _draftId, ...payload } = draftRow;
      const result = validationSchema.safeParse(payload);
      if (!result.success) {
        setFieldErrors((prev) => {
          const next = new Map(prev);
          result.error.issues.forEach((issue) => {
            next.set(
              `${draftRow._draftId}:${issue.path[0] as string}`,
              issue.message,
            );
          });
          return new Map([...prev, ...next]);
        });
        return;
      }
    }

    clearErrorsForRow(draftRow._draftId);
    const { _draftId, ...payload } = draftRow;
    onAdd?.(payload as unknown as Partial<TRow>);
    setDraftRow(null);
    setEditCell(null);
  };

  /** Discards the draft row and clears any associated validation errors. */
  const cancelDraftRow = () => {
    if (draftRow) clearErrorsForRow(draftRow._draftId);
    setDraftRow(null);
    setEditCell(null);
  };

  // ─── Tab navigation ──────────────────────────────────────────────────────

  /**
   * Returns the key of the next (or previous, if `shift`) editable column,
   * or null when the focus would move beyond the last/first column.
   */
  const findNextEditableColumn = (
    currentColKey: string,
    shift: boolean,
  ): string | null => {
    const idx = editableCols.findIndex((c) => c.key === currentColKey);
    const next = shift ? idx - 1 : idx + 1;
    return next >= 0 && next < editableCols.length
      ? editableCols[next].key
      : null;
  };

  const handleTab = (
    rowId: string,
    colKey: string,
    shift: boolean,
    isDraft: boolean,
  ) => {
    const nextCol = findNextEditableColumn(colKey, shift);
    setEditCell(nextCol ? { rowId, colKey: nextCol, isDraft } : null);
  };

  // ─── Selection and bulk delete ───────────────────────────────────────────

  const allSelected =
    displayedRows.length > 0 && selectedIds.size === displayedRows.length;

  const toggleAll = () =>
    setSelectedIds(
      allSelected
        ? new Set()
        : new Set(displayedRows.map((r) => String(r[rowKey]))),
    );

  const toggleSelect = (id: string) =>
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const deleteSelected = () => {
    onChange(rows.filter((r) => !selectedIds.has(String(r[rowKey]))));
    setSelectedIds(new Set());
  };

  // ─── Drag-and-drop reordering ────────────────────────────────────────────

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = rows.findIndex((r) => String(r[rowKey]) === active.id);
    const newIndex = rows.findIndex((r) => String(r[rowKey]) === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    let newRows = arrayMove(rows, oldIndex, newIndex);

    // Reassign sequential sort-key values when a dedicated key is configured
    if (sortKey) {
      newRows = newRows.map((row, idx) => ({ ...row, [sortKey]: idx + 1 }));
    }

    onChange(newRows);
    onReorder?.(newRows);
  };

  // ─── Render ──────────────────────────────────────────────────────────────

  // Total column count: drag-handle + select-checkbox + data columns
  const totalColumns = (enableReorder ? 1 : 0) + 1 + columns.length;

  return (
    <div
      className={cn(
        "p-8 flex flex-col bg-card border border-border rounded-lg overflow-hidden",
        className,
      )}
    >
      {/* ── Toolbar ──────────────────────────────────────────────────────── */}
      <TableToolbar
        title={title}
        caption={caption}
        filterValue={currentFilter}
        onFilterChange={handleFilterChange}
        selectedCount={selectedIds.size}
        onDeleteSelected={deleteSelected}
      >
        {toolbar}
      </TableToolbar>

      {/* ── Table (wrapped in DnD context) ───────────────────────────────── */}
      <div className="border border-border rounded-lg overflow-x-auto">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <Table className="w-full table-fixed">
            {/* Header */}
            <TableHeader className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60 border-b">
              <TableRow className="hover:bg-transparent">
                {/* Drag-handle column */}
                {enableReorder && <TableHead className="w-8" />}
                {/* Select-all checkbox */}
                <TableHead className="w-9 px-2 text-center">
                  <Checkbox
                    checked={allSelected}
                    onCheckedChange={toggleAll}
                    className="translate-y-0.5"
                  />
                </TableHead>
                {columns.map((col) => (
                  <TableHead
                    key={col.key}
                    onClick={() => col.sortable && toggleSort(col.key)}
                    className={cn(
                      "w-min px-2 uppercase tracking-widest font-semibold whitespace-nowrap text-left",
                      col.sortable &&
                        "cursor-pointer hover:text-foreground select-none",
                      col.align === "right" && "text-right",
                      col.align === "center" && "text-center",
                      col.type === "checkbox"
                        ? "w-9"
                        : col.type === "date"
                          ? "w-36"
                          : col.width,
                    )}
                  >
                    {col.header}
                    {col.sortable && (
                      <SortIcon
                        dir={
                          internalSort.key === col.key ? internalSort.dir : null
                        }
                      />
                    )}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>

            <TableBody>
              {/* "Add new row" trigger (hidden while a draft is open) */}
              {!draftRow && (
                <TableRow
                  className="hover:bg-muted/50 cursor-pointer"
                  onClick={showDraftRow}
                >
                  <TableCell colSpan={totalColumns} className="p-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full h-8 gap-1 rounded-none"
                    >
                      <span className="text-lg">+</span> Add new row
                    </Button>
                  </TableCell>
                </TableRow>
              )}

              {/* Draft row */}
              {draftRow && (
                <>
                  <TableRow className="bg-muted/30">
                    {/* Drag-handle placeholder */}
                    <TableCell className="w-8 px-2" />
                    {/* Disabled checkbox (draft rows cannot be selected) */}
                    <TableCell className="px-2 py-0">
                      <Checkbox disabled />
                    </TableCell>
                    {columns.map((col) => {
                      const isEditing =
                        editCell?.rowId === draftRow._draftId &&
                        editCell?.colKey === col.key &&
                        editCell?.isDraft;
                      return (
                        <EditableTableCell
                          key={col.key}
                          row={draftRow as unknown as TRow}
                          column={col}
                          isEditing={!!isEditing}
                          onStartEdit={() =>
                            setEditCell({
                              rowId: draftRow._draftId,
                              colKey: col.key,
                              isDraft: true,
                            })
                          }
                          onCommit={(raw) =>
                            commitDraftCell(draftRow._draftId, col.key, raw)
                          }
                          onCancel={() => setEditCell(null)}
                          onTab={(shift) =>
                            handleTab(draftRow._draftId, col.key, shift, true)
                          }
                          errorMessage={fieldErrors.get(
                            `${draftRow._draftId}:${col.key}`,
                          )}
                          readOnly={col.readOnly}
                        />
                      );
                    })}
                  </TableRow>

                  {/* Draft row action bar */}
                  <TableRow className="border-b border-dashed border-border bg-muted/10">
                    <TableCell colSpan={totalColumns} className="py-1 px-4">
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={cancelDraftRow}
                        >
                          Cancel
                        </Button>
                        <Button size="sm" onClick={saveDraftRow}>
                          Save row
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                </>
              )}

              {/* Existing rows */}
              {displayedRows.length > 0 && (
                <SortableContext
                  items={displayedRows.map((r) => String(r[rowKey]))}
                  strategy={verticalListSortingStrategy}
                >
                  {displayedRows.map((row) => {
                    const rowId = String(row[rowKey]);
                    const isSelected = selectedIds.has(rowId);
                    return (
                      <SortableTableRow
                        key={rowId}
                        id={rowId}
                        showDragHandle={enableReorder}
                        className={cn(isSelected && "bg-muted")}
                      >
                        <TableCell className="px-2 py-0">
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => toggleSelect(rowId)}
                          />
                        </TableCell>
                        {columns.map((col) => {
                          const isEditing =
                            editCell?.rowId === rowId &&
                            editCell?.colKey === col.key &&
                            !editCell?.isDraft;
                          return (
                            <EditableTableCell
                              key={col.key}
                              row={row}
                              column={col}
                              isEditing={!!isEditing}
                              onStartEdit={() =>
                                setEditCell({
                                  rowId,
                                  colKey: col.key,
                                  isDraft: false,
                                })
                              }
                              onCommit={(raw) =>
                                commitExistingCell(rowId, col.key, raw)
                              }
                              onCancel={() => setEditCell(null)}
                              onTab={(shift) =>
                                handleTab(rowId, col.key, shift, false)
                              }
                              errorMessage={fieldErrors.get(
                                `${rowId}:${col.key}`,
                              )}
                              readOnly={col.readOnly}
                            />
                          );
                        })}
                      </SortableTableRow>
                    );
                  })}
                </SortableContext>
              )}

              {/* Empty state */}
              {sortedRows.length === 0 && !draftRow && (
                <EmptyState isFiltered={!!currentFilter} />
              )}
            </TableBody>
          </Table>
        </DndContext>
      </div>

      {/* ── Footer ───────────────────────────────────────────────────────── */}
      <TableFooter
        totalRows={sortedRows.length}
        selectedCount={selectedIds.size}
        hasDraft={!!draftRow}
        isFiltered={!!currentFilter}
        showPagination={pagination.enabled || isControlledPagination}
        currentPage={currentPage}
        totalPages={totalPages}
        currentPageSize={currentPageSize}
        pageSizeOptions={pageSizeOptions}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
      />
    </div>
  );
}
