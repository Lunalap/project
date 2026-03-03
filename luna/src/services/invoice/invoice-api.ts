import apiClient from "../api-client";
import type { InvoiceEntry, InvoiceResponse } from "@/types/invoice";

export const invoiceApi = {
  // get list of budgets for a specific month
  getMonthlyList: async (month: string): Promise<InvoiceResponse> => {
    const { data } = await apiClient.get<InvoiceResponse>("/invoices", {
      params: { month }
    });
    if (!data) throw new Error("No data received from API");
    return data;
  },
};