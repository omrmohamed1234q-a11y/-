// Professional Pricing Rules for اطبعلي Platform
// Shared between frontend and backend to ensure consistency

export const LARGE_FORMAT_SIZES = ['A0', 'A1', 'A2'] as const;

export interface SharedPricingOptions {
  paper_size: 'A4' | 'A3' | 'A0' | 'A1' | 'A2';
  paper_type: 'plain' | 'coated' | 'glossy' | 'sticker';
  print_type: 'face' | 'face_back';
  pages: number;
  copies?: number;  // Add copies to pricing calculation
  is_black_white?: boolean;
}

export interface SharedPricingResult {
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
 * Centralized pricing logic - used by both frontend and backend
 */
export function calculateSharedPrice(options: SharedPricingOptions): SharedPricingResult {
  const { paper_size, paper_type, print_type, pages, copies = 1, is_black_white = false } = options;
  
  let pricePerPage = 0;
  const isLargeFormat = LARGE_FORMAT_SIZES.includes(paper_size as any);

  // Large Format Pricing Rules: Fixed prices, plain paper only, no B&W discount
  if (paper_size === 'A0' || paper_size === 'A1') {
    pricePerPage = 30.00; // Fixed 30 EGP
  } else if (paper_size === 'A2') {
    pricePerPage = 25.00; // Fixed 25 EGP
  }
  // A4 Pricing Rules (same as before)
  else if (paper_size === 'A4') {
    if (paper_type === 'plain') {
      if (print_type === 'face') {
        if (pages <= 20) pricePerPage = 1.00;
        else if (pages <= 1000) pricePerPage = 0.70;
        else pricePerPage = 0.60;
      } else { // face_back
        if (pages <= 20) pricePerPage = 1.50;
        else if (pages <= 1000) pricePerPage = 0.95;
        else pricePerPage = 0.70;
      }
    } else if (paper_type === 'coated') {
      if (pages <= 20) pricePerPage = 8.00;
      else if (pages <= 1000) pricePerPage = 7.00;
      else pricePerPage = 6.00;
    } else if (paper_type === 'glossy') {
      if (pages <= 20) pricePerPage = 8.00;
      else if (pages <= 1000) pricePerPage = 7.00;
      else pricePerPage = 6.00;
    } else if (paper_type === 'sticker') {
      if (pages <= 20) pricePerPage = 12.00;
      else if (pages <= 1000) pricePerPage = 11.00;
      else pricePerPage = 10.00;
    }
  }
  // A3 Pricing Rules (same as before)
  else if (paper_size === 'A3') {
    if (paper_type === 'plain') {
      if (print_type === 'face') {
        if (pages <= 50) pricePerPage = 2.50;
        else pricePerPage = 2.00;
      } else { // face_back
        if (pages <= 50) pricePerPage = 4.00;
        else pricePerPage = 3.50;
      }
    } else if (paper_type === 'coated') {
      if (pages <= 50) pricePerPage = 14.00;
      else pricePerPage = 12.00;
    } else if (paper_type === 'glossy') {
      if (pages <= 50) pricePerPage = 14.00;
      else pricePerPage = 12.00;
    } else if (paper_type === 'sticker') {
      if (pages <= 50) pricePerPage = 22.00;
      else pricePerPage = 18.00;
    }
  }

  // Calculate total price with special handling for double-sided odd pages
  let totalPrice: number;
  let pricingMeta: { fullPairs?: number; halfPageApplied?: boolean } | undefined;
  
  if (print_type === 'face_back') {
    // For double-sided printing: full pairs at full price + remainder at half price
    const fullPairs = Math.floor(pages / 2);
    const remainder = pages % 2;
    totalPrice = pricePerPage * (fullPairs * 2) + (remainder ? pricePerPage * 0.5 : 0);
    
    pricingMeta = {
      fullPairs,
      halfPageApplied: remainder === 1
    };
  } else {
    // For single-sided printing: standard calculation
    totalPrice = pricePerPage * pages;
  }
  
  // Apply black and white discount (only for non-large formats)
  let discount = 0;
  if (is_black_white && !isLargeFormat) {
    discount = totalPrice * 0.10; // 10% discount
  }
  
  // Multiply by number of copies to get total cost
  const priceAfterDiscount = totalPrice - discount;
  const finalPrice = priceAfterDiscount * copies;

  return {
    totalPrice,
    pricePerPage,
    discount: discount * copies, // Discount also multiplied by copies
    finalPrice,
    currency: 'EGP',
    isLargeFormat,
    meta: pricingMeta
  };
}

/**
 * Validate paper size constraints for large formats
 */
export function validateLargeFormatConstraints(paper_size: string, paper_type: string, print_type: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (LARGE_FORMAT_SIZES.includes(paper_size as any)) {
    if (paper_type !== 'plain') {
      errors.push(`${paper_size} يدعم الورق العادي فقط`);
    }
    if (print_type === 'face_back') {
      errors.push(`${paper_size} لا يدعم الطباعة على الوجهين`);
    }
  }
  
  return {
    valid: errors.length === 0,
    errors
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
        { range: '1-20 صفحة', price: '12 جنيه/صفحة' },
        { range: '21-1000 صفحة', price: '11 جنيه/صفحة' },
        { range: '1001+ صفحة', price: '10 جنيه/صفحة' }
      ]
    },
    A3: {
      plain: {
        face: [
          { range: '1-50 صفحة', price: '2.50 جنيه/صفحة' },
          { range: '51+ صفحة', price: '2.00 جنيه/صفحة' }
        ],
        face_back: [
          { range: '1-50 صفحة', price: '4.00 جنيه/صفحة' },
          { range: '51+ صفحة', price: '3.50 جنيه/صفحة' }
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
        { range: '1-50 صفحة', price: '22 جنيه/صفحة' },
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
  pages?: number;  // Add optional pages parameter
}) {
  return {
    paper_size: settings.paperSize === 'A3' ? 'A3' : 
                settings.paperSize === 'A0' ? 'A0' : 
                settings.paperSize === 'A1' ? 'A1' : 
                settings.paperSize === 'A2' ? 'A2' : 'A4' as 'A4' | 'A3' | 'A0' | 'A1' | 'A2',
    paper_type: 'plain' as 'plain',
    print_type: settings.doubleSided ? 'face_back' : 'face' as 'face' | 'face_back',
    is_black_white: settings.colorMode === 'grayscale',
    pages: settings.pages || 1,  // Use actual pages, not copies
    copies: settings.copies      // Keep copies separate
  };
}