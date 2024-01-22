import { hasJPUpdate } from './api/reptileRules.js';
import schedule from 'node-schedule';

const main = async () => {
  schedule.scheduleJob('scheduleReptileRules', '0 7 * * 6', async () => {
    await hasJPUpdate();
    console.log('OK!');
  });
};

main();
