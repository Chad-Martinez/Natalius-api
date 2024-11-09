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
  week: PieDataSet[];
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
  label: string;
  shift?: number;
  misc?: number;
  equipment?: number;
  service?: number;
  type: string;
};

export type GraphSet = {
  week: GraphCurrentPeriod[];
  month: GraphCurrentPeriod[];
  quarter: GraphCurrentPeriod[];
  year: GraphCurrentPeriod[];
  defaultDataSet: string;
};
