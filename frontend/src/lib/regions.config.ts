export interface ShippingOption {
  id: string
  name: string
  cost: number
  deliveryDays: number
}

export interface Region {
  code: string
  displayName: string
  flagEmoji: string
  currencyCode: string
  currencySymbol: string
  locale: string
  taxLabel: string
  taxRate: number
  shippingZones: ShippingOption[]
  paymentMethods: string[]
  codAvailable: boolean
  measurementSystem: 'imperial' | 'metric'
}

export const REGIONS: Region[] = [
  {
    code: 'US',
    displayName: 'United States',
    flagEmoji: '🇺🇸',
    currencyCode: 'USD',
    currencySymbol: '$',
    locale: 'en-US',
    taxLabel: 'Sales Tax',
    taxRate: 0.08875,
    shippingZones: [
      { id: 'us-std', name: 'Standard Delivery', cost: 10, deliveryDays: 5 },
      { id: 'us-exp', name: 'Express Delivery', cost: 25, deliveryDays: 2 }
    ],
    paymentMethods: ['card', 'stripe'],
    codAvailable: false,
    measurementSystem: 'imperial'
  },
  {
    code: 'IN',
    displayName: 'India',
    flagEmoji: '🇮🇳',
    currencyCode: 'INR',
    currencySymbol: '₹',
    locale: 'en-IN',
    taxLabel: 'GST',
    taxRate: 0.18,
    shippingZones: [
      { id: 'in-std', name: 'Standard Delivery', cost: 150, deliveryDays: 6 },
      { id: 'in-exp', name: 'Express Shipping', cost: 450, deliveryDays: 2 }
    ],
    paymentMethods: ['card', 'upi', 'cod'],
    codAvailable: true,
    measurementSystem: 'metric'
  },
  {
    code: 'GB',
    displayName: 'United Kingdom',
    flagEmoji: '🇬🇧',
    currencyCode: 'GBP',
    currencySymbol: '£',
    locale: 'en-GB',
    taxLabel: 'VAT',
    taxRate: 0.20,
    shippingZones: [
      { id: 'gb-std', name: 'Standard Royal Mail', cost: 5, deliveryDays: 4 },
      { id: 'gb-exp', name: 'Special Delivery', cost: 12, deliveryDays: 1 }
    ],
    paymentMethods: ['card', 'stripe'],
    codAvailable: false,
    measurementSystem: 'metric'
  },
  {
    code: 'AE',
    displayName: 'United Arab Emirates',
    flagEmoji: '🇦🇪',
    currencyCode: 'AED',
    currencySymbol: 'د.إ',
    locale: 'en-AE',
    taxLabel: 'VAT',
    taxRate: 0.05,
    shippingZones: [
      { id: 'ae-std', name: 'Courier Delivery', cost: 20, deliveryDays: 3 },
      { id: 'ae-exp', name: 'Next-Day Delivery', cost: 50, deliveryDays: 1 }
    ],
    paymentMethods: ['card', 'cod'],
    codAvailable: true,
    measurementSystem: 'metric'
  },
  {
    code: 'DE',
    displayName: 'Germany',
    flagEmoji: '🇩🇪',
    currencyCode: 'EUR',
    currencySymbol: '€',
    locale: 'de-DE',
    taxLabel: 'VAT (MwSt.)',
    taxRate: 0.19,
    shippingZones: [
      { id: 'de-std', name: 'Standard DHL', cost: 6, deliveryDays: 4 },
      { id: 'de-exp', name: 'Express DHL', cost: 18, deliveryDays: 2 }
    ],
    paymentMethods: ['card', 'stripe'],
    codAvailable: false,
    measurementSystem: 'metric'
  }
]

export const DEFAULT_REGION = REGIONS[0]
