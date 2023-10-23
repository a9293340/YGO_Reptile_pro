import figlet from "figlet";
import { reptilePrice } from "./api/reptilePrice.js";
import schedule from "node-schedule";
import gradient from "gradient-string";
import chalk from "chalk";
import fs from "fs";

const getRutenInfo = async () => {
	console.log(gradient.rainbow("========  Reptile YGO Cards Price ========"));
	let price = await reptilePrice();

	fs.writeFileSync("./database/cardInfo.json", JSON.stringify(price.cardInfo));
	if (price.errorBox.length)
		fs.writeFileSync(
			`./database/price_error_${new Date().toISOString().split(":")[0]}.json`,
			JSON.stringify(price.errorBox)
		);

	console.log(
		chalk.white.bgGreen.bold(
			"Updated Data Price Successful !",
			new Date().toDateString()
		),
		`,total updated ${
			price.cardInfo.length
		} data(${new Date().toLocaleDateString()})`
	);
};

async function scheduleReptilePrice() {
	console.log(
		figlet.textSync("YGO Reptile!", {
			font: "Ghost",
			horizontalLayout: "fill",
			verticalLayout: "default",
			width: 140,
			whitespaceBreak: true,
		})
	);
	schedule.scheduleJob("scheduleReptilePrice", "0 18 9 * * *", () => {
		getRutenInfo();
	});
}

scheduleReptilePrice();
