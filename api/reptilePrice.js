import axios from 'axios';
import * as cheerio from 'cheerio';
import iconv from 'iconv-lite';
import { useReptileTargetUrl } from './reptile/index.js';
import gradient from 'gradient-string';
import { createSpinner } from 'nanospinner';
import chalk from 'chalk';
import { useDelay } from './tools/index.js';
import dayjs from 'dayjs';
import MongooseCRUD from '../api/MongoDb/Api.js';

const price_temp = {
  time: null,
  rarity: '',
  price_lowest: 0,
  price_avg: 0,
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
    from: ['SE', 'GSE'],
    to: ['半鑽', '紅字半鑽', '藍鑽', '半鑽點鑽', '半鑽碎鑽', '半鑽方鑽', '斜鑽'],
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
    from: ['20thSE', '10000SE'],
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
  await useDelay(Math.random() * 1000);
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

export const reptilePrice = async () => {
  console.log(gradient.rainbow('Start Reptile Cards Information'));
  let cardInfo = await MongooseCRUD('R', 'cards', {});
  let errorBox = [];
  const startTime = new Date();
  // TEMP 23
  for (let c = 0; c < cardInfo.length; c++) {
    if (!c % 100 && c) await useDelay(20000);
    const number = cardInfo[c].id;
    const rarity = [...new Set(cardInfo[c].rarity)];
    let allPrice = cardInfo[c].price_info;
    let isFalse = 0;
    //! 銀亮 跳過
    if (rarity.find(el => el === '銀亮')) continue;
    // if (number !== '301-051') continue;
    const spinner = createSpinner().start({
      text: `Get Card Number : ${chalk.whiteBright.bgMagenta(number)}  Price Information`,
    });
    try {
      // console.log(rarity);
      for (let r = 0; r < rarity.length; r++) {
        // console.log(rarity);
        await useDelay(500);
        isFalse = 0;
        const rar = rarity[r];
        let price = JSON.parse(JSON.stringify(price_temp));
        price.time = dayjs().format('YYYY-MM-DD HH:mm:ss');
        price.rarity = rar;
        const rarityWords = rar !== '普卡' ? '+' + rar : '';
        const errorControls = type => {
          price[`price_${type}`] = null;
          isFalse++;
        };

        const searchURL = `https://rtapi.ruten.com.tw/api/search/v3/index.php/core/prod?q=${number}${rarityWords}&type=direct&sort=prc%2Fac&offset=1&limit=100`;
        const targets = (await axios.get(searchURL)).data.Rows.map(el => el.Id);
        if (targets.length) {
          const searchPriceURL = `https://rtapi.ruten.com.tw/api/prod/v2/index.php/prod?id=${targets.join(
            ',',
          )}`;
          let prices = (await axios.get(searchPriceURL)).data
            .filter(el => el.Currency === 'TWD')
            .filter(el => el.StockQty > el.SoldQty)
            .map(el => el.PriceRange[1])
            .filter(el => Number.isInteger(el))
            .filter(el => el < 150000);
          if (prices.length <= 3) {
            if (!prices.length) {
              errorControls('avg');
              errorControls('lowest');
            } else {
              price.price_avg = Math.round(prices.reduce((a, b) => a + b) / prices.length);
              price.price_lowest = Math.round(prices.reduce((a, b) => a + b) / prices.length);
            }
            if (isFalse < 2) allPrice.push(price);
            break;
          }

          //! avg
          try {
            prices = outlierDetector(prices);
            if (prices.reduce((a, b) => a + b) / prices.length > 1000)
              prices = outlierDetector(prices);
            price.price_avg = Math.round(weight_function(prices, 'low'));
            price.price_lowest = Math.round(weight_function(prices, 'lowest'));
          } catch (e) {
            errorControls('avg');
            errorControls('lowest');
          }
        } else {
          errorControls('avg');
          errorControls('lowest');
        }

        if (isFalse < 2) allPrice.push(price);
      }
    } catch (e) {
      isFalse = 2;
    }
    try {
      cardInfo[c].price_info = allPrice;
      // console.log(cardInfo[c]);
      await MongooseCRUD('Uo', 'cards', { id: cardInfo[c].id }, cardInfo[c]);
      const successWords = allPrice
        .map(el => `${el.rarity}-${el.price_lowest}-${el.price_avg}`)
        .join(' / ');
      const totalSpendTime = `Total Spend ${chalk.bgGray((new Date() - startTime) / 1000)} sec`;

      isFalse < 2
        ? spinner
            .success({
              text: `Get Card ${chalk.whiteBright.bgGreen(
                ` ${number}`,
              )} Price Success! (${successWords}) Current progress [${c + 1}/${
                cardInfo.length
              }] ${chalk.blue(
                ` ${parseInt(((c + 1) / cardInfo.length) * 1000000) / 10000}% `,
              )} ${totalSpendTime} `,
            })
            .clear()
        : spinner
            .error({
              text: `Card Number : ${chalk.white.bgRed(
                `${number} can not reptile price!`,
              )} Current progress [${c + 1}/${cardInfo.length}] ${chalk.blue(
                ` ${parseInt(((c + 1) / cardInfo.length) * 1000000) / 10000}% `,
              )} ${totalSpendTime}`,
            })
            .clear();
    } catch (error) {
      spinner
        .error({
          text: `Card Number : ${chalk.white.bgCyanBright(
            `${number} upload Failed!`,
          )} Current progress [${c + 1}/${cardInfo.length}] ${chalk.blue(
            ` ${parseInt(((c + 1) / cardInfo.length) * 1000000) / 10000}% `,
          )} ${totalSpendTime}`,
        })
        .clear();
      errorBox.push({
        number: cardInfo[c].number,
      });
    }
  }
  console.log(chalk.bgBlue(`Total Spend ${(new Date() - startTime) / 1000} sec !`));
  return {
    cardInfo,
    errorBox,
  };
};

const weight_function = (prices, type) => {
  let { q1, q3 } = q3Detector(prices);
  const jud = prices.reduce((a, b) => a + b) / prices.length > 1000;
  let avg = jud
    ? prices.reduce((a, b) => (b < q1 ? a + b * 1.25 : b > q3 ? a + b * 0.75 : a + b)) /
      prices.length
    : prices.reduce((a, b) => (b > q3 ? a + q3 : a + b)) / prices.length;
  let lowest = prices[0];
  let low = jud
    ? prices.reduce((a, b) => (b < q1 ? a + b * 1.25 : b < (q1 + q3) / 2 ? a + b : a + b * 0.75)) /
      prices.length
    : prices.reduce((a, b) => (b <= (q1 + q3) / 2 ? a + b : a)) /
      prices.filter(el => el <= (q1 + q3) / 2).length;
  low = low < lowest ? lowest : low;

  return type === 'low' ? low : lowest;
};

const outlierDetector = collection => {
  const sortedCollection = collection.slice().sort((a, b) => a - b);

  let { q1, q3 } = q3Detector(sortedCollection);
  if (!q1 && !q3) return collection;
  const iqr = q3 - q1;
  let maxValue = q3 + iqr * 1.5;
  if (maxValue > sortedCollection[sortedCollection.length - 1])
    maxValue = sortedCollection[sortedCollection.length - 1];
  //q1 - iqr * 1.5 > 0 ? q1 - iqr * 1.5 : q1
  const min = sortedCollection.filter(el => el <= q1);
  const minValue = min.reduce((a, b) => a + b) / min.length;
  // console.log(q1, maxValue, minValue);
  return q1 === q3
    ? sortedCollection
    : sortedCollection.filter(value => value < maxValue && value >= minValue);
};

const q3Detector = collection => {
  const size = collection.length;

  let q1, q3;

  if (size < 2) {
    return { q1: 0, q3: 0 };
  }

  const sortedCollection = collection.slice().sort((a, b) => a - b);

  if (((size - 1) / 4) % 1 === 0 || (size / 4) % 1 === 0) {
    q1 =
      (1 / 2) *
      (sortedCollection[Math.floor(size / 4) - 1] + sortedCollection[Math.floor(size / 4)]);
    q3 =
      (1 / 2) *
      (sortedCollection[Math.ceil((size * 3) / 4) - 1] +
        sortedCollection[Math.ceil((size * 3) / 4)]);
  } else {
    q1 = sortedCollection[Math.floor(size / 4)];
    q3 = sortedCollection[Math.floor((size * 3) / 4)];
  }

  return { q1, q3 };
};
