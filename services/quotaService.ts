
const QUOTA_KEY = 'jouda_daily_scan_quota_v1';
const MAX_DAILY_SCANS = 3; // Set the daily limit here

interface QuotaData {
  date: string;
  count: number;
}

const getTodayDate = (): string => {
  return new Date().toDateString();
};

const getQuotaData = (): QuotaData => {
  try {
    const saved = localStorage.getItem(QUOTA_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.error("Error reading quota", e);
  }
  return { date: getTodayDate(), count: 0 };
};

export const checkDailyQuota = (): boolean => {
  const data = getQuotaData();
  const today = getTodayDate();

  // Reset if new day
  if (data.date !== today) {
    return true;
  }

  return data.count < MAX_DAILY_SCANS;
};

export const incrementDailyQuota = (): void => {
  const data = getQuotaData();
  const today = getTodayDate();

  let newCount = 1;

  if (data.date === today) {
    newCount = data.count + 1;
  }

  try {
    localStorage.setItem(QUOTA_KEY, JSON.stringify({
      date: today,
      count: newCount
    }));
  } catch (e) {
    console.error("Error saving quota", e);
  }
};

export const getRemainingScans = (): number => {
  const data = getQuotaData();
  const today = getTodayDate();

  if (data.date !== today) {
    return MAX_DAILY_SCANS;
  }

  return Math.max(0, MAX_DAILY_SCANS - data.count);
};

export const getMaxScans = (): number => {
  return MAX_DAILY_SCANS;
};
