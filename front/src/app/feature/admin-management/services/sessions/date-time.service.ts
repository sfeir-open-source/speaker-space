// import { Injectable } from '@angular/core';
//
// @Injectable({
//   providedIn: 'root'
// })
// export class DateTimeService {
//
//   formatDateTimeForEvent(date: Date | string, eventTimeZone: string, options?: Intl.DateTimeFormatOptions): string {
//     if (!date) return '';
//
//     try {
//       const dateObj = typeof date === 'string' ? new Date(date) : date;
//
//       if (isNaN(dateObj.getTime())) {
//         console.warn('Invalid date:', date);
//         return '';
//       }
//
//       const defaultOptions: Intl.DateTimeFormatOptions = {
//         timeZone: eventTimeZone,
//         year: 'numeric',
//         month: 'long',
//         day: 'numeric',
//         hour: '2-digit',
//         minute: '2-digit',
//         hour12: false
//       };
//
//       const finalOptions = { ...defaultOptions, ...options };
//
//       return dateObj.toLocaleString('en-US', finalOptions);
//     } catch (error) {
//       console.error('Error formatting date:', error);
//       return date.toString();
//     }
//   }
//
//   formatTimeForEvent(date: Date | string, eventTimeZone: string): string {
//     return this.formatDateTimeForEvent(date, eventTimeZone, {
//       hour: '2-digit',
//       minute: '2-digit',
//       hour12: false
//     });
//   }
//
//   formatDateForInput(date: Date | string, eventTimeZone: string): string {
//     if (!date) return '';
//
//     try {
//       const dateObj = typeof date === 'string' ? new Date(date) : date;
//
//       if (isNaN(dateObj.getTime())) {
//         return '';
//       }
//
//       const formatter = new Intl.DateTimeFormat('en-CA', {
//         timeZone: eventTimeZone,
//         year: 'numeric',
//         month: '2-digit',
//         day: '2-digit'
//       });
//
//       return formatter.format(dateObj);
//     } catch (error) {
//       console.error('Error formatting date for input:', error);
//       return '';
//     }
//   }
//
//   formatTimeForInput(date: Date | string, eventTimeZone: string): string {
//     if (!date) return '';
//
//     try {
//       const dateObj = typeof date === 'string' ? new Date(date) : date;
//
//       if (isNaN(dateObj.getTime())) {
//         return '';
//       }
//
//       const formatter = new Intl.DateTimeFormat('en-GB', {
//         timeZone: eventTimeZone,
//         hour: '2-digit',
//         minute: '2-digit',
//         hour12: false
//       });
//
//       return formatter.format(dateObj);
//     } catch (error) {
//       console.error('Error formatting time for input:', error);
//       return '';
//     }
//   }
// }
