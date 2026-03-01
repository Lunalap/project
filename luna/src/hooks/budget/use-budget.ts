import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { budgetApi } from "@/services/budget/budget-api";
import { CreateBudgetRequest } from "@/types/budget";

export const useBudget = (month: string) => {
  const queryClient = useQueryClient();

  // 1. 데이터 가져오기 (Query)
  const budgetQuery = useQuery({
    queryKey: ["budgets", month],
    queryFn: () => budgetApi.getMonthlyList(month),
  });

  // 2. 데이터 등록하기 (Mutation)
  const createMutation = useMutation({
    mutationFn: (newEntry: CreateBudgetRequest) => budgetApi.createEntry(newEntry),
    onSuccess: () => {
      // 등록 성공 시 목록 쿼리를 무효화하여 다시 불러옴
      queryClient.invalidateQueries({ queryKey: ["budgets", month] });
    },
  });

  return {
    budgets: budgetQuery.data?.data ?? [],
    isLoading: budgetQuery.isLoading,
    isError: budgetQuery.isError,
    createBudget: createMutation.mutate,
    isCreating: createMutation.isPending,
  };
};