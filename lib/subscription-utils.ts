import type { SubscriptionFrequency } from '@prisma/client';
import {
  addDays,
  addMonths,
  addWeeks,
  addYears,
  setDate,
  startOfDay,
} from 'date-fns';

/**
 * Calculates the next run date for a subscription based on its frequency
 */
export function calculateNextRunAt(
  frequency: SubscriptionFrequency,
  startDate: Date,
  lastRunAt: Date | null = null,
  cycleDayOfMonth?: number | null,
  cycleDayOfWeek?: number | null,
): Date {
  const now = startOfDay(new Date());
  const baseDate = lastRunAt ? startOfDay(lastRunAt) : startOfDay(startDate);
  let nextDate: Date;

  switch (frequency) {
    case 'DAILY': {
      // If lastRunAt exists, add 1 day from it, otherwise start from today if startDate is today or past
      if (lastRunAt) {
        nextDate = addDays(baseDate, 1);
      } else {
        nextDate = baseDate <= now ? addDays(now, 1) : baseDate;
      }
      break;
    }
    case 'WEEKLY': {
      if (lastRunAt) {
        nextDate = addWeeks(baseDate, 1);
      } else if (cycleDayOfWeek !== null && cycleDayOfWeek !== undefined) {
        // Find next occurrence of the specified day of week
        const today = new Date(now);
        const currentDay = today.getDay();
        let daysUntilNext = cycleDayOfWeek - currentDay;

        if (daysUntilNext < 0 || (daysUntilNext === 0 && baseDate <= now)) {
          daysUntilNext += 7;
        }

        nextDate = addDays(now, daysUntilNext);
      } else {
        // Default: next week from start date
        nextDate = baseDate <= now ? addWeeks(now, 1) : baseDate;
      }
      break;
    }
    case 'MONTHLY': {
      if (lastRunAt) {
        nextDate = addMonths(baseDate, 1);
      } else if (cycleDayOfMonth !== null && cycleDayOfMonth !== undefined) {
        // Find next occurrence of the specified day of month
        const today = new Date(now);
        const currentMonth = today.getMonth();
        const currentYear = today.getFullYear();

        // Try current month first
        let candidateDate = setDate(
          new Date(currentYear, currentMonth, 1),
          cycleDayOfMonth,
        );

        // If that date has passed or is today, move to next month
        if (
          candidateDate < now ||
          (candidateDate.getTime() === now.getTime() && baseDate < now)
        ) {
          candidateDate = setDate(
            new Date(currentYear, currentMonth + 1, 1),
            cycleDayOfMonth,
          );
        }

        nextDate = candidateDate;
      } else {
        // Default: same day next month from start date
        if (baseDate <= now) {
          nextDate = addMonths(now, 1);
        } else {
          nextDate = baseDate;
        }
      }
      break;
    }
    case 'YEARLY': {
      if (lastRunAt) {
        nextDate = addYears(baseDate, 1);
      } else {
        // Default: same date next year from start date
        nextDate = baseDate <= now ? addYears(now, 1) : baseDate;
      }
      break;
    }
    default:
      nextDate = addDays(now, 1);
  }

  return nextDate;
}
