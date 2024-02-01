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
};

main();
