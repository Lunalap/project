/**
 * Budget 서비스 모듈 엔트리
 * 외부에서는 import { budgetService } from "@/services/budget" 형태로 사용합니다.
 */
import { budgetApi } from "./budget-api";

// 필요 시 여기에 데이터 가공 로직(Mappers)을 추가하여 확장할 수 있습니다.
export const budgetService = {
  ...budgetApi,
  
  /** * 추가적인 비즈니스 로직 예시: 
   * 서버 데이터를 UI에 맞게 가공하거나 공통 계산 로직이 필요한 경우 여기에 정의 
   */
  calculateTotalVariance(entries: any[]) {
    return entries.reduce((acc, cur) => acc + (cur.expected_amount - cur.actual_amount), 0);
  }
};

// 타입도 함께 내보내어 편의성 제공
export * from "./budget-api";