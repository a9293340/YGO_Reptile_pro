import figlet from 'figlet';
import { reptilePrice } from './api/reptilePrice.js';
import schedule from 'node-schedule';
import gradient from 'gradient-string';
import chalk from 'chalk';
import fs from 'fs';
import nodemailer from 'nodemailer';
import path from 'path';

const getRutenInfo = async () => {
  console.log(gradient.rainbow('========  Reptile YGO Cards Price ========'));
  let price = await reptilePrice();

  const filename = `${new Date().toDateString()}.json`;
  const filePath = path.join('./log', filename);
  fs.writeFileSync(filePath, JSON.stringify(price.failedIds));

  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com', // SMTP 服务器
    port: 587, // SMTP 端口
    secure: false, // 如果端口为 465 则为 true，其他端口一般为 false
    auth: {
      user: process.env.EMAIL, // 你的邮箱账户
      pass: `${process.env.EPASS1} ${process.env.EPASS2} ${process.env.EPASS3} ${process.env.EPASS4}`, // 你的邮箱密码
    },
  });

  const mailOptions = {
    from: 'erichong19900327@gmail.com',
    to: 'f102041332@gmail.com,alex1234567639@gmail.com',
    subject: `爬蟲完成確認信件(${new Date().toLocaleDateString()})`,
    html: `
      <p>'Updated Data Price Successful !'</p>
      <p> total updated ${price.cardInfo.length} data(${new Date().toLocaleDateString()})</a>
    `,
    attachments: [
      {
        filename: filename,
        path: filePath,
      },
    ],
  };

  transporter.sendMail(mailOptions, async function (error, info) {
    if (error) {
      console.log('Error sending email: ' + error);
    } else {
      console.log(
        chalk.white.bgGreen.bold('Updated Data Price Successful !'),
        `,total updated ${price.cardInfo.length} data(${new Date().toLocaleDateString()})`,
      );
    }
  });
};

async function scheduleReptilePrice() {
  console.log(
    figlet.textSync('YGO Reptile!', {
      font: 'Ghost',
      horizontalLayout: 'fill',
      verticalLayout: 'default',
      width: 140,
      whitespaceBreak: true,
    }),
  );
  schedule.scheduleJob('scheduleReptilePrice', '20 33 17 * * *', () => {
    getRutenInfo();
  });
}

scheduleReptilePrice();
