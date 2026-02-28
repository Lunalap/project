// src/components/ui/skeleton.tsx
import { cn } from "@/lib/utils";

export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "min-h-[80vh]",
        "rounded-md",
        // 1. 배경색을 더 명확하게 조절 (대비 증가)
        "bg-zinc-200 dark:bg-zinc-700",
        // 2. 애니메이션 속도와 투명도 변화 폭을 크게 설정
        "animate-[pulse_1.5s_cubic-bezier(0.4,0,0.6,1)_infinite]",
        className
      )}
      {...props}
    />
  );
}