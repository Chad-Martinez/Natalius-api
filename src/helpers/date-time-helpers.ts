import dayjs from 'dayjs';

export const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export const MONTHS_OF_YEAR = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export const getStartOfDay = () => new Date(dayjs.utc().startOf('day').format());

export const getStartOfWeek = (): Date => new Date(dayjs.utc().startOf('week').format());

export const getEndOfWeek = (): Date => new Date(dayjs.utc().add(1, 'week').startOf('week').format());

export const getStartOfMonth = (): Date => new Date(dayjs.utc().startOf('month').format());

export const getEndOfMonth = (): Date => new Date(dayjs.utc().add(1, 'month').startOf('month').format());

export const getStartOfQuarter = (): Date => new Date(dayjs.utc().startOf('quarter').format());

export const getEndOfQuarter = (): Date => new Date(dayjs.utc().add(1, 'quarter').startOf('quarter').format());

export const getStartOfYear = (): Date => new Date(dayjs.utc().startOf('year').format());

export const getEndOfYear = (): Date => new Date(dayjs.utc().add(1, 'year').startOf('year').format());

export const getQuarterMonths = () => MONTHS_OF_YEAR.slice((dayjs().quarter() - 1) * 3, (dayjs().quarter() - 1) * 3 + 3);
