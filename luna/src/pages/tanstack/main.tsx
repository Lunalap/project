import React, { useState, useRef, useMemo, useCallback } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  flexRender,
  type Column,
  type Table,
  type RowData,
  type ColumnDef,
  type SortingState,
  type ColumnFiltersState,
  type RowSelectionState,
} from '@tanstack/react-table';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useMutation, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ArrowDownZA, ArrowUpAZ, Check, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Search } from "lucide-react";
import { useInvoice } from "@/hooks/invoice/use-invoice";
import { useBudget } from "@/hooks/budget/use-budget";
import { cn } from "@/lib/utils";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import type { InvoiceEntry } from '@/types/invoice';
import type { BudgetEntry } from '@/types/budget';
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group';
import { Input } from '@/components/ui/input';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// --- Types & Constants ---
const ROW_HEIGHT = 40;

declare module '@tanstack/table-core' {
  interface TableMeta<TData extends RowData> {
    updateData: (id: number, purpose: string) => void;
    budgets: BudgetEntry[];
  }
};

// filtering budget entry
const getFilteredBudgets = (
  allBudgets: BudgetEntry[],
  categoryName: string = "",
  accountingDate: string = ""
): BudgetEntry[] => {
  const currentMonth = accountingDate.trim().substring(0, 7);
  const trimmedCategory = categoryName.trim();
  const sameMonthBudgets = allBudgets.filter(b => b.month === currentMonth);
  if (sameMonthBudgets.length === 0) return [];

  // stage 0
  const strictMatch = sameMonthBudgets.filter(b => b.detail_category_name.trim() === trimmedCategory);
  if (strictMatch.length > 0) return strictMatch;

  // stage 1
  const partialMatch = sameMonthBudgets.filter(b => {
    const target = b.detail_category_name.trim();
    return target.includes(trimmedCategory) || trimmedCategory.includes(target);
  });
  if (partialMatch.length > 0) return partialMatch;

  // stage 2
  return sameMonthBudgets;
};

// --- Components ---

interface AutocompleteCellProps {
  initialValue: string;
  options: BudgetEntry[];
  onUpdate: (value: string) => void;
}

const AutocompleteCell: React.FC<AutocompleteCellProps> = ({
  initialValue,
  options,
  onUpdate,
}) => {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(initialValue);

  React.useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  const handleSelect = useCallback((newValue: string) => {
    setValue(newValue);
    onUpdate(newValue);
    setOpen(false);
  }, [onUpdate]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div
          className={cn(
            "w-full h-8 px-2 flex items-center text-xs cursor-pointer rounded transition-colors truncate font-medium",
            "hover:bg-sky-50 dark:hover:bg-sky-700",
            open && "ring-1 ring-sky-500 border-sky-500 bg-white dark:bg-slate-900"
          )}
        >
          {value || <span className="text-slate-400">예산계획 선택</span>}
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0" align="start">
        <Command filter={(value, search) => (value.toLowerCase().includes(search.toLowerCase()) ? 1 : 0)}>
          <CommandInput placeholder="예산계획 검색..." className="h-8 text-xs" />
          <CommandList className="max-h-[300px]">
            <CommandEmpty>검색 결과가 없습니다.</CommandEmpty>
            <CommandGroup heading="실행예산 목록">
              {options.map((opt) => (
                <CommandItem
                  key={opt.id}
                  value={`${opt.detail_category_name} ${opt.purpose}`}
                  onSelect={() => handleSelect(opt.purpose)}
                  className="flex flex-col items-start gap-1 p-2 border-b last:border-0 cursor-pointer"
                >
                  <div className="flex w-full justify-between items-center text-[10px]">
                    <span className="bg-gray-200 dark:bg-gray-800 px-1.5 py-0.5 rounded text-gray-600 dark:text-gray-300">
                      {opt.detail_category_name}
                    </span>
                    <span className="opacity-70">예산: {opt.expected_amount.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center gap-2 w-full">
                    <Check className={cn("h-3 w-3", value === opt.purpose ? "opacity-100" : "opacity-0")} />
                    <span className="text-xs truncate">{opt.purpose}</span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

interface FilterProps {
  column: Column<any, unknown>;
  table: Table<any>;
};

const Filter = ({ column }: FilterProps) => {
  const columnFilterValue = column.getFilterValue();

  return (
    <div className='mt-1'>
      <Input
        type="text"
        value={(columnFilterValue ?? "") as string}
        onChange={e => column.setFilterValue(e.target.value)}
        className="h-7 w-full text-[11px] px-2 font-normal border-slate-200 focus-visible:ring-sky-500"
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  )
}

// --- Main Table ---

const InvoiceTable: React.FC = () => {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [globalFilter, setGlobalFilter] = useState('');
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 100 });
  
  // API 데이터 (실제 프로젝트에서는 상위나 Context에서 날짜 관리 권장)
  const { invoices = [] } = useInvoice("2026-02");
  const { budgets = [], isLoading } = useBudget("2026-02");

  const updateMutation = useMutation({
    mutationFn: async ({ id, purpose }: { id: number; purpose: string }) => {
      // API 호출 시뮬레이션
      return new Promise((res) => setTimeout(res, 300));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
    }
  });

  const columns = useMemo<ColumnDef<InvoiceEntry>[]>(() => [
    {
      id: 'select',
      size: 40,
      header: ({ table }) => (
        <input
          type="checkbox"
          checked={table.getIsAllRowsSelected()}
          onChange={table.getToggleAllRowsSelectedHandler()}
        />
      ),
      cell: ({ row }) => (
        <input
          type="checkbox"
          checked={row.getIsSelected()}
          onChange={row.getToggleSelectedHandler()}
        />
      ),
    },
    { accessorKey: 'id', header: 'ID', size: 50 },
    {
      accessorKey: 'detail_category_name',
      header: '소분류',
      size: 150,
      enableColumnFilter: true,
      footer: ({ table }) => {
        return <div>{table.getSelectedRowModel().rows.length} / {table.getFilteredRowModel().rows.length}</div>
      }
    },
    {
      accessorKey: 'purpose',
      header: '예산계획',
      size: 200,
      cell: ({ row, table }) => {
        const budgets = table.options.meta?.budgets || [];
        const filteredOptions = getFilteredBudgets(
          budgets,
          row.original.detail_category_name,
          row.original.accounting_date
        );

        return (
          <AutocompleteCell
            initialValue={row.original.purpose || ""}
            options={filteredOptions}
            onUpdate={(val) => table.options.meta?.updateData(row.original.id, val)}
          />
        );
      },
    },
    {
      accessorKey: 'amount',
      header: '금액',
      size: 120,
      cell: ({ getValue }) => {
        const amount = Number(getValue() ?? 0);
        return (
          <span className={cn(amount < 0 ? "text-red-600" : "text-foreground")}>
            {amount === 0 ? "-" : amount.toLocaleString()}
          </span>
        );
      },
      footer: ({ table }) => {
        const selectedRows = table.getSelectedRowModel().rows;
        const total = selectedRows.reduce((sum, row ) => sum + (Number(row.original.amount) || 0), 0);
        return (
          <div className="flex flex-col items-end w-full pr-1">
            <span className={cn(
              "font-bold leading-none", total < 0 ? "text-red-600" : ""
            )}>
              {total.toLocaleString()}
            </span>
          </div>
        )
      }
    },
    { accessorKey: 'account', header: '거래처', size: 150, filterFn: 'includesString' },
    { accessorKey: 'actual_use', header: '실사용처', size: 150, filterFn: 'includesString' },
    {
      accessorKey: 'remark',
      header: '적요',
      size: 300,
      enableColumnFilter: true,
      cell: ({ getValue }) => {
        const value = getValue() as string;
        if (value.length < 25) return <div className='truncate w-full'>{value}</div>
        return (
          <TooltipProvider delayDuration={600}>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className='truncate w-full'>
                  {value}
                </div>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-[600px] break-all">
                {value}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )
      }
     },
    { accessorKey: 'charge', header: '작성자', size: 80, enableColumnFilter: true },
    { accessorKey: 'accounting_date', header: '회계일자', size: 90 },
    { accessorKey: '', header: '예산변경', size: 80 },
  ], []);

  const table = useReactTable({
    data: invoices,
    columns,
    defaultColumn: { enableColumnFilter: false },
    state: { sorting, columnFilters, rowSelection, globalFilter, pagination },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onRowSelectionChange: setRowSelection,
    onPaginationChange: setPagination,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    meta: {
      updateData: (id, purpose) => updateMutation.mutate({ id, purpose }),
      budgets,
    },
    getFilteredRowModel: getFilteredRowModel(),
    globalFilterFn: (row, columnId, filterValue) => {const searchValue = filterValue.toLowerCase();
      const account = String(row.original.account ?? "").toLowerCase();
      const actualUse = String(row.original.actual_use ?? "").toLowerCase();      
      return account.includes(searchValue) || actualUse.includes(searchValue);
    },
  });

  const tableContainerRef = useRef<HTMLDivElement>(null);
  const { rows } = table.getRowModel();

  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => tableContainerRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 10,
  });

  if (isLoading) return <div className="p-8 text-center">Now loading...</div>;

  return (
    <div className="p-10 space-y-4">
      <span className="font-bold">전표내역</span>
      {/* Virtualized Table */}
      <div
        ref={tableContainerRef}
        className="border rounded-md overflow-auto bg-white dark:bg-slate-950 shadow-sm"
        style={{ height: '750px' }}
      >
        <table className="w-full border-collapse table-fixed">
          <thead className="sticky top-0 z-20 bg-gray-50 dark:bg-slate-900 shadow-sm">
            {table.getHeaderGroups().map(headerGroup => (
              <tr key={headerGroup.id} className="flex w-full">
                {headerGroup.headers.map(header => (
                  <th
                    key={header.id}
                    className="p-2 border-b border-r last:border-r-0 text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider cursor-pointer hover:bg-slate-100 transition-colors"
                    style={{ width: header.getSize(), flexShrink: 0 }}
                    onClick={header.column.getToggleSortingHandler()}
                  >
                    <div className="flex items-center gap-2">
                      {flexRender(header.column.columnDef.header, header.getContext())}
                      {{
                        asc: <ArrowUpAZ size={14} />,
                        desc: <ArrowDownZA size={14} />,
                      }[header.column.getIsSorted() as string] ?? null}
                    </div>
                    {header.column.getCanFilter() ? (
                      <Filter column={header.column} table={table} />
                    ) : (
                      <div className='h-8' />
                    )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody
            className="text-xs"
            style={{
              height: `${rowVirtualizer.getTotalSize()}px`,
              position: 'relative',
              display: 'block'
            }}
          >
            {rowVirtualizer.getVirtualItems().map(virtualRow => {
              const row = rows[virtualRow.index];
              return (
                <tr
                  key={row.id}
                  className="absolute w-full flex border-b hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors"
                  style={{
                    height: `${ROW_HEIGHT}px`,
                    transform: `translateY(${virtualRow.start}px)`,
                  }}
                >
                  {row.getVisibleCells().map(cell => {
                    const isCurrency = cell.column.id === 'amount';
                    return (
                      <td
                        key={cell.id}
                        className={`p-1.5 border-r last:border-r-0 flex items-center overflow-hidden ${isCurrency ? "text-right" : ""}`}
                        style={{ width: cell.column.getSize(), flexShrink: 0 }}
                      >
                        <div className="truncate w-full">
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </div>
                      </td>
                    )
                  })}
                </tr>
              );
            })}
          </tbody>

          {/* --- Sticky Footer for summary --- */}
          <tfoot className="text-xs sticky bottom-0 z-20 bg-slate-50 dark:bg-slate-800 border-t shadow-[0_-1px_2px_rgba(0,0,0,0.05)]">
            {table.getFooterGroups().map(footerGroup => (
              <tr key={footerGroup.id} className="flex w-full pt-2 pb-2">
                {footerGroup.headers.map(column => (
                  <td
                    key={column.id}
                    className="p-0.5 border-r last:border-r-0 flex items-center"
                    style={{ width: column.getSize(), flexShrink: 0 }}
                  >
                    {flexRender(
                      column.column.columnDef.footer,
                      column.getContext()
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tfoot>
        </table>
      </div>

      {/*--- pagination ---*/}      
      <div className="flex items-center gap-2 text-sm">
        <Button
          variant="outline"
          size="icon"
          className="hidden size-8 lg:flex"
          onClick={() => table.setPageIndex(0)}
          disabled={!table.getCanPreviousPage()}
        >
          <span className="sr-only">처음</span>
          <ChevronsLeft />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="size-8"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
        >
          <span className="sr-only">이전</span>
          <ChevronLeft />
        </Button>
        <span>
          Page {table.getState().pagination.pageIndex + 1} / {table.getPageCount()}
        </span>
        <Button
          variant="outline"
          size="icon"
          className="size-8"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
        >
          <span className="sr-only">다음</span>
          <ChevronRight />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="hidden size-8 lg:flex"
          onClick={() => table.setPageIndex(table.getPageCount() - 1)}
          disabled={!table.getCanNextPage()}
        >
          <span className="sr-only">마지막</span>
          <ChevronsRight />
        </Button>
      </div>
    </div>
  );
};

const queryClient = new QueryClient();

export default function InvoiceList() {
  return (
    <QueryClientProvider client={queryClient}>
      <InvoiceTable />
    </QueryClientProvider>
  );
}