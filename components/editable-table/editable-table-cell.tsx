import { ColumnDef, ColumnType } from "./types";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { TableCell } from "@/components/ui/table";
import { AlertIcon } from "./icons";

// ─── Cell editor (internal) ───────────────────────────────────────────────────

interface CellEditorProps {
  type: ColumnType;
  value: string;
  options?: string[];
  onCommit: (v: string) => void;
  onCancel: () => void;
  onTab: (shift: boolean) => void;
  align?: "left" | "right" | "center";
  hasError?: boolean;
}

/**
 * Renders the appropriate input component for editing a table cell.
 * - text / number / date → <Input>
 * - select → <Select> with given options
 * - checkbox → <Checkbox>
 *
 * Supports Enter/Escape/Tab keys for fast navigation.
 */
function CellEditor({
  type,
  value,
  options,
  onCommit,
  onCancel,
  onTab,
  align,
  hasError,
}: CellEditorProps) {
  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    if (e.key === "Enter") onCommit((e.target as HTMLInputElement).value);
    if (e.key === "Escape") onCancel();
    if (e.key === "Tab") {
      e.preventDefault();
      onCommit((e.target as HTMLInputElement).value);
      onTab(e.shiftKey);
    }
  };

  if (type === "select" && options) {
    return (
      <Select
        defaultValue={value}
        onValueChange={(val, e) => {
          if (val === null) return;
          if (e.reason !== "item-press" && e.reason !== "focus-out") return;
          onCommit(val);
        }}
      >
        <SelectTrigger
          className={cn("h-8 w-full text-sm", hasError && "border-destructive")}
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectItem value="">—</SelectItem>
            {options.map((opt) => (
              <SelectItem key={opt} value={opt}>
                {opt}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    );
  }

  if (type === "checkbox") {
    return (
      <div className="flex items-center justify-center">
        <Checkbox
          checked={value === "true"}
          onCheckedChange={(c) => onCommit(String(c))}
        />
      </div>
    );
  }

  return (
    <Input
      autoFocus
      type={type === "number" ? "number" : type === "date" ? "date" : "text"}
      defaultValue={value}
      onKeyDown={handleKeyDown}
      onBlur={(e) => onCommit(e.target.value)}
      className={cn(
        "h-8 px-2 box-border",
        (type === "number" || align === "right") && "text-right font-mono",
        hasError && "border-destructive focus-visible:ring-destructive",
      )}
    />
  );
}

// ─── Display cell (internal) ──────────────────────────────────────────────────

interface DisplayCellProps<TRow extends Record<string, unknown>> {
  value: unknown;
  type: ColumnType;
  format?: (value: unknown, row: Record<string, unknown>) => React.ReactNode;
  row: Record<string, unknown>;
  align?: "left" | "right" | "center";
  onClick: () => void;
  readOnly?: boolean;
  errorMessage?: string;
}

/**
 * Read‑only view of a cell value.
 * Handles special formatting for dates, checkboxes, and custom `format` functions.
 * An error icon with tooltip appears when validation fails.
 */
function DisplayCell<TRow extends Record<string, unknown>>({
  value,
  type,
  format,
  row,
  align,
  onClick,
  readOnly,
  errorMessage,
}: DisplayCellProps<TRow>) {
  let display: React.ReactNode;

  if (format) {
    display = format(value, row);
  } else if (type === "checkbox") {
    display = (
      <Checkbox
        checked={Boolean(value)}
        onCheckedChange={onClick as unknown as (c: boolean) => void}
        disabled={readOnly}
      />
    );
  } else if (type === "date" && typeof value === "string" && value) {
    display = new Date(value + "T00:00:00").toLocaleDateString("en-PH", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } else if (value == null || value === "") {
    display = <span className="text-muted-foreground">—</span>;
  } else {
    display = String(value);
  }

  return (
    <div
      onClick={!readOnly && type !== "checkbox" ? onClick : undefined}
      className={cn(
        "flex items-center h-8 px-2 truncate text-sm",
        !readOnly &&
          type !== "checkbox" &&
          "cursor-text rounded hover:bg-muted transition-colors",
        align === "right" && "justify-end",
        align === "center" && "justify-center",
      )}
    >
      {display}
      {errorMessage && (
        <span className="ml-1 text-destructive" title={errorMessage}>
          <AlertIcon size={14} />
        </span>
      )}
    </div>
  );
}

interface EditableTableCellProps<TRow extends Record<string, unknown>> {
  row: TRow & { _draftId?: string };
  column: ColumnDef<TRow>;
  isEditing: boolean;
  onStartEdit: () => void;
  onCommit: (rawValue: string) => void;
  onCancel: () => void;
  onTab: (shift: boolean) => void;
  errorMessage?: string;
  readOnly?: boolean;
}

/**
 * Decides whether to show an editor (CellEditor) or read‑only display (DisplayCell).
 * Used for both existing rows and the draft row.
 */
export function EditableTableCell<TRow extends Record<string, unknown>>({
  row,
  column,
  isEditing,
  onStartEdit,
  onCommit,
  onCancel,
  onTab,
  errorMessage,
  readOnly = false,
}: EditableTableCellProps<TRow>) {
  return (
    <TableCell className="px-1 py-0">
      {isEditing && !readOnly ? (
        <CellEditor
          type={column.type}
          value={String(row[column.key] ?? "")}
          options={column.options}
          onCommit={onCommit}
          onCancel={onCancel}
          onTab={onTab}
          align={column.align}
          hasError={!!errorMessage}
        />
      ) : (
        <DisplayCell
          value={row[column.key]}
          type={column.type}
          format={column.format}
          row={row}
          align={column.align}
          onClick={onStartEdit}
          readOnly={readOnly}
          errorMessage={errorMessage}
        />
      )}
    </TableCell>
  );
}
