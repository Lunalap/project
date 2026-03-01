export default function HomePage() {
  return (
    <main className="flex-1">
      {/* 히어로 섹션 예시 */}
      <section className="w-full h-[500px] bg-neutral-900 dark:bg-black flex items-center justify-center text-white">
        <div className="container px-4 text-center">
          <h1 className="text-5xl font-bold mb-6 tracking-tight">
            Design for Your Budgeting
          </h1>
          <p className="text-xl text-neutral-400">
            데이터 기반 예산관리 솔루션
          </p>
        </div>
      </section>

      {/* 카드 그리드 섹션 예시 */}
      <section className="container mx-auto py-20 px-4">
        <h2 className="text-2xl font-bold mb-10">자주 찾는 업무</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[1, 2, 3].map((i) => (
            <div key={i} className="aspect-[3/2] bg-gray-100 rounded-xl border p-8 hover:shadow-md transition-shadow">
              <div className="w-12 h-20 bg-black rounded-sm mb-4" />
              <p className="font-bold">실행예산 등록{i}</p>
              <p className="text-sm text-gray-500">익월 실행예산 산정</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}