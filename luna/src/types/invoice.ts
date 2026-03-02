/** invoice entry interface */
export interface InvoiceEntry {
  id: string;                  // unique ID
  budget_category: string;     // budget category
  department_name: string;      // department name
  charge: string;              // person in charge
  accouting_date: string;      // accounting date
  invoice_number: string;      // invoice number
  invoice_line_number: string; // invoice line number
  invoice_amount: number;      // invoice amount
  amount: number;              // amount to be processed
  conversion_amount: number;   // amount converted to KRW
  account: string;             // account name
  actual_use: string;          // actual use description
  remark: string;              // additional remarks
  account_code: string;        // account code
  account_category: string;    // account category
  proof: string;               // proof of expense (e.g. receipt URL)
}

/** API response interface */
export interface InvoiceResponse {
  data: InvoiceEntry[];
  total_expected: number;
  total_actual: number;
  summary_month: string;
}