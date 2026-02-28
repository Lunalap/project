export const NAV_ITEMS = [
  {
    title: "My Account",
    groups: [
      {
        label: "카드이용내역",
        items: [
          { name: "국내 이용내역", path: "/account/domestic" },
          { name: "해외 이용내역", path: "/account/overseas" },
          { name: "이용내역 요약", path: "/account/summary" },
        ],
      },
      {
        label: "결제",
        items: [
          { name: "자동결제", path: "/account/auto-payment" },
          { name: "즉시결제", path: "/account/instant-payment" },
          { name: "결제일변경", path: "/account/payment-date-change" },
        ],
      },
    ],
  },
  {
    title: "카드",
    groups: [
      { 
        label: "카드 찾기", 
        items: [
          { name: "나만의 카드 찾기", path: "/card/search" },
          { name: "모든 카드", path: "/card/all" },
          { name: "프리미엄 카드", path: "/card/premium" },
        ] 
      },
    ]
  },
  {
    title: "금융",
    groups: [
      { label: "대출", items: [        
        { name: "단기카드대출", path: "/finance/short-term-loan" },
        { name: "장기카드대출", path: "/finance/long-term-loan" },
      ]},
      { label: "케어", items: [
        { name: "신용케어", path: "/finance/credit-care" },
        { name: "금융사기예방", path: "/finance/fraud-prevention" },
      ]}, 
    ],
  },
];