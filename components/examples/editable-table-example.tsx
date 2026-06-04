"use client";

import { useState } from "react";
import { z } from "zod";
import EditableTable from "@/components/editable-table/editable-table";
import { ColumnDef } from "@/components/editable-table/types";
import { Button } from "@/components/ui/button";
import { HugeiconsIcon } from "@hugeicons/react";
import { Cancel01Icon } from "@hugeicons/core-free-icons";
import { cn } from "@/lib/utils";
import { CATEGORIES, LABELS, SEED_TRANSACTIONS } from "./seed-data";

// ─── Types ────────────────────────────────────────────────────────────────────

export type Transaction = Record<string, unknown> & {
  id: string;
  date: string;
  account: string;
  category: string;
  notes: string;
  label: string;
  amount: number;
  order: number;
};

// ─── Validation Schema ────────────────────────────────────────────────────────

/**
 * `id` and `order` are generated/managed internally and excluded from
 * user-facing validation.
 */
const transactionSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD"),
  account: z.string().min(2, "Account must be at least 2 characters"),
  category: z.string().min(1, "Please select a category"),
  notes: z.string().max(100, "Notes too long (max 100 chars)").optional(),
  label: z.string().max(50, "Label too long (max 50 chars)").optional(),
  amount: z.number("Amount must be a number"),
  order: z.number().optional(),
}) as unknown as z.ZodSchema<Transaction>;

// ─── Custom Cell Renderers ─────────────────────────────────────────────────────

/** Renders a signed, colour-coded monetary amount. */
function AmountCell({ value }: { value: unknown }) {
  const n = Number(value);
  if (isNaN(n)) return <span className="text-muted-foreground">—</span>;

  const abs = Math.abs(n).toLocaleString("en-PH", { minimumFractionDigits: 2 });
  const isPositive = n > 0;

  return (
    <span
      className={cn(
        "font-mono tabular-nums text-sm",
        isPositive
          ? "text-green-600 dark:text-green-400 font-medium"
          : "text-foreground",
      )}
    >
      {isPositive ? "+" : n < 0 ? "−" : ""}
      {abs}
    </span>
  );
}

/** Renders an emoji label inside a subtle border badge. */
function LabelCell({ value }: { value: unknown }) {
  if (!value) return null;
  return (
    <span className="border border-border rounded px-1 text-sm">
      {String(value)}
    </span>
  );
}

/** Row-level delete button injected via the `action` column. */
function DeleteButton({ onDelete }: { onDelete: () => void }) {
  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-7 w-7 text-muted-foreground hover:text-destructive"
      onClick={onDelete}
    >
      <HugeiconsIcon icon={Cancel01Icon} className="h-4 w-4" />
    </Button>
  );
}

// ─── Toolbar: Financial Summary ───────────────────────────────────────────────

interface FinancialSummaryProps {
  transactions: Transaction[];
}

/** Displays income, expense, and net totals in the table toolbar. */
function FinancialSummary({ transactions }: FinancialSummaryProps) {
  const income = transactions.reduce(
    (s, t) => (t.amount > 0 ? s + t.amount : s),
    0,
  );
  const expense = transactions.reduce(
    (s, t) => (t.amount < 0 ? s + t.amount : s),
    0,
  );
  const net = income + expense;

  const fmt = (n: number) =>
    Math.abs(n).toLocaleString("en-PH", { minimumFractionDigits: 2 });

  return (
    <div className="flex items-center gap-5 mr-2">
      <StatColumn
        label="Income"
        value={`+${fmt(income)}`}
        className="text-green-600 dark:text-green-400"
      />
      <StatColumn
        label="Expenses"
        value={`−${fmt(Math.abs(expense))}`}
        className="text-red-600 dark:text-red-400"
      />
      <StatColumn
        label="Net"
        value={`${net >= 0 ? "+" : "−"}${fmt(Math.abs(net))}`}
        className={
          net >= 0
            ? "text-green-600 dark:text-green-400"
            : "text-red-600 dark:text-red-400"
        }
      />
    </div>
  );
}

interface StatColumnProps {
  label: string;
  value: string;
  className?: string;
}

function StatColumn({ label, value, className }: StatColumnProps) {
  return (
    <div className="text-right">
      <div className="text-[9px] uppercase tracking-widest text-muted-foreground">
        {label}
      </div>
      <div className={cn("font-mono text-sm font-semibold", className)}>
        {value}
      </div>
    </div>
  );
}

/** Attaches sequential `order` values (1-based) to the seed rows. */
const generateSeedData = (): Transaction[] =>
  SEED_TRANSACTIONS.map((item, idx) => ({ ...item, order: idx + 1 }));

// Simple incrementing ID generator (replace with uuid or server-assigned IDs in production)
let nextId = 100;
const generateId = () => String(++nextId);

// ─── Main Component ───────────────────────────────────────────────────────────

export function EditableTableExample() {
  const [transactions, setTransactions] =
    useState<Transaction[]>(generateSeedData);

  // ─── Column Definitions ────────────────────────────────────────────────
  //
  // Defined inside the component so the `action` column's `format` can call
  // `handleDelete` without a global event bus.

  const columns: ColumnDef<Transaction>[] = [
    {
      key: "date",
      header: "Date",
      type: "date",
      sortable: true,
    },
    {
      key: "account",
      header: "Account",
      type: "text",
      sortable: true,
    },
    {
      key: "category",
      header: "Category",
      type: "select",
      options: [...CATEGORIES],
      sortable: true,
    },
    {
      key: "label",
      header: "Label",
      type: "select",
      width: "w-28",
      options: [...LABELS],
      sortable: true,
      format: (v) => <LabelCell value={v} />,
    },
    {
      key: "notes",
      header: "Notes",
      type: "text",
    },
    {
      key: "amount",
      header: "Amount",
      type: "number",
      width: "w-28",
      align: "right",
      sortable: true,
      format: (v) => <AmountCell value={v} />,
    },
    {
      // Read-only column that renders a per-row delete button.
      // Hidden for draft rows (which carry a `_draftId` field).
      key: "id",
      header: "",
      type: "text",
      width: "w-10",
      readOnly: true,
      format: (_, row) => {
        if ("_draftId" in row) return null;
        return <DeleteButton onDelete={() => handleDelete(row.id as string)} />;
      },
    },
  ];

  // ─── Handlers ─────────────────────────────────────────────────────────

  const handleDelete = (id: string) => {
    setTransactions((prev) => prev.filter((t) => t.id !== id));
  };

  const handleAdd = (partial: Partial<Transaction>) => {
    const newTransaction: Transaction = {
      id: generateId(),
      date: partial.date ?? new Date().toISOString().slice(0, 10),
      account: partial.account ?? "",
      category: partial.category ?? "",
      label: partial.label ?? "",
      notes: partial.notes ?? "",
      amount: Number(partial.amount ?? 0),
      order: transactions.length + 1, // will be normalised on next reorder
    };
    setTransactions((prev) => [...prev, newTransaction]);
  };

  const handleReorder = (newRows: Transaction[]) => {
    // In a real app, send the updated `order` values to the backend here.
    // `onChange` has already updated local state, so no `setTransactions` needed.
    console.log(
      "New order:",
      newRows.map((r) => ({ id: r.id, order: r.order })),
    );
  };

  // ─── Render ────────────────────────────────────────────────────────────

  return (
    <EditableTable<Transaction>
      title="Transactions"
      caption="List of transactions"
      columns={columns}
      rows={transactions}
      rowKey="id"
      onChange={setTransactions}
      onAdd={handleAdd}
      validationSchema={transactionSchema}
      defaultSort={{ key: "date", dir: "desc" }}
      enableReorder={true}
      sortKey="order"
      onReorder={handleReorder}
      pagination={{
        enabled: true,
        pageSize: 10,
        pageSizeOptions: [5, 10, 20, 50],
      }}
      newRowDefaults={{
        date: new Date().toISOString().slice(0, 10),
        category: "",
        label: "",
        notes: "",
      }}
      toolbar={<FinancialSummary transactions={transactions} />}
    />
  );
}
