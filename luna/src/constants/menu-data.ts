export const NAV_ITEMS = [
  {
    title: "예산관리",
    groups: [
      {
        label: "실행예산",
        items: [
          { name: "예산등록", path: "/budget/regist" },
          { name: "예산집행내역", path: "/budget/execution" },
        ],
      },
      {
        label: "차이분석",
        items: [
          { name: "예산차이분석", path: "/budget/variance" },
          { name: "전표내역", path: "/budget/invoice" },
        ],
      },
    ],
  },
  {
    title: "현금사용",
    groups: [
      { 
        label: "사용계획", 
        items: [
          { name: "현금사용계획", path: "/cash/usage-plan" },
        ] 
      },
    ]
  },
  {
    title: "항목설정",
    groups: [
      { 
        label: "", 
        items: [
          { name: "예산항목", path: "/settings/budget" },
          { name: "사용자관리", path: "/settings/users" },
        ] 
      },
    ]
  },
];