import { lazy } from "react";
import { NAV_ITEMS } from "@/constants/menu-data";

// 개별 페이지들을 lazy 로딩
const HomePage = lazy(() => import("@/pages/home-page"));
const BudgetRegist = lazy(() => import("@/pages/budget/regist"));
const InvoiceList = lazy(() => import("@/pages/invoice/invoice-list"));
const CashList = lazy(() => import("@/pages/cashflow/cash-list"));
const Tanstack = lazy(() => import("@/pages/tanstack/main"));
const SpreadsheetPage = lazy(() => import("@/pages/features/spread/sheetpage"));

// 컴포넌트 매핑 테이블
const PAGE_COMPONENTS: Record<string, React.ComponentType<React.PropsWithChildren<unknown>>> = {
  "/": HomePage,
  "/budget/regist": BudgetRegist,
  "/invoice/list": InvoiceList,
  "/cash/list": CashList,
  "/tanstack/list": Tanstack,
  "/features/sheetpage": SpreadsheetPage,
};

const dynamicRoutes = NAV_ITEMS.flatMap((menu) =>
  menu.groups.flatMap((group) =>
    group.items.map((item) => {
      const Component = PAGE_COMPONENTS[item.path] || HomePage; // 매핑된 컴포넌트가 없으면 HomePage로 대체
      
      return {
        path: item.path,
        element: <Component />,
      };
    })
  )
);

export const APP_ROUTES = [
  { path: "/", element: <HomePage /> },
  ...dynamicRoutes,
  { path: "*", element: <HomePage /> },
];