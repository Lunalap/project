/**
 * SpreadsheetPage.tsx
 *
 * - useInvoice / useBudget 훅 기반 데이터
 * - @tanstack/react-virtual 로 가상 스크롤 (1000+ 행 최적화)
 * - "프로젝트" 컬럼: budget 데이터 Combobox (detail_category_name / purpose / expected_amount)
 * - actual_use 컬럼 제거
 * - 인라인 편집 (onBlur / Enter → PATCH)
 * - 낙관적 업데이트 + 롤백
 * - 컬럼 정렬 / 전체 검색 / 체크박스 선택 + 요약바 / 행 추가·삭제
 *
 * 패키지 설치:
 *   npm install @tanstack/react-virtual
 *   npx shadcn@latest add table input badge skeleton button checkbox
 *                        command popover scroll-area
 *   npm install sonner
 */

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useInvoice } from "@/hooks/invoice/use-invoice";
import { useBudget } from "@/hooks/budget/use-budget";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Check,
  ChevronsUpDown,
  Hash,
  Loader2,
  Plus,
  Search,
  Sigma,
  Trash2,
} from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface Invoice {
  id: number;
  detail_category_name: string;
  department_name: string;
  charge: string;
  accounting_date: string;
  invoice_number: string;
  invoice_line_number: number;
  amount: string;
  account: string;
  remark: string;
  /** 프로젝트 연결 – budget.id */
  project_id?: number | null;
}

export interface Budget {
  id: number;
  month: string;
  department_name: string;
  detail_category_name: string;
  purpose: string;
  expected_amount: string;
  [key: string]: unknown;
}

type SortDir = "asc" | "desc" | null;

// ─────────────────────────────────────────────────────────────────────────────
// 컬럼 정의
// ─────────────────────────────────────────────────────────────────────────────

interface ColumnDef {
  key: string;
  label: string;
  editable?: boolean;
  type?: "text" | "number" | "project";
  width: number; // px
}

const COLUMN_DEFS: ColumnDef[] = [
  { key: "id",                   label: "ID",      editable: false, width: 56  },
  { key: "accounting_date",      label: "회계일자", editable: true,  width: 110 },
  { key: "invoice_number",       label: "전표번호", editable: true,  width: 230 },
  { key: "invoice_line_number",  label: "행번호",   editable: false, type: "number", width: 64 },
  { key: "detail_category_name", label: "세부항목", editable: true,  width: 120 },
  { key: "department_name",      label: "부서",     editable: true,  width: 120 },
  { key: "charge",               label: "담당자",   editable: true,  width: 90  },
  { key: "account",              label: "거래처",   editable: true,  width: 160 },
  { key: "amount",               label: "금액",     editable: true,  type: "number", width: 140 },
  { key: "project",              label: "프로젝트", editable: true,  type: "project", width: 220 },
  { key: "remark",               label: "비고",     editable: true,  width: 280 },
];

const TOTAL_WIDTH = COLUMN_DEFS.reduce((s, c) => s + c.width, 0);

// ─────────────────────────────────────────────────────────────────────────────
// API
// ─────────────────────────────────────────────────────────────────────────────

const API_BASE = "/api/invoices";

async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, options);
  if (!res.ok) throw new Error(`API ${res.status}: ${res.statusText}`);
  return res.json() as Promise<T>;
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function parseAmount(v: string | number | null | undefined): number {
  const n = Number(String(v ?? "").trim().replace(/,/g, "").replace(/\s/g, ""));
  return isNaN(n) ? 0 : n;
}

function formatNumber(v: string | number | null | undefined): string {
  return parseAmount(v).toLocaleString("ko-KR");
}

// ─────────────────────────────────────────────────────────────────────────────
// SortIcon
// ─────────────────────────────────────────────────────────────────────────────

function SortIcon({ dir }: { dir: SortDir }) {
  if (dir === "asc")  return <ArrowUp   className="w-3 h-3 shrink-0" />;
  if (dir === "desc") return <ArrowDown className="w-3 h-3 shrink-0" />;
  return <ArrowUpDown className="w-3 h-3 shrink-0 opacity-40" />;
}

// ─────────────────────────────────────────────────────────────────────────────
// ProjectCell – Combobox
// ─────────────────────────────────────────────────────────────────────────────

interface ProjectCellProps {
  projectId: number | null | undefined;
  invoiceId: number;
  budgets: Budget[];
  onSelect: (invoiceId: number, budgetId: number | null) => Promise<void>;
}

function ProjectCell({ projectId, invoiceId, budgets, onSelect }: ProjectCellProps) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const selected = budgets.find((b) => b.id === projectId) ?? null;

  const handleSelect = async (budgetId: number | null) => {
    setOpen(false);
    if (budgetId === projectId) return;
    setSaving(true);
    try {
      await onSelect(invoiceId, budgetId);
    } catch {
      toast.error("프로젝트 저장 실패");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className={cn(
            "flex items-center justify-between w-full min-h-7 px-1 py-0.5 rounded text-sm text-left",
            "hover:bg-muted/60 transition-colors cursor-pointer",
            saving && "opacity-50 pointer-events-none"
          )}
        >
          <span className="truncate text-sm">
            {saving ? (
              <span className="flex items-center gap-1 text-muted-foreground">
                <Loader2 className="w-3 h-3 animate-spin" />
                저장 중...
              </span>
            ) : selected ? (
              <span className="font-medium">{selected.detail_category_name}</span>
            ) : (
              <span className="text-muted-foreground/60">선택...</span>
            )}
          </span>
          <ChevronsUpDown className="w-3 h-3 shrink-0 opacity-40 ml-1" />
        </button>
      </PopoverTrigger>

      <PopoverContent className="p-0 w-[420px]" align="start">
        <Command>
          <CommandInput placeholder="세부항목 / 목적 검색..." />
          <CommandList className="max-h-64">
            <CommandEmpty>검색 결과가 없습니다.</CommandEmpty>
            <CommandGroup>
              {/* 선택 해제 */}
              <CommandItem
                value="__none__"
                onSelect={() => handleSelect(null)}
                className="text-muted-foreground text-xs"
              >
                <Check className={cn("w-3 h-3 mr-2", projectId == null ? "opacity-100" : "opacity-0")} />
                선택 안 함
              </CommandItem>

              {budgets.map((b) => (
                <CommandItem
                  key={b.id}
                  value={`${b.detail_category_name} ${b.purpose} ${b.expected_amount}`}
                  onSelect={() => handleSelect(b.id)}
                >
                  <Check
                    className={cn(
                      "w-3 h-3 mr-2 shrink-0",
                      b.id === projectId ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <div className="flex flex-col min-w-0">
                    <span className="font-medium text-sm truncate">{b.detail_category_name}</span>
                    <span className="text-xs text-muted-foreground truncate">{b.purpose}</span>
                  </div>
                  <span className="ml-auto pl-2 text-xs text-muted-foreground tabular-nums shrink-0">
                    {b.expected_amount}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// EditableCell – 텍스트 / 숫자
// ─────────────────────────────────────────────────────────────────────────────

interface EditableCellProps {
  value: string | number | null | undefined;
  invoiceId: number;
  col: ColumnDef;
  onCommit: (id: number, key: string, value: string) => Promise<void>;
}

function EditableCell({ value, invoiceId, col, onCommit }: EditableCellProps) {
  const display = col.type === "number" ? formatNumber(value) : String(value ?? "");

  const [editing, setEditing] = useState(false);
  const [draft, setDraft]     = useState(String(value ?? "").trim());
  const [saving, setSaving]   = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { if (!editing) setDraft(String(value ?? "").trim()); }, [value, editing]);
  useEffect(() => { if (editing) inputRef.current?.focus(); }, [editing]);

  const commit = useCallback(async () => {
    setEditing(false);
    const original = String(value ?? "").trim();
    if (draft === original) return;
    setSaving(true);
    try {
      await onCommit(invoiceId, col.key, draft);
    } catch {
      setDraft(original);
      toast.error(`"${col.label}" 저장 실패`);
    } finally {
      setSaving(false);
    }
  }, [col, draft, invoiceId, onCommit, value]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter")  commit();
    if (e.key === "Escape") { setDraft(String(value ?? "").trim()); setEditing(false); }
  };

  if (!col.editable) {
    return (
      <span className={cn("text-sm text-muted-foreground px-1 select-none", col.type === "number" && "tabular-nums")}>
        {display}
      </span>
    );
  }

  if (editing) {
    return (
      <Input
        ref={inputRef}
        type={col.type === "number" ? "number" : "text"}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={handleKeyDown}
        className="h-7 w-full px-1 py-0 text-sm border-primary ring-1 ring-primary focus-visible:ring-primary"
      />
    );
  }

  return (
    <div
      onClick={() => setEditing(true)}
      title="클릭하여 편집"
      className={cn(
        "min-h-7 w-full px-1 py-0.5 rounded cursor-text text-sm select-none truncate",
        "hover:bg-muted/60 transition-colors",
        col.type === "number" && "tabular-nums text-right",
        saving && "opacity-50 pointer-events-none"
      )}
    >
      {saving
        ? <span className="flex items-center gap-1 text-muted-foreground"><Loader2 className="w-3 h-3 animate-spin" />{display}</span>
        : display
      }
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SelectionSummaryBar
// ─────────────────────────────────────────────────────────────────────────────

function SelectionSummaryBar({
  selectedRows,
  onClearSelection,
}: {
  selectedRows: Invoice[];
  onClearSelection: () => void;
}) {
  if (selectedRows.length === 0) return null;

  const total = selectedRows.reduce((s, r) => s + parseAmount(r.amount), 0);

  return (
    <div className="flex items-center gap-4 flex-wrap rounded-lg border border-primary/30 bg-primary/5 px-4 py-2.5 text-sm animate-in slide-in-from-bottom-2 duration-200">
      <div className="flex items-center gap-1.5 font-medium text-primary">
        <Hash className="w-3.5 h-3.5" />
        선택된 행
        <Badge className="h-5 px-1.5 text-xs">{selectedRows.length}</Badge>
      </div>
      <div className="flex items-center gap-1.5 text-muted-foreground">
        <span className="text-border">|</span>
        <Sigma className="w-3.5 h-3.5" />
        금액 합계
        <span className="font-semibold text-foreground tabular-nums">
          {total.toLocaleString("ko-KR")}
          <span className="text-xs font-normal text-muted-foreground ml-1">원</span>
        </span>
      </div>
      <Button
        size="sm" variant="ghost"
        className="ml-auto h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
        onClick={onClearSelection}
      >
        선택 해제
      </Button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SpreadsheetPage
// ─────────────────────────────────────────────────────────────────────────────

interface SpreadsheetPageProps {
  yearMonth: string;   // e.g. "2026-02"
  allowAdd?: boolean;
  allowDelete?: boolean;
}

const ROW_HEIGHT = 36; // px – 가상 스크롤 고정 행 높이
const OVERSCAN   = 10;

export default function SpreadsheetPage({
  yearMonth,
  allowAdd    = true,
  allowDelete = true,
}: SpreadsheetPageProps) {
  const { invoices = [], isLoading: invLoading, isError: invError } = useInvoice(yearMonth);
  const { budget   = [], isLoading: budLoading, isError: budError  } = useBudget(yearMonth);

  const [localRows, setLocalRows] = useState<Invoice[]>([]);
  useEffect(() => { setLocalRows(invoices as Invoice[]); }, [invoices]);

  const [search,    setSearch]    = useState("");
  const [sortKey,   setSortKey]   = useState<string | null>(null);
  const [sortDir,   setSortDir]   = useState<SortDir>(null);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  // ── 셀 저장 (낙관적)
  const handleCommit = useCallback(async (id: number, key: string, value: string) => {
    setLocalRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, [key]: value } : r))
    );
    await apiFetch(`${API_BASE}/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [key]: value }),
    });
    toast.success("저장되었습니다.");
  }, []);

  // ── 프로젝트 선택 저장
  const handleProjectSelect = useCallback(
    async (invoiceId: number, budgetId: number | null) => {
      setLocalRows((prev) =>
        prev.map((r) => (r.id === invoiceId ? { ...r, project_id: budgetId } : r))
      );
      await apiFetch(`${API_BASE}/${invoiceId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ project_id: budgetId }),
      });
      toast.success("프로젝트가 저장되었습니다.");
    },
    []
  );

  // ── 행 삭제
  const handleDelete = useCallback(async (id: number) => {
    const snapshot = localRows;
    setLocalRows((r) => r.filter((row) => row.id !== id));
    setSelectedIds((prev) => { const s = new Set(prev); s.delete(id); return s; });
    try {
      await apiFetch(`${API_BASE}/${id}`, { method: "DELETE" });
      toast.success("삭제되었습니다.");
    } catch {
      setLocalRows(snapshot);
      toast.error("삭제에 실패했습니다.");
    }
  }, [localRows]);

  // ── 행 추가
  const handleAddRow = useCallback(async () => {
    try {
      const created = await apiFetch<Invoice>(API_BASE, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accounting_date: yearMonth + "-01" }),
      });
      setLocalRows((prev) => [...prev, created]);
      toast.success("행이 추가되었습니다.");
    } catch {
      toast.error("행 추가에 실패했습니다.");
    }
  }, [yearMonth]);

  // ── 정렬 토글
  const handleSort = (key: string) => {
    if (sortKey !== key) { setSortKey(key); setSortDir("asc"); }
    else if (sortDir === "asc") setSortDir("desc");
    else { setSortKey(null); setSortDir(null); }
  };

  // ── 행 선택
  const toggleRow = (id: number) =>
    setSelectedIds((prev) => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; });

  // ── 필터 + 정렬
  const processed = useMemo(() => {
    let data = [...localRows];
    if (search.trim()) {
      const q = search.toLowerCase();
      data = data.filter((row) =>
        COLUMN_DEFS.some((col) => String((row as Record<string, unknown>)[col.key] ?? "").toLowerCase().includes(q))
      );
    }
    if (sortKey && sortDir) {
      const col = COLUMN_DEFS.find((c) => c.key === sortKey);
      data.sort((a, b) => {
        const av = (a as Record<string, unknown>)[sortKey];
        const bv = (b as Record<string, unknown>)[sortKey];
        const cmp = col?.type === "number"
          ? parseAmount(av as string) - parseAmount(bv as string)
          : String(av ?? "").localeCompare(String(bv ?? ""), "ko", { numeric: true });
        return sortDir === "asc" ? cmp : -cmp;
      });
    }
    return data;
  }, [localRows, search, sortKey, sortDir]);

  const selectedRows = useMemo(
    () => localRows.filter((r) => selectedIds.has(r.id)),
    [localRows, selectedIds]
  );

  // ─── Virtual Scroll
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count:         processed.length,
    getScrollElement: () => parentRef.current,
    estimateSize:  () => ROW_HEIGHT,
    overscan:      OVERSCAN,
  });

  const virtualItems  = virtualizer.getVirtualItems();
  const totalVirtHeight = virtualizer.getTotalSize();

  // ── 전체 선택 (현재 화면 기준)
  const visibleIds     = virtualItems.map((vi) => processed[vi.index]?.id).filter(Boolean) as number[];
  const allVisSelected = visibleIds.length > 0 && visibleIds.every((id) => selectedIds.has(id));
  const partialSel     = !allVisSelected && visibleIds.some((id) => selectedIds.has(id));

  const toggleAllVisible = () => {
    setSelectedIds((prev) => {
      const s = new Set(prev);
      allVisSelected
        ? visibleIds.forEach((id) => s.delete(id))
        : visibleIds.forEach((id) => s.add(id));
      return s;
    });
  };

  // ─── Loading
  if (invLoading || budLoading) {
    return (
      <div className="p-6 space-y-3">
        <Skeleton className="h-9 w-56" />
        <Skeleton className="h-10 w-full" />
        {Array.from({ length: 12 }).map((_, i) => <Skeleton key={i} className="h-9 w-full" />)}
      </div>
    );
  }

  if (invError || budError) {
    return (
      <div className="p-6 flex flex-col gap-3">
        <Badge variant="destructive" className="w-fit">데이터 로드 실패</Badge>
        <p className="text-sm text-muted-foreground">데이터를 불러오는 중 오류가 발생했습니다.</p>
        <Button size="sm" variant="outline" onClick={() => window.location.reload()}>다시 시도</Button>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────

  const CHECK_COL_W = 40;
  const DEL_COL_W   = allowDelete ? 40 : 0;

  return (
    <div className="flex flex-col gap-4 p-6 h-full min-h-0">

      {/* Toolbar */}
      <div className="flex items-center justify-between flex-wrap gap-2 shrink-0">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-semibold tracking-tight">인보이스 시트</h1>
          <Badge variant="secondary">{processed.length.toLocaleString()}건</Badge>
          <span className="text-sm text-muted-foreground">{yearMonth}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="전체 검색..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 h-9 w-56"
            />
          </div>
          {allowAdd && (
            <Button size="sm" onClick={handleAddRow}>
              <Plus className="w-4 h-4 mr-1" />행 추가
            </Button>
          )}
        </div>
      </div>

      {/* Table wrapper */}
      <div className="rounded-lg border flex flex-col flex-1 min-h-0 overflow-hidden">

        {/* ── Sticky Header ── */}
        <div
          className="shrink-0 overflow-hidden border-b bg-background"
          style={{ minWidth: TOTAL_WIDTH + CHECK_COL_W + DEL_COL_W }}
        >
          <div className="flex items-center h-10">
            {/* 전체 선택 */}
            <div style={{ width: CHECK_COL_W, minWidth: CHECK_COL_W }} className="flex items-center justify-center px-2 shrink-0">
              <Checkbox
                checked={allVisSelected}
                data-state={partialSel ? "indeterminate" : undefined}
                onCheckedChange={toggleAllVisible}
                aria-label="화면 내 전체 선택"
              />
            </div>

            {COLUMN_DEFS.map((col) => (
              <div
                key={col.key}
                style={{ width: col.width, minWidth: col.width }}
                className="flex items-center gap-1 px-2 shrink-0 text-xs uppercase tracking-wide font-semibold cursor-pointer select-none hover:bg-muted/50 h-full"
                onClick={() => handleSort(col.key)}
              >
                <span className="truncate">{col.label}</span>
                <SortIcon dir={sortKey === col.key ? sortDir : null} />
              </div>
            ))}

            {allowDelete && (
              <div style={{ width: DEL_COL_W, minWidth: DEL_COL_W }} className="shrink-0" />
            )}
          </div>
        </div>

        {/* ── Virtual Scroll Body ── */}
        <div
          ref={parentRef}
          className="flex-1 overflow-auto"
          style={{ minWidth: TOTAL_WIDTH + CHECK_COL_W + DEL_COL_W }}
        >
          {processed.length === 0 ? (
            <div className="flex items-center justify-center h-40 text-sm text-muted-foreground">
              {search ? "검색 결과가 없습니다." : "데이터가 없습니다."}
            </div>
          ) : (
            <div style={{ height: totalVirtHeight, position: "relative" }}>
              {virtualItems.map((vi) => {
                const row        = processed[vi.index] as Invoice & Record<string, unknown>;
                const isSelected = selectedIds.has(row.id);

                return (
                  <div
                    key={row.id}
                    data-index={vi.index}
                    ref={virtualizer.measureElement}
                    style={{
                      position: "absolute",
                      top:       vi.start,
                      left:      0,
                      width:     "100%",
                      height:    ROW_HEIGHT,
                    }}
                    className={cn(
                      "flex items-center border-b group transition-colors",
                      isSelected ? "bg-primary/5 hover:bg-primary/10" : "hover:bg-muted/30"
                    )}
                  >
                    {/* 체크박스 */}
                    <div
                      style={{ width: CHECK_COL_W, minWidth: CHECK_COL_W }}
                      className="flex items-center justify-center px-2 shrink-0"
                    >
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => toggleRow(row.id)}
                        aria-label={`행 ${row.id} 선택`}
                      />
                    </div>

                    {/* 데이터 셀 */}
                    {COLUMN_DEFS.map((col) => (
                      <div
                        key={col.key}
                        style={{ width: col.width, minWidth: col.width }}
                        className="px-1 shrink-0 overflow-hidden"
                      >
                        {col.type === "project" ? (
                          <ProjectCell
                            projectId={row.project_id as number | null}
                            invoiceId={row.id}
                            budgets={budget as Budget[]}
                            onSelect={handleProjectSelect}
                          />
                        ) : (
                          <EditableCell
                            value={row[col.key] as string | number}
                            invoiceId={row.id}
                            col={col}
                            onCommit={handleCommit}
                          />
                        )}
                      </div>
                    ))}

                    {/* 삭제 버튼 */}
                    {allowDelete && (
                      <div
                        style={{ width: DEL_COL_W, minWidth: DEL_COL_W }}
                        className="flex items-center justify-center shrink-0"
                      >
                        <Button
                          size="icon" variant="ghost"
                          className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive"
                          onClick={() => handleDelete(row.id)}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Summary Bar */}
      <SelectionSummaryBar
        selectedRows={selectedRows}
        onClearSelection={() => setSelectedIds(new Set())}
      />
    </div>
  );
}
