import MongooseCRUD from './api/MongoDb/Api.js';
import fs from 'fs';
import { noJp } from './api/reptileRules.js';
import { reptilePrice } from './api/reptilePrice.js';
// const main = async () => {
//   const regex = /非(?=[A-Za-z\s])/;
//   console.log(regex.test('這是非 A')); // 應該返回 true
//   console.log(regex.test('非常')); // 應該返回 false，因為「非」後面沒有跟英文字母或空格
//   console.log(regex.test('我是非B')); // 應該返回 true
// };

const main = async () => {
  noJp();
};
main();
