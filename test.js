import MongooseCRUD from './api/MongoDb/Api.js';
import { reptilePrice } from './api/reptilePrice.js';

// const main = async () => {
//   let cardInfo = await MongooseCRUD('R', 'cards', {
//     id: 'QCDB-JP048',
//   });

//   for (let i = 0; i < cardInfo.length; i++) {
//     await MongooseCRUD('Uo', 'cards', { id: cardInfo[i].id }, { price_info: [] });
//     console.log(cardInfo[i].id);
//   }
// };

// main();

reptilePrice();
