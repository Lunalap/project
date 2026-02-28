export default function HomePage() {
  return (
    <main className="flex-1">
      {/* 히어로 섹션 예시 */}
      <section className="w-full h-[500px] bg-neutral-900 dark:bg-black flex items-center justify-center text-white">
        <div className="container px-4 text-center">
          <h1 className="text-5xl font-bold mb-6 tracking-tight">
            Design for Your Lifestyle
          </h1>
          <p className="text-xl text-neutral-400">
            당신의 일상에 특별함을 더하는 현대카드
          </p>
        </div>
      </section>

      {/* 카드 그리드 섹션 예시 */}
      <section className="container mx-auto py-20 px-4">
        <h2 className="text-2xl font-bold mb-10">인기 카드 리스트</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[1, 2, 3].map((i) => (
            <div key={i} className="aspect-[3/2] bg-gray-100 rounded-xl border p-8 hover:shadow-md transition-shadow">
              <div className="w-12 h-20 bg-black rounded-sm mb-4" />
              <p className="font-bold">Hyundai Card M{i}</p>
              <p className="text-sm text-gray-500">포인트 적립의 끝판왕</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}