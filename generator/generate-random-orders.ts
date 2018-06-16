import { CUSTOMERS } from './customers';
import { VENDORS } from './vendors';
import * as moment from 'moment';
import { Random } from './random';
import { DRIVERS } from './drivers';

export const generateRandomOrders = (count: number, seed: number = Math.floor(Math.random() * 1000000)): any[] => {
  const random = new Random(seed);

  const randomFrom = <T>(list: T[]) => list[random.next(0, list.length - 1)];
  const randomDate = (now: moment.Moment, daysInPast: number, daysInFuture: number) => now.clone()
    .add(random.next(daysInPast, daysInFuture), 'days')
    .startOf('minute')
    .hour(7 + random.next(0, 4) + random.next(0, 4) + random.next(0, 4)) // Between 7 and 21h, but more likely in the middle
    .minutes(30 * random.next(0, 1));
  const randomLatLong = () => {
    // Top left 51.528593, -0.204306
    // center 51.507389, -0.127789
    // bottom right 51.462166, -0.006886
    const M = 1000000;
    return {
      lat: 51.462166 + random.next(0, (51.528593 * M - 51.462166 * M)) / M,
      long: -0.204306 + random.next(0, (-0.006886 * M - (-0.204306) * M)) / M
    };
  };

  const randomOrder = (lastId: number) => {
    const now = moment('2018-05-01T10:00:00Z');

    const price = Math.floor((random.next(50, 300000) + random.next(0, 300000) + random.next(0, 300000)) / 5) * 5 / 100;
    const vat = randomFrom([0, 10, 15, 20]);
    const vatableItems = randomFrom([0, 0.4, 0.8, 1]);
    const vatablePrice = price * vatableItems;
    const vatAmount = vat * vatablePrice / 100;
    const delivery = randomFrom([0, 5, 15, 15, 15, 20, 25]);
    const deliveryDate = randomDate(now, -300, 100);
    const deliveredAt = deliveryDate.isBefore(now) ? deliveryDate.clone().add(random.next(-15 * 60, 5 * 3600), 'seconds') : null;
    const commissionRate = randomFrom([0.1, 0.12, 0.15, 0.17, 0.2, 0.99]);
    const lastModified = now.clone().add(random.next(-10 * 7 * 24 * 3600, 0), 'seconds');
    const late = random.next(1, 10) < 3;
    const delayMinutes = late ? random.next(1, 25) : 0;
    const lateReason = late && random.next(1, 10) < 8 ?
      randomFrom(['VENDOR_LATE', 'TRAFFIC', 'DRIVER_LATE_FOR_PICKUP', 'BAD_INSTRUCTIONS']) : null;
    const id = lastId + random.next(0, 100);
    const order = {
      id,
      lastModified,
      customer: randomFrom(CUSTOMERS),
      vendor: randomFrom(VENDORS),
      commissionRate,
      requestedDeliveryDate: deliveryDate,
      price: {
        delivery,
        items: price,
        total: delivery + price,
        vatRate: vat,
        vatableItems: vatablePrice,
        vatAmount
      },
      paymentType: randomFrom(['CARD', 'CASH', 'PAY_ON_ACCOUNT']),
      headcount: random.next(15, 200),
      servingStyle: randomFrom(['BUFFET', 'INDIVIDUAL_PORTIONS']),
      deliveredAt,
      delayMinutes,
      lateReason,
      packaging: randomFrom(['HOTBOX', 'COLDBOX', 'VENDOR_PROVIDED']),
      driverName: randomFrom(DRIVERS),
      deliveryLocation: randomLatLong(),
      currentLocation: randomLatLong(),
      vendorLocation: randomLatLong(),
    };
    return order;
  };

  let runningId = random.next(1000, 5000);
  return Array(count).fill(null).map(() => {
    const order = randomOrder(runningId);
    runningId = order.id;
    return order;
  });
};
