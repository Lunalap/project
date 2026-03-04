import { useQuery } from "@tanstack/react-query";
import { budgetApi } from "@/services/budget/budget-api";
import type { BudgetEntry } from "@/types/budget";

interface UseBudgetReturn {
  budgets: BudgetEntry[];
  isLoading: boolean;
  isError: boolean;
  dataUpdatedAt: number;
}

export const useBudget = (month: string): UseBudgetReturn => {
  // fetch query
  const budgetQuery = useQuery({
    queryKey: ["budgets", month],
    queryFn: () => budgetApi.getMonthlyList(month),
    select: (response: any) => response.data || response,
  });
  
  return {
    budgets: budgetQuery.data ?? [],
    isLoading: budgetQuery.isLoading,
    isError: budgetQuery.isError,
    dataUpdatedAt: budgetQuery.dataUpdatedAt,
  };
};