import MongooseCRUD from './api/MongoDb/Api.js';
import fs from 'fs';
import { noJp } from './api/reptileRules.js';
import { reptilePrice } from './api/reptilePrice.js';
// const main = async () => {
//   reptilePrice();
// };

const main = async () => {
  noJp();
};

main();
