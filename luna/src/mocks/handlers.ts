import { http, HttpResponse, delay } from "msw";
import budget_data_mock from '@/mocks/data/budget.json'
import invoice_data_mock  from "@/mocks/data/invoice.json";

export const handlers = [
  // simulate budget lists
  http.get("**/api/budgets", ({ request }) => {
    const url = new URL(request.url);
    const month = url.searchParams.get("month") || "2026-02";   
    return HttpResponse.json(budget_data_mock);
  }),

  http.post("**/api/budgets", async ({ request }) => {
    const payload = await request.json();
    return HttpResponse.json({ ...payload, id: Date.now().toString() }, { status: 201 });
  }),

  // simulate invoice lists
  http.get("**/api/invoices", ({ request }) => {
    const url = new URL(request.url);
    const month = url.searchParams.get("month") || "2026-02";
    return HttpResponse.json(invoice_data_mock);
  }),

];