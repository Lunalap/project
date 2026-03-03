import React, { useState, useMemo, useEffect, useRef } from 'react';
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
} from '@tanstack/react-table';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useInvoice } from "@/hooks/invoice/use-invoice";

/**
 * 1. Data Type Definition
 */
interface Invoice {
  id: number;
  detail_category_name: string;
  department_name: string;
  charge: string;
  accounting_date: string;
  invoice_number: string;
  invoice_line_number: number;
  amount: string;
  account: string;
  actual_use: string;
  remark: string;
  purpose?: string; // 사용자가 추가/수정할 컬럼
}

/**
 * 2. Editable Autocomplete Cell Component
 */
const AutocompleteCell = ({
  value: initialValue,
  rowId,
  columnId,
  updateData,
}: {
  value: string;
  rowId: number;
  columnId: string;
  updateData: (rowId: number, columnId: string, value: string) => void;
}) => {
  const [value, setValue] = useState(initialValue || '');
  const options = ['운영비', '소모품비', '교육훈련비', '사무용품비', '기타'];

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue(e.target.value);
  };

  const onSelect = (val: string) => {
    console.log(val);
    setValue(val);
    updateData(rowId, columnId, val); // 즉각 반영 및 업로드 트리거
  };

  return (
    <div className="relative group">
      <input
        value={value}
        onChange={onChange}
        className="w-full p-1 border rounded text-sm focus:ring-2 focus:ring-blue-500 outline-none"
        placeholder="선택 또는 입력..."
      />
      <div className="absolute z-10 hidden group-focus-within:block w-full bg-white border rounded shadow-lg mt-1">
        {options.map((opt) => (
          <div
            key={opt}
            onMouseDown={() => onSelect(opt)}
            className="p-2 hover:bg-gray-100 cursor-pointer text-xs"
          >
            {opt}
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * 3. Main Table Page Component
 */
const InvoiceTablePage: React.FC = () => {
  const { invoices = [], isLoading } = useInvoice("2026-02");
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});
  const [columnOrder, setColumnOrder] = useState<string[]>([]);

  // 데이터 업로드 로직 (즉각 반영용)
  const handleUpdateData = async (rowId: number, columnId: string, value: string) => {
    console.log(`Uploading change: Row ${rowId}, ${columnId} = ${value}`);
    
    // 1. 서버에 업로드 (Mock API call)
    // await fetch(`/api/update/${rowId}`, { method: 'POST', body: JSON.stringify({ [columnId]: value }) });

    // 2. 업로드 완료 후 데이터 다시 요청하여 렌더링
    //await fetchData();
  };

  /**
   * 4. Column Definitions
   */
  const columns = useMemo<ColumnDef<Invoice>[]>(
    () => [
      {
        id: 'select',
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
      {
        accessorKey: 'accounting_date',
        header: '회계일자',
      },
      {
        accessorKey: 'detail_category_name',
        header: '상세카테고리',
      },
      {
        accessorKey: 'department_name',
        header: '부서명',
      },
      {
        accessorKey: 'amount',
        header: '금액',
        cell: (info) => Number(info.getValue()?.toString().replace(/,/g, '')).toLocaleString(),
      },
      {
        accessorKey: 'purpose',
        header: '용도',
        cell: ({ row, column, getValue }) => (
          <AutocompleteCell
            value={getValue() as string}
            rowId={row.original.id}
            columnId={column.id}
            updateData={handleUpdateData}
          />
        ),
      },
      {
        accessorKey: 'remark',
        header: '비고',
      },
    ],
    []
  );

  const table = useReactTable({
    data: invoices,
    columns,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      columnOrder,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    onColumnOrderChange: setColumnOrder,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    debugTable: true,
  });

  // 5. Virtualization Setup
  const tableContainerRef = useRef<HTMLDivElement>(null);
  const { rows } = table.getRowModel();
  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => tableContainerRef.current,
    estimateSize: () => 45, // 예상 행 높이
    overscan: 30,
  });

  return (
    <div className="p-4 flex flex-col h-[850px] overflow-hidden font-sans">
      <h1 className="text-xl font-bold mb-4">Invoice Management System</h1>

      {/* Table Controls (Filtering & Ordering Mock) */}
      <div className="mb-4 flex gap-2">
        <input
          placeholder="부서명 필터링..."
          value={(table.getColumn('department_name')?.getFilterValue() as string) ?? ''}
          onChange={(e) => table.getColumn('department_name')?.setFilterValue(e.target.value)}
          className="border p-2 rounded text-sm"
        />
        <button 
          onClick={() => setColumnOrder(['select', 'purpose', 'amount', 'remark'])} // 순서 변경 예시
          className="bg-gray-200 px-3 py-1 rounded text-sm hover:bg-gray-300"
        >
          컬럼 순서 변경 (샘플)
        </button>
      </div>

      {/* Virtualized Table Container */}
      <div
        ref={tableContainerRef}
        className="flex-1 overflow-auto border rounded relative bg-white"
      >
        <table className="w-full border-collapse">
          <thead className="sticky top-0 bg-gray-50 z-20 shadow-sm">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="p-3 text-left text-xs font-semibold text-gray-600 border-b cursor-pointer select-none"
                    onClick={header.column.getToggleSortingHandler()}
                  >
                    {flexRender(header.column.columnDef.header, header.getContext())}
                    {{ asc: ' 🔼', desc: ' 🔽' }[header.column.getIsSorted() as string] ?? null}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody
            style={{
              height: `${rowVirtualizer.getTotalSize()}px`,
              position: 'relative',
            }}
          >
            {rowVirtualizer.getVirtualItems().map((virtualRow) => {
              const row = rows[virtualRow.index];
              return (
                <tr
                  key={row.id}
                  className={`hover:bg-blue-50 transition-colors ${row.getIsSelected() ? 'bg-blue-100' : ''}`}
                  style={{
                    position: 'absolute',
                    top: 0,
                    transform: `translateY(${virtualRow.start}px)`,
                    width: '100%',
                    display: 'flex',
                  }}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td
                      key={cell.id}
                      className="p-2 border-b text-sm overflow-hidden text-ellipsis whitespace-nowrap"
                      style={{ width: cell.column.getSize() }}
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      <div className="py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className="border px-3 py-1 rounded disabled:opacity-30"
          >
            이전
          </button>
          <span className="text-sm">
            {table.getState().pagination.pageIndex + 1} / {table.getPageCount()}
          </span>
          <button
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className="border px-3 py-1 rounded disabled:opacity-30"
          >
            다음
          </button>
        </div>
        <div className="text-sm text-gray-500">
          Selected: {Object.keys(rowSelection).length} rows
        </div>
      </div>
    </div>
  );
};

export default InvoiceTablePage;