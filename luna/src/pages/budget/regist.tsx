import React from "react";
import { useBudget } from "@/hooks/budget/use-budget";
import { columns } from "./colums";
import { DataTable } from "./data-table";

const BudgetRegistrationPage: React.FC = () => {

  const { budgets, isLoading } = useBudget("2026-02");

  if (isLoading) return <div className="p-10 text-center">Loading...</div>;

  return (
    <div className="container mx-auto py-10">
      <DataTable columns={columns} data={budgets} />
    </div>
  );
};

export default BudgetRegistrationPage;