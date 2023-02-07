import chalk from 'chalk';
import fs from 'fs';
import { reptileCardInfo, reptileOptions } from './api/reptile.js';
import inquirer from 'inquirer';
import { useErrorMsg } from './api/tools/index.js';
import figlet from 'figlet';
import gradient from 'gradient-string';

const checkCardNumber = file =>
  fs
    .readdirSync('./pics')
    .map(el => el.split('.')[0].padStart(8, '0'))
    .filter(el => file.existed.findIndex(x => x === el) === -1);

const updatedJson = (newData, file) => {
  // if (!newData.length) return;
  file.existed = [...file.existed, ...newData];
  file.lastAdd = newData;
  return file;
};

// './database/card_number.json'
const checkDataFromYgoProPic = path => checkCardNumber(JSON.parse(fs.readFileSync(path)));
const checkDataFromJson = path => JSON.parse(fs.readFileSync(path));

const getOptions = async (updateOption, cb = async () => {}) => {
  console.log(gradient.rainbow('========  Reptile YGO Options Information ========'));
  let newData = await reptileOptions();
  fs.writeFileSync('./database/options.json', JSON.stringify(newData.options));
  fs.writeFileSync(
    './database/productInformation.json',
    JSON.stringify(newData.productInformation),
  );
  console.log(chalk.white.bgGreen.bold('Updated Options Successful !'));
  //* 結束後執行callback function
  if (updateOption === '3') await cb();
};

const getCardInfo = async () => {
  console.log(gradient.rainbow('========  Reptile YGO Cards Information ========'));
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
      message: 'Input path information.(Pic => card_number.json path , JSON => json path)',
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
  file = updatedJson(newData, file);

  // Image File Control
  const imgFilePath = await inquirer.prompt({
    type: 'input',
    name: 'path',
    message: 'Input update image file path.',
  });

  //* 爬蟲
  const getData = await reptileCardInfo(file, imgFilePath.path);

  const allData = [...fs.readFileSync('./database/cardInfo.json'), ...getData.final];

  fs.writeFileSync('./database/card_number.json', JSON.stringify(getData.file));
  fs.writeFileSync('./database/cardInfo.json', JSON.stringify(allData));

  console.log(
    chalk.white.bgGreen.bold('Updated Data Successful !'),
    `,total updated ${getData.final.length} data`,
  );
};

async function main() {
  console.log(
    figlet.textSync('YGO Reptile!', {
      font: 'Ghost',
      horizontalLayout: 'fill',
      verticalLayout: 'default',
      width: 140,
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

  answers.updateOption === '2'
    ? await getCardInfo()
    : await getOptions(answers.updateOption, getCardInfo);
}

main();
