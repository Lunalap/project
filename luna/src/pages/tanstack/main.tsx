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
import { useQuery, useMutation, useQueryClient, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useInvoice } from "@/hooks/invoice/use-invoice";
import { ArrowDownZA, ArrowUpAZ } from "lucide-react";

// --- 1. 타입 정의 및 Mock API ---
type Invoice = {
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
  purpose?: string; // 추가된 purpose 컬럼
};

// Autocomplete를 위한 목적(purpose) 옵션 목록
const PURPOSE_OPTIONS = ["운영비", "복리후생비", "접대비", "여비교통비", "소모품비"];

// 가상의 백엔드 API 함수
const fetchInvoices = async (): Promise<Invoice[]> => {
  // 실제 환경에서는 fetch('/api/invoices') 등을 사용
  return Array.from({ length: 500 }).map((_, i) => ({
    id: i + 1,
    detail_category_name: "건강보험",
    department_name: "인사총무팀",
    charge: "박민정",
    accounting_date: "2026-02-10",
    invoice_number: `240101-260204-${String(i + 1).padStart(3, '0')}-EA`,
    invoice_line_number: 1,
    amount: "142,797,160",
    account: "국민건강보험관리공단",
    actual_use: "국민건강보험관리공단",
    remark: "2026년 1월 국민건강보험료(판관)",
    purpose: i % 2 === 0 ? "운영비" : "", // 초기 일부 데이터
  }));
};

const updateInvoicePurpose = async ({ id, purpose }: { id: number; purpose: string }) => {
  return new Promise((resolve) => setTimeout(() => resolve({ success: true, id, purpose }), 300));
};

// --- 2. Autocomplete Editable Cell 컴포넌트 ---
const EditablePurposeCell = ({ getValue, row, column, table }: any) => {
  const initialValue = getValue() as string;
  const [value, setValue] = useState(initialValue || '');

  // 초기값이 (refetch 등으로) 변경되면 상태 동기화
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
        className="border p-1 rounded w-full text-sm text-gray-800"
        placeholder="용도 선택/입력"
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

  // 테이블 상태 관리
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [columnOrder, setColumnOrder] = useState<string[]>([]);
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 100 }); // 100개씩 표시

  /*// 데이터 Fetching
  const { data: invoices = [], isLoading } = useQuery({
    queryKey: ['invoices'],
    queryFn: fetchInvoices,
  });
  */
  
  const { invoices, isLoading } = useInvoice("2026-02");

  // 데이터 Updating Mutation
  const updateMutation = useMutation({
    mutationFn: updateInvoicePurpose,
    onSuccess: () => {
      // 변경 성공 시 즉각적으로 데이터를 재요청(refetch)하여 렌더링
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      console.log('')
      alert('업로드 완료 및 데이터 갱신됨');
    },
  });

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
      { accessorKey: 'id', header: 'ID' },
      { accessorKey: 'department_name', header: '부서명' },
      { accessorKey: 'charge', header: '담당자' },
      { accessorKey: 'amount', header: '금액' },
      { accessorKey: 'remark', header: '적요' },
      {
        accessorKey: 'purpose',
        header: '용도 (Purpose)',
        cell: EditablePurposeCell, // Autocomplete 적용된 커스텀 셀
      },
    ],
    []
  );

  // TanStack Table 인스턴스 생성
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
      // Editable Cell에서 호출할 업데이트 함수
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
    estimateSize: () => 40, // 행(row)의 대략적인 높이 (px)
    overscan: 10, // 화면 밖으로 미리 렌더링할 행 개수
  });

  if (isLoading) return <div>데이터를 불러오는 중입니다...</div>;

  return (
    <div className="p-4 space-y-4">
      {/* 검색/필터링 (Column Filtering) */}
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="부서명 검색..."
          className="border p-2 rounded"
          value={(table.getColumn('department_name')?.getFilterValue() as string) ?? ''}
          onChange={(e) => table.getColumn('department_name')?.setFilterValue(e.target.value)}
        />
      </div>

      {/* 테이블 영역 (가상화 컨테이너) */}
      <div
        ref={tableContainerRef}
        className="border rounded shadow"
        style={{ height: '500px', overflow: 'auto' }} // 스크롤 영역 필수
      >
        <table className="w-full text-left border-collapse">
          <thead className="bg-gray-100 sticky top-0 z-10">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="p-2 border-b font-semibold cursor-pointer"
                    onClick={header.column.getToggleSortingHandler()}
                  >
                    {flexRender(header.column.columnDef.header, header.getContext())}
                    {{
                      asc: <ArrowUpAZ size={16} />,
                      desc: <ArrowDownZA size={16} />,
                    }[header.column.getIsSorted() as string] ?? null}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody
            style={{
              height: `${rowVirtualizer.getTotalSize()}px`,
              position: 'relative', // 가상화 필수 스타일
            }}
          >
            {rowVirtualizer.getVirtualItems().map((virtualRow) => {
              const row = rows[virtualRow.index];
              return (
                <tr
                  key={row.id}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    transform: `translateY(${virtualRow.start}px)`, // 위치 계산
                  }}
                  className="hover:bg-gray-50 border-b"
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="p-2">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* 페이지네이션 (Pagination) - 100row씩 보여주기 */}
      <div className="flex items-center gap-2">
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

// 최상위 Query Provider 래핑
export default function App() {
  const queryClient = new QueryClient();
  return (
    <QueryClientProvider client={queryClient}>
      <InvoiceTable />
    </QueryClientProvider>
  );
}
