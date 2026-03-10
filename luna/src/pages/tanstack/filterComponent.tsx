// ✅ 추가 import
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  getFacetedRowModel,          // 🆕
  getFacetedUniqueValues,      // 🆕
  flexRender,
  type Column,
  type Table,
  type RowData,
  type ColumnDef,
  type SortingState,
  type ColumnFiltersState,
  type RowSelectionState,
  type FilterFn,               // 🆕
} from '@tanstack/react-table';

// ✅ ColumnMeta 타입 확장 (기존 TableMeta 선언 아래에 추가)
declare module '@tanstack/table-core' {
  interface ColumnMeta<TData extends RowData, TValue> {
    filterType?: 'autocomplete' | 'text';
  }
}

// ----------------------------------------------------------------
// 🆕 AutocompleteFilter 컴포넌트 — 헤더용 멀티셀렉트 자동완성 필터
// ----------------------------------------------------------------
interface AutocompleteFilterProps {
  column: Column<any, unknown>;
}

const AutocompleteFilter: React.FC<AutocompleteFilterProps> = ({ column }) => {
  const [open, setOpen] = useState(false);

  // 현재 필터값 (string[] 형태로 관리)
  const selectedValues = (column.getFilterValue() as string[] | undefined) ?? [];

  // 해당 컬럼의 고유 값 목록 (getFacetedUniqueValues 활용)
  const uniqueValues = useMemo(() => {
    const valuesMap = column.getFacetedUniqueValues();
    return Array.from(valuesMap.keys())
      .filter(Boolean)
      .sort() as string[];
  }, [column.getFacetedUniqueValues()]);

  const handleSelect = useCallback(
    (value: string) => {
      const next = selectedValues.includes(value)
        ? selectedValues.filter((v) => v !== value)
        : [...selectedValues, value];

      column.setFilterValue(next.length > 0 ? next : undefined);
    },
    [selectedValues, column]
  );

  const handleClear = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      column.setFilterValue(undefined);
    },
    [column]
  );

  return (
    <div className="mt-1" onClick={(e) => e.stopPropagation()}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <div
            className={cn(
              "h-7 w-full text-[11px] px-2 font-normal border rounded-md",
              "flex items-center justify-between gap-1 cursor-pointer",
              "transition-colors hover:bg-slate-50 dark:hover:bg-slate-800",
              selectedValues.length > 0
                ? "border-sky-400 bg-sky-50 dark:bg-sky-950"
                : "border-slate-200"
            )}
          >
            {selectedValues.length > 0 ? (
              <span className="truncate text-sky-600 dark:text-sky-400 flex-1">
                {selectedValues.length === 1
                  ? selectedValues[0]
                  : `${selectedValues.length}개 선택됨`}
              </span>
            ) : (
              <span className="text-slate-400 flex-1">필터 선택...</span>
            )}

            {/* 선택값 있을 때 X 버튼 */}
            {selectedValues.length > 0 && (
              <span
                onClick={handleClear}
                className="text-slate-400 hover:text-slate-600 leading-none"
              >
                ✕
              </span>
            )}
          </div>
        </PopoverTrigger>

        <PopoverContent
          className="w-[200px] p-0"
          align="start"
          // 헤더 클릭 → 정렬 이벤트 차단
          onClick={(e) => e.stopPropagation()}
        >
          <Command
            filter={(value, search) =>
              value.toLowerCase().includes(search.toLowerCase()) ? 1 : 0
            }
          >
            <CommandInput
              placeholder="검색..."
              className="h-8 text-xs"
            />
            <CommandList className="max-h-[240px]">
              <CommandEmpty className="text-xs text-center py-3 text-slate-400">
                검색 결과 없음
              </CommandEmpty>
              <CommandGroup>
                {uniqueValues.map((val) => {
                  const isSelected = selectedValues.includes(val);
                  return (
                    <CommandItem
                      key={val}
                      value={val}
                      onSelect={() => handleSelect(val)}
                      className="flex items-center gap-2 text-xs cursor-pointer"
                    >
                      {/* 체크박스 역할 */}
                      <div
                        className={cn(
                          "h-3.5 w-3.5 rounded border flex items-center justify-center flex-shrink-0",
                          isSelected
                            ? "bg-sky-500 border-sky-500"
                            : "border-slate-300"
                        )}
                      >
                        {isSelected && (
                          <Check className="h-2.5 w-2.5 text-white" />
                        )}
                      </div>
                      <span className="truncate">{val}</span>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
};

// ----------------------------------------------------------------
// ✅ Filter 컴포넌트 수정 — meta.filterType에 따라 분기
// ----------------------------------------------------------------
const Filter = ({ column }: FilterProps) => {
  const filterType = column.columnDef.meta?.filterType;

  // autocomplete 타입
  if (filterType === 'autocomplete') {
    return <AutocompleteFilter column={column} />;
  }

  // 기본 텍스트 필터 (기존 동일)
  return (
    <div className="mt-1">
      <Input
        type="text"
        value={(column.getFilterValue() ?? '') as string}
        onChange={(e) => column.setFilterValue(e.target.value)}
        className="h-7 w-full text-[11px] px-2 font-normal border-slate-200 focus-visible:ring-sky-500"
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  );
};

// ----------------------------------------------------------------
// ✅ 컬럼 정의 수정 — autocomplete 대상 컬럼에 meta + filterFn 추가
// ----------------------------------------------------------------
// InvoiceTable 내 columns useMemo 안에서:

const columns = useMemo<ColumnDef<InvoiceEntry>[]>(() => [
    // ... (select, id 컬럼 동일)

    {
      accessorKey: 'detail_category_name',
      header: '소분류',
      size: 150,
      enableColumnFilter: true,
      // 🆕 autocomplete 설정
      meta: { filterType: 'autocomplete' },
      filterFn: (row, columnId, filterValue: string[]) => {
        if (!filterValue || filterValue.length === 0) return true;
        return filterValue.includes(String(row.getValue(columnId)));
      },
      footer: ({ table }) => (
        <div>
          {table.getSelectedRowModel().rows.length} /{' '}
          {table.getFilteredRowModel().rows.length}
        </div>
      ),
    },

    // purpose, amount 컬럼 동일...

    {
      accessorKey: 'charge',
      header: '작성자',
      size: 80,
      enableColumnFilter: true,
      // 🆕 autocomplete 설정
      meta: { filterType: 'autocomplete' },
      filterFn: (row, columnId, filterValue: string[]) => {
        if (!filterValue || filterValue.length === 0) return true;
        return filterValue.includes(String(row.getValue(columnId)));
      },
    },

    // account, actual_use → 기존 텍스트 필터 유지 (filterType 미설정)
    { accessorKey: 'account', header: '거래처', size: 150, filterFn: 'includesString' },
    { accessorKey: 'actual_use', header: '실사용처', size: 150, filterFn: 'includesString' },
    {
      accessorKey: 'remark',
      header: '적요',
      size: 300,
      enableColumnFilter: true,
      // remark는 기존 text 필터 유지 (meta 없음 = text)
      // ...
    },
    // 나머지 동일
], []);

// ----------------------------------------------------------------
// ✅ useReactTable 설정에 Faceted 모델 추가
// ----------------------------------------------------------------
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
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFacetedRowModel: getFacetedRowModel(),           // 🆕
    getFacetedUniqueValues: getFacetedUniqueValues(),   // 🆕
    meta: {
      updateData: (id, purpose) => updateMutation.mutate({ id, purpose }),
      budgets,
    },
    globalFilterFn: (row, columnId, filterValue) => {
      const searchValue = filterValue.toLowerCase();
      const account = String(row.original.account ?? '').toLowerCase();
      const actualUse = String(row.original.actual_use ?? '').toLowerCase();
      return account.includes(searchValue) || actualUse.includes(searchValue);
    },
  });
