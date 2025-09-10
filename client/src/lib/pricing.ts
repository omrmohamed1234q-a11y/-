// Professional Printing Price Calculator for اطبعلي Platform
// Implements comprehensive pricing rules for all paper sizes and types

export interface PricingOptions {
  paper_size: 'A4' | 'A3' | 'A0' | 'A1';
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
  let pricePerPage = 0;
  let isLargeFormat = false;

  // A4 Pricing Rules
  if (paper_size === 'A4') {
    if (paper_type === 'plain') {
      if (print_type === 'face') {
        // A4 Plain - Face only
        if (pages >= 1 && pages <= 20) {
          pricePerPage = 1.00;
        } else if (pages >= 21 && pages <= 1000) {
          pricePerPage = 0.70;
        } else if (pages >= 1001) {
          pricePerPage = 0.60;
        }
      } else if (print_type === 'face_back') {
        // A4 Plain - Face & Back
        if (pages >= 1 && pages <= 20) {
          pricePerPage = 1.50;
        } else if (pages >= 21 && pages <= 1000) {
          pricePerPage = 0.95;
        } else if (pages >= 1001) {
          pricePerPage = 0.35;
        }
      }
    } else if (paper_type === 'coated') {
      // A4 Coated (كوشيه)
      if (pages >= 1 && pages <= 20) {
        pricePerPage = 6.00;
      } else if (pages >= 21 && pages <= 1000) {
        pricePerPage = 5.00;
      } else if (pages >= 1001) {
        pricePerPage = 4.50;
      }
    } else if (paper_type === 'glossy') {
      // A4 Glossy (جلوسي)
      if (pages >= 1 && pages <= 20) {
        pricePerPage = 10.00;
      } else if (pages >= 21 && pages <= 1000) {
        pricePerPage = 9.00;
      } else if (pages >= 1001) {
        pricePerPage = 8.00;
      }
    } else if (paper_type === 'sticker') {
      // A4 Sticker
      if (pages >= 1 && pages <= 20) {
        pricePerPage = 10.00;
      } else if (pages >= 21 && pages <= 1000) {
        pricePerPage = 9.00;
      } else if (pages >= 1001) {
        pricePerPage = 8.00;
      }
    }
  }
  // A3 Pricing Rules
  else if (paper_size === 'A3') {
    if (paper_type === 'plain') {
      if (print_type === 'face') {
        // A3 Plain - Face only
        if (pages >= 1 && pages <= 30) {
          pricePerPage = 5.00;
        } else if (pages >= 31) {
          pricePerPage = 3.00;
        }
      } else if (print_type === 'face_back') {
        // A3 Plain - Face & Back
        if (pages >= 1 && pages <= 30) {
          pricePerPage = 6.00;
        } else if (pages >= 31) {
          pricePerPage = 5.00;
        }
      }
    } else if (paper_type === 'coated') {
      // A3 Coated (كوشيه)
      if (pages >= 1 && pages <= 50) {
        pricePerPage = 12.00;
      } else if (pages >= 51) {
        pricePerPage = 10.00;
      }
    } else if (paper_type === 'glossy') {
      // A3 Glossy (جلوسي)
      if (pages >= 1 && pages <= 50) {
        pricePerPage = 16.00;
      } else if (pages >= 51) {
        pricePerPage = 14.00;
      }
    } else if (paper_type === 'sticker') {
      // A3 Sticker
      if (pages >= 1 && pages <= 50) {
        pricePerPage = 20.00;
      } else if (pages >= 51) {
        pricePerPage = 18.00;
      }
    }
  }
  // Large Format Pricing Rules: A0, A1, A2 - Plain paper only, no B&W discount
  else if (['A0', 'A1', 'A2'].includes(paper_size)) {
    isLargeFormat = true;
    // Large formats support plain paper only and no B&W discount
    pricePerPage = print_type === 'face' ? 15.00 : 20.00;
  }

  // Calculate base total
  const totalPrice = pricePerPage * pages;
  
  // Apply 10% discount for black and white (but NOT for large formats)
  const discount = (is_black_white && !isLargeFormat) ? totalPrice * 0.10 : 0;
  const finalPrice = totalPrice - discount;

  return {
    totalPrice,
    pricePerPage,
    discount,
    finalPrice,
    currency: 'جنيه'
  };
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
          { range: '1001+ صفحة', price: '0.35 جنيه/صفحة' }
        ]
      },
      coated: [
        { range: '1-20 صفحة', price: '6 جنيه/صفحة' },
        { range: '21-1000 صفحة', price: '5 جنيه/صفحة' },
        { range: '1001+ صفحة', price: '4.5 جنيه/صفحة' }
      ],
      glossy: [
        { range: '1-20 صفحة', price: '10 جنيه/صفحة' },
        { range: '21-1000 صفحة', price: '9 جنيه/صفحة' },
        { range: '1001+ صفحة', price: '8 جنيه/صفحة' }
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
        { range: '1-50 صفحة', price: '12 جنيه/صفحة' },
        { range: '51+ صفحة', price: '10 جنيه/صفحة' }
      ],
      glossy: [
        { range: '1-50 صفحة', price: '16 جنيه/صفحة' },
        { range: '51+ صفحة', price: '14 جنيه/صفحة' }
      ],
      sticker: [
        { range: '1-50 صفحة', price: '20 جنيه/صفحة' },
        { range: '51+ صفحة', price: '18 جنيه/صفحة' }
      ]
    },
    A0: {
      plain_bw: [
        { range: 'وجه واحد', price: '15 جنيه/صفحة (أبيض وأسود فقط)' },
        { range: 'وجهين', price: '20 جنيه/صفحة (أبيض وأسود فقط)' }
      ]
    },
    A1: {
      plain_bw: [
        { range: 'وجه واحد', price: '15 جنيه/صفحة (أبيض وأسود فقط)' },
        { range: 'وجهين', price: '20 جنيه/صفحة (أبيض وأسود فقط)' }
      ]
    },
    A2: {
      plain_bw: [
        { range: 'وجه واحد', price: '15 جنيه/صفحة (أبيض وأسود فقط)' },
        { range: 'وجهين', price: '20 جنيه/صفحة (أبيض وأسود فقط)' }
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
    copies: settings.copies
  };
}