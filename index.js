import fs from 'fs';
import { reptile } from './api/reptile.js';

const checkCardNumber = file => 
	fs
	.readdirSync('./pics')
	.map((el) => el.split('.')[0].padStart(8, '0')).filter((el) => file.existed.findIndex((x) => x === el) === -1);

const updatedJson = (newData, file) => {
	if (!newData.length) return;
	file.existed = [...file.existed, ...newData];
	file.lastAdd = newData;
	fs.writeFileSync('./database/card_number.json', JSON.stringify(file));
};

async function main() {
	const file = JSON.parse(fs.readFileSync('./database/card_number.json'));
	// 判斷卡號是否完整，否則更新
	const newData = checkCardNumber(file);
	console.log(newData)
	// 把新增的卡號紀錄在JSON中
	updatedJson(newData, file);
	// 爬蟲
	await reptile(file);
}

main();
