import { http, HttpResponse, delay } from "msw";
import { getMockBudgetResponse } from "./data/budget-mock";

export const handlers = [
  // 도메인과 포트를 포함한 전체 URL을 와일드카드로 잡아냅니다.
  http.get("**/api/budgets", ({ request }) => {
    const url = new URL(request.url);
    const month = url.searchParams.get("month") || "2026-02";
    
    return HttpResponse.json(getMockBudgetResponse(month));
  }),

  http.post("**/api/budgets", async ({ request }) => {
    const payload = await request.json();
    return HttpResponse.json({ ...payload, id: Date.now().toString() }, { status: 201 });
  }),
];