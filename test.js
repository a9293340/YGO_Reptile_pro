<<<<<<< HEAD
import MongooseCRUD from './api/MongoDb/Api.js';
import fs from 'fs';
import { noJp } from './api/reptileRules.js';
import { reptilePrice } from './api/reptilePrice.js';
const main = async () => {
  const regex = /非(?=[A-Za-z\s])/;
  console.log(regex.test('這是非 A')); // 應該返回 true
  console.log(regex.test('非常')); // 應該返回 false，因為「非」後面沒有跟英文字母或空格
  console.log(regex.test('我是非B')); // 應該返回 true
=======
import MongooseCRUD from "./api/MongoDb/Api.js";
import fs from "fs";
import { hasJPUpdate, noJp } from "./api/reptileRules.js";
import { reptilePrice } from "./api/reptilePrice.js";
// const main = async () => {
// 	const cards = await MongooseCRUD("R", "cards", { star: "星數" });

// 	for (let i = 0; i < cards.length; i++) {
// 		const card = cards[i];
// 		await MongooseCRUD("Uo", "cards", { _id: card._id }, { star: "" });
// 	}
// };

const main = async () => {
	console.log("Start");
	await hasJPUpdate();
	console.log("End");
>>>>>>> 90f332aca0a293c67104a42c18ead6109eba7b3d
};

// const main = async () => {
//   noJp();
// };
main();
