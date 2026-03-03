import React from "react";
import { useBudget } from "@/hooks/budget/use-budget";
import { columns } from "./colums";
import { DataTable } from "./data-table";
import { Skeleton } from "@/components/ui/skeleton"

const BudgetRegistrationPage: React.FC = () => {

  const { budgets, isLoading } = useBudget("2026-02");

  if (isLoading) return (
    <div className="flex w-full flex-col gap-2 p-10">
      {Array.from({ length: 5 }).map((_, index) => (
        <div className="flex gap-4" key={index}>
          <Skeleton className="h-4 flex-1" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-20" />
        </div>
      ))}
    </div>
  )

  return (
    <div className="container mx-auto py-10">
      <h4 className="text-2xl font-bold mb-6">예산등록</h4>
      <DataTable columns={columns} data={budgets} />
    </div>
  );
};

export default BudgetRegistrationPage;