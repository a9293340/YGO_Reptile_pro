import axios from 'axios';
import * as cheerio from 'cheerio';
import iconv from 'iconv-lite';
import { useReptileTargetUrl } from './reptile/index.js';
import gradient from 'gradient-string';
import { createSpinner } from 'nanospinner';
import chalk from 'chalk';
import { useDelay } from './tools/index.js';
import { delay } from './tools/delay.js';
let times = new Date();

const price_temp = {
  time: `${times.getFullYear()}-${times.getMonth() + 1}-${times.getDate()}`,
  rarity: '',
  price_lowest: 0,
  price_avg: 0,
  price_yuyu: 0,
};

const transfer = [
  {
    from: ['N'],
    to: ['普卡', '點鑽', '碎鑽', '方鑽'],
  },
  {
    from: ['R'],
    to: ['銀字', '銀字點鑽', '銀字碎鑽', '銀字方鑽'],
  },
  {
    from: ['NR'],
    to: ['隱普'],
  },
  {
    from: ['SR'],
    to: ['亮面', '亮面點鑽', '亮面碎鑽', '亮面方鑽'],
  },
  {
    from: ['UL'],
    to: ['金普'],
  },
  {
    from: ['UR'],
    to: ['金亮', '紅亮', '藍亮', '金亮點鑽', '金亮碎鑽', '金亮方鑽'],
  },
  {
    from: ['SE'],
    to: ['半鑽', '紅字半鑽', '藍鑽', '半鑽點鑽', '半鑽碎鑽', '半鑽方鑽'],
  },
  {
    from: ['EXSE', 'P-EXSE'],
    to: ['斜鑽'],
  },
  {
    from: ['P-R'],
    to: ['銀鑽'],
  },
  {
    from: ['PSE'],
    to: ['白鑽'],
  },
  {
    from: ['P-UR'],
    to: ['全鑽'],
  },
  {
    from: ['CR'],
    to: ['雕鑽'],
  },
  {
    from: ['UL'],
    to: ['浮雕'],
  },
  {
    from: ['HR', 'P-HR'],
    to: ['雷射'],
  },
  {
    from: ['GR'],
    to: ['黃金'],
  },
  {
    from: ['20thSE'],
    to: ['紅鑽'],
  },
  {
    from: ['QCSE'],
    to: ['金鑽'],
  },
  {
    from: ['KC-UR'],
    to: ['KC紋'],
  },
  {
    from: ['M', 'M-SR', 'M-UR', 'M-GR', 'M-SE'],
    to: ['古文鑽'],
  },
  {
    from: ['P-N', 'P-SR', 'P-UR'],
    to: ['普鑽', '粉鑽', '亮面彩鑽', '金亮彩鑽', '半鑽彩鑽', '碎鑽'],
  },
  {
    from: ['KC-R'],
    to: ['銀字KC紋'],
  },
];

//! API

const count_low_1 = prices =>
  Math.round(
    prices
      .slice(0, Math.round(prices.length / (prices.length > 4 ? 4 : 1)))
      .reduce((a, b) => a + b) /
      prices.slice(0, Math.round(prices.length / (prices.length > 4 ? 4 : 1))).length,
  );

const count_low_2 = prices =>
  Math.round(
    (prices
      .slice(Math.round(prices.length * 0.1), Math.round(prices.length * 0.4))
      .reduce((a, b) => a + b) /
      Math.round(Math.round(prices.length * 0.4) - Math.round(prices.length * 0.1) + 1)) *
      0.8,
  );

const getPriceYuYu = async (name, rares) => {
  let targetPrice = 0;
  try {
    const URL = 'https://yuyu-tei.jp/game_ygo/sell/sell_price.php?name=' + name;
    const url = await useReptileTargetUrl(URL);
    const body = iconv.decode(Buffer.from(url), 'UTF-8');
    const $ = cheerio.load(body);
    const checkRares = rares.indexOf('異圖') !== -1 ? rares.split('-')[1] : rares;
    const isDiff = rares.indexOf('異圖') !== -1;
    const checkRare = (from, to) =>
      transfer.findIndex(
        el => el.from.findIndex(x => x === from) !== -1 && el.to.findIndex(x => x === to) !== -1,
      ) !== -1;

    const str2Int = tar =>
      tar
        .text()
        .replace(/[^\d.-]/g, ' ')
        .split(' ')
        .filter(el => el)
        .map(el => parseInt(el));
    const checkDiff = imgArr =>
      isDiff
        ? imgArr.findIndex(x => x.indexOf('違い版') !== -1)
        : imgArr.findIndex(x => x.indexOf('違い版') === -1);

    $('.gr_color').each((n, color) => {
      if (checkRare($(color).text(), checkRares)) {
        let imgArr = [];
        const priceWords = $(
          `.card_unit.rarity_${$(color).text()} > .price_box > form > .price > b`,
        );
        const targetArr = str2Int(priceWords);
        $(`.card_unit.rarity_${$(color).text()} > .image_box`).each((ss, set) => {
          imgArr.push($(set).children('p.name').text());
        });
        targetPrice = targetArr.length === 1 ? targetArr[0] : targetArr[checkDiff(imgArr)];
      }
    });
  } catch (e) {
    // console.log('aa');
  }

  return targetPrice;
};

export const reptilePrice = async cardInfo => {
  console.log(gradient.rainbow('Start Reptile Cards Information'));
  let errorBox = [];
  //! 銀亮 跳過
  // TEMP 23
  for (let c = 0; c < cardInfo.length; c++) {
    if (!c % 100 && c) await useDelay(20000);
    const number = cardInfo[c].id;
    const rarity = cardInfo[c].rarity;
    let allPrice = cardInfo[c].price_info;
    let isFalse = 0;
    if (rarity.find(el => el === '銀亮')) continue;
    // if (number !== 'SOI-JP051') continue;
    const spinner = createSpinner().start({
      text: `Get Card Number : ${chalk.whiteBright.bgMagenta(number)}  Price Information`,
    });
    try {
      for (let r = 0; r < rarity.length; r++) {
        await useDelay(Math.random() * 800);
        isFalse = 0;
        const rar = rarity[r];
        let price = JSON.parse(JSON.stringify(price_temp));
        price.rarity = rar;

        const errorControls = type => {
          price[`price_${type}`] = null;
          errorBox.push({
            number,
            rarity,
            type,
          });
          isFalse++;
        };

        const searchURL = `https://rtapi.ruten.com.tw/api/search/v3/index.php/core/prod?q=${number}+${rar}&type=direct&sort=prc%2Fac&offset=1&limit=100`;
        const targets = (await axios.get(searchURL)).data.Rows.map(el => el.Id);
        if (targets.length) {
          const searchPriceURL = `https://rtapi.ruten.com.tw/api/prod/v2/index.php/prod?id=${targets.join(
            ',',
          )}`;
          let prices = (await axios.get(searchPriceURL)).data
            .filter(el => el.Currency === 'TWD')
            .map(el => el.PriceRange[1])
            .filter(el => Number.isInteger(el))
            .filter(el => el < 150000);
          if (prices.length < 3) {
            if (!prices.length) {
              errorControls('avg');
              errorControls('lowest');
            } else {
              price.price_avg = Math.round(prices.reduce((a, b) => a + b) / prices.length);
              price.price_lowest = Math.round(prices.reduce((a, b) => a + b) / prices.length);
            }
            price.price_yuyu = await getPriceYuYu(number, rar);
            if (!price.price_yuyu) errorControls('yuyu');
            if (isFalse < 3) allPrice.push(price);
            break;
          }
          const mid = Math.round(prices.length / 2);
          const findRange = [mid - Math.round(mid / 2) - 1, mid + Math.round(mid / 2) - 1];
          //! avg
          try {
            price.price_avg = Math.round(
              prices.slice(findRange[0], findRange[1] + 1).reduce((a, b) => a + b) /
                prices.slice(findRange[0], findRange[1] + 1).length,
            );
          } catch (e) {
            errorControls('avg');
          }

          //! low
          let pricesAbnormal = prices.filter(
            el => el >= price.price_avg * 0.25 && el <= price.price_avg * 2,
          );

          try {
            price.price_lowest = count_low_1(pricesAbnormal);
          } catch (e) {
            errorControls('lowest');
          }
        } else {
          errorControls('avg');
          errorControls('lowest');
        }

        price.price_yuyu = await getPriceYuYu(number, rar);

        if (!price.price_yuyu) errorControls('yuyu');
        if (isFalse < 3) allPrice.push(price);
      }
    } catch (e) {
      isFalse = 3;
    }
    cardInfo[c].price_info = allPrice;
    const successWords = allPrice.map(el => `${el.rarity}-${el.price_avg}`).join(' / ');
    isFalse < 3
      ? spinner
          .success({
            text: `Get Card ${chalk.whiteBright.bgGreen(
              ` ${number}`,
            )} Price Success! (${successWords}) Current progress [${c + 1}/${
              cardInfo.length
            }] ${chalk.blue(` ${parseInt(((c + 1) / cardInfo.length) * 1000000) / 10000}% `)}`,
          })
          .clear()
      : spinner
          .error({
            text: `Card Number : ${chalk.white.bgRed(
              `${number} can not reptile price!`,
            )} Current progress [${c + 1}/${cardInfo.length}] ${chalk.blue(
              ` ${parseInt(((c + 1) / cardInfo.length) * 1000000) / 10000}% `,
            )}`,
          })
          .clear();
  }

  return {
    cardInfo,
    errorBox,
  };
};
