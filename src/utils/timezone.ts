// Timezone utility functions for IST (UTC+5:30)

/**
 * Get current date in IST timezone
 * Returns a Date object representing the current time in IST
 */
export const getCurrentDateIST = (): Date => {
  // Simply return the current date - we'll handle IST formatting in display functions
  return new Date();
};

/**
 * Get current date string in IST (YYYY-MM-DD format)
 */
export const getCurrentDateStringIST = (): string => {
  const now = new Date();
  return now.toLocaleDateString('en-CA', {
    timeZone: 'Asia/Kolkata'
  });
};

/**
 * Get current time string in IST (HH:MM format)
 */
export const getCurrentTimeStringIST = (): string => {
  const now = new Date();
  return now.toLocaleTimeString('en-GB', {
    timeZone: 'Asia/Kolkata',
    hour12: false,
    hour: '2-digit',
    minute: '2-digit'
  });
};

/**
 * Get the first day of current month in IST
 */
export const getFirstDayOfCurrentMonthIST = (): Date => {
  const todayIST = getCurrentDateIST();
  return new Date(todayIST.getFullYear(), todayIST.getMonth(), 1);
};

/**
 * Convert a date to IST
 * Returns a Date object representing the given date/time in IST
 */
export const convertToIST = (date: Date): Date => {
  // Return the same date - formatting will handle timezone conversion
  return date;
};

/**
 * Get date range presets for IST timezone
 */
export const getDateRangePresets = () => {
  const today = new Date();

  return {
    today: {
      start: today,
      end: today
    },
    last7Days: {
      start: new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000),
      end: today
    },
    last30Days: {
      start: new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000),
      end: today
    },
    thisMonth: {
      start: getFirstDayOfCurrentMonthIST(),
      end: today
    }
  };
};

/**
 * Format date for display in IST
 */
export const formatDateIST = (date: Date, options?: Intl.DateTimeFormatOptions): string => {
  return date.toLocaleDateString('en-IN', {
    timeZone: 'Asia/Kolkata',
    ...options
  });
};

/**
 * Format datetime for display in IST
 */
export const formatDateTimeIST = (date: Date): string => {
  return date.toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
};