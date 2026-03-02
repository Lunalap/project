import React from "react";
import { useInvoice } from "@/hooks/invoice/use-invoice";
import { columns } from "./colums";
import { DataTable } from "./data-table";

const InvoiceListPage: React.FC = () => {

  const { invoices, isLoading } = useInvoice("2026-02");

  if (isLoading) return <div className="p-10 text-center">Loading...</div>;

  return (
    <div className="container mx-auto py-10">
      <h4 className="text-2xl font-bold mb-6">전표내역</h4>
      <DataTable columns={columns} data={invoices} />
    </div>
  );
};

export default InvoiceListPage;