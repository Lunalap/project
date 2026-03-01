/** budget entry interface */
export interface BudgetEntry {
  id: string;                  // unique ID
  month: string;               // "2026-03"
  department_code: string;     // department code
  department_name: string;     // department name
  charge: string;              // person in charge
  main_category_code: string;  // category code
  main_category_name: string;  // category name
  sub_category_code: string;   // sub category code
  sub_category_name: string;   // sub category name
  detail_category_code: string;// detail category code
  detail_category_name: string;// detail category name
  tag: string[];               // tags for filtering/searching
  purpose: string;             // budget purpose/justification
  expected_amount: number;     // expected budget amount
  actual_amount: number;       // actual spent amount
  variance_amount: number;     // variance (expected - actual)
  variance_reason: string | null; // variance reason (if any)
  updated_at: string;          // update timestamp
}

/** API response interface */
export interface BudgetResponse {
  data: BudgetEntry[];
  total_expected: number;
  total_actual: number;
  summary_month: string;
}