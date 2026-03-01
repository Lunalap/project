"use client"
 
import type { ColumnDef } from "@tanstack/react-table"
import type { BudgetEntry } from "@/types/budget"
import { ArrowUpDown } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

export const columns: ColumnDef<BudgetEntry>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "id",
    header: "id",
  },
  {
    accessorKey: "month",
    header: ({ column }) => (
      <button
        className="flex items-center gap-1 hover:text-black transition-colors"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        기준월 <ArrowUpDown className="h-3 w-3" />
      </button>
    ),
  },
  {
    accessorKey: "department_name",
    header: ({ column }) => (
      <button
        className="flex items-center gap-1 hover:text-black transition-colors"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        부서명 <ArrowUpDown className="h-3 w-3" />
      </button>
    ),
  },
  {
    accessorKey: "charge",
    header: ({ column }) => (
      <button
        className="flex items-center gap-1 hover:text-black transition-colors"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        담당자 <ArrowUpDown className="h-3 w-3" />
      </button>
    ),
    cell: ({ row }) => <div className="font-medium">{row.getValue("charge")}</div>,
  },
  {
    accessorKey: "detail_category_name",
    header: ({ column }) => (
      <button
        className="flex items-center gap-1 hover:text-black transition-colors"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        소분류 <ArrowUpDown className="h-3 w-3" />
      </button>
    ),
  },
  {
    accessorKey: "tag",
    header: "태그",
    cell: ({ row }) => (
      <div className="flex gap-1">
        {row.original.tag.map((t) => (
          <span key={t} className="rounded-sm text-[10px] bg-zinc-200 dark:bg-zinc-700 px-2 py-0.5">#{t}</span>
        ))}
      </div>
    ),
  },
  {
    accessorKey: "purpose",
    header: ({ column }) => (
      <button
        className="flex items-center gap-1 hover:text-black transition-colors"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        예산명 <ArrowUpDown className="h-3 w-3" />
      </button>
    ),
  },
  {
    accessorKey: "expected_amount",
    header: ({ column }) => (
      <button
        className="flex items-center gap-1 hover:text-black transition-colors"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        예상금액 <ArrowUpDown className="h-3 w-3" />
      </button>
    ),
    cell: ({ row }) => {
      const amount = row.original.expected_amount;
      
      if (!amount || amount === 0) return <div className="text-right">-</div>;
      return <div className={`text-right ${amount === 0 ? "-" : amount < 0 ? "text-red-600" : ""}`}>{amount.toLocaleString()}</div>
    },
  },  
  {
    accessorKey: "actual_amount",
    header: ({ column }) => (
      <button
        className="flex items-center gap-1 hover:text-black transition-colors"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        실제금액 <ArrowUpDown className="h-3 w-3" />
      </button>
    ),
    cell: ({ row }) => {
      const amount = row.original.actual_amount;

      if (!amount || amount === 0) return <div className="text-right">-</div>;
      return <div className={`text-right ${amount === 0 ? "-" : amount < 0 ? "text-red-600" : ""}`}>{amount.toLocaleString()}</div>
    },
  },
  {
    accessorKey: "variance_amount",
    header: ({ column }) => (
      <button
        className="flex items-center gap-1 hover:text-black transition-colors"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        차액 <ArrowUpDown className="h-3 w-3" />
      </button>
    ),
    cell: ({ row }) => {
      const amount = row.original.variance_amount;

      if (!amount || amount === 0) return <div className="text-right">-</div>;
      return <div className={`text-right ${amount < 0 ? "text-red-600" : ""}`}>{amount.toLocaleString()}</div>
    },
  },
  {
    accessorKey: "variance_reason",
    header: "차액사유",
  },
  {
    accessorKey: "updated_at",
    header: ({ column }) => (
      <button
        className="flex items-center gap-1 hover:text-black transition-colors"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        수정일시 <ArrowUpDown className="h-3 w-3" />
      </button>
    ),
    cell: ({ row }) => {
      const date = new Date(row.original.updated_at);
      const options: Intl.DateTimeFormatOptions = {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      };
      return <div>{date.toLocaleString('ko-KR', options)}</div>
    },
  },
]