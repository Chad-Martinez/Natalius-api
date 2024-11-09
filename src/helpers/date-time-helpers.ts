export const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export const MONTHS_OF_YEAR = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export const getStartOfWeek = (): Date => {
  const now = new Date();

  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - now.getUTCDay()));
};

export const getEndOfWeek = (): Date => {
  const now = new Date();

  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + (6 - now.getUTCDay()), 23, 59, 59, 999));
};

export const getStartOfYear = (): Date => {
  const now = new Date();
  const currentYear = now.getFullYear();
  return new Date(currentYear, 0, 1);
};

export const getEndOfYear = (): Date => {
  const now = new Date();
  const currentYear = now.getFullYear();
  return new Date(currentYear + 1, 0, 1);
};

export const getStartOfMonth = (): Date => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1);
};

export const getEndOfMonth = (): Date => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth() + 1, 0);
};

export const getStartOfQuarter = (): Date => {
  const now = new Date();
  const currentYear = now.getFullYear();
  return new Date(currentYear, Math.floor(now.getMonth() / 3) * 3, 1);
};

export const getEndOfQuarter = (): Date => {
  const startOfQuarter = getStartOfQuarter();
  return new Date(startOfQuarter.getFullYear(), startOfQuarter.getMonth() + 3, 0);
};
