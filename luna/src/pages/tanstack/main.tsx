import React, { useState, useRef, useMemo } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  flexRender,
  type RowData,
  type ColumnDef,
  type SortingState,
  type ColumnFiltersState,
  type RowSelectionState,
} from '@tanstack/react-table';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useMutation, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useInvoice } from "@/hooks/invoice/use-invoice";
import { useBudget } from "@/hooks/budget/use-budget";
import { ArrowDownZA, ArrowUpAZ } from "lucide-react";
import type { InvoiceEntry } from '@/types/invoice';
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
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
import type { BudgetEntry } from '@/types/budget';

declare module '@tanstack/table-core' {
  interface TableMeta<TData extends RowData> {
    updateData: (id: number, purpose: string) => void;
    budgets: BudgetEntry[];
  }
}

const updateInvoicePurpose = async ({ id, purpose }: { id: number; purpose: string }) => {
  return new Promise((resolve) => setTimeout(() => resolve({ success: true, id, purpose }), 300));
};

const queryClient = new QueryClient();

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
  const [isEditing, setIsEditing] = useState(false);
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState<string>(initialValue || "");
  const [prevInitialValue, setPrevInitialValue] = useState<string>(initialValue || "");

  if (initialValue !== prevInitialValue) {
    setPrevInitialValue(initialValue || "");
    setValue(initialValue || "");
  }

  const handleClose = () => {
    setOpen(false);
    setIsEditing(false);
  };

  if (!isEditing) {
    return (
      <div
        className="w-full h-8 px-2 flex items-center text-xs cursor-pointer hover:bg-sky-50 dark:hover:bg-sky-700 rounded transition-colors truncate font-medium"
        onClick={() => setIsEditing(true)}
      >
        {value || <span className="text-slate-400">예산계획</span>}
      </div>
    );
  }

  return (
    <div className="w-full">
      <Popover 
        open={open || isEditing} 
        onOpenChange={(isOpen) => {
          setOpen(isOpen);
          if (!isOpen) setIsEditing(false);
        }}
      >
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="w-full h-8 justify-between text-xs border-sky-500 ring-1 ring-sky-500"
          >
            <span className="truncate">{value || "예산계획"}</span>
            <ChevronsUpDown className="ml-2 h-3 w-3 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[400px] p-0" align="start">
          <Command filter={(value, search) => {
            // 용도나 소분류명에 검색어가 포함되면 필터링
            if (value.toLowerCase().includes(search.toLowerCase())) return 1;
            return 0;
          }}>
            <CommandInput placeholder="예산계획 검색..." className="h-8 text-xs" autoFocus />
            <CommandList className="max-h-[300px]">
              <CommandEmpty>검색 결과가 없습니다.</CommandEmpty>
              <CommandGroup header="실행예산 목록">
                {options.map((opt) => (
                  <CommandItem
                    key={opt.id}
                    value={`${opt.detail_category_name} ${opt.purpose}`} // 검색 대상 텍스트 결합
                    onSelect={() => {
                      setValue(opt.purpose);
                      onUpdate(opt.purpose);
                      handleClose();
                    }}
                    className="flex flex-col items-start gap-1 p-2 border-b last:border-0 cursor-pointer"
                  >
                    <div className="flex w-full justify-between items-center">
                      <span className="text-[11px] text-gray-500 bg-gray-200 dark:bg-gray-800 px-1.5 py-0.5 rounded">
                        {opt.detail_category_name}
                      </span>
                      <span className="text-[10px] opacity-80">
                        예산: {opt.expected_amount}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 w-full">
                      <Check
                        className={cn(
                          "h-3 w-3 shrink-0",
                          value === opt.purpose ? "opacity-100" : "opacity-0"
                        )}
                      />
                      <span className="text-xs truncate">
                        {opt.purpose}
                      </span>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
};

// --- 3. 메인 테이블 컴포넌트 ---
const InvoiceTable = () => {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [columnOrder, setColumnOrder] = useState<string[]>([]);
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 100 });

  const { invoices = [] } = useInvoice("2026-02");  
  const { budgets, isLoading } = useBudget("2026-02");

  const updateMutation = useMutation({
    mutationFn: updateInvoicePurpose,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
    }})

  // columns setting
  const columns = useMemo<ColumnDef<InvoiceEntry>[]>(
    () => [
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
      { accessorKey: 'detail_category_name', header: '소분류', size: 150 },
      {
        accessorKey: 'purpose',
        header: '예산계획',
        size: 180,
        cell: ({ row, table }) => {
          const allBudgets = table.options.meta?.budgets || [];

          // 공백으로 인한 매칭 실패 방지를 위해 trim() 적용
          const currentRowCategory = (row.original.detail_category_name || "").trim();
          const currentRowDate = (row.original.accounting_date || "").trim();
          const currentMonth = currentRowDate.substring(0, 7); // "YYYY-MM"

          // --- 1단계: 엄격한 매칭 (월 일치 && 소분류 완전 일치) ---
          let filteredOptions = allBudgets.filter((option) => {
            const isMonthMatch = option.month === currentMonth;
            const isCategoryStrictMatch = option.detail_category_name.trim() === currentRowCategory;
            return isMonthMatch && isCategoryStrictMatch;
          });

          // --- 2단계: 유연한 매칭 (월 일치 && 소분류 부분 일치) ---
          if (filteredOptions.length === 0 && currentRowCategory.length > 0) {
            filteredOptions = allBudgets.filter((option) => {
              const isMonthMatch = option.month === currentMonth;
              const targetCat = option.detail_category_name.trim();
              const isPartialMatch = 
                targetCat.includes(currentRowCategory) || 
                currentRowCategory.includes(targetCat);
              return isMonthMatch && isPartialMatch;
            });
          }

          // --- 3단계: 최후의 수단 (해당 월의 전체 목록 노출) ---
          // 카테고리가 아예 다르더라도 같은 달의 예산이라면 선택지로 제공
          if (filteredOptions.length === 0) {
            filteredOptions = allBudgets.filter((option) => {
              return option.month === currentMonth;
            });
          }

          return (
            <AutocompleteCell
              initialValue={row.original.purpose || ""}
              options={filteredOptions}
              onUpdate={(newValue) => {
                table.options.meta?.updateData(row.original.id, newValue);
              }}
            />
          );
        },
      },
      { accessorKey: 'amount', header: '금액', size: 100,
        cell: ({ row }) => {
          const amount = Number(row.original.amount?? 0);
          if (amount === 0) return <span className="text-muted-foreground">-</span>;
          return <span className={`${(amount) < 0 ? "text-red-600" : "text-foreground"}`}>{amount.toLocaleString()}</span>;
        },
      },
      { accessorKey: 'account', header: '거래처', size: 180 },
      { accessorKey: 'actual_use', header: '실사용처', size: 180 },
      { accessorKey: 'remark', header: '적요', size: 400 },
      { accessorKey: 'department_name', header: '입력부서', size: 100 },
      { accessorKey: 'charge', header: '작성자', size: 80 },
      { accessorKey: 'accounting_date', header: '회계일자', size: 80 },
    ],
    [budgets]
  );

  const table = useReactTable({
    data: invoices,
    columns,
    state: {
      sorting,
      columnFilters,
      rowSelection,
      columnOrder,
      pagination,
    },
    enableRowSelection: true,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onRowSelectionChange: setRowSelection,
    onColumnOrderChange: setColumnOrder,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
   meta: {
      updateData: (id, purpose) => updateMutation.mutate({ id, purpose }),
      budgets: budgets,
    },
  });

  // --- 4. 가상화 (Virtualization) 설정 ---
  const tableContainerRef = useRef<HTMLDivElement>(null);
  const { rows } = table.getRowModel();

  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => tableContainerRef.current,
    estimateSize: () => 40, 
    overscan: 10,
  });

  if (isLoading) return <div>데이터를 불러오는 중입니다...</div>;

  return (
    <div className="p-4 space-y-4">
      {/* 검색/필터링 */}
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="작성자"
          className="border p-2 rounded text-sm"
          value={(table.getColumn('charge')?.getFilterValue() as string) ?? ''}
          onChange={(e) => table.getColumn('charge')?.setFilterValue(e.target.value)}
        />
      </div>

      {/* 테이블 영역 */}
      <div
        ref={tableContainerRef}
        className="border rounded shadow"
        style={{ height: '750px', overflow: 'auto' }}
      >
        <table className="w-full text-left border-collapse text-sm">
          <thead className="bg-gray-100 dark:bg-gray-800 sticky top-0 z-10">
            {table.getHeaderGroups().map((headerGroup) => (
              // [수정] thead tr을 flex로 변경하여 자식 너비 매칭 지원
              <tr key={headerGroup.id} className="flex w-full">
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    // [수정] 테두리 유지 및 셀 크기 지정 (스프레드시트 룩)
                    className="p-2 border-b border-r font-semibold cursor-pointer truncate last:border-r-0 select-none hover:bg-sky-100 dark:hover:bg-sky-800 text-sm"
                    style={{ width: header.column.getSize(), flexShrink: 0 }}
                    onClick={header.column.getToggleSortingHandler()}
                  >
                    {/* [수정] 정렬 아이콘이 인라인으로 표시되도록 flex 설정 */}
                    <div className="flex items-center gap-1">
                      <span className="truncate">
                        {flexRender(header.column.columnDef.header, header.getContext())}
                      </span>
                      {{
                        asc: <ArrowUpAZ size={16} className="shrink-0" />,
                        desc: <ArrowDownZA size={16} className="shrink-0" />,
                      }[header.column.getIsSorted() as string] ?? null}
                    </div>
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody
            style={{
              display: 'block', // [수정] flex 기반 row 배치를 위해 block 처리
              height: `${rowVirtualizer.getTotalSize()}px`,
              position: 'relative',
            }}
          >
            {rowVirtualizer.getVirtualItems().map((virtualRow) => {
              const row = rows[virtualRow.index];
              return (
                <tr
                  key={row.id}
                  style={{
                    display: 'flex', // [수정] 헤더와 너비를 1:1 매칭하기 위해 flex 적용
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    transform: `translateY(${virtualRow.start}px)`,
                  }}
                  className="hover:bg-sky-100 dark:hover:bg-sky-800 border-b text-xs"
                >
                  {row.getVisibleCells().map((cell) => {
                    const isAmount = cell.column.id === 'amount';
                    return (
                      <td
                        key={cell.id}
                        className={`p-2 border-r last:border-r-0 truncate flex items-center ${
                          isAmount ? "justify-end text-right" : "justify-start"
                        }`}
                        style={{ width: cell.column.getSize(), flexShrink: 0 }}
                      >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* 페이지네이션 */}
      <div className="flex items-center gap-2 text-sm">
        <button
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
          className="px-3 py-1 border rounded disabled:opacity-50"
        >
          이전
        </button>
        <span>
          페이지 {table.getState().pagination.pageIndex + 1} / {table.getPageCount()}
        </span>
        <button
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
          className="px-3 py-1 border rounded disabled:opacity-50"
        >
          다음
        </button>
      </div>
    </div>
  );
};

export default function InvoiceList() {
  return (
    <QueryClientProvider client={queryClient}>
      <InvoiceTable />
    </QueryClientProvider>
  );
};