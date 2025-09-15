// Professional Printing Price Calculator for اطبعلي Platform
// Implements comprehensive pricing rules for all paper sizes and types
// Now uses shared pricing system for consistency with backend

import { calculateSharedPrice, type SharedPricingOptions, type SharedPricingResult, LARGE_FORMAT_SIZES } from '@shared/pricing';

export interface PricingOptions {
  paper_size: 'A4' | 'A3' | 'A0' | 'A1' | 'A2';
  paper_type: 'plain' | 'coated' | 'glossy' | 'sticker';
  print_type: 'face' | 'face_back';
  pages: number;
  is_black_white?: boolean; // 10% discount for black and white
}

export interface PricingResult {
  totalPrice: number;
  pricePerPage: number;
  discount: number;
  finalPrice: number;
  currency: string;
  isLargeFormat: boolean;
  meta?: {
    fullPairs?: number;
    halfPageApplied?: boolean;
  };
}

/**
 * Calculate printing price based on professional pricing rules
 * @param options Printing options including paper size, type, print mode, and page count
 * @returns Detailed pricing breakdown with discounts
 */
export function calculate_price(
  paper_size: 'A4' | 'A3' | 'A0' | 'A1' | 'A2',
  paper_type: 'plain' | 'coated' | 'glossy' | 'sticker',
  print_type: 'face' | 'face_back',
  pages: number,
  is_black_white: boolean = false
): PricingResult {
  // Use shared pricing system for consistency
  const result = calculateSharedPrice({
    paper_size,
    paper_type,
    print_type,
    pages,
    is_black_white
  });
  
  return result;
}

/**
 * Get pricing tier information for display purposes
 */
export function getPricingTiers() {
  return {
    A4: {
      plain: {
        face: [
          { range: '1-20 صفحة', price: '1.00 جنيه/صفحة' },
          { range: '21-1000 صفحة', price: '0.70 جنيه/صفحة' },
          { range: '1001+ صفحة', price: '0.60 جنيه/صفحة' }
        ],
        face_back: [
          { range: '1-20 صفحة', price: '1.50 جنيه/صفحة' },
          { range: '21-1000 صفحة', price: '0.95 جنيه/صفحة' },
          { range: '1001+ صفحة', price: '0.70 جنيه/صفحة' }
        ]
      },
      coated: [
        { range: '1-20 صفحة', price: '8 جنيه/صفحة' },
        { range: '21-1000 صفحة', price: '7 جنيه/صفحة' },
        { range: '1001+ صفحة', price: '6 جنيه/صفحة' }
      ],
      glossy: [
        { range: '1-20 صفحة', price: '8 جنيه/صفحة' },
        { range: '21-1000 صفحة', price: '7 جنيه/صفحة' },
        { range: '1001+ صفحة', price: '6 جنيه/صفحة' }
      ],
      sticker: [
        { range: '1-20 صفحة', price: '10 جنيه/صفحة' },
        { range: '21-1000 صفحة', price: '9 جنيه/صفحة' },
        { range: '1001+ صفحة', price: '8 جنيه/صفحة' }
      ]
    },
    A3: {
      plain: {
        face: [
          { range: '1-30 صفحة', price: '5 جنيه/صفحة' },
          { range: '31+ صفحة', price: '3 جنيه/صفحة' }
        ],
        face_back: [
          { range: '1-30 صفحة', price: '6 جنيه/صفحة' },
          { range: '31+ صفحة', price: '5 جنيه/صفحة' }
        ]
      },
      coated: [
        { range: '1-50 صفحة', price: '14 جنيه/صفحة' },
        { range: '51+ صفحة', price: '12 جنيه/صفحة' }
      ],
      glossy: [
        { range: '1-50 صفحة', price: '14 جنيه/صفحة' },
        { range: '51+ صفحة', price: '12 جنيه/صفحة' }
      ],
      sticker: [
        { range: '1-50 صفحة', price: '20 جنيه/صفحة' },
        { range: '51+ صفحة', price: '18 جنيه/صفحة' }
      ]
    },
    A0: {
      plain_bw: [
        { range: 'جميع الكميات', price: '30 جنيه/صفحة (أبيض وأسود فقط)' }
      ]
    },
    A1: {
      plain_bw: [
        { range: 'جميع الكميات', price: '30 جنيه/صفحة (أبيض وأسود فقط)' }
      ]
    },
    A2: {
      plain_bw: [
        { range: 'جميع الكميات', price: '25 جنيه/صفحة (أبيض وأسود فقط)' }
      ]
    }
  };
}

/**
 * Convert legacy print settings to new pricing format
 */
export function convertLegacySettings(settings: {
  colorMode: string;
  paperSize: string;
  doubleSided: boolean;
  copies: number;
}) {
  return {
    paper_size: settings.paperSize === 'A3' ? 'A3' : 
                settings.paperSize === 'A0' ? 'A0' : 
                settings.paperSize === 'A1' ? 'A1' : 
                settings.paperSize === 'A2' ? 'A2' : 'A4' as 'A4' | 'A3' | 'A0' | 'A1' | 'A2',
    paper_type: 'plain' as 'plain',
    print_type: settings.doubleSided ? 'face_back' : 'face' as 'face' | 'face_back',
    is_black_white: settings.colorMode === 'grayscale',
    pages: settings.copies // Fixed: return pages instead of copies
  };
}