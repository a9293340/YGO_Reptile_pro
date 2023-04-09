import MongooseCRUD from '../api/MongoDb/Api.js';
import chalk from 'chalk';
import gradient from 'gradient-string';
import { createSpinner } from 'nanospinner';
import img2base from 'image-to-base64';
import fs from 'fs';

export const batchUpload2DB = async obj => {
  console.log(gradient.rainbow('Start batch upload cards information to database!'));
  let count = { success: 0, warn: 0, error: 0 };
  for (let i = 0; i < obj.length; i++) {
    let target = JSON.parse(JSON.stringify(obj[i]));
    const number = Number.parseInt(target.number).toString();
    const spinner = createSpinner().start({
      text: `Upload Card Name : ${chalk.whiteBright.bgMagenta(target.id + ':' + target.name)}`,
    });
    if (fs.statSync(`./pics/${number}.jpg`)) {
      const image = {
        number: target.number,
        photo: `data:image/jpeg;base64,${await img2base(`./pics/${number}.jpg`)}`,
      };
      target['price_yuyu'] = [];
      try {
        await MongooseCRUD('C', 'cards', target);
        await MongooseCRUD('C', 'cards_image', image);
        spinner.success({ text: target.id + ':' + target.name + ' Upload success!' }).clear();
        count.success++;
      } catch (error) {
        spinner.error({ text: target.id + ':' + target.name + ' Upload failed!' }).clear();
        count.error++;
      }
    } else {
      try {
        await MongooseCRUD('C', 'cards', target);
        spinner.warn({ text: target.id + ':' + target.name + ' Has no image!' }).clear();
        count.warn++;
      } catch (error) {
        spinner.error({ text: target.id + ':' + target.name + ' Upload failed!' }).clear();
        count.error++;
      }
    }
  }

  return count;
};
