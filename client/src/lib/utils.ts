import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Safely formats a price value to a string with 2 decimal places
 * Handles both string and number inputs from database
 * @param price - The price value (string or number)
 * @param defaultValue - The default value to return if price is invalid (default: "0.00")
 * @returns Formatted price string with 2 decimal places
 */
export function formatPrice(price: string | number | null | undefined, defaultValue: string = "0.00"): string {
  if (price === null || price === undefined) {
    return defaultValue;
  }
  
  const numPrice = typeof price === 'string' ? parseFloat(price) : price;
  
  if (isNaN(numPrice)) {
    return defaultValue;
  }
  
  return numPrice.toFixed(2);
}

/**
 * Safely converts a price value to a number
 * Handles both string and number inputs from database
 * @param price - The price value (string or number)
 * @param defaultValue - The default value to return if price is invalid (default: 0)
 * @returns Price as a number
 */
export function parsePrice(price: string | number | null | undefined, defaultValue: number = 0): number {
  if (price === null || price === undefined) {
    return defaultValue;
  }
  
  const numPrice = typeof price === 'string' ? parseFloat(price) : price;
  
  if (isNaN(numPrice)) {
    return defaultValue;
  }
  
  return numPrice;
}
