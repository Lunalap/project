import { BudgetEntry, BudgetResponse } from "@/types/budget";

const DEPARTMENTS = [
  { code: "246001", name: "인사총무팀" },
  { code: "246002", name: "IT지원팀" },
  { code: "246003", name: "마케팅팀" },
  { code: "246004", name: "영업지원팀" },
  { code: "246005", name: "재무회계팀" },
];

const CHARGES = ["김환인", "이혁수", "곽다솜", "김철수", "박지민", "최유리", "정태양"];

const CATEGORIES = [
  { main: "기본자산", sub: "임차보증금", detail: "임차보증금", tags: ["임차보증금", "환인빌딩"] },
  { main: "기본자산", sub: "대여금 지급", detail: "종업원대여금 지급", tags: ["대여금"] },
  { main: "판매관리비", sub: "임차료", detail: "사무실임차료", tags: ["임차료", "고정비"] },
  { main: "판매관리비", sub: "소모품비", detail: "사무용품", tags: ["소모품", "비품"] },
  { main: "판매관리비", sub: "통신비", detail: "전화요금", tags: ["통신비", "SKT"] },
  { main: "복리후생비", sub: "식대", detail: "중식대", tags: ["식비", "복지"] },
  { main: "교육훈련비", sub: "도서구입비", detail: "기술서적", tags: ["자기개발", "도서"] },
];

const PURPOSES = [
  "사무실 임대료 납부",
  "신규 입사자 PC 구매",
  "클라우드 서버 구독료",
  "직원 종합검진 비용",
  "분기별 광고 집행비",
  "워크샵 장소 대여료",
  "소모품 정기 구매",
  "외부 강사 초빙 강연료",
  "사내 동호회 지원금",
  "팀별 회식 지원비",
];

// 100개의 데이터를 생성하는 함수
export const generateMockBudgets = (count: number = 100): BudgetEntry[] => {
  return Array.from({ length: count }).map((_, index) => {
    const id = (index + 1).toString();
    const dept = DEPARTMENTS[index % DEPARTMENTS.length];
    const cat = CATEGORIES[index % CATEGORIES.length];
    const charge = CHARGES[index % CHARGES.length];
    const purpose = PURPOSES[index % PURPOSES.length];
    
    // 금액 로직: 10만 원 ~ 5억 원 사이 랜덤
    const expected = Math.floor(Math.random() * 500) * 1000000 + 100000;
    // 실제 집행액은 예산의 90% ~ 110% 사이로 설정
    const actual = Math.floor(expected * (0.9 + Math.random() * 0.2));
    const variance = expected - actual;
    const update_at = new Date(Date.now() - Math.floor(Math.random() * 200000000)).toISOString();

    return {
      id,
      month: "2026-02",
      department_code: dept.code,
      department_name: dept.name,
      charge,
      main_category_code: (100000 + index).toString(),
      main_category_name: cat.main,
      sub_category_code: (102000 + index).toString(),
      sub_category_name: cat.sub,
      detail_category_code: (102001 + index).toString(),
      detail_category_name: cat.detail,
      tag: cat.tags,
      purpose,
      expected_amount: expected,
      actual_amount: actual,
      variance_amount: variance,
      variance_reason: variance > 1000000 || variance < -1000000 ? `${purpose} 예산 추정차액` : "",
      updated_at: update_at,
    };
  });
};

export const MOCK_BUDGET_ENTRIES = generateMockBudgets(100);

export const getMockBudgetResponse = (month: string): BudgetResponse => ({
  data: MOCK_BUDGET_ENTRIES.filter((item) => item.month === month),
  total_expected: 322972275,
  total_actual: 0,
  summary_month: month,
});