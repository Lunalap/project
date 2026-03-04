import { useQuery } from "@tanstack/react-query";
import { invoiceApi } from "@/services/invoice/invoice-api";
import type { InvoiceEntry } from "@/types/invoice";

interface UseInvoiceReturn {
  invoices: InvoiceEntry[];
  isLoading: boolean;
  isError: boolean;
}

export const useInvoice = (month: string): UseInvoiceReturn => {

  const invoiceQuery = useQuery({
    queryKey: ["invoices", month],
    queryFn: () => invoiceApi.getMonthlyList(month),
  });

  if (invoiceQuery.isLoading) console.log('useInvoice - Loading invoices...');

  return {
    invoices: (invoiceQuery.data as unknown as InvoiceEntry[]) ?? [],
    isLoading: invoiceQuery.isLoading,
    isError: invoiceQuery.isError,
  };
};