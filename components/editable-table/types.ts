import { z } from "zod";

export type ColumnType = "text" | "number" | "date" | "select" | "checkbox";

export interface ColumnDef<TRow extends Record<string, unknown>> {
  key: keyof TRow & string;
  header: string;
  type: ColumnType;
  options?: string[];
  width?: string; // Tailwind width class, e.g. "w-32"
  align?: "left" | "right" | "center";
  sortable?: boolean;
  format?: (value: unknown, row: Record<string, unknown>) => React.ReactNode;
  readOnly?: boolean;
}

export interface PaginationConfig {
  enabled?: boolean;
  pageSize?: number;
  pageSizeOptions?: number[];
}

export interface EditableTableProps<TRow extends Record<string, unknown>> {
  title: string;
  caption: string;
  columns: ColumnDef<TRow>[];
  rows: TRow[];
  rowKey: keyof TRow & string;
  onChange: (rows: TRow[]) => void;
  onAdd?: (row: Partial<TRow>) => void;
  newRowDefaults?: Partial<TRow>;
  toolbar?: React.ReactNode;
  className?: string;
  validationSchema?: z.ZodSchema<TRow>;

  // Sorting (client‑side only)
  defaultSort?: { key: string; dir: "asc" | "desc" };

  // Filtering (optional external control)
  filterValue?: string;
  onFilterChange?: (value: string) => void;

  // Pagination (two modes)
  pagination?: PaginationConfig;
  page?: number; // external page (server‑side)
  totalRows?: number;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;

  // Drag & drop row reordering
  enableReorder?: boolean;
  sortKey?: keyof TRow & string; // field that holds the order (e.g., "position")
  onReorder?: (newRows: TRow[]) => void;
}