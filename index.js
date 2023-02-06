import chalk from 'chalk';
import fs from 'fs';
import { reptile, reptileOptions } from './api/reptile.js';
import inquirer from 'inquirer';
import { useErrorMsg } from './api/tools/index.js';
import figlet from 'figlet';

const checkCardNumber = file =>
  fs
    .readdirSync('./pics')
    .map(el => el.split('.')[0].padStart(8, '0'))
    .filter(el => file.existed.findIndex(x => x === el) === -1);

const updatedJson = (newData, file) => {
  // if (!newData.length) return;
  file.existed = [...file.existed, ...newData];
  file.lastAdd = newData;
  fs.writeFileSync('./database/card_number.json', JSON.stringify(file));
};

// './database/card_number.json'
const checkDataFromYgoProPic = path => checkCardNumber(JSON.parse(fs.readFileSync(path)));
const checkDataFromJson = path => JSON.parse(fs.readFileSync(path));

const getOptions = async (cb = async () => {}) => {
  let newData = await reptileOptions();
  fs.writeFileSync('./database/options.json', JSON.stringify(newData.options));
  fs.writeFileSync(
    './database/productInformation.json',
    JSON.stringify(newData.productInformation),
  );
  console.log(
    chalk.white.bgGreen.bold('Updated Options Successful !'),
    `,total updated option data`,
  );
  //* 結束後執行callback function
  await cb();
};

const getCardInfo = async () => {
  let newData = [];
  const answers = await inquirer.prompt([
    {
      type: 'list',
      name: 'useToGetNewData',
      message: 'Which of the following methods do you want to use to update the information?',
      choices: [
        { name: 'From YcoPro Pic (put pictures in "pic" file)', value: '1' },
        { name: 'From JSON (json must be array !)', value: '2' },
      ],
    },
    {
      type: 'input',
      name: 'useToGetNewPath',
      message: 'Input path information.(Pic => file path , JSON => json path)',
    },
  ]);
  try {
    newData =
      answers.useToGetNewData === '1'
        ? checkDataFromYgoProPic(answers.useToGetNewPath)
        : checkDataFromJson(answers.useToGetNewPath);
  } catch (e) {
    useErrorMsg('Path /Picture file Error ! Please check data and retry !');
    return;
  }
  if (!Array.isArray(newData)) {
    useErrorMsg('JSON file is not array ! Please check data and retry !');
    return;
  }

  let file = JSON.parse(fs.readFileSync('./database/card_number.json'));
  //* 把新增的卡號紀錄在JSON中
  updatedJson(newData, file);
  //*s 爬蟲
  let getData = await reptile(file);
  let allData = fs.readFileSync('./database/cardInfo.json');
  allData = [...allData, ...getData];
  fs.writeFileSync('./database/cardInfo.json', JSON.stringify(allData));
  console.log(
    chalk.white.bgGreen.bold('Updated Data Successful !'),
    `,total updated ${getData.length} data`,
  );
};

async function main() {
  console.log(
    figlet.textSync('YGO Reptile!', {
      font: 'Ghost',
      horizontalLayout: 'fill',
      verticalLayout: 'default',
      width: 80,
      whitespaceBreak: true,
    }),
  );

  const answers = await inquirer.prompt({
    type: 'list',
    name: 'updateOption',
    message: 'Please select an update process.',
    choices: [
      { name: 'Options', value: '1' },
      { name: 'Card Information', value: '2' },
      { name: 'All', value: '3' },
    ],
  });

  switch (answers.updateOption) {
    case '1':
      await getOptions();
      break;
    case '2':
      await getCardInfo();
      break;
    case '3':
      await getOptions(getCardInfo);
      break;
  }
}

main();
