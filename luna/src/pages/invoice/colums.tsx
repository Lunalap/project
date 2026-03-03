"use client"
 
import type { ColumnDef } from "@tanstack/react-table"
import type { InvoiceEntry } from "@/types/invoice"
import { ArrowUpDown } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

export const columns: ColumnDef<InvoiceEntry>[] = [
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
    accessorKey: "detail_category_name",
    header: ({ column }) => (
      <button
        className="flex items-center gap-1 hover:text-black transition-colors"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        예산명 <ArrowUpDown className="h-3 w-3" />
      </button>
    ),
  },

  /*

  {
    accessorKey: "reviewer",
    header: "Reviewer",
    cell: ({ row }) => {
      const isAssigned = row.original.reviewer !== "Assign reviewer"

      if (isAssigned) {
        return row.original.reviewer
      }

      return (
        <>
          <Label htmlFor={`${row.original.id}-reviewer`} className="sr-only">
            Reviewer
          </Label>
          <Select>
            <SelectTrigger
              className="w-38 **:data-[slot=select-value]:block **:data-[slot=select-value]:truncate"
              size="sm"
              id={`${row.original.id}-reviewer`}
            >
              <SelectValue placeholder="Assign reviewer" />
            </SelectTrigger>
            <SelectContent align="end">
              <SelectItem value="Eddie Lake">Eddie Lake</SelectItem>
              <SelectItem value="Jamik Tashpulatov">
                Jamik Tashpulatov
              </SelectItem>
            </SelectContent>
          </Select>
        </>
      )
    },
  },

  */ 



  {
    accessorKey: "department_name",
    header: ({ column }) => (
      <button
        className="flex items-center gap-1 hover:text-black transition-colors"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        입력부서 <ArrowUpDown className="h-3 w-3" />
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
        작성자 <ArrowUpDown className="h-3 w-3" />
      </button>
    ),
    cell: ({ row }) => <div className="font-medium">{row.getValue("charge")}</div>,
  },
  {
    accessorKey: "accounting_date",
    header: ({ column }) => (
      <button
        className="flex items-center gap-1 hover:text-black transition-colors"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        회계일자 <ArrowUpDown className="h-3 w-3" />
      </button>
    ),
  },
  {
    accessorKey: "invoice_number",
    header: ({ column }) => (
      <button
        className="flex items-center gap-1 hover:text-black transition-colors"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        전표번호 <ArrowUpDown className="h-3 w-3" />
      </button>
    ),
  },
  {
    accessorKey: "invoice_line_number",
    header: ({ column }) => (
      <button
        className="flex items-center gap-1 hover:text-black transition-colors"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        전표라인 <ArrowUpDown className="h-3 w-3" />
      </button>
    ),
  },
  {
    accessorKey: "amount",
    header: ({ column }) => (
      <button
        className="flex items-center gap-1 hover:text-black transition-colors"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        금액 <ArrowUpDown className="h-3 w-3" />
      </button>
    ),
    cell: ({ row }) => {
      const amount = row.original.amount;

      if (!amount || amount === 0) return <div className="text-right">-</div>;
      return <div className={`text-right ${amount === 0 ? "-" : amount < 0 ? "text-red-600" : ""}`}>{amount.toLocaleString()}</div>
    },
  },
  {
    accessorKey: "account",
    header: ({ column }) => (
      <button
        className="flex items-center gap-1 hover:text-black transition-colors"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        거래처 <ArrowUpDown className="h-3 w-3" />
      </button>
    ),
  },
  {
    accessorKey: "actual_use",
    header: ({ column }) => (
      <button
        className="flex items-center gap-1 hover:text-black transition-colors"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        실사용처 <ArrowUpDown className="h-3 w-3" />
      </button>
    ),
  },
  {
    accessorKey: "remark",
    header: ({ column }) => (
      <button
        className="flex items-center gap-1 hover:text-black transition-colors"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        적요 <ArrowUpDown className="h-3 w-3" />
      </button>
    ),
  },
]