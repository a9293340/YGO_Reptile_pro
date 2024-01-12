import * as cheerio from "cheerio";
import iconv from "iconv-lite";
import fs from "fs";
import { useReptileTargetUrl } from "./reptile/index.js";
import { MongooseCRUD } from "./MongoDb/Api.js";
import { useDelay } from "./tools/index.js";

const containsJapanese = (text) => {
	const japaneseRegex =
		/[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF\u3400-\u4DBF]/;
	return japaneseRegex.test(text);
};

const removeTN = (txt) => txt.replaceAll(`\n`, "").replaceAll(`\t`, "");

const changeReptileTarget = async (delayTime, link) => {
	await useDelay(delayTime);
	const res = await useReptileTargetUrl(link);
	const body = iconv.decode(Buffer.from(res), "UTF-8");
	return cheerio.load(body);
};

// 爬蟲RULE主程式
const reptileRule = async ($, originQa = []) => {
	let box = [];
	let links = [];
	$(".t_body")
		.children(".t_row")
		.each(async (n, rule) => {
			let qa = {
				title: "",
				tag: "",
				date: "",
				q: "",
				a: "",
			};
			const deck_set = $(rule).children(".inside").children(".dack_set");
			const date = $(rule).children(".inside").children(".div.date");
			const link =
				"https://www.db.yugioh-card.com/" +
				$(rule).children(".link_value").attr("value") +
				"&request_locale=ja";
			if (
				!originQa.length ||
				(originQa.length &&
					!originQa.find(
						(x) => x.title === removeTN(deck_set.children(".dack_name").text())
					))
			) {
				qa.date = removeTN(date.text()).split("更新日:")[1];
				qa.title = removeTN(deck_set.children(".dack_name").text());
				qa.tag = removeTN(deck_set.children(".text").text());

				box.push(qa);
				links.push(link);
			}
		});
	console.log("Get Detail");
	for (let i = 0; i < links.length; i++) {
		const link = links[i];
		console.log(link);
		// Go to Detail Page
		const $r = await changeReptileTarget(350, link);

		box[i].q = removeTN($r("#question_text").text());
		box[i].a = removeTN($r("#answer_text").text());
	}
	return box;
};

// 第一次爬蟲(沒有QA時)
const firstReptile = async (page, pageLink, link) => {
	// 查看最後page
	const $p = await changeReptileTarget(200, pageLink);

	// 第一次爬蟲
	const hasLastPageOver10 = $p(".t_body").children().length >= 10;

	// 爬最後一頁
	let qa = await reptileRule($p);

	// 如果不足10筆 頁數超過一頁
	if (!hasLastPageOver10 && page > 1) {
		console.log("Reptile Another");
		const newLink = link + `&page=${page - 1}`;
		const $p = await changeReptileTarget(200, newLink);

		qa = [...(await reptileRule($p)), ...qa];
	}
	return qa;
};

// update rules
const rulesUpdate = async (pageLink, originQa) => {
	console.log("!!!!!!!", originQa);
	// 查看最後page
	const $p = await changeReptileTarget(200, pageLink);
	const qa = await reptileRule($p, originQa);

	return [...originQa, ...qa].sort((a, b) => b.date.localeCompare(a.date));
};

// 爬RULE
const getRulesAndInfo = async (file, jud) => {
	const link = file.jud_link + "&sort=2";
	// console.log(link);
	// rules page 1
	const $ = await changeReptileTarget(200, link);

	// Get Info
	file.info = removeTN($("#supplement").text());
	// 看有幾頁page
	let page = 1;
	if ($(".page_num ").children().length <= 5) page = 5;
	else {
		page = parseInt(
			$(".page_num ").children().last().attr("href").split("(")[1]
		);
	}
	// console.log(page);
	const pageLink = link + `&page=${page}`;
	console.log(pageLink);

	// 第一次爬蟲
	if (!jud) file.qa = await firstReptile(page, pageLink, link);
	// 補新資料
	else file.qa = await rulesUpdate(pageLink, file.qa);

	return file;
};

// 爬日文資料
const getCardJpInfo = async (text, number) => {
	const urls = (str, type) =>
		`https://www.db.yugioh-card.com/yugiohdb/card_search.action?ope=1&sess=1&rp=10&mode=&sort=1&keyword=${str}&stype=${type}&ctype=&othercon=2&starfr=&starto=&pscalefr=&pscaleto=&linkmarkerfr=&linkmarkerto=&link_m=2&atkfr=&atkto=&deffr=&defto=&request_locale=ja`;

	const type = containsJapanese(text) ? 1 : 4;
	const tar = containsJapanese(text) ? encodeURIComponent(text) : text;
	const url = urls(tar, type);

	// origin link
	const $ = await changeReptileTarget(200, url);

	if (!$(".link_value").attr("value")) {
		return false;
	}

	const oldLink = `https://www.db.yugioh-card.com${$(".link_value").attr(
		"value"
	)}&request_locale=ja`;
	// 補足情報
	let info = {
		number,
		name_jp_h: "",
		name_jp_k: "",
		name_en: "",
		effect_jp: "",
		jud_link: "",
		info: "",
		qa: [],
	};

	// old Link
	const $o = await changeReptileTarget(300, oldLink);

	const card_name = $o("#cardname")
		.children("h1")
		.text()
		.split("\n\t\n\t\t\t")
		.filter((el) => el);
	// console.log(number, card_name);
	if (card_name[0]) info.name_jp_h = removeTN(card_name[0]);
	if (card_name[1]) info.name_jp_k = removeTN(card_name[1]);
	if (card_name[2]) info.name_en = removeTN(card_name[2]);

	info.effect_jp = removeTN(
		$o(".item_box_text").text().split("\n\t\t\t\t\t\n\t\t\t\t\t")[2]
	);
	// console.log(info.effect_jp);

	const newLink = oldLink.replace(
		"card_search.action?ope=2",
		"faq_search.action?ope=4"
	);
	info.jud_link = newLink;

	return info;
};

// 執行程式 : 爬新資料(有日文) - 新建檔案 後續備存
const hasJp = async () => {
	const allData = fs.readdirSync("./rules").map((x) => `./rules/${x}`);

	for (let i = 0; i < allData.length; i++) {
		const file = JSON.parse(fs.readFileSync(allData[i]).toString());
		fs.writeFileSync(
			allData[i],
			JSON.stringify(await getRulesAndInfo(file, 0), null, 2)
		);
	}
};

// 執行程式 : 爬新資料(無日文) - 新增number時使用
const noJp = async (numbers) => {
	const cards = Object.values(
		(
			await MongooseCRUD("R", "cards", {}, {}, { id: 1, number: 1, _id: 0 })
		).reduce((accumulator, card) => {
			// 如果累加器中已經有這個number，則將id添加到對應的ids陣列中
			if (accumulator[card.number]) {
				accumulator[card.number].ids.push(card.id);
			} else {
				// 如果累加器中沒有這個number，則創建一個新條目
				accumulator[card.number] = { number: card.number, ids: [card.id] };
			}
			return accumulator;
		}, {})
	).filter((x) => numbers.find((y) => y === x.number));

	for (let i = 0; i < cards.length; i++) {
		const card = cards[i];

		let errorCount = 0;
		let info;
		for (let j = 0; j < card.ids.length; j++) {
			const id = card.ids[j];
			if ((info = await getCardJpInfo(id, card.number))) break;
			else errorCount++;
		}

		// 改成寫到資料庫
		fs.writeFileSync(
			`./rules/__${card.number}.json`,
			JSON.stringify(info, null, 2)
		);
	}
};

// 執行程式 : 更新資料  - 既有資料庫取用
const hasJPUpdate = async () => {
	const allData = fs.readdirSync("./rules").map((x) => `./rules/${x}`);

	for (let i = 0; i < allData.length; i++) {
		// console.log(allData[i]);
		const file = JSON.parse(fs.readFileSync(allData[i]).toString());
		fs.writeFileSync(
			allData[i],
			JSON.stringify(await getRulesAndInfo(file, 1), null, 2)
		);
	}
	console.log("over");
};
