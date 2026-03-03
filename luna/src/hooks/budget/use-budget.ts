import { useQuery } from "@tanstack/react-query";
import { budgetApi } from "@/services/budget/budget-api";

export const useBudget = (month: string) => {

  // 1. 데이터 가져오기 (Query)
  const budgetQuery = useQuery({
    queryKey: ["budgets", month],
    queryFn: () => budgetApi.getMonthlyList(month),
  });

  if (budgetQuery.isLoading) console.log('useBudget - Loading budgets...');

  return {
    budgets: budgetQuery.data ?? [],
    isLoading: budgetQuery.isLoading,
    isError: budgetQuery.isError,
  };
};