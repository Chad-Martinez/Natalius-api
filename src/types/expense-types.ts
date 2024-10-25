export type ExpensesByTypeAndPeriod = {
  year: number;
  month: number;
  day?: number;
  type: string;
  totalAmount: number;
};

type PieDataSet = {
  count: number;
  label: string;
  value: number;
};

export type PieData = {
  month: PieDataSet[];
  quarter: PieDataSet[];
  year: PieDataSet[];
  defaultDataSet: string;
};

export type GraphType = {
  type: string;
  totalExpense: number;
};

export type GraphCurrentPeriod = {
  month: string;
  types: GraphType[];
};

export type GraphSet = {
  weeklyExpenseCurrentMonth: GraphCurrentPeriod[];
  monthlyExpenseCurrentQuarter: GraphCurrentPeriod[];
  monthlyExpenseCurrentYear: GraphCurrentPeriod[];
};
