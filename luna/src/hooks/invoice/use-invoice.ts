import type { InvoiceResponse } from "@/types/invoice";
import { useQuery } from "@tanstack/react-query";
import { invoiceApi } from "@/services/invoice/invoice-api";

export const useInvoice = (month: string) => {

  // 1. 데이터 가져오기 (Query)
  const invoiceQuery = useQuery({
    queryKey: ["invoices", month],
    queryFn: () => invoiceApi.getMonthlyList(month),
  });

  if (invoiceQuery.isLoading) console.log('useInvoice - Loading invoices...');

  return {
    invoices: invoiceQuery.data ?? [],
    isLoading: invoiceQuery.isLoading,
    isError: invoiceQuery.isError,
  };
};