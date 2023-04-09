import axios from 'axios';
async function main() {
  const id_list = (
    await axios.get(
      'https://rtapi.ruten.com.tw/api/search/v3/index.php/core/prod?q=EXFO-JP069&type=direct&sort=prc%2Fac&offset=1&limit=100',
    )
  ).data.Rows.map(el => el.Id);

  console.log(id_list);
  // STON-JP024+銀字
  // IGAS-JP000
  // RIRA-JP046+紅鑽
  // EP16-JP004+普卡
  // SOFU-JP067+普卡
  // ABPF-JP003+普卡
  const searchPriceURL = `https://rtapi.ruten.com.tw/api/prod/v2/index.php/prod?id=${id_list.join(
    ',',
  )}`;
  const source = (await axios.get(searchPriceURL)).data;
  // console.log(source);
  let prices = source
    .filter(el => el.Currency === 'TWD')
    .filter(el => el.StockQty > el.SoldQty)
    .map(el => el.PriceRange[1])
    .filter(el => Number.isInteger(el))
    .filter(el => el < 150000);
  console.log(1, prices);
  prices = outlierDetector(prices);
  console.log(2, prices);
  if (prices.reduce((a, b) => a + b) / prices.length > 1000) {
    prices = outlierDetector(prices);
    console.log(prices);
  }
  console.log(weight_function(prices, 'low'));
  console.log(weight_function(prices, 'lowest'));
}

main();

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
  console.log(prices.filter(el => el <= (q1 + q3) / 2));
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
  console.log(q1, q3, iqr);
  console.log(sortedCollection.filter(value => value <= maxValue));
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
