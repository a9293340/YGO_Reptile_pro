import axios from 'axios';
import * as cheerio from 'cheerio';
import iconv from 'iconv-lite';
import { useReptileTargetUrl } from './reptile/index.js';
import gradient from 'gradient-string';

let times = new Date();

const price_temp = {
  time: `${times.getFullYear()}-${times.getMonth() + 1}-${times.getDate()}`,
  price: 0,
  price_lowest: 0,
  price_avg: 0,
  price_yuyu: 0,
};

const count_low_1 = prices =>
  Math.floor(
    prices.slice(0, Math.floor(prices.length / 4)).reduce((a, b) => a + b) /
      Math.floor(prices.length / 4),
  );

const count_low_2 = prices =>
  Math.floor(
    (prices
      .slice(Math.floor(prices.length * 0.1), Math.floor(prices.length * 0.4))
      .reduce((a, b) => a + b) /
      Math.floor(Math.floor(prices.length * 0.4) - Math.floor(prices.length * 0.1) + 1)) *
      0.8,
  );

const getPriceYuYu = async (name, rares) => {
  const URL = 'https://yuyu-tei.jp/game_ygo/sell/sell_price.php?name=' + name;
  const url = await useReptileTargetUrl(URL);
  const body = iconv.decode(Buffer.from(url), 'Big5');
  const $ = cheerio.load(body);
  let rare = [];
  $('.gr_color').each((n, color) => {
    const rare = $(color).text();
    const target = $(`.card_unit.rarity_${rare} > .price_box > form > .price > b`);
    target.each((tt, tar) => {});
  });

  console.log(rare);
};

const reptilePrice = async () => {
  console.log(gradient.rainbow('Start Reptile Cards Information'));
  // TEMP
  let number = 'PAC1-JP021';
  let rarity = ['普鑽', '半鑽', '異圖-半鑽', '白鑽', '異圖-白鑽'];

  let price = JSON.parse(JSON.stringify(price_temp));

  const searchURL = `https://rtapi.ruten.com.tw/api/search/v3/index.php/core/prod?q=${number}+${rarity[0]}&type=direct&sort=prc%2Fac&offset=1&limit=100`;
  const targets = (await axios.get(searchURL)).data.Rows.map(el => el.Id);
  const searchPriceURL = `https://rtapi.ruten.com.tw/api/prod/v2/index.php/prod?id=${targets.join(
    ',',
  )}`;

  let prices = (await axios.get(searchPriceURL)).data
    .map(el => el.PriceRange[1])
    .filter(el => Number.isInteger(el));
  const mid = Math.floor(prices.length / 2);
  const findRange = [mid - Math.floor(mid / 2), mid + Math.floor(mid / 2)];
  price.price_avg = Math.floor(
    prices.slice(findRange[0], findRange[1] + 1).reduce((a, b) => a + b) /
      (findRange[1] - findRange[0] + 1),
  );

  //! low
  let pricesAbnormal = prices.filter(
    el => el >= price.price_avg * 0.5 && el <= price.price_avg * 1.5,
  );

  price.price_lowest = count_low_1(pricesAbnormal);

  price.price_yuyu = await getPriceYuYu(number, rarity[0]);

  console.log(price);

  return price;
};

reptilePrice();
