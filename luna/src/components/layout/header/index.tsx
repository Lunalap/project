import React from "react";
import { NAV_ITEMS } from "@/constants/menu-data";
import { cn } from "@/lib/utils";
import { ModeToggle } from "@/components/mode-toggle";
import { Link } from "react-router-dom";
import Logo from "@/assets/logo.svg?react";

interface HeaderProps {
  activeMenu: string | null;
  setActiveMenu: (menu: string | null) => void;
}

// src/components/layout/header/index.tsx
export function Header({ activeMenu, setActiveMenu }: HeaderProps) {
  return (
    <header
      className="fixed top-0 left-0 w-full z-50 bg-white dark:bg-zinc-950/90 border-b border-gray-200 dark:border-zinc-800 transition-colors duration-300"
      onMouseLeave={() => setActiveMenu(null)}
    >
      <div className="container mx-auto flex h-20 items-center px-6 justify-between">
        <div className="flex items-center">
          <Link 
            to={"/"} // 데이터에 정의된 경로 사용
            //className="text-[14px] text-zinc-500 hover:text-black dark:hover:text-white transition-colors block"
            onClick={() => setActiveMenu(null)}
          >
            <Logo width="30" height="30" />
          </Link>           
          <nav className="hidden md:flex h-20"> {/* 헤더와 동일한 높이 고정 */}
            {NAV_ITEMS.map((item) => {
              const isActive = activeMenu === item.title;
              return (
                <div
                  key={item.title}
                  className={cn(
                    // 1. h-full을 통해 박스가 헤더 바닥까지 닿게 함
                    "group relative flex items-center px-6 h-full cursor-pointer transition-colors duration-200",
                    "text-black dark:text-white font-bold text-[16px]"
                  )}
                  onMouseEnter={() => setActiveMenu(item.title)}
                >
                  {/* 메뉴 텍스트 */}
                  <span>{item.title}</span>

                  {/* ---------------------------------------------------------
                      하단 강조 라인 (헤더 보더와 일치하는 위치)
                  --------------------------------------------------------- */}
                  <span 
                    className={cn(
                      // absolute bottom-0: 부모(h-full)의 가장 바닥에 붙음
                      // h-[2px]: 보더보다 약간 두껍게 설정하여 확실히 덮음
                      "absolute bottom-0 left-0 w-full h-[2px] bg-black dark:bg-white transition-all duration-300 ease-in-out",
                      // z-10: 헤더의 기본 border-b 보다 위에 렌더링되도록 함
                      "z-10",
                      // 노출 로직: 활성 상태이거나 호버 시에만 보임
                      isActive || activeMenu === null 
                        ? (isActive ? "opacity-100 scale-x-100" : "opacity-0 scale-x-0 group-hover:opacity-100 group-hover:scale-x-100")
                        : "opacity-0 scale-x-0" 
                    )}
                  />
                </div>
              );
            })}
          </nav>
        </div>
        
        <div className="flex items-center gap-4">
          <ModeToggle />
        </div>
      </div>

      {/* 드롭다운 오버레이 */}
      <div
        className={cn(
          "absolute left-0 w-full bg-white dark:bg-zinc-900 border-t border-b border-gray-100 dark:border-zinc-800 shadow-2xl transition-all duration-300",
          activeMenu ? "max-h-[600px] opacity-100" : "max-h-0 opacity-0 pointer-events-none"
        )}
      >
        {/* 드롭다운 오버레이 내부 */}
        <div className="container mx-auto py-12 px-6">
          {NAV_ITEMS.map((item) => (
            <div 
              key={item.title}
              className={cn(
                "flex justify-between transition-opacity duration-300 min-h-[350px]", // flex로 변경
                activeMenu === item.title ? "opacity-100 flex" : "opacity-0 hidden"
              )}
            >
              {/* ---------------------------------------------------------
                  1. 좌측 메뉴 영역 (유동적 너비)
              --------------------------------------------------------- */}
              <div className="flex-1 grid grid-cols-3 gap-12 pr-20"> 
                {/* pr-20으로 프로모션 영역과의 간격을 넉넉히 확보 */}
                {item.groups.map((group) => (
                  <div key={group.label} className="space-y-6">
                    <h4 className="text-[15px] font-black text-black dark:text-white border-b border-gray-100 dark:border-zinc-800 pb-4 tracking-tighter uppercase">
                      {group.label}
                    </h4>
                      <ul className="space-y-3">
                        {group.items.map((subItem) => (
                          <li key={subItem.name}> {/* subItem.name 사용 */}
                            <Link 
                              to={subItem.path} // 데이터에 정의된 경로 사용
                              className="text-[14px] text-zinc-500 hover:text-black dark:hover:text-white transition-colors block"
                              onClick={() => setActiveMenu(null)}
                            >
                              {subItem.name}
                            </Link>
                          </li>
                        ))}
                      </ul>
                  </div>
                ))}
              </div>

              {/* ---------------------------------------------------------
                  2. 우측 프로모션 영역 (너비 완전 고정)
                  w-[300px]와 shrink-0을 사용하여 왼쪽 내용에 절대 영향을 받지 않음
              --------------------------------------------------------- */}
              <div className="w-[300px] shrink-0 border-l border-gray-100 dark:border-zinc-800 pl-12 flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="inline-block bg-black dark:bg-white text-white dark:text-black text-[10px] font-bold px-2 py-0.5 tracking-widest uppercase">
                    Featured
                  </div>
                  <div>
                    <h5 className="text-[18px] font-black text-black dark:text-white leading-tight tracking-tighter">
                      {item.title} 추천 혜택
                    </h5>
                    <p className="mt-2 text-[13px] text-zinc-500 dark:text-zinc-400 leading-relaxed">
                      현대카드가 제안하는<br />특별한 서비스를 만나보세요.
                    </p>
                  </div>
                </div>

                {/* 프로모션 카드 */}
                <div className="group relative mt-auto cursor-pointer">
                  <div className="aspect-[1.5/1] bg-zinc-100 dark:bg-zinc-800 rounded-sm overflow-hidden border border-gray-200 dark:border-zinc-700 flex items-center justify-center transition-transform duration-300 group-hover:scale-[1.02]">
                    <span className="text-[11px] text-zinc-400 font-bold tracking-widest uppercase">Promotion Card</span>
                  </div>
                  <div className="mt-4 flex items-center gap-2 text-[12px] font-bold text-black dark:text-white">
                    자세히 보기 
                    <span className="text-[14px] transition-transform group-hover:translate-x-1">→</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </header>
  );
}