import { InvoiceEntry, InvoiceResponse } from "@/types/invoice";

const DEPARTMENTS = [
  { code: "246001", name: "공장관리팀" },
  { code: "246002", name: "생산1팀" },
  { code: "246003", name: "분석연구팀" },
  { code: "246004", name: "품질보증팀" },
  { code: "246005", name: "제조지원팀" },
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
export const generateMockInvoices = (count: number = 100): InvoiceEntry[] => {

  return Array.from({ length: count }).map((_, index) => {
    const id = (index + 1).toString();
    const dept = DEPARTMENTS[index % DEPARTMENTS.length];
    const cat = CATEGORIES[index % CATEGORIES.length];
    const charge = CHARGES[index % CHARGES.length];
    const purpose = PURPOSES[index % PURPOSES.length];
    const actual = Math.floor(Math.random() * 500) * 100000 + 10000;

    return {
      id,
      budget_category: cat.sub + "/" + cat.detail,
      department_name: dept.name,
      charge: charge,
      accouting_date: new Date(Date.now() - Math.floor(Math.random() * 200000000)).toISOString(),
      invoice_number: `${id.padStart(6, "0")}-EA`,
      invoice_line_number: Math.floor(Math.random() * 10).toString(),
      invoice_amount: actual,
      amount: actual,
      conversion_amount: 0,
      account: dept.name,
      actual_use: purpose,
      remark: purpose,
      account_code: `${dept.code}-${cat.main}-${cat.sub}`,
      account_category: cat.sub + "/" + cat.detail,
      proof: "증빙없음",
    };
  });
};

export const MOCK_INVOICE_ENTRIES = generateMockInvoices(100);

export const getMockInvoiceResponse = (month: string): InvoiceResponse => ({
  data: MOCK_INVOICE_ENTRIES,
  total_expected: 0,
  total_actual: 0,
  summary_month: month,
});