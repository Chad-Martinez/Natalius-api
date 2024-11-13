import dayjs from 'dayjs';

export const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export const MONTHS_OF_YEAR = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export const getStartOfDay = () => new Date(dayjs.utc().startOf('day').format());

// export const getStartOfWeek = (): Date => {
//   const now = new Date();

//   return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - now.getUTCDay()));
// };

export const getStartOfWeek = (): Date => new Date(dayjs.utc().startOf('week').format());

// export const getEndOfWeek = (): Date => {
//   const now = new Date();

//   return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + (6 - now.getUTCDay()), 23, 59, 59, 999));
// };

export const getEndOfWeek = (): Date => new Date(dayjs.utc().add(1, 'week').startOf('week').format());

// export const getStartOfMonth = (): Date => {
//   const now = new Date();
//   return new Date(now.getFullYear(), now.getMonth(), 1);
// };

export const getStartOfMonth = (): Date => new Date(dayjs.utc().startOf('month').format());

// export const getEndOfMonth = (): Date => {
//   const now = new Date();
//   return new Date(now.getFullYear(), now.getMonth() + 1, 0);
// };

export const getEndOfMonth = (): Date => new Date(dayjs.utc().add(1, 'month').startOf('month').format());

// export const getStartOfQuarter = (): Date => {
//   const now = new Date();
//   const currentYear = now.getFullYear();
//   return new Date(currentYear, Math.floor(now.getMonth() / 3) * 3, 1);
// };

export const getStartOfQuarter = (): Date => new Date(dayjs.utc().startOf('quarter').format());

// export const getEndOfQuarter = (): Date => {
//   const startOfQuarter = getStartOfQuarter();
//   return new Date(startOfQuarter.getFullYear(), startOfQuarter.getMonth() + 3, 0);
// };

export const getEndOfQuarter = (): Date => new Date(dayjs.utc().add(1, 'quarter').startOf('quarter').format());

// export const getStartOfYear = (): Date => {
//   const now = new Date();
//   const currentYear = now.getFullYear();
//   return new Date(currentYear, 0, 1);
// };

export const getStartOfYear = (): Date => new Date(dayjs.utc().startOf('year').format());

// export const getEndOfYear = (): Date => {
//   const now = new Date();
//   const currentYear = now.getFullYear();
//   return new Date(currentYear + 1, 0, 1);
// };

export const getEndOfYear = (): Date => new Date(dayjs.utc().add(1, 'year').startOf('year').format());
