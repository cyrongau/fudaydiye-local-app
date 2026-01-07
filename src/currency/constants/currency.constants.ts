
export enum Currency {
  USD = 'USD',
  SLSH = 'SLSH',
}

export enum PaymentMethod {
  ZAAD = 'ZAAD',
  EDAHAB = 'EDAHAB',
  PREMIER_WALLET = 'PREMIER_WALLET',
  STRIPE_CARD = 'STRIPE_CARD',
  PREMIER_CARD = 'PREMIER_CARD',
}

export const MOBILE_MONEY_METHODS = [
  PaymentMethod.ZAAD,
  PaymentMethod.EDAHAB,
  PaymentMethod.PREMIER_WALLET,
];

export const CARD_METHODS = [
  PaymentMethod.STRIPE_CARD,
  PaymentMethod.PREMIER_CARD,
];

export const USD_MIN_THRESHOLD = 100;
