import * as cheerio from "cheerio";
import iconv from "iconv-lite";
import fs from "fs";
import { useReptileTargetUrl } from "./reptile/index.js";
import { MongooseCRUD } from "./MongoDb/Api.js";
import { useDelay } from "./tools/index.js";

const removeTN = (txt) => txt.replaceAll(`\n`, "").replaceAll(`\t`, "");

const sendRulesToDb = async () => {
	const have = await MongooseCRUD("R", "jurisprudence", {}, {}, { number: 1 });
	const allRules = fs
		.readdirSync("./rules")
		.filter((el) => !have.find((x) => el.indexOf(x.number) !== -1));

	let err = [];
	let emptyJSON = [];
	let errInfo = [];
	for (let i = 0; i < allRules.length; i++) {
		// if (i) break;
		const ruleFile = allRules[i];
		const rule = JSON.parse(fs.readFileSync(`./rules/${ruleFile}`).toString());
		if (typeof rule !== "object") {
			emptyJSON.push(ruleFile);
			console.log(`${ruleFile} GG`);
		}
		try {
			const a = await MongooseCRUD("C", "jurisprudence", rule);
			if (a.length) console.log(`${rule.number} OK!`);
			else {
				console.log(`${rule.number} GG`);
				err.push(rule.number);
			}
			await useDelay(200);
		} catch (error) {
			errInfo.push(rule.number);
			console.log(`${rule.number} info GG`);
		}
	}

	fs.writeFileSync("./err.json", JSON.stringify(err));
	fs.writeFileSync("./err.json", JSON.stringify(emptyJSON));
	fs.writeFileSync("./err.json", JSON.stringify(errInfo));
};

sendRulesToDb();
