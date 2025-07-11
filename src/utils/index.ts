import { v4 as uuidv4 } from 'uuid';

/**
 * Generates a UUID v4
 */
export function generateId(): string {
  return uuidv4();
}

/**
 * Truncates a string to a maximum length with an ellipsis
 * @param text The text to truncate
 * @param maxLength The maximum length
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) {
    return text;
  }
  
  return text.slice(0, maxLength - 3) + '...';
}

/**
 * Sanitizes a string for safe use in various contexts
 * @param text The text to sanitize
 */
export function sanitizeText(text: string): string {
  // Remove any HTML/script tags
  return text
    .replace(/<[^>]*>?/gm, '')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');
}

/**
 * Formats a date as an ISO string without the time component
 * @param date The date to format
 */
export function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

/**
 * Validates an email address
 * @param email The email address to validate
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Measures response time between two points
 */
export class ResponseTimer {
  private startTime: number;
  
  constructor() {
    this.startTime = Date.now();
  }
  
  /**
   * Gets the elapsed time in milliseconds
   */
  getElapsedTime(): number {
    return Date.now() - this.startTime;
  }
  
  /**
   * Restarts the timer
   */
  restart(): void {
    this.startTime = Date.now();
  }
}

/**
 * Safely parses JSON with error handling
 * @param jsonString The JSON string to parse
 * @param defaultValue The default value to return if parsing fails
 */
export function safeJsonParse<T>(jsonString: string, defaultValue: T): T {
  try {
    return JSON.parse(jsonString) as T;
  } catch (error) {
    return defaultValue;
  }
}

/**
 * Debounce function to limit the rate at which a function can fire
 * @param func The function to debounce
 * @param wait The wait time in milliseconds
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  
  return function(...args: Parameters<T>): void {
    if (timeout) {
      clearTimeout(timeout);
    }
    
    timeout = setTimeout(() => {
      func(...args);
    }, wait);
  };
}