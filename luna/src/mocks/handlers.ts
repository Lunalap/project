import { http, HttpResponse, delay } from "msw";
import { getMockBudgetResponse } from "./data/budget-mock";
import { getMockInvoiceResponse } from "./data/invoice-mock";

export const handlers = [
  // simulate budget lists
  http.get("**/api/budgets", ({ request }) => {
    const url = new URL(request.url);
    const month = url.searchParams.get("month") || "2026-02";
    
    return HttpResponse.json(getMockBudgetResponse(month));
  }),

  http.post("**/api/budgets", async ({ request }) => {
    const payload = await request.json();
    return HttpResponse.json({ ...payload, id: Date.now().toString() }, { status: 201 });
  }),


  // simulate invoice lists
  http.get("**/api/invoices", ({ request }) => {
    const url = new URL(request.url);
    const month = url.searchParams.get("month") || "2026-02";
    
    return HttpResponse.json(getMockInvoiceResponse(month));
  }),

];