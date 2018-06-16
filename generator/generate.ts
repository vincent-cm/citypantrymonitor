import * as fs from 'fs';
import * as path from 'path';
import { generateRandomOrders } from './generate-random-orders';

const args = process.argv;
const getNumericArg = (index: number, defaultValue: number) => {
  const argValue = args[2 + index];
  if (typeof argValue !== 'undefined') {
    const parsed = parseInt(argValue, 10);
    if (!isNaN(parsed)) {
      return parsed;
    }
  }
  return defaultValue;
};
const count = getNumericArg(0, 10);
const seed = getNumericArg(1, undefined);

console.log(`Generating ${count} orders` + (typeof seed !== 'undefined' ? ` with seed ${seed}` : ''));
const data = generateRandomOrders(count, seed);

console.log('Writing to orders.json...');

fs.writeFileSync(path.join(__dirname, '../server/data/orders.json'), JSON.stringify(data));
console.log('Done!');
