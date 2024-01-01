import MongooseCRUD from './api/MongoDb/Api.js';
import fs from 'fs';
import { useDelay } from './api/tools/index.js';
const fix = async id => {
  await MongooseCRUD('Uo', 'cards', { id: id }, { price_info: [] });
  console.log(id, 'done');
  // fs.writeFileSync('./t2.json', JSON.stringify(res));
};

const main = async () => {
  const ids = (await MongooseCRUD('R', 'cards', {}, {}, { _id: 0, id: 1 })).map(el => el.id);
  console.log(ids);
  for (let i = 0; i < ids.length; i++) {
    const id = ids[i];
    await fix(id);
    useDelay(50);
  }
};

main();
