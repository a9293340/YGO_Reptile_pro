import axios from "axios";
import gradient from "gradient-string";
import { createSpinner } from "nanospinner";
import chalk from "chalk";
import { useDelay } from "./tools/index.js";
import dayjs from "dayjs";
import MongooseCRUD from "../api/MongoDb/Api.js";

const price_temp = {
	time: null,
	rarity: "",
	price_lowest: 0,
	price_avg: 0,
};

//! API

function calculatePrices(prices) {
	// 檢查原始陣列長度
	if (prices.length < 4) {
		const minPrice = Math.min(...prices);
		// 長度小於4時，最小值和最小平均值相等
		return { minPrice, averagePrice: minPrice };
	}
	const filteredPrices = removeOutliersIQR(prices).sort((a, b) => a - b);
	const minPrice = Math.min(...filteredPrices);
	let averagePrice;

	if (filteredPrices.length < 3) {
		averagePrice = minPrice;
	} else {
		const oneThirdLength = Math.ceil(filteredPrices.length / 3);
		const lowestPrices = filteredPrices.slice(0, oneThirdLength);
		averagePrice = Math.floor(
			lowestPrices.reduce((sum, price) => sum + price, 0) / oneThirdLength
		);
	}

	return { minPrice, averagePrice };
}

function removeOutliersIQR(prices) {
	const sortedPrices = prices.slice().sort((a, b) => a - b);
	const q1 = sortedPrices[Math.floor(sortedPrices.length / 4)];
	const q3 = sortedPrices[Math.ceil(sortedPrices.length * (3 / 4))];
	const iqr = q3 - q1;

	return sortedPrices.filter(
		(price) => price >= q1 - 1.5 * iqr && price <= q3 + 1.5 * iqr
	);
}

const rarityWordsFunction = (rar) => {
	if (rar === "普卡" && rarity.length === 1) return "";
	if (rar.indexOf("異圖") !== -1) return "+" + rar.replace("-", "+");
	if (["方鑽", "點鑽"].find((el) => el === rar)) return "+普卡";
	else if (["凸版浮雕", "浮雕"].find((el) => el === rar)) return "+浮雕";
	else if (["20th紅鑽", "紅鑽"].find((el) => el === rar)) return "+紅鑽";
	else if (["25th金鑽", "金鑽"].find((el) => el === rar)) return "+金鑽";
	else if (["金亮KC紋"].find((el) => el === rar)) return "+KC";
	else if (["普卡放射鑽"].find((el) => el === rar)) return "+" + tar;
	else if (rar.indexOf("字紋鑽") !== -1) return "+字紋鑽";
	else if (rar.indexOf("粉鑽") !== -1) return "+粉鑽";
	else if (rar.indexOf("彩鑽") !== -1) return "+彩鑽";
	else if (rar.indexOf("方鑽") !== -1)
		return rar.replace("方鑽", "") === "普卡" ||
			rar.replace("方鑽", "") === "銀字" ||
			rar.replace("方鑽", "") === "隱普"
			? ""
			: "+方鑽" + `+${rar.replace("方鑽", "")}`;
	else if (rar.indexOf("點鑽") !== -1)
		return rar.replace("點鑽", "") === "普卡" ||
			rar.replace("點鑽", "") === "銀字" ||
			rar.replace("點鑽", "") === "隱普"
			? ""
			: "+點鑽" + `+${rar.replace("點鑽", "")}`;
	else if (rar.indexOf("碎鑽") !== -1)
		return rar.replace("碎鑽", "") === "普卡" ||
			rar.replace("碎鑽", "") === "銀字" ||
			rar.replace("碎鑽", "") === "隱普"
			? ""
			: "+碎鑽" + `+${rar.replace("碎鑽", "")}`;
	else return "+" + rar;
};

const checkWordsFunction = (tar, rar) => {
	// 異圖判斷
	if (rar.indexOf("異圖") !== -1) {
		const check = rar.split("");
		return tar.indexOf(check[0]) !== -1 && tar.indexOf(check[1]) !== -1;
	} else {
		if (["方鑽", "點鑽"].find((el) => el === rar))
			return tar.indexOf("普卡") !== -1;
		else if (["凸版浮雕", "浮雕"].find((el) => el === rar))
			return tar.indexOf("浮雕") !== -1;
		else if (["20th紅鑽", "紅鑽"].find((el) => el === rar))
			return tar.indexOf("紅鑽") !== -1;
		else if (["25th金鑽", "金鑽"].find((el) => el === rar))
			return tar.indexOf("金鑽") !== -1;
		else if (["金亮KC紋"].find((el) => el === rar))
			return tar.indexOf("KC") !== -1;
		else if (["普卡放射鑽"].find((el) => el === rar)) return tar;
		else if (rar.indexOf("字紋鑽") !== -1) return tar.indexOf("字紋鑽") !== -1;
		else if (rar.indexOf("粉鑽") !== -1) return tar.indexOf("粉鑽") !== -1;
		else if (rar.indexOf("彩鑽") !== -1) return tar.indexOf("彩鑽") !== -1;
		else if (rar.indexOf("方鑽") !== -1)
			return (
				tar.indexOf("方鑽") !== -1 &&
				(rar.replace("方鑽", "") === "普卡" ||
				rar.replace("方鑽", "") === "銀字" ||
				rar.replace("方鑽", "") === "隱普"
					? true
					: tar.indexOf(rar.replace("方鑽", "")) !== -1)
			);
		else if (rar.indexOf("點鑽") !== -1)
			return (
				tar.indexOf("點鑽") !== -1 &&
				(rar.replace("點鑽", "") === "普卡" ||
				rar.replace("方鑽", "") === "銀字" ||
				rar.replace("方鑽", "") === "隱普"
					? true
					: tar.indexOf(rar.replace("點鑽", "")) !== -1)
			);
		else if (rar.indexOf("碎鑽") !== -1)
			return (
				tar.indexOf("碎鑽") !== -1 &&
				(rar.replace("碎鑽", "") === "普卡" ||
				rar.replace("方鑽", "") === "銀字" ||
				rar.replace("方鑽", "") === "隱普"
					? true
					: tar.indexOf(rar.replace("碎鑽", "")) !== -1)
			);
		else return tar.indexOf(rar) !== -1;
	}
};

export const reptilePrice = async () => {
	console.log(gradient.rainbow("Start Reptile Cards Information"));
	let cardInfo = await MongooseCRUD(
		"R",
		"cards",
		{
			"price_info.time": {
				$not: new RegExp(dayjs().format("YYYY-MM-DD")),
			},
		},
		{},
		{ id: 1, rarity: 1, _id: 0 }
	);
	let errorBox = [];
	let failedIds = [];
	const startTime = new Date();
	// if (true) return;
	// TEMP 23
	for (let c = 0; c < cardInfo.length; c++) {
		// if (c !== 0) return;
		if (!c % 100 && c) await useDelay(5000);
		const number = cardInfo[c].id;
		const rarity = [...new Set(cardInfo[c].rarity)];
		let allPrice = [];
		let isFalse = 0;
		if (
			allPrice.find(
				(el) =>
					dayjs().format("YYYY-MM-DD") === dayjs(el.time).format("YYYY-MM-DD")
			)
		)
			continue;

		//! 銀亮 跳過
		if (rarity.find((el) => el === "銀亮")) continue;
		// if (number !== '301-051') continue;
		const spinner = createSpinner().start({
			text: `Get Card Number : ${chalk.whiteBright.bgMagenta(
				number
			)}  Price Information`,
		});

		try {
			for (let r = 0; r < rarity.length; r++) {
				await useDelay(500);
				isFalse = 0;
				const rar = rarity[r];
				let price = JSON.parse(JSON.stringify(price_temp));
				price.time = dayjs().format("YYYY-MM-DD HH:mm:ss");
				price.rarity = rar;
				const rarityWords = rarityWordsFunction(rar);
				const errorControls = (type) => {
					price[`price_${type}`] = null;
					isFalse++;
				};
				const searchURL = `http://rtapi.ruten.com.tw/api/search/v3/index.php/core/prod?q=${number}${rarityWords}&type=direct&sort=prc%2Fac&offset=1&limit=100`;
				const targets = (await axios.get(searchURL)).data.Rows.map(
					(el) => el.Id
				);
				if (targets.length) {
					const searchPriceURL = `http://rtapi.ruten.com.tw/api/prod/v2/index.php/prod?id=${targets.join(
						","
					)}`;
					let prices = (await axios.get(searchPriceURL)).data
						// 台幣
						.filter((el) => el.Currency === "TWD")
						// 有庫存
						.filter((el) => el.StockQty > el.SoldQty)
						// 卡號正確
						.filter((el) => el.ProdName.indexOf(number) !== -1)
						// 非同人卡
						.filter((el) => el.ProdName.indexOf("同人") === -1)
						.filter((el) => el.ProdName.indexOf("DIY") === -1)
						// 非福袋 雜項
						.filter((el) => el.ProdName.indexOf("福袋") === -1)
						.filter((el) => el.ProdName.indexOf("卡磚") === -1)
						.filter((el) => el.ProdName.indexOf("壓克力") === -1)
						.filter((el) => el.ProdName.indexOf("單螺絲卡夾") === -1)
						.filter((el) => el.ProdName.indexOf("全新未拆") === -1)
						.filter((el) => el.ProdName.indexOf("參考") === -1)
						// 非搜尋
						// .filter(el => el.ProdName.indexOf('搜') === -1)
						// 非未拆包
						.filter((el) => el.ProdName.indexOf("未拆包") === -1)
						// 卡號相同
						.filter((el) => el.ProdName.indexOf(number) !== -1);
					if (rarity.length > 1)
						// 稀有度相同
						prices = prices.filter((el) => checkWordsFunction(el, rar));
					prices = prices
						.map((el) => el.PriceRange[1])
						.filter((el) => Number.isInteger(el))
						.filter((el) => el < 100000);
					try {
						const { minPrice, averagePrice } = calculatePrices(prices);
						price.price_avg = averagePrice;
						price.price_lowest = minPrice;
					} catch (error) {
						errorControls("avg");
						errorControls("lowest");
					}

					if (!Number.isInteger(price.price_avg)) errorControls("avg");
					if (!Number.isInteger(price.price_lowest)) errorControls("lowest");
				} else {
					errorControls("avg");
					errorControls("lowest");
				}

				if (isFalse < 2) allPrice.push(price);
			}
		} catch (e) {
			// console.log(e);
			// isFalse = 2;
		}
		const totalSpendTime = `Total Spend ${chalk.bgGray(
			(new Date() - startTime) / 1000
		)} sec`;
		try {
			cardInfo[c].price_info = allPrice;
			// console.log(cardInfo[c]);
			const successWords = allPrice
				.slice(allPrice.length - rarity.length, allPrice.length)
				.map((el) => `${el.rarity}-${el.price_lowest}-${el.price_avg}`)
				.join(" / ");

			// Mongodb
			let tar = (
				await MongooseCRUD(
					"R",
					"cards",
					{ id: cardInfo[c].id },
					{ price_info: 1, id: 1 }
				)
			)[0];

			// 檢查異常值
			if (tar.price_info.length >= 3) {
				for (let i = 0; i < rarity.length; i++) {
					const rar = rarity[i];
					let prices = allPrice.filter((el) => el.rarity === rar)[0];
					const tar_prices = tar.price_info.filter((el) => el.rarity === rar);
					const avg_low = Math.floor(
						tar_prices
							.filter((el) => el.price_lowest !== "-")
							.reduce((a, b) => a + b.price_lowest, 0) / tar_prices.length
					);
					const avg_avg = Math.floor(
						tar_prices
							.filter((el) => el.price_avg !== "-")
							.reduce((a, b) => a + b.price_avg, 0) / tar_prices.length
					);
					if (
						avg_low * 1.7 <= prices.price_lowest ||
						avg_low * 0.35 >= prices.price_lowest
					) {
						allPrice[allPrice.findIndex((x) => x.rarity === rar)].price_lowest =
							"-";
					}
					if (
						avg_avg * 1.7 <= prices.price_avg ||
						avg_avg * 0.35 >= prices.price_avg
					) {
						allPrice[allPrice.findIndex((x) => x.rarity === rar)].price_avg =
							"-";
					}
				}
			}
			// console.log(allPrice);
			// return;
			tar.price_info = [...tar.price_info, ...allPrice];
			let upload = true;
			if (allPrice.length > 0) {
				try {
					await MongooseCRUD(
						"Uo",
						"cards",
						{ id: cardInfo[c].id },
						{ price_info: tar.price_info }
					);
				} catch (error) {
					upload = false;
				}
				await useDelay(100);
			} else upload = false;

			if (!upload) {
				spinner
					.error({
						text: `Card Number : ${chalk.white.bgRed(
							`${number} upload failed!`
						)}`,
					})
					.clear();
				failedIds.push(number);
			} else
				allPrice.length > 0
					? spinner
							.success({
								text: `Get Card ${chalk.whiteBright.bgGreen(
									` ${number}`
								)} Price Success! (${successWords}) Current progress [${
									c + 1
								}/${cardInfo.length}] ${chalk.blue(
									` ${
										parseInt(((c + 1) / cardInfo.length) * 1000000) / 10000
									}% `
								)} ${totalSpendTime} `,
							})
							.clear()
					: spinner
							.error({
								text: `Card Number : ${chalk.white.bgRed(
									`${number} can not reptile price!`
								)} Current progress [${c + 1}/${cardInfo.length}] ${chalk.blue(
									` ${
										parseInt(((c + 1) / cardInfo.length) * 1000000) / 10000
									}% `
								)} ${totalSpendTime}`,
							})
							.clear();
		} catch (error) {
			spinner
				.error({
					text: `Card Number : ${chalk.white.bgCyanBright(
						`${number} upload Failed!`
					)} Current progress [${c + 1}/${cardInfo.length}] ${chalk.blue(
						` ${parseInt(((c + 1) / cardInfo.length) * 1000000) / 10000}% `
					)} ${totalSpendTime}`,
				})
				.clear();
			errorBox.push({
				number: cardInfo[c].number,
			});
		}
	}

	console.log(
		chalk.bgBlue(`Total Spend ${(new Date() - startTime) / 1000} sec !`)
	);
	return {
		cardInfo,
		errorBox,
		failedIds,
	};
};
