export function convertToDate(dateValue: any): Date | null {
  if (!dateValue) return null;

  if (dateValue instanceof Date) {
    return dateValue;
  }

  if (typeof dateValue === 'string') {
    const parsed = new Date(dateValue);
    return isNaN(parsed.getTime()) ? null : parsed;
  }

  if (typeof dateValue === 'object' && dateValue._seconds) {
    return new Date(dateValue._seconds * 1000 + (dateValue._nanoseconds || 0) / 1000000);
  }

  return null;
}
