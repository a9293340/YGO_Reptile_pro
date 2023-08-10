import {
  useReptile2Split,
  useReptileByForm,
  useReptileTargetUrl,
  useReptile2Str,
} from './api/reptile/index.js';
import iconv from 'iconv-lite';
import * as cheerio from 'cheerio';
import fs from 'fs';
import chalk from 'chalk';
import gradient from 'gradient-string';
import { createSpinner } from 'nanospinner';
import { useBig5_encode, useDelay } from './api/tools/index.js';
import MongooseCRUD from './api/MongoDb/Api.js';
import img2base from 'image-to-base64';
import { reptileCardInfo } from './api/reptile.js';
import webp from 'webp-converter';

let box = [];
let errorBox = [];

const cardInfoObj = {
  number: '',
  name: '',
  type: '',
  race: '',
  star: '',
  attribute: '',
  rarity: [],
  atk: '',
  def: '',
  id: '',
  effect: '',
  price_info: [],
  price_yuyu: [],
};

const transferRarityArr = [
  {
    from: '紅鑽',
    to: '紅字半鑽',
  },
  {
    from: '凸版浮雕',
    to: '浮雕',
  },
  {
    from: '20th紅鑽',
    to: '紅鑽',
  },
  {
    from: '25th金鑽',
    to: '金鑽',
  },
  {
    from: '金亮KC紋',
    to: 'KC紋',
  },
  {
    from: '普卡字紋鑽',
    to: '古文鑽',
  },
  {
    from: '銀字字紋鑽',
    to: '銀字KC紋',
  },
  {
    from: '亮面字紋鑽',
    to: '古文鑽',
  },
  {
    from: '金亮字紋鑽',
    to: '古文鑽',
  },
  {
    from: '黃金字紋鑽',
    to: '古文鑽',
  },
  {
    from: '半鑽字紋鑽',
    to: '古文鑽',
  },
  {
    from: '普卡放射鑽',
    to: '古文鑽',
  },
  {
    from: '普卡粉鑽',
    to: '普鑽',
  },
  {
    from: '亮面粉鑽',
    to: '粉鑽',
  },
  {
    from: '金亮粉鑽',
    to: '粉鑽',
  },
  {
    from: '普卡彩鑽',
    to: '普鑽',
  },
  {
    from: '斜鑽彩鑽',
    to: '斜鑽',
  },
  {
    from: '雷射彩鑽',
    to: '雷射',
  },
  {
    from: '普卡點鑽',
    to: '點鑽',
  },
  {
    from: '隱普點鑽',
    to: '點鑽',
  },
  {
    from: '普卡碎鑽',
    to: '碎鑽',
  },
  {
    from: '隱普碎鑽',
    to: '碎鑽',
  },
  {
    from: '普卡方鑽',
    to: '方鑽',
  },
  {
    from: '隱普方鑽',
    to: '方鑽',
  },
  {
    from: '其他',
    to: '不鏽鋼',
  },
];
const options = JSON.parse(fs.readFileSync('./database/options.json'));

const RarityTransfer = r =>
  transferRarityArr.findIndex(el => el.from === r) === -1
    ? r
    : transferRarityArr.find(el => el.from === r).to;

async function main5() {
  let card_names = [];
  await useReptileByForm('http://220.134.173.17/gameking/card/ocg_list.asp', {
    form_data8: '1',
  }).then(async sus => {
    const body = iconv.decode(Buffer.from(sus), 'Big5');
    const $ = cheerio.load(body);
    const page = $('tr[bgcolor="#C1E0FF"] > td > select').first().children().length;
    console.log(page);
    for (let p = 0; p < page; p++) {
      const pageUrl =
        'http://220.134.173.17/gameking/card/ocg_list.asp' +
        `?call_item=8&call_data=1&call_sql=Select%20*%20from%20ocg%20where%20ocg_attack%20>=%201%20and%20ocg_attack%20<=%201%20order%20by%20ocg_attack%20asc&Page=${
          p + 1
        }`;
      const res = await useReptileTargetUrl(pageUrl);
      const bodyS = iconv.decode(Buffer.from(res), 'Big5');
      const $s = cheerio.load(bodyS);
      const namesInfo = useReptile2Split(
        $s('tr[bgcolor="#E8F4FF"] td[width="08%"][align="center"]'),
      ).filter(el => el !== '-');
      card_names = [...card_names, ...namesInfo];
    }
  });
  fs.writeFileSync('./database/updateQN.json', JSON.stringify(card_names));
}

async function main6() {
  const pic = fs.readdirSync('./pics').map(el => el.split('.')[0].padStart(8, '0'));
  const a = JSON.parse(fs.readFileSync('./database/updateQN.json').toString());
  let data = [...new Set(a)];
  const file = {
    errorList: [],
    lastAdd: data,
    existed: [],
    type: 'jpg',
  };
  reptileCardInfo(file);
}

async function main() {
  let card_names = [];
  await useReptileByForm('http://220.134.173.17/gameking/card/ocg_list.asp', {
    form_data13: '-',
  }).then(async sus => {
    const body = iconv.decode(Buffer.from(sus), 'Big5');
    const $ = cheerio.load(body);
    const page = $('tr[bgcolor="#C1E0FF"] > td > select').first().children().length;
    // console.log(page);
    for (let p = 0; p < page; p++) {
      const pageUrl =
        'http://220.134.173.17/gameking/card/ocg_list.asp' +
        `?call_item=13&call_data=-&call_sql=Select%20*%20from%20ocg%20where%20ocg_password%20=%20%27-%27%20order%20by%20ocg_no%20asc&Page=${
          p + 1
        }`;
      const res = await useReptileTargetUrl(pageUrl);
      const bodyS = iconv.decode(Buffer.from(res), 'Big5');
      const $s = cheerio.load(bodyS);
      const namesInfo = useReptile2Split(
        $s('tr[bgcolor="#E8F4FF"] td[width="22%"][align="center"]'),
      );
      const card_race = $s('tr[bgcolor="#E8F4FF"] td[width="10%"][align="center"]');

      for (let j = 0; j < namesInfo.length; j++) {
        // if (j) break;
        const tarName = namesInfo[j];
        const tarRace = $s(card_race[j * 2])
          .text()
          .trim();
        if (
          tarRace !== '' &&
          tarRace !== '代幣' &&
          tarRace !== '無' &&
          !card_names.find(x => x === tarName)
        ) {
          card_names.push(tarName);
          const tart = $s('tr[bgcolor="#E8F4FF"] td[width="05%"][bgcolor="#ffff99"]');
          const src = $s(tart[j]).children().attr('href');
          // console.log('!!!', src);
          await goNext(src);
        }
      }
      // console.log(p + 1);
    }

    fs.writeFileSync('./database/updateName.json', JSON.stringify(card_names));
    fs.writeFileSync('./database/updateInfo.json', JSON.stringify(box));
    fs.writeFileSync('./database/updateError.json', JSON.stringify(errorBox));
  });
}

const goNext = async src => {
  const effect_url = await useReptileTargetUrl(`http://220.134.173.17/gameking/card/${src}`);
  const effect_body = iconv.decode(Buffer.from(effect_url), 'Big5');
  const $x = cheerio.load(effect_body);
  const links = $x('center').children().attr('href');
  // console.log(links);
  await gogo(links);
};

const gogo = async src => {
  let Cname = '';
  try {
    src = src
      .split('=')
      .map((s, e) => {
        if (e === 2) Cname = s;
        return e === 2 ? useBig5_encode(s) : s;
      })
      .join('=');
    try {
      const effect_url = await useReptileTargetUrl(`http://220.134.173.17/gameking/card/${src}`);
      const effect_body = iconv.decode(Buffer.from(effect_url), 'Big5');
      const $ = cheerio.load(effect_body);
      await reptileCardInfo(Cname, $);
    } catch (error) {
      console.log('!!!!!!', Cname);
      errorBox.push(Cname);
    }
  } catch (e) {
    errorBox.push(Cname);
  }
};

// export const reptileCardInfo = async (Cname, $) => {
//   console.log(gradient.rainbow('Start Reptile Cards Information'));
//   //! function
//   const jud_correct_info = text =>
//     options.attribute.find(el => text.indexOf(el) !== -1)
//       ? 1
//       : options.rareAll.find(el => text.indexOf(el) !== -1)
//       ? 2
//       : 0;
//   const getDesc = async (rarity, $) => {
//     const effect_url = await useReptileTargetUrl(
//       `http://220.134.173.17/gameking/card/${$(rarity).children().attr('href')}`,
//     );
//     const effect_body = iconv.decode(Buffer.from(effect_url), 'Big5');
//     const $x = cheerio.load(effect_body);
//     const desc = $x('tr[bgcolor="#E8F4FF"] td[width="80%"]');
//     let str = '';
//     $x(desc).each((nn, des) => {
//       if (nn) str += $x(des).text();
//     });
//     return str;
//   };
//   const makeMoreData = (
//     cardInfo,
//     card_id_arr,
//     card_product_information_type_arr,
//     card_rarity_arr,
//     names,
//   ) => {
//     let arr = [];
//     for (let i = 0; i < card_id_arr.length; i++) {
//       const card_id = card_id_arr[i];
//       const card_product_information_type = card_product_information_type_arr[i];
//       const coolName = names[i].indexOf('異圖') !== -1;
//       const card_rarity = `${coolName ? '異圖-' : ''}${RarityTransfer(card_rarity_arr[i])}`;
//       if (
//         arr.find(
//           el =>
//             el.product_information_type === card_product_information_type &&
//             el.rarity.find(x => x !== card_rarity) &&
//             el.id === card_id,
//         )
//       ) {
//         const set = arr.findIndex(el => el.id === card_id);
//         if (arr[set].rarity.findIndex(el => el === card_rarity) === -1)
//           arr[set].rarity.push(card_rarity);
//       } else {
//         const cp = JSON.parse(JSON.stringify(cardInfo));
//         cp.id = card_id;
//         cp.product_information_type = card_product_information_type;
//         cp.rarity.push(card_rarity);
//         arr.push(cp);
//       }
//     }
//     return arr;
//   };

//   const errorControl = (spinner, cardInfo) =>
//     spinner
//       .error({
//         text: `Card Number : ${chalk.white.bgRed(`${Cname} is not existed!`)}`,
//       })
//       .clear();

//   const checkIdRules = str => {
//     while (/[A-Za-z]$/.test(str)) {
//       str = str.substring(0, str.length - 1);
//     }
//     return str;
//   };

//   //
//   // let errorBox = file.errorList;

//   let cardInfo = JSON.parse(JSON.stringify(cardInfoObj));
//   let card_id_arr = [];
//   let card_product_information_type_arr = [];
//   let card_rarity_arr = [];
//   let names = [];
//   cardInfo.number = '';
//   const spinner = createSpinner().start({
//     text: `Get Card Number : ${chalk.whiteBright.bgMagenta(Cname)}  Information`,
//   });
//   try {
//     //! 卡名
//     cardInfo.name = useReptile2Split($('tr[bgcolor="#E8F4FF"] td[width="22%"][align="center"]'))[0];
//     if (cardInfo.name === undefined) {
//       errorControl(spinner, cardInfo);
//       // errorBox.push(cardInfo.number);
//       return;
//     }
//     //! 星數
//     cardInfo.star = useReptile2Split($('tr[bgcolor="#E8F4FF"] td[width="06%"][align="center"]'))[0];

//     //! 種族 & 分類
//     const card_race = $('tr[bgcolor="#E8F4FF"] td[width="10%"][align="center"]');
//     for (let i = 0; i < card_race.length; i++) {
//       if (i > 2) break;

//       const types = useReptile2Str($(card_race[i]).text());
//       options.type.find(el => el === types) ? (cardInfo.race = types) : (cardInfo.type = types);
//     }

//     //! 攻擊 & 防禦
//     const card_atk = $('tr[bgcolor="#E8F4FF"] td[width="07%"][align="center"]');
//     for (let i = 0; i < card_atk.length; i++) {
//       if (!(cardInfo.def === '' || cardInfo.atk === '')) break;

//       const info = useReptile2Str($(card_atk[i]).text());
//       i % 2 === 1 ? (cardInfo.def = info) : (cardInfo.atk = info);
//     }

//     //! page
//     const page = $('tr[bgcolor="#C1E0FF"] > td > select').first().children().length;
//     for (let p = 0; p < page; p++) {
//       const pageUrl =
//         'http://220.134.173.17/gameking/card/ocg_list.asp' +
//         `?call_item=60&call_data=${useBig5_encode(
//           Cname,
//         )}&call_sql=Select%20*%20from%20ocg%20where%20ocg_name%20=%20%27${useBig5_encode(
//           Cname,
//         )}%27%20order%20by%20ocg_no%20asc&Page=${p + 1}`;
//       const res = await useReptileTargetUrl(pageUrl);
//       const bodyS = iconv.decode(Buffer.from(res), 'Big5');
//       const $s = cheerio.load(bodyS);
//       //! 所有名稱
//       names = [
//         ...names,
//         ...useReptile2Split($('tr[bgcolor="#E8F4FF"] td[width="22%"][align="center"]')),
//       ];
//       //! 卡號 (多)
//       card_id_arr = [
//         ...card_id_arr,
//         ...useReptile2Split($s('tr[bgcolor="#E8F4FF"] td[width="09%"][align="center"]')).map(el =>
//           checkIdRules(el),
//         ),
//       ];
//       //! 稀有度 (多)& 屬性
//       const rarity_attribute = $s('tr[bgcolor="#E8F4FF"] td[width="05%"][align="center"]');
//       for (let i = 0; i < rarity_attribute.length; i++) {
//         const rarity = rarity_attribute[i];
//         if (jud_correct_info($s(rarity).text()))
//           jud_correct_info($s(rarity).text()) === 1
//             ? (cardInfo.attribute = useReptile2Str($s(rarity).text()))
//             : card_rarity_arr.push(useReptile2Str($s(rarity).text()));
//         else if ($s(rarity).text() === '內容' && cardInfo.effect === '')
//           cardInfo.effect = await getDesc(rarity, $s);
//         await useDelay(Math.random() * 100);
//       }
//     }
//     //! 產品包代號(多)
//     card_product_information_type_arr = card_id_arr.map(el => el.split('-')[0]);

//     const finalData = makeMoreData(
//       cardInfo,
//       card_id_arr,
//       card_product_information_type_arr,
//       card_rarity_arr,
//       names,
//     );
//     // console.log(finalData);
//     box = [...box, ...finalData];
//     const text = `Get Card ${chalk.whiteBright.bgGreen(
//       ` ${cardInfo.number} - ${cardInfo.name}`,
//     )} Success! `;
//     spinner.success({ text }).clear();
//   } catch (error) {
//     // console.log(error);
//     errorBox.push(Cname);
//     errorControl(spinner, cardInfo);
//     // errorBox.push(cardInfo.number);
//   }
//   await useDelay(Math.random() * 100);
// };

// function test() {
// 	console.log(useBig5_encode('太陽神的翼神龍-球體形'));
// }

// test();

//

async function main2() {
  let data = JSON.parse(fs.readFileSync('./database/updateInfo.json').toString());
  console.log(data.length);
  let err = [];
  for (let i = 0; i < data.length; i++) {
    const target = data[i].name;

    const dbData = await MongooseCRUD('R', 'cards', { name: target });

    if (dbData.length) err.push(i);
  }
  data = data.filter((el, i) => !err.find(x => x === i));
  fs.writeFileSync('./database/updateInfo2.json', JSON.stringify(data));
}

async function main3() {
  let data = JSON.parse(fs.readFileSync('./database/updateInfo2.json').toString());
  console.log(data.length);
  let err = [];
  for (let i = 0; i < data.length; i++) {
    const target = data[i].product_information_type;

    if (target.indexOf('RD/') !== -1) err.push(i);
  }
  data = data.filter((el, i) => !err.find(x => x === i));
  fs.writeFileSync('./database/updateInfo3.json', JSON.stringify(data));
}

async function main4() {
  const pic = fs.readdirSync('./pics').map(el => el.split('.')[0].padStart(8, '0'));
  let data = JSON.parse(fs.readFileSync('./database/updateError1.json').toString());
  for (let i = 0; i < data.length; i++) {
    const target = data[i];
    if (!pic.find(el => el === target.number)) console.log(target.name);
    else {
      const checkCards = await MongooseCRUD('R', 'cards', {
        id: target.id,
      });
      console.log(!checkCards.length);
      if (!checkCards.length) {
        const a = await MongooseCRUD('C', 'cards', target);
        console.log(a);
      }

      const numberX = `${parseInt(target.number)}`;
      const check = await MongooseCRUD('R', 'cards_image', {
        number: target.number,
      });
      if (!check.length)
        await MongooseCRUD('C', 'cards_image', {
          number: target.number,
          photo: `data:image/jpeg;base64,${await img2base(`./pics/${numberX}.jpg`)}`,
        });
      console.log(`${target.id}-${target.name} ok!`);
      // await useDelay(300);
    }
  }
}

// main6();

async function img2Webp() {
  let err = [];
  const trans = str => str.padStart(8, '0');
  const data = fs.readdirSync('./pics').map(el => el.split('.')[0]);
  const all = await MongooseCRUD(
    'R',
    'cards_image',
    { number: data.map(el => trans(el)) },
    {},
    { photo: 0 },
  );
  for (let i = 0; i < data.length; i++) {
    if (!all.find(el => el.number === trans(data[i]))) {
      await webp.cwebp(`./pics/${data[i]}.jpg`, `./pic2/${data[i]}.webp`, '-q 80');
      console.log(data[i], '     GooD!');
    } else {
      console.log(data[i], '     BaD!');
    }
  }
}

async function ImgToDB() {
  const data = fs.readdirSync('./pic2').map(el => el.split('.')[0]);
  // console.log(data);
  for (let i = 0; i < data.length; i++) {
    const base64 = `data:image/webp;base64,${fs
      .readFileSync(`./pic2/${data[i]}.webp`)
      .toString('base64')}`;

    const number = data[i].padStart(8, '0');
    await MongooseCRUD('C', 'cards_image', { photo: base64, number });
    console.log(number, '    Done!');
    await useDelay(100);
  }
}

async function getID() {
  await useReptileByForm('http://220.134.173.17/gameking/card/ocg_list.asp', {
    form_data1: 'SD46',
  }).then(async sus => {
    const body = iconv.decode(Buffer.from(sus), 'Big5');
    const $ = cheerio.load(body);
    const page = $('tr[bgcolor="#C1E0FF"] > td > select').first().children().length;
    console.log(page);
    let card_names = [];
    for (let p = 0; p < page; p++) {
      const pageUrl = `http://220.134.173.17/gameking/card/ocg_list.asp?call_item=1&call_data=SD46&call_sql=Select%20*%20from%20ocg%20where%20ocg_no%20like%20%27AC03%A2H%27%20order%20by%20ocg_no%20asc&Page=${
        p + 1
      }`;
      const res = await useReptileTargetUrl(pageUrl);
      const bodyS = iconv.decode(Buffer.from(res), 'Big5');
      const $s = cheerio.load(bodyS);
      const namesInfo = useReptile2Split(
        $s('tr[bgcolor="#E8F4FF"] td[width="08%"][align="center"]'),
      ).filter(el => el !== '-');
      card_names = [...card_names, ...namesInfo];
      console.log(p + 1, 'done');
    }
    const result = [...new Set(card_names)];

    console.log(result);
    fs.writeFileSync('./database/cards_id.json', JSON.stringify(result));
  });
}

// getID();
// img2Webp();
ImgToDB();
