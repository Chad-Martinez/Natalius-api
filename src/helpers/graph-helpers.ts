import { MONTHS_OF_YEAR } from './date-time-helpers';

type WeekData = { income: number; year: number; week: number };
export type MappedData = { label: string; income: number };
type PeriodGraphData = {
  week: { label: string; income: number }[];
  month: { label: string; income: number }[];
  quarter: { label: string; income: number }[];
  year: { label: string; income: number }[];
};

const getISOWeekNumber = (date: Date): number => {
  const tempDate = new Date(date);
  tempDate.setHours(0, 0, 0, 0);
  tempDate.setDate(tempDate.getDate() + 3 - ((tempDate.getDay() + 6) % 7));

  const year = tempDate.getFullYear();
  const startOfYear = new Date(year, 0, 4);
  const diffInMs = tempDate.getTime() - startOfYear.getTime();
  const days = Math.floor(diffInMs / (24 * 60 * 60 * 1000));
  return Math.floor(days / 7) + 1;
};

export const getWeeksInMonth = (startOfMonth: Date, endOfMonth: Date, data: WeekData[]): MappedData[] => {
  const startWeek = getISOWeekNumber(startOfMonth);
  const endWeek = getISOWeekNumber(endOfMonth);

  const weeksRange =
    startWeek <= endWeek
      ? Array.from({ length: endWeek - startWeek + 1 }, (_, i) => startWeek + i)
      : [...Array.from({ length: 53 - startWeek }, (_, i) => startWeek + i), ...Array.from({ length: endWeek }, (_, i) => i + 1)];

  const mappedWeeks = weeksRange.map((absoluteWeek, index) => {
    const label = `Week ${index + 1}`;
    const weekData = data.find((d) => d.week === absoluteWeek) || { income: 0 };
    return { label, income: weekData.income };
  });

  return mappedWeeks;
};

export const fillMissingPeriods = (data: MappedData[], rangePeriod: string[]): MappedData[] => {
  const dataMap = new Map(data.map((item) => [item.label, item.income]));

  const filledData = rangePeriod.map((period) => ({
    label: period,
    income: dataMap.get(period) || 0,
  }));

  return filledData;
};

export const findFirstNonZeroIncomeProperty = (data: PeriodGraphData): string | null => {
  for (const key in data) {
    const array = data[key as keyof PeriodGraphData];

    for (const item of array) {
      if (item.income > 0) {
        return key;
      }
    }
  }
  return null;
};
