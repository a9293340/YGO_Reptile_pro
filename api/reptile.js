import request from 'request-promise';
import * as cheerio from 'cheerio';
import iconv from 'iconv-lite';
import chalk from 'chalk';
import fs from 'fs';
import {Iconv} from 'iconv'
const iconv2Big5 = new Iconv('utf8', 'BIG5');
const options = JSON.parse(fs.readFileSync('./database/options.json'))
const cardInfoObj = {
	"number": "",
	"name": "",
	"type": "",
	"race": "",
	"star": "",
	"attribute": "",
	"rarity": [],
	"atk": '',
	"def": '',
	"product_information_type_id": 0,
	"id": '',
	"effect": "",
	"photo": "",
	"price_info": [
	  {
		"time": "",
		"price": 0
	  }
	],
}
let jud;

// Api
const ygo = async (pic) => {
    let a = request({
        url: 'http://220.134.173.17/gameking/card/ocg_list.asp',
        method:'POST',
        form: {
            form_data13: `${pic}`,
        },
        encoding: null
    })
    return a

}

const yog_img = async(url) => {
    let a = request({
        url: `http://220.134.173.17/gameking/card/${url}`,
        method:'GET',
        encoding: null
    })
    return a
}

const delay = async (time) => {
    return new Promise((resolve) => {
        setTimeout(resolve, time);
    });
}

function big5_encode(chr) {
    var rtn = "";
    var buf = iconv2Big5.convert(chr);
    for(var i=0;i<buf.length;i+=2) {
        rtn += '%' + buf[i].toString(16).toUpperCase();
        rtn += ((buf[i+1] >= 65 && buf[i+1] <= 90)
            ||(buf[i+1]>=97 && buf[i+1]<=122))
            ? String.fromCharCode(buf[i+1])
            : '%' + buf[i+1].toString(16).toUpperCase();
    }
    return rtn;
}
// 


export const reptile = async (file) => {
	console.log(chalk.blue.bold('Start Reptile'));
	let final = []


	// function
	const toSplit = (str) => str.text().split('　').filter(el => el); 
	const getStr = (nn) => {return nn.substring(0,nn.length - 1)}
	const jud_correct_info = (text) => 
		options.attribute.find(el => text.indexOf(el) !== -1) ? 1 :
			options.rare.find(el => text.indexOf(el) !== -1) ? 2 : 0
	const getDesc = async (rarity,$) => {
		const effect_url = await yog_img($(rarity).children().attr('href'));
		const effect_body = iconv.decode(Buffer.from(effect_url), 'Big5');
		const $x = cheerio.load(effect_body);
		const desc = $x('tr[bgcolor="#E8F4FF"] td[width="80%"]')
		let str = ''
		$x(desc).each((nn,des)=>{
			if(nn) str += $x(des).text();
		})
		return str;
	}
	const makeMoreData = (cardInfo,card_id_arr,card_product_information_type_arr,card_rarity_arr) => {
		let arr = []
		for (let i = 0; i < card_id_arr.length; i++) {
			const card_id = card_id_arr[i];
			const card_product_information_type = card_product_information_type_arr[i];
			const card_rarity = card_rarity_arr[i];
			if(arr.find(el => 
				el.product_information_type === card_product_information_type &&
				el.rarity.find(x => x !== card_rarity)
			)){
				let set = arr.findIndex(el => el.product_information_type === card_product_information_type)
				arr[set].rarity.push(card_rarity)
			}else{
				const cp = JSON.parse(JSON.stringify(cardInfo));
				cp.id = card_id;
				cp.product_information_type = card_product_information_type;
				cp.rarity.push(card_rarity)
				arr.push(cp)
			}
			
		}

		return arr;
	}
	// 
	let errorbox = file.errorList;
	for (let set = 0; set < file.lastAdd.length; set++) {
		let cardInfo = JSON.parse(JSON.stringify(cardInfoObj));
		let trigger = true;
		let card_id_arr = []
		let card_product_information_type_arr = []
		let card_rarity_arr = [];
		cardInfo.number = file.lastAdd[set];
		try {
			await ygo(cardInfo.number).then(async (sus) => {
				const body = iconv.decode(Buffer.from(sus), 'Big5');
				const $ = cheerio.load(body);
				// 卡號 (多)
				card_id_arr = toSplit($('tr[bgcolor="#E8F4FF"] td[width="09%"][align="center"]'))
				// 產品包代號(多)
				card_product_information_type_arr = card_id_arr.map(el => el.split('-')[0]);
	
				// 卡名
				cardInfo.name = toSplit($('tr[bgcolor="#E8F4FF"] td[width="22%"][align="center"]'))[0]
	
				// 稀有度 (多)& 屬性
				const rarity_attribute = $('tr[bgcolor="#E8F4FF"] td[width="05%"][align="center"]')
				for (let i = 0; i < rarity_attribute.length; i++) {
					const rarity = rarity_attribute[i];
					if(jud = jud_correct_info($(rarity).text()))
						jud === 1 ? cardInfo.attribute = getStr($(rarity).text()) : card_rarity_arr.push(getStr($(rarity).text()));
					else if($(rarity).text() === '內容'){
						if(cardInfo.effect === ''){
							cardInfo.effect = await getDesc(rarity,$)
						}
					}
					await delay(Math.random()*100)
				}
	
				// 星數
				cardInfo.star = toSplit($('tr[bgcolor="#E8F4FF"] td[width="06%"][align="center"]'))[0]
	
				// 種族 & 分類
				const card_race = $('tr[bgcolor="#E8F4FF"] td[width="10%"][align="center"]')
				for (let i = 0; i < card_race.length; i++) {
					const types = getStr($(card_race[i]).text());
					if(i < 2){
						(options.type.find(el => el === types)) ?
						cardInfo.race = types :
						cardInfo.type = types
					}else break;
				}
	
				// 攻擊 & 防禦
				const card_atk = $('tr[bgcolor="#E8F4FF"] td[width="07%"][align="center"]')
				for (let i = 0; i < card_atk.length; i++) {
					const info = getStr($(card_atk[i]).text());
					if(cardInfo.def === '' || cardInfo.atk === ''){
						(i % 2) === 1 ? cardInfo.def = info : cardInfo.atk = info
					}else break;				
				}
			})
		} catch (error) {
			console.log(chalk.bgRedBright(`${cardInfo.number} ${cardInfo.name} Data Path Error!`))
			trigger = false
		}

		if(trigger){
			let finalData = makeMoreData(cardInfo,card_id_arr,card_product_information_type_arr,card_rarity_arr)
			final = [...final, ...finalData];
			console.log(`Get Card`,chalk.bgMagenta(` ${cardInfo.number} - ${cardInfo.name}`),` Success!`)
		}
		else{
			errorbox.push(cardInfo.number);
			console.log(`Get Card`,chalk.bgRed(` ${cardInfo.number}`),` no this card id!`)
		}


		await delay(Math.random()*100)
	}

	if(errorbox.length > file.errorList.length){
		file.errorList.length = errorbox ;
		fs.writeFileSync('./database/options.json',JSON.stringify(file))
	}


	return final;
};

