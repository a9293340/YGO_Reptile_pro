import * as cheerio from 'cheerio';
import iconv from 'iconv-lite';
import { useReptileTargetUrl } from './api/reptile/index.js';
import fs from 'fs';
import MongooseCRUD from './api/MongoDb/Api.js';
import { useDelay } from './api/tools/index.js';

const containsJapanese = text => {
  const japaneseRegex = /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF\u3400-\u4DBF]/;
  return japaneseRegex.test(text);
};

const removeTN = txt => txt.replaceAll(`\n`, '').replaceAll(`\t`, '');

const urls = (str, type) =>
  `https://www.db.yugioh-card.com/yugiohdb/card_search.action?ope=1&sess=1&rp=10&mode=&sort=1&keyword=${str}&stype=${type}&ctype=&othercon=2&starfr=&starto=&pscalefr=&pscaleto=&linkmarkerfr=&linkmarkerto=&link_m=2&atkfr=&atkto=&deffr=&defto=&request_locale=ja`;

const getJudRulesLink = async (text, number) => {
  // console.log(text);
  const type = containsJapanese(text) ? 1 : 4;
  const tar = containsJapanese(text) ? encodeURIComponent(text) : text;
  const url = urls(tar, type);
  // console.log(url);
  const res = await useReptileTargetUrl(url);
  const body = iconv.decode(Buffer.from(res), 'UTF-8');
  const $ = cheerio.load(body);

  if (!$('.link_value').attr('value')) {
    return false;
  }

  let newLink =
    `https://www.db.yugioh-card.com${$('.link_value').attr('value')}`.replace(
      'card_search.action?ope=2',
      'faq_search.action?ope=4',
    ) + '&request_locale=ja';
  // console.log(newLink);

  const rulePage = await useReptileTargetUrl(newLink);
  const rBody = iconv.decode(Buffer.from(rulePage), 'UTF-8');
  const $r = cheerio.load(rBody);

  // 補足情報
  let info = {
    number,
    info: '',
    qa: [],
  };

  info.info = removeTN($r('#supplement').text());

  // QA
  const qaTitle = $r('span.name');
  qaTitle.each((n, t) => {
    info.qa.push({
      title: removeTN($r(t).text()),
      tag: '',
      date: '',
      q: '',
      a: '',
    });
  });

  const qaTag = $r('.tag_name ');
  qaTag.each((n, t) => {
    info.qa[n].tag = removeTN($r(t).text());
  });

  const qaDate = $r('.div.date');
  qaDate.each((n, t) => {
    info.qa[n].date = removeTN($r(t).text().trim()).replace('更新日:', '');
  });

  const qaLink = $r('.link_value');
  let links = [];
  qaLink.each((n, t) => {
    links.push('https://www.db.yugioh-card.com/' + $r(t).attr('value') + '&request_locale=ja');
  });

  // find effect
  for (let i = 0; i < links.length; i++) {
    const qLink = links[i];
    const linkPage = await useReptileTargetUrl(qLink);
    const lBody = iconv.decode(Buffer.from(linkPage), 'UTF-8');
    const $l = cheerio.load(lBody);
    info.qa[i].q = removeTN($l('#question_text').text());
    info.qa[i].a = removeTN($l('#answer_text').text());
  }

  fs.writeFileSync(`./rules/${number}.json`, JSON.stringify(info));
  console.log(number, ' done!');
  return true;
};

// getJudRulesLink('EP19-JP067', 4);

const main = async () => {
  const cards = Object.values(
    (await MongooseCRUD('R', 'cards', {}, {}, { id: 1, number: 1, _id: 0 })).reduce(
      (accumulator, card) => {
        // 如果累加器中已經有這個number，則將id添加到對應的ids陣列中
        if (accumulator[card.number]) {
          accumulator[card.number].ids.push(card.id);
        } else {
          // 如果累加器中沒有這個number，則創建一個新條目
          accumulator[card.number] = { number: card.number, ids: [card.id] };
        }
        return accumulator;
      },
      {},
    ),
  );
  let err = [];
  for (let i = 0; i < cards.length; i++) {
    await useDelay(500);
    const card = cards[i];
    let errorCount = 0;
    for (let i = 0; i < card.ids.length; i++) {
      const id = card.ids[i];
      if (await getJudRulesLink(id, card.number)) break;
      else errorCount++;
    }

    if (errorCount === card.ids.length) {
      err.push(card.number);
      console.log(`${card.number} no data`);
    }
  }

  fs.writeFileSync('./rules/_err.json', JSON.stringify(err));
};

main();
