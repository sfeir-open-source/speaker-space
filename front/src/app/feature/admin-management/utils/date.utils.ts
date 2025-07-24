export interface FirestoreTimestamp {
  toDate(): Date;
  seconds: number;
  nanoseconds: number;
}

export function convertToDate(dateValue: Date | string | FirestoreTimestamp | any): Date | null {
  if (!dateValue) return null;

  try {
    if (dateValue instanceof Date) {
      return dateValue;
    }

    if (typeof dateValue === 'string') {
      const date = new Date(dateValue);
      return isNaN(date.getTime()) ? null : date;
    }

    if (dateValue && typeof dateValue === 'object' && typeof dateValue.toDate === 'function') {
      return dateValue.toDate();
    }

    if (dateValue && typeof dateValue === 'object' &&
      typeof dateValue.seconds === 'number') {
      return new Date(dateValue.seconds * 1000 + Math.floor(dateValue.nanoseconds / 1000000));
    }

    const date = new Date(dateValue);
    return isNaN(date.getTime()) ? null : date;

  } catch (error) {
    console.error('Error converting date:', error, 'Input:', dateValue);
    return null;
  }
}
