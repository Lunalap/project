import apiClient from "../api-client";
import type { BudgetEntry, BudgetResponse, CreateBudgetRequest } from "@/types/budget";

export const budgetApi = {
  // get list of budgets for a specific month
  getMonthlyList: async (month: string): Promise<BudgetResponse> => {
    const { data } = await apiClient.get<BudgetResponse>("/budgets", {
      params: { month },
    });
    if (!data) throw new Error("No data received from API");
    return data;
  },

  // create a new budget entry
  createEntry: async (payload: CreateBudgetRequest): Promise<BudgetEntry> => {
    const { data } = await apiClient.post<BudgetEntry>("/budgets", payload);
    return data;
  }
};