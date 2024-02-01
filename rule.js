import { reptilePrice } from "./api/reptilePrice.js";
import { hasJPUpdate } from "./api/reptileRules.js";
import schedule from "node-schedule";

const main = async () => {
	schedule.scheduleJob("scheduleReptileRules", "10 02 10 * * 4", async () => {
		console.log("Start");
		await hasJPUpdate();
		console.log("OK!");
	});
};

main();
