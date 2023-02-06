import * as cheerio from 'cheerio';
import iconv from 'iconv-lite';
import chalk from 'chalk';
import fs from 'fs';
import { useBig5_encode, useDelay } from './tools/index.js';
import gradient from 'gradient-string';
import { createSpinner } from 'nanospinner';
import {
  useReptile2Split,
  useReptileByForm,
  useReptileTargetUrl,
  useReptile2Str,
} from './reptile/index.js';
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
  product_information_type_id: 0,
  id: '',
  effect: '',
  photo: '',
  price_info: [
    {
      time: '',
      price: 0,
    },
  ],
};

export const reptile = async file => {
  console.log(gradient.rainbow('Start Reptile Cards Information'));
  let final = [];
  //! function
  const jud_correct_info = text =>
    options.attribute.find(el => text.indexOf(el) !== -1)
      ? 1
      : options.rare.find(el => text.indexOf(el) !== -1)
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
  ) => {
    let arr = [];
    for (let i = 0; i < card_id_arr.length; i++) {
      const card_id = card_id_arr[i];
      const card_product_information_type = card_product_information_type_arr[i];
      const card_rarity = card_rarity_arr[i];
      if (
        arr.find(
          el =>
            el.product_information_type === card_product_information_type &&
            el.rarity.find(x => x !== card_rarity),
        )
      ) {
        let set = arr.findIndex(
          el => el.product_information_type === card_product_information_type,
        );
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
    spinner.error({
      text: `Card Number : ${chalk.white.bgRed(
        `${cardInfo.number} is not existed!`,
      )} Current progress [${set + 1}/${file.lastAdd.length}] ${chalk.blue(
        ` ${parseInt(((set + 1) / file.lastAdd.length) * 1000000) / 10000}% `,
      )})}`,
    });

  //
  let errorBox = file.errorList;
  for (let set = 0; set < file.lastAdd.length; set++) {
    let cardInfo = JSON.parse(JSON.stringify(cardInfoObj));
    let card_id_arr = [];
    let card_product_information_type_arr = [];
    let card_rarity_arr = [];
    cardInfo.number = file.lastAdd[set];
    const spinner = createSpinner(
      `Get Card Number : ${chalk.whiteBright.bgMagenta(cardInfo.number)} Information`,
    ).start();
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
          return;
        }

        //! 卡號 (多)
        card_id_arr = useReptile2Split($('tr[bgcolor="#E8F4FF"] td[width="09%"][align="center"]'));
        //! 產品包代號(多)
        card_product_information_type_arr = card_id_arr.map(el => el.split('-')[0]);

        //! 稀有度 (多)& 屬性
        const rarity_attribute = $('tr[bgcolor="#E8F4FF"] td[width="05%"][align="center"]');
        for (let i = 0; i < rarity_attribute.length; i++) {
          const rarity = rarity_attribute[i];
          if (jud_correct_info($(rarity).text()))
            jud_correct_info($(rarity).text()) === 1
              ? (cardInfo.attribute = useReptile2Str($(rarity).text()))
              : card_rarity_arr.push(useReptile2Str($(rarity).text()));
          else if ($(rarity).text() === '內容' && cardInfo.effect === '')
            cardInfo.effect = await getDesc(rarity, $);

          await useDelay(Math.random() * 100);
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
          options.type.find(el => el === types) ? (cardInfo.race = types) : (cardInfo.type = types);
        }

        //! 攻擊 & 防禦
        const card_atk = $('tr[bgcolor="#E8F4FF"] td[width="07%"][align="center"]');
        for (let i = 0; i < card_atk.length; i++) {
          if (!(cardInfo.def === '' || cardInfo.atk === '')) break;

          const info = useReptile2Str($(card_atk[i]).text());
          i % 2 === 1 ? (cardInfo.def = info) : (cardInfo.atk = info);
        }

        //
        final = [
          ...final,
          ...makeMoreData(
            cardInfo,
            card_id_arr,
            card_product_information_type_arr,
            card_rarity_arr,
          ),
        ];
        spinner.success({
          text: `Get Card ${chalk.whiteBright.bgGreen(
            ` ${cardInfo.number} - ${cardInfo.name}`,
          )} Success! Current progress [${set + 1}/${file.lastAdd.length}] ${chalk.blue(
            ` ${parseInt(((set + 1) / file.lastAdd.length) * 1000000) / 10000}% `,
          )}`,
        });
      });
    } catch (error) {
      errorControl(spinner, cardInfo, set, file);
      errorBox.push(cardInfo.number);
    }
    await useDelay(Math.random() * 100);
  }

  if (errorBox.length > file.errorList.length) {
    file.errorList = errorBox;
    fs.writeFileSync('./database/card_number.json', JSON.stringify(file));
  }

  return final;
};

export const reptileOptions = async () => {
  console.log(gradient.rainbow('Start Reptile Options'));
  let final = {};
  const res = await useReptileTargetUrl('http://220.134.173.17/gameking/card/ocg_index.asp');
  const body = iconv.decode(Buffer.from(res), 'Big5');
  const $ = cheerio.load(body);

  //! API
  const makeProductInfoPackType = async pack => {
    for (let i = 0; i < pack.length; i++) {
      const pp = pack[i];
      const x = await useReptileTargetUrl(
        `http://220.134.173.17/gameking/card/ocg_list.asp?call_item=12&call_data=${useBig5_encode(
          pp.name,
        )}`,
      );
      const bodyS = iconv.decode(Buffer.from(x), 'Big5');
      const $$ = cheerio.load(bodyS);
      pack[i].packType = useReptile2Split(
        $$('tr[bgcolor="#E8F4FF"] td[width="09%"][align="center"]'),
      )[0].split('-')[0];
    }

    return pack;
  };

  const search_option = ss => {
    let box = [];
    $(ss)
      .children()
      .each((x, cc) => {
        if ($(cc).text() != '' && $(cc).text().indexOf('無') == -1) box.push($(cc).text());
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
        final.rare = search_option(ss);
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
  return {
    options: final,
    productInformation,
  };
};
