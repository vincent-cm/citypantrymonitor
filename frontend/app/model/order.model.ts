export class Order {
  id?: number;
  lastModified?: Date;
  customer?: string;
  vendor?: string;
  commissionRate?: number;
  requestedDeliveryDate?: Date;
  price?: Price;
  paymentType?: Order_Enum.PaymentTypeEnum;
  headcount?: number;
  servingStyle?: Order_Enum.ServingStyleEnum;
  deliveredAt?: Date;
  delayMinutes?: number;
  lateReason?: string;
  packaging?: Order_Enum.PackagingEnum;
  driverName?: string;
  deliveryLocation?: Loc;
  currentLocation?: Loc;
  vendorLocation?: Loc;
  totalDistance?: number;
  distanceLeft?: number;

  constructor() {
    this.customer = '';
    this.vendor = '';
    this.commissionRate = 0;
    this.requestedDeliveryDate = new Date();
    this.price = new Price();
    this.paymentType = Order_Enum.PaymentTypeEnum.CARD;
    this.headcount = 0;
    this.servingStyle = Order_Enum.ServingStyleEnum.BUFFET;
    this.deliveredAt = new Date();
    this.delayMinutes = 0;
    this.lateReason = '';
    this.packaging = Order_Enum.PackagingEnum.COLDBOX;
    this.driverName = '';
    this.deliveryLocation = new Loc();
    this.currentLocation = new Loc();
    this.vendorLocation = new Loc();
    this.totalDistance = 0;
    this.distanceLeft = 0;
  }
}

export class Price {
  delivery: number;
  items: number;
  total: number;
  vatRate: number;
  vatableItems: number;
  vatAmount: number;
}

export class Loc {
  lat: number;
  long: number;
}

export namespace Order_Enum {
  export type PaymentTypeEnum = 'CARD' | 'CASH' | 'PAY_ON_ACCOUNT';
  export const PaymentTypeEnum = {
    CARD: 'CARD' as PaymentTypeEnum,
    CASH: 'CASH' as PaymentTypeEnum,
    PAY_ON_ACCOUNT: 'PAY_ON_ACCOUNT' as PaymentTypeEnum
  };
}

export namespace Order_Enum {
  export type ServingStyleEnum = 'BUFFET' | 'INDIVIDUAL_PORTIONS';
  export const ServingStyleEnum = {
    BUFFET: 'BUFFET' as ServingStyleEnum,
    INDIVIDUAL_PORTIONS: 'INDIVIDUAL_PORTIONS' as ServingStyleEnum
  };
}

export namespace Order_Enum {
  export type PackagingEnum = 'HOTBOX' | 'COLDBOX' | 'VENDOR_PROVIDED';
  export const PackagingEnum = {
    HOTBOX: 'HOTBOX' as PackagingEnum,
    COLDBOX: 'COLDBOX' as PackagingEnum,
    VENDOR_PROVIDED: 'VENDOR_PROVIDED' as PackagingEnum
  };
}
