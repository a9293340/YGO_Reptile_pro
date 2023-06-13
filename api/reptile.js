import * as cheerio from 'cheerio';
import iconv from 'iconv-lite';
import chalk from 'chalk';
import fs from 'fs';
import { useBig5_encode, useDelay } from './tools/index.js';
import gradient from 'gradient-string';
import { createSpinner } from 'nanospinner';
import img2base from 'image-to-base64';
import {
  useReptile2Split,
  useReptileByForm,
  useReptileTargetUrl,
  useReptile2Str,
} from './reptile/index.js';
import MongooseCRUD from '../api/MongoDb/Api.js';
const options = JSON.parse(fs.readFileSync('./database/options.json'));
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

const RarityTransfer = r =>
  transferRarityArr.findIndex(el => el.from === r) === -1
    ? r
    : transferRarityArr.find(el => el.from === r).to;

export const reptileCardInfo = async file => {
  console.log(gradient.rainbow('Start Reptile Cards Information'));
  let final = [];
  //! function
  const jud_correct_info = text =>
    options.attribute.find(el => text.indexOf(el) !== -1)
      ? 1
      : options.rareAll.find(el => text.indexOf(el) !== -1)
      ? 2
      : 0;
  const getDesc = async (rarity, $) => {
    const effect_url = await useReptileTargetUrl(
      `http://220.134.173.17/gameking/card/${$(rarity).children().attr('href')}`,
    );
    const effect_body = iconv.decode(Buffer.from(effect_url), 'Big5');
    const $x = cheerio.load(effect_body);
    const desc = $x('tr[bgcolor="#E8F4FF"] td[width="80%"]');
    let str = '';
    $x(desc).each((nn, des) => {
      if (nn) str += $x(des).text();
    });
    return str;
  };
  const makeMoreData = (
    cardInfo,
    card_id_arr,
    card_product_information_type_arr,
    card_rarity_arr,
    names,
  ) => {
    let arr = [];
    for (let i = 0; i < card_id_arr.length; i++) {
      const card_id = card_id_arr[i];
      const card_product_information_type = card_product_information_type_arr[i];
      const coolName = names[i].indexOf('異圖') !== -1;
      const card_rarity = `${coolName ? '異圖-' : ''}${RarityTransfer(card_rarity_arr[i])}`;
      if (
        arr.find(
          el =>
            el.product_information_type === card_product_information_type &&
            el.rarity.find(x => x !== card_rarity) &&
            el.id === card_id,
        )
      ) {
        const set = arr.findIndex(el => el.id === card_id);
        if (arr[set].rarity.findIndex(el => el === card_rarity) === -1)
          arr[set].rarity.push(card_rarity);
      } else {
        const cp = JSON.parse(JSON.stringify(cardInfo));
        cp.id = card_id;
        cp.product_information_type = card_product_information_type;
        cp.rarity.push(card_rarity);
        arr.push(cp);
      }
    }
    return arr;
  };

  const errorControl = (spinner, cardInfo, set, file) =>
    spinner
      .error({
        text: `Card Number : ${chalk.white.bgRed(
          `${cardInfo.number} is not existed!`,
        )} Current progress [${set + 1}/${file.lastAdd.length}] ${chalk.blue(
          ` ${parseInt(((set + 1) / file.lastAdd.length) * 1000000) / 10000}% `,
        )}`,
      })
      .clear();

  const checkIdRules = str => {
    while (/[A-Za-z]$/.test(str)) {
      str = str.substring(0, str.length - 1);
    }
    return str.trim();
  };

  //
  let errorBox = file.errorList;
  for (let set = 0; set < file.lastAdd.length; set++) {
    let cardInfo = JSON.parse(JSON.stringify(cardInfoObj));
    let card_id_arr = [];
    let card_product_information_type_arr = [];
    let card_rarity_arr = [];
    let names = [];
    cardInfo.number = file.lastAdd[set];
    const spinner = createSpinner().start({
      text: `Get Card Number : ${chalk.whiteBright.bgMagenta(cardInfo.number)}  Information`,
    });
    try {
      await useReptileByForm('http://220.134.173.17/gameking/card/ocg_list.asp', {
        form_data13: `${cardInfo.number}`,
      }).then(async sus => {
        const body = iconv.decode(Buffer.from(sus), 'Big5');
        const $ = cheerio.load(body);
        //! 卡名
        cardInfo.name = useReptile2Split(
          $('tr[bgcolor="#E8F4FF"] td[width="22%"][align="center"]'),
        )[0];
        if (cardInfo.name === undefined) {
          errorControl(spinner, cardInfo, set, file);
          errorBox.push(cardInfo.number);
          return;
        }

        //! 星數
        cardInfo.star = useReptile2Split(
          $('tr[bgcolor="#E8F4FF"] td[width="06%"][align="center"]'),
        )[0];

        //! 種族 & 分類
        const card_race = $('tr[bgcolor="#E8F4FF"] td[width="10%"][align="center"]');
        for (let i = 0; i < card_race.length; i++) {
          if (i > 2) break;

          const types = useReptile2Str($(card_race[i]).text());
          options.type.find(el => el === types) ? (cardInfo.type = types) : (cardInfo.race = types);
        }

        //! 攻擊 & 防禦
        const card_atk = $('tr[bgcolor="#E8F4FF"] td[width="07%"][align="center"]');
        for (let i = 0; i < card_atk.length; i++) {
          if (!(cardInfo.def === '' || cardInfo.atk === '')) break;

          const info = useReptile2Str($(card_atk[i]).text());
          i % 2 === 1 ? (cardInfo.def = info) : (cardInfo.atk = info);
        }

        //! page
        const page = $('tr[bgcolor="#C1E0FF"] > td > select').first().children().length;
        for (let p = 0; p < page; p++) {
          const pageUrl =
            'http://220.134.173.17/gameking/card/ocg_list.asp' +
            `?call_item=13&call_data=${
              cardInfo.number
            }&call_sql=Select%20*%20from%20ocg%20where%20ocg_password%20=%20%27${
              cardInfo.number
            }%27%20order%20by%20ocg_no%20asc&Page=${p + 1}`;
          const res = await useReptileTargetUrl(pageUrl);
          const bodyS = iconv.decode(Buffer.from(res), 'Big5');
          const $s = cheerio.load(bodyS);
          //! 所有名稱
          names = [
            ...names,
            ...useReptile2Split($('tr[bgcolor="#E8F4FF"] td[width="22%"][align="center"]')),
          ];

          //! 卡號 (多)
          card_id_arr = [
            ...card_id_arr,
            ...useReptile2Split($s('tr[bgcolor="#E8F4FF"] td[width="09%"][align="center"]')).map(
              el => checkIdRules(el),
            ),
          ];
          //! 稀有度 (多)& 屬性
          const rarity_attribute = $s('tr[bgcolor="#E8F4FF"] td[width="05%"][align="center"]');
          for (let i = 0; i < rarity_attribute.length; i++) {
            const rarity = rarity_attribute[i];
            if (jud_correct_info($s(rarity).text()))
              jud_correct_info($s(rarity).text()) === 1
                ? (cardInfo.attribute = useReptile2Str($s(rarity).text()))
                : card_rarity_arr.push(useReptile2Str($s(rarity).text()));
            else if ($s(rarity).text() === '內容' && cardInfo.effect === '')
              cardInfo.effect = await getDesc(rarity, $s);
            await useDelay(Math.random() * 100);
          }
        }
        //! 產品包代號(多)
        card_product_information_type_arr = card_id_arr.map(el => el.split('-')[0]);

        const finalData = makeMoreData(
          cardInfo,
          card_id_arr,
          card_product_information_type_arr,
          card_rarity_arr,
          names,
        );
        // Mongodb
        for (let i = 0; i < finalData.length; i++) {
          let cards = await MongooseCRUD('R', 'cards', {
            id: finalData[i].id,
          });
          if (!cards.length) {
            await MongooseCRUD('C', 'cards', finalData[i]);
          } else {
            cards[0].type = finalData[i].type;
            cards[0].race = finalData[i].race;
            cards[0].rarity = finalData[i].rarity;
            await MongooseCRUD('Uo', 'cards', { id: cards[0].id }, cards[0]);
            spinner.update({ text: 'go go go!' });
          }
          // const number = Number.parseInt(finalData[i].number).toString();
          // const image = {
          //   number: finalData[i].number,
          //   photo: `data:image/jpeg;base64,${await img2base(`./pics/${number}.${file.type}`)}`,
          // };
          // const arr = await MongooseCRUD('R', 'cards_image', {
          //   number: finalData[i].number,
          // });
          // if (!arr.length) await MongooseCRUD('C', 'cards_image', image);

          await useDelay(50);
        }
        final = [...final, ...finalData];
        const text = `Get Card ${chalk.whiteBright.bgGreen(
          ` ${cardInfo.number} - ${cardInfo.name}`,
        )} Success! Current progress [${set + 1}/${file.lastAdd.length}] ${chalk.blue(
          ` ${parseInt(((set + 1) / file.lastAdd.length) * 1000000) / 10000}% `,
        )}`;
        spinner.success({ text }).clear();
      });
    } catch (error) {
      console.log(111111, error);
      errorControl(spinner, cardInfo, set, file);
      errorBox.push(cardInfo.number);
    }
    await useDelay(Math.random() * 100);
  }

  //! 韓文 out!
  final = final.filter(el => el.id.indexOf('-KR') === -1 && el.id.indexOf('-EN') === -1);

  if (errorBox.length > file.errorList.length) {
    file.errorList = errorBox;
  }
  return { final, file };
};

export const reptileOptions = async () => {
  console.log(gradient.rainbow('Start Reptile Options'));
  let final = {};
  let errorMsg = [];
  const res = await useReptileTargetUrl('http://220.134.173.17/gameking/card/ocg_index.asp');
  const body = iconv.decode(Buffer.from(res), 'Big5');
  const $ = cheerio.load(body);

  //! API
  const makeProductInfoPackType = async pack => {
    for (let i = 0; i < pack.length; i++) {
      const pp = pack[i];
      try {
        const x = await useReptileTargetUrl(
          `http://220.134.173.17/gameking/card/ocg_list.asp?call_item=12&call_data=${useBig5_encode(
            pp.name,
          )}`,
        );
        const bodyS = iconv.decode(Buffer.from(x), 'Big5');
        const $$ = cheerio.load(bodyS);
        const final = useReptile2Split(
          $$('tr[bgcolor="#E8F4FF"] td[width="09%"][align="center"]'),
        )[0];
        if (!final) {
          errorMsg.push(pp.name);
          console.log(pp.name, ':', chalk.red('Error!!!'));
          pack[i].packType = '';
        } else {
          console.log(pp.name, ':', chalk.blue(final));
          pack[i].packType = final.split('-')[0];
        }
      } catch (e) {
        errorMsg.push(pp.name);
        console.log(pp.name, ':', chalk.red('Error!!!'));
        pack[i].packType = '';
      }
    }

    return pack;
  };

  const search_option = (ss, xx = 0) => {
    let box = [];
    $(ss)
      .children()
      .each((x, cc) => {
        if ($(cc).text() != '' && $(cc).text().indexOf('無') == -1 && $(cc).text() != '其他')
          if (!xx) box.push($(cc).text());
          else {
            const rare = RarityTransfer($(cc).text());
            if (box.findIndex(el => el === rare) === -1) box.push(rare);
          }
      });

    return box;
  };
  //!

  const select_bar = $('select[name="jump"]');

  for (let i = 0; i < select_bar.length; i++) {
    const ss = select_bar[i];
    switch (`${$(ss).parent().prev().text()}`) {
      case '種類':
        final.type = search_option(ss);
        break;
      case '星數':
        final.star = search_option(ss);
        break;
      case '屬性':
        final.attribute = search_option(ss);
        break;
      case '種族':
        final.race = search_option(ss);
        break;
      case '型式':
        final.rare = search_option(ss, 1);
        final.rareAll = search_option(ss);
        break;
      case '包裝分類':
        let pack = search_option(ss).filter(
          el =>
            el.indexOf('(RD)') === -1 &&
            el.indexOf('RD ') === -1 &&
            el.indexOf('RD補充包') == -1 &&
            el.length > 5,
        );
        final.product_information_type = pack.map(pp => ({
          name: pp,
          packType: '',
          subtype:
            pp.indexOf('】') !== -1 ? pp.substring(pp.indexOf('【') + 1, pp.indexOf('】')) : '',
          mainType: 0,
        }));
        break;
    }
  }

  const productInformation = await makeProductInfoPackType(final.product_information_type);
  console.log(chalk.red(errorMsg));
  return {
    options: final,
    productInformation,
  };
};
