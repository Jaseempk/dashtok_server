// Response helpers for consistent API responses

export function success<T>(data: T) {
  return {
    success: true as const,
    data,
  };
}

export function paginated<T>(
  data: T[],
  total: number,
  page: number,
  limit: number
) {
  return {
    success: true as const,
    data,
    pagination: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
      hasMore: page * limit < total,
    },
  };
}

// Date utilities for timezone-aware operations

export function getStartOfDay(date: Date, timezone: string): Date {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });

  const parts = formatter.formatToParts(date);
  const year = parts.find((p) => p.type === 'year')?.value;
  const month = parts.find((p) => p.type === 'month')?.value;
  const day = parts.find((p) => p.type === 'day')?.value;

  return new Date(`${year}-${month}-${day}T00:00:00`);
}

export function getEndOfDay(date: Date, timezone: string): Date {
  const startOfDay = getStartOfDay(date, timezone);
  return new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000 - 1);
}

export function isToday(date: Date, timezone: string): boolean {
  const now = new Date();
  const todayStart = getStartOfDay(now, timezone);
  const todayEnd = getEndOfDay(now, timezone);
  return date >= todayStart && date <= todayEnd;
}

// Generate unique IDs
export function generateId(): string {
  return crypto.randomUUID();
}
