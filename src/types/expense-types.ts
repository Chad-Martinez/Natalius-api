export type ExpensesByTypeAndPeriod = {
  year: number;
  month: number;
  day?: number;
  type: string;
  totalAmount: number;
};
