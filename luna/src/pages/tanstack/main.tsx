import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  ColumnDef,
  flexRender,
  SortingState,
  ColumnFiltersState,
  RowSelectionState,
} from '@tanstack/react-table';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useMutation, useQueryClient, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useInvoice } from "@/hooks/invoice/use-invoice";
import { ArrowDownZA, ArrowUpAZ } from "lucide-react";
import type { InvoiceEntry } from '@/types/invoice';
import { AutocompleteCell } from './autocomplete';
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

const PURPOSE_OPTIONS = ["운영비", "복리후생비", "접대비", "여비교통비", "소모품비"];

const updateInvoicePurpose = async ({ id, purpose }: { id: number; purpose: string }) => {
  return new Promise((resolve) => setTimeout(() => resolve({ success: true, id, purpose }), 300));
};

// Autocomplete Editable Cell component
interface AutocompleteCellProps {
  initialValue: string;
  options: string[];
  onUpdate: (value: string) => void;
}

 const AutocompleteCell: React.FC<AutocompleteCellProps> = ({
  initialValue,
  options,
  onUpdate,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(initialValue || "");
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setValue(initialValue || "");
  }, [initialValue]);

  // 편집 모드 종료 핸들러
  const handleClose = () => {
    setOpen(false);
    setIsEditing(false);
  };

  // 1. 읽기 모드 (Display Mode)
  if (!isEditing) {
    return (
      <div
        className="w-full h-8 px-2 flex items-center text-xs cursor-pointer hover:bg-slate-100 rounded transition-colors truncate"
        onClick={() => setIsEditing(true)}
      >
        {value || <span className="text-slate-400">선택...</span>}
      </div>
    );
  }

  // 2. 편집 모드 (Edit Mode)
  return (
    <div ref={containerRef} className="w-full">
      <Popover 
        open={open || isEditing} 
        onOpenChange={(isOpen) => {
          setOpen(isOpen);
          if (!isOpen) setIsEditing(false); // 팝업 닫히면 편집모드 해제
        }}
      >
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            className="w-full h-8 justify-between text-xs font-normal border-blue-500 ring-1 ring-blue-500"
          >
            <span className="truncate">{value || "선택..."}</span>
            <ChevronsUpDown className="ml-2 h-3 w-3 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent 
          className="w-[200px] p-0" 
          align="start"
          onPointerDownOutside={handleClose} // 외부 클릭 시 종료
          onEscapeKeyDown={handleClose}      // ESC 키 입력 시 종료
        >
          <Command>
            <CommandInput 
              placeholder="검색어 입력..." 
              className="h-8 text-xs" 
              autoFocus 
            />
            <CommandList>
              <CommandEmpty>결과가 없습니다.</CommandEmpty>
              <CommandGroup>
                {options.map((opt) => (
                  <CommandItem
                    key={opt}
                    value={opt}
                    onSelect={(currentValue) => {
                      const newValue = currentValue;
                      setValue(newValue);
                      onUpdate(newValue);
                      handleClose();
                    }}
                    className="text-xs"
                  >
                    <Check
                      className={cn(
                        "mr-2 h-3 w-3",
                        value === opt ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {opt}
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


// --- 2. Autocomplete Editable Cell 컴포넌트 ---
const EditablePurposeCell = ({ getValue, row, column, table }: any) => {
  const initialValue = getValue() as string;
  const [value, setValue] = useState(initialValue || '');
  useEffect(() => { setValue(initialValue || ''); }, [initialValue]);

  const onBlurOrEnter = () => {
    if (value !== initialValue) {
      table.options.meta?.updateData(row.original.id, value);
    }
  };

  return (
    <>
      <input
        type="text"
        list="purpose-options"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={onBlurOrEnter}
        onKeyDown={(e) => e.key === 'Enter' && onBlurOrEnter()}
        className="border p-1 rounded w-full text-sm text-gray-800 outline-none focus:border-blue-500 text-xs"
        placeholder="실행예산계획"
      />
      <datalist id="purpose-options">
        {PURPOSE_OPTIONS.map((opt) => (
          <option key={opt} value={opt} />
        ))}
      </datalist>
    </>
  );
};

// --- 3. 메인 테이블 컴포넌트 ---
const InvoiceTable = () => {
  const queryClient = useQueryClient();

  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [columnOrder, setColumnOrder] = useState<string[]>([]);
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 100 });

  const { invoices = [], isLoading } = useInvoice("2026-02");

  const updateMutation = useMutation({
    mutationFn: updateInvoicePurpose,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
    },
  });

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
      { accessorKey: 'purpose', header: '예산계획', size: 100, cell: EditablePurposeCell },
      {
        accessorKey: 'purpose',
        header: '용도2(Purpose)',
        size: 180,
        cell: ({ row, table }) => (
          <AutocompleteCell
            initialValue={row.original.purpose || ""}
            options={PURPOSE_OPTIONS}
            onUpdate={(newValue) => {
              table.options.meta?.updateData(row.original.id, newValue);
            }}
          />
        ),
      },
      { accessorKey: 'amount', header: '금액', size: 100,
        cell: ({ row }) => {
          const amount = Number(row.original.amount) ?? 0;
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
    []
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
      updateData: (id: number, purpose: string) => {
        updateMutation.mutate({ id, purpose });
      },
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
          placeholder="부서명 검색..."
          className="border p-2 rounded text-sm"
          value={(table.getColumn('department_name')?.getFilterValue() as string) ?? ''}
          onChange={(e) => table.getColumn('department_name')?.setFilterValue(e.target.value)}
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
                    className="p-2 border-b border-r font-semibold cursor-pointer truncate last:border-r-0 select-none hover:bg-gray-200 text-sm"
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
                  className="hover:bg-blue-50 border-b text-xs"
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

export default function App() {
  const queryClient = new QueryClient();
  return (
    <QueryClientProvider client={queryClient}>
      <InvoiceTable />
    </QueryClientProvider>
  );
}
