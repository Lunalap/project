"use client"

import * as React from "react"
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  PaginationState,
} from "@tanstack/react-table"

import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { DataTablePagination } from "./data-table-page"

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
}
// local storage key for pageSize state
const STORAGE_KEY = "data-table-pageSize"

export function DataTable<TData, TValue>({
  columns,
  data,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = React.useState({})
  const [pagination, setPagination] = React.useState<PaginationState>(() => {
    if (typeof window !== "undefined") {
      const storedPagination = localStorage.getItem(STORAGE_KEY)
      return storedPagination ? JSON.parse(storedPagination) : { pageIndex: 0, pageSize: 15 }
    }
  })

  React.useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(pagination))
  }, [pagination])

  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    onPaginationChange: setPagination,

    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      pagination,
    },
  })

  return (
    <div className="space-y-4">

      {/* Filter Section */}
      <div className="flex items-center gap-2">
        <Input
          placeholder="담당자"
          value={(table.getColumn("charge")?.getFilterValue() as string) ?? ""}
          onChange={(event) =>
            table.getColumn("charge")?.setFilterValue(event.target.value)
          }
          className="max-w-30"
        />
        <Input
          placeholder="소분류"
          value={(table.getColumn("detail_category_name")?.getFilterValue() as string) ?? ""}
          onChange={(event) =>
            table.getColumn("detail_category_name")?.setFilterValue(event.target.value)
          }
          className="max-w-40"
        />
        <Input
          placeholder="예산명"
          value={(table.getColumn("purpose")?.getFilterValue() as string) ?? ""}
          onChange={(event) =>
            table.getColumn("purpose")?.setFilterValue(event.target.value)
          }
          className="max-w-80"
        />
      </div>

      {/* Table Section */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  No results
                </TableCell>
              </TableRow>
            )}
          </TableBody>          
          <TableFooter>
            <TableRow>
              <TableCell colSpan={8}>
                {table.getFilteredSelectedRowModel().rows.length} /{" "}
                {table.getFilteredRowModel().rows.length}
              </TableCell>
              <TableCell className="text-right">
                {(() => {
                  const total = table.getFilteredSelectedRowModel().rows.reduce((sum, row) => {
                    const value = row.getValue("expected_amount");
                    return sum + (typeof value === "number" ? value : 0);
                  }, 0);
                  if (total === 0) return <div className="text-right text-zinc-400">-</div>;
                  return <div className={`text-right font-bold ${total < 0 ? "text-red-600" : ""}`}>{total.toLocaleString()}</div>
                })()}
              </TableCell>
              <TableCell className="text-right">
                {(() => {
                  const total = table.getFilteredSelectedRowModel().rows.reduce((sum, row) => {
                    const value = row.getValue("actual_amount");
                    return sum + (typeof value === "number" ? value : 0);
                  }, 0);
                  if (total === 0) return <div className="text-right text-zinc-400">-</div>;
                  return <div className={`text-right font-bold ${total < 0 ? "text-red-600" : ""}`}>{total.toLocaleString()}</div>
                })()}
              </TableCell>
              <TableCell className="text-right">
                {(() => {
                  const total = table.getFilteredSelectedRowModel().rows.reduce((sum, row) => {
                    const value = row.getValue("variance_amount");
                    return sum + (typeof value === "number" ? value : 0);
                  }, 0);
                  if (total === 0) return <div className="text-right text-zinc-400">-</div>;
                  return <div className={`text-right font-bold ${total < 0 ? "text-red-600" : ""}`}>{total.toLocaleString()}</div>
                })()}
              </TableCell>
              <TableCell colSpan={2} />
            </TableRow>
          </TableFooter>
        </Table>
      </div>

      {/* Integrated Pagination Component */}
      <DataTablePagination table={table} />
    </div>
  )
}