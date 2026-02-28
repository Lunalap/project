import { lazy } from "react";
import { NAV_ITEMS } from "@/constants/menu-data";
import { Skeleton } from "@/components/ui/skeleton";

// 개별 페이지들을 lazy 로딩합니다.
const AllCards = lazy(() => import("@/pages/card/all-cards"));
const CardSearch = lazy(() => import("@/pages/card/search"));
const DefaultPage = lazy(() => import("@/pages/home-page"));

// [핵심] 경로(path)를 키값으로 하는 컴포넌트 매핑 테이블
const PAGE_COMPONENTS: Record<string, React.ComponentType<React.PropsWithChildren<unknown>>> = {
  "/card/search": CardSearch,
  "/card/all": AllCards,
  // 여기에 정의되지 않은 경로는 DefaultPage를 보여주게 설정할 수 있습니다.
};

const dynamicRoutes = NAV_ITEMS.flatMap((menu) =>
  menu.groups.flatMap((group) =>
    group.items.map((item) => {
      // 매핑 테이블에 해당 경로의 컴포넌트가 있는지 확인
      const Component = PAGE_COMPONENTS[item.path] || DefaultPage;
      
      return {
        path: item.path,
        element: <Component />,
      };
    })
  )
);

export const APP_ROUTES = [
  { path: "/", element: <DefaultPage /> },
  ...dynamicRoutes,
  { path: "*", element: <DefaultPage /> }, // 404 페이지 처리
  { path: "test/skeleton", element: <Skeleton /> }, // 테스트용 라우트
];