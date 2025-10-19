import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export class Utils {

  static formatCallDuration(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);

    if (mins > 0) {
      return `${mins}:${secs.toString().padStart(2, '0')} min`;
    } else {
      return `${secs} sec`;
    }
  }

  /**
   * Gets the user's current timezone identifier (e.g., "America/New_York", "Europe/London")
   */
  static getTimezone(): string {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  }

  /**
   * Gets the user's current timezone offset in minutes
   */
  static getTimezoneOffset(): number {
    return new Date().getTimezoneOffset();
  }

  /**
   * Converts a date to a timezone-adjusted date string (YYYY-MM-DD format)
   * This ensures the date is in the user's local timezone, not UTC
   */
  static toLocalDateString(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * Gets the start of day in local timezone (00:00:00)
   */
  static getStartOfDay(date: Date): Date {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    return startOfDay;
  }

  /**
   * Gets the end of day in local timezone (23:59:59)
   */
  static getEndOfDay(date: Date): Date {
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    return endOfDay;
  }

  /**
   * Adjusts a date based on timezone offset to get the correct local date
   */
  static adjustDateForTimezone(date: Date, timezoneOffset: number): Date {
    // Create a new date adjusted for timezone
    const adjustedDate = new Date(date.getTime() - (timezoneOffset * 60 * 1000));
    return adjustedDate;
  }

  /**
   * Calculates date range with proper timezone offset handling
   * Returns dates in YYYY-MM-DD format adjusted for user's timezone
   */
  static calculateDateRange(duration: 'day' | 'week' | 'month' | 'all'): { 
    startDate?: string; 
    endDate?: string;
  } {
    const timezoneOffset = this.getTimezoneOffset();
    
    // Get current date and adjust for timezone
    const now = new Date();
    const adjustedNow = this.adjustDateForTimezone(now, timezoneOffset);
    const todayStr = this.toLocalDateString(adjustedNow);

    switch (duration) {
      case 'day':
        // Yesterday: 24 hours ago, adjusted for timezone
        const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        const adjustedYesterday = this.adjustDateForTimezone(yesterday, timezoneOffset);
        return {
          startDate: this.toLocalDateString(adjustedYesterday),
          endDate: todayStr
        };
      case 'week':
        // 6 days ago, adjusted for timezone
        const sixDaysAgo = new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000);
        const adjustedSixDaysAgo = this.adjustDateForTimezone(sixDaysAgo, timezoneOffset);
        return {
          startDate: this.toLocalDateString(adjustedSixDaysAgo),
          endDate: todayStr
        };
      case 'month':
        // 30 days ago, adjusted for timezone
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        const adjustedThirtyDaysAgo = this.adjustDateForTimezone(thirtyDaysAgo, timezoneOffset);
        return {
          startDate: this.toLocalDateString(adjustedThirtyDaysAgo),
          endDate: todayStr
        };
      case 'all':
        return {
          startDate: undefined,
          endDate: todayStr
        };
      default:
        const defaultYesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        const adjustedDefaultYesterday = this.adjustDateForTimezone(defaultYesterday, timezoneOffset);
        return {
          startDate: this.toLocalDateString(adjustedDefaultYesterday),
          endDate: todayStr
        };
    }
  }

  /**
   * Calculates date range with explicit timezone offset
   * Useful when you need to pass the timezone offset to the backend
   */
  static calculateDateRangeWithOffset(duration: 'day' | 'week' | 'month' | 'all'): { 
    startDate?: string; 
    endDate?: string;
    timezoneOffset: number;
  } {
    const timezoneOffset = this.getTimezoneOffset();
    const dateRange = this.calculateDateRange(duration);
    
    return {
      ...dateRange,
      timezoneOffset
    };
  }
}