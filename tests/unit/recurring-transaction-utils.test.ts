import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { calculateNextRunAt } from '@/lib/recurring-transaction-utils';
import { addDays, addMonths, addWeeks, addYears, format } from 'date-fns';

describe('calculateNextRunAt', () => {
  // Use a fixed date for testing - we set it to start of day to avoid timezone issues
  const mockNow = new Date(2024, 5, 15, 0, 0, 0, 0); // June 15, 2024 (Saturday) - local time

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(mockNow);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // Helper to format date for comparison
  const formatDate = (date: Date) => format(date, 'yyyy-MM-dd');

  describe('DAILY frequency', () => {
    it('should return tomorrow when no lastRunAt provided and startDate is today', () => {
      // Arrange
      const startDate = new Date(2024, 5, 15); // June 15, 2024

      // Act
      const result = calculateNextRunAt('DAILY', startDate, null);

      // Assert
      expect(formatDate(result)).toBe(formatDate(addDays(mockNow, 1)));
    });

    it('should return tomorrow when no lastRunAt and startDate is in the past', () => {
      // Arrange
      const startDate = new Date(2024, 5, 1); // June 1, 2024

      // Act
      const result = calculateNextRunAt('DAILY', startDate, null);

      // Assert
      expect(formatDate(result)).toBe(formatDate(addDays(mockNow, 1)));
    });

    it('should return startDate when it is in the future', () => {
      // Arrange
      const startDate = new Date(2024, 5, 20); // June 20, 2024 - 5 days in future

      // Act
      const result = calculateNextRunAt('DAILY', startDate, null);

      // Assert
      expect(formatDate(result)).toBe('2024-06-20');
    });

    it('should return day after lastRunAt when lastRunAt provided', () => {
      // Arrange
      const startDate = new Date(2024, 5, 1);
      const lastRunAt = new Date(2024, 5, 14); // June 14, 2024

      // Act
      const result = calculateNextRunAt('DAILY', startDate, lastRunAt);

      // Assert
      expect(formatDate(result)).toBe('2024-06-15');
    });
  });

  describe('WEEKLY frequency', () => {
    it('should return next week when no lastRunAt and startDate is today or past', () => {
      // Arrange
      const startDate = new Date(2024, 5, 15);

      // Act
      const result = calculateNextRunAt('WEEKLY', startDate, null);

      // Assert
      expect(formatDate(result)).toBe(formatDate(addWeeks(mockNow, 1)));
    });

    it('should return startDate when it is in the future', () => {
      // Arrange
      const startDate = new Date(2024, 5, 25); // June 25, 2024

      // Act
      const result = calculateNextRunAt('WEEKLY', startDate, null);

      // Assert
      expect(formatDate(result)).toBe('2024-06-25');
    });

    it('should return week after lastRunAt when lastRunAt provided', () => {
      // Arrange
      const startDate = new Date(2024, 5, 1);
      const lastRunAt = new Date(2024, 5, 8); // June 8, 2024

      // Act
      const result = calculateNextRunAt('WEEKLY', startDate, lastRunAt);

      // Assert
      expect(formatDate(result)).toBe('2024-06-15');
    });

    it('should respect cycleDayOfWeek when provided (Monday = 1)', () => {
      // Arrange
      const startDate = new Date(2024, 5, 1);
      const cycleDayOfWeek = 1; // Monday

      // Act
      const result = calculateNextRunAt('WEEKLY', startDate, null, null, cycleDayOfWeek);

      // Assert - June 15 is Saturday, next Monday is June 17
      expect(formatDate(result)).toBe('2024-06-17');
    });

    it('should handle cycleDayOfWeek for same day (Saturday = 6)', () => {
      // Arrange
      const startDate = new Date(2024, 5, 1);
      const cycleDayOfWeek = 6; // Saturday

      // Act - Today is Saturday (June 15), so should return next Saturday (June 22)
      const result = calculateNextRunAt('WEEKLY', startDate, null, null, cycleDayOfWeek);

      // Assert
      expect(formatDate(result)).toBe('2024-06-22');
    });

    it('should handle cycleDayOfWeek for Sunday (0)', () => {
      // Arrange
      const startDate = new Date(2024, 5, 1);
      const cycleDayOfWeek = 0; // Sunday

      // Act
      const result = calculateNextRunAt('WEEKLY', startDate, null, null, cycleDayOfWeek);

      // Assert - June 15 is Saturday, next Sunday is June 16
      expect(formatDate(result)).toBe('2024-06-16');
    });
  });

  describe('MONTHLY frequency', () => {
    it('should return next month when no lastRunAt and startDate is today or past', () => {
      // Arrange
      const startDate = new Date(2024, 5, 15);

      // Act
      const result = calculateNextRunAt('MONTHLY', startDate, null);

      // Assert
      expect(formatDate(result)).toBe(formatDate(addMonths(mockNow, 1)));
    });

    it('should return startDate when it is in the future', () => {
      // Arrange
      const startDate = new Date(2024, 6, 20); // July 20, 2024

      // Act
      const result = calculateNextRunAt('MONTHLY', startDate, null);

      // Assert
      expect(formatDate(result)).toBe('2024-07-20');
    });

    it('should return month after lastRunAt when lastRunAt provided', () => {
      // Arrange
      const startDate = new Date(2024, 4, 1); // May 1
      const lastRunAt = new Date(2024, 4, 15); // May 15, 2024

      // Act
      const result = calculateNextRunAt('MONTHLY', startDate, lastRunAt);

      // Assert
      expect(formatDate(result)).toBe('2024-06-15');
    });

    it('should respect cycleDayOfMonth when provided', () => {
      // Arrange
      const startDate = new Date(2024, 5, 1);
      const cycleDayOfMonth = 25; // 25th of month

      // Act
      const result = calculateNextRunAt('MONTHLY', startDate, null, cycleDayOfMonth);

      // Assert - Today is June 15, so should return June 25
      expect(formatDate(result)).toBe('2024-06-25');
    });

    it('should move to next month if cycleDayOfMonth has passed', () => {
      // Arrange
      const startDate = new Date(2024, 5, 1);
      const cycleDayOfMonth = 10; // 10th of month, which is before June 15

      // Act
      const result = calculateNextRunAt('MONTHLY', startDate, null, cycleDayOfMonth);

      // Assert - June 10 has passed, so should return July 10
      expect(formatDate(result)).toBe('2024-07-10');
    });

    it('should handle end of month correctly (31st)', () => {
      // Arrange
      const startDate = new Date(2024, 5, 1);
      const cycleDayOfMonth = 31;

      // Act
      const result = calculateNextRunAt('MONTHLY', startDate, null, cycleDayOfMonth);

      // Assert - June has 30 days, so date-fns will overflow to next month
      expect(result.getMonth()).toBeGreaterThanOrEqual(5); // June or later
    });
  });

  describe('YEARLY frequency', () => {
    it('should return next year when no lastRunAt and startDate is today or past', () => {
      // Arrange
      const startDate = new Date(2024, 5, 15);

      // Act
      const result = calculateNextRunAt('YEARLY', startDate, null);

      // Assert
      expect(formatDate(result)).toBe(formatDate(addYears(mockNow, 1)));
    });

    it('should return startDate when it is in the future', () => {
      // Arrange
      const startDate = new Date(2024, 11, 25); // December 25, 2024

      // Act
      const result = calculateNextRunAt('YEARLY', startDate, null);

      // Assert
      expect(formatDate(result)).toBe('2024-12-25');
    });

    it('should return year after lastRunAt when lastRunAt provided', () => {
      // Arrange
      const startDate = new Date(2023, 5, 15); // June 15, 2023
      const lastRunAt = new Date(2024, 5, 15); // June 15, 2024

      // Act
      const result = calculateNextRunAt('YEARLY', startDate, lastRunAt);

      // Assert
      expect(formatDate(result)).toBe('2025-06-15');
    });

    it('should handle leap year date (Feb 29)', () => {
      // Arrange
      const startDate = new Date(2024, 1, 29); // Feb 29, 2024 (leap year)
      const lastRunAt = new Date(2024, 1, 29);

      // Act
      const result = calculateNextRunAt('YEARLY', startDate, lastRunAt);

      // Assert - 2025 is not a leap year
      expect(result.getFullYear()).toBe(2025);
    });
  });

  describe('Edge cases', () => {
    it('should return tomorrow for unknown frequency', () => {
      // Arrange
      const startDate = new Date(2024, 5, 15);

      // Act
      // @ts-expect-error Testing unknown frequency
      const result = calculateNextRunAt('UNKNOWN', startDate, null);

      // Assert
      expect(formatDate(result)).toBe(formatDate(addDays(mockNow, 1)));
    });

    it('should handle dates correctly regardless of time component', () => {
      // Arrange
      const startDate = new Date(2024, 5, 15, 23, 59, 59);

      // Act
      const result = calculateNextRunAt('DAILY', startDate, null);

      // Assert - Should still be next day
      expect(formatDate(result)).toBe(formatDate(addDays(mockNow, 1)));
    });

    it('should calculate correctly when lastRunAt has time component', () => {
      // Arrange
      const startDate = new Date(2024, 5, 1);
      const lastRunAt = new Date(2024, 5, 14, 8, 30, 0);

      // Act
      const result = calculateNextRunAt('DAILY', startDate, lastRunAt);

      // Assert - Should be day after lastRunAt date
      expect(formatDate(result)).toBe('2024-06-15');
    });
  });
});
