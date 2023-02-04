import chalk from 'chalk';

export const errorMsg = txt => console.log(chalk.white.bgRed(txt), 'Please Check & Retry!');
