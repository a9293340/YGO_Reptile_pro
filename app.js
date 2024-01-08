import figlet from "figlet";
import { reptilePrice } from "./api/reptilePrice.js";
import schedule from "node-schedule";
import gradient from "gradient-string";
import chalk from "chalk";
import fs from "fs";
import nodemailer from "nodemailer";
import path from "path";
import axios from "axios";
import dotenv from "dotenv";
import { google } from "googleapis";
dotenv.config();

const getRutenInfo = async () => {
	const sendStartLine = async (message) => {
		const token = process.env.LINENOTIFY; // 將此替換為您的 LINE Notify 權杖
		const url = "https://notify-api.line.me/api/notify";

		await axios.post(url, `message=${message}`, {
			headers: {
				Authorization: `Bearer ${token}`,
				"Content-Type": "application/x-www-form-urlencoded",
			},
		});
	};
	let now = new Date().toLocaleDateString();
	await sendStartLine(`${now} 開始爬蟲!`);
	console.log(gradient.rainbow("========  Reptile YGO Cards Price ========"));

	let price, html;
	let errorMsg = "";
	try {
		price = await reptilePrice();
		html = `
    <p>'Updated Data Price Successful !'</p>
    <p> total updated ${price.cardInfo.length} data(${now})</a>
  `;
	} catch (error) {
		price = null;
		html = `
    <p>爬蟲錯誤</P>
    <p>${error}<p>
    `;
	}

	const filename = `${new Date().toDateString()}.json`;
	const filePath = path.join("./log", filename);
	fs.writeFileSync(filePath, JSON.stringify(price.failedIds));

	const sendLineNotification = (message) => {
		axios
			.post(url, `message=${message}`, {
				headers: {
					Authorization: `Bearer ${token}`,
					"Content-Type": "application/x-www-form-urlencoded",
				},
			})
			.then(() => {
				console.log(
					chalk.white.bgGreen.bold(
						`Updated Data Price ${price ? "Successful" : "failed!"} !`
					),
					`,total updated ${price.cardInfo.length} data(${now})`
				);
			})
			.catch((error) => {
				console.error("Error sending LINE notification:", error);
			});
	};

	const sendMail = () => {
		const transporter = nodemailer.createTransport({
			host: "smtp.gmail.com", // SMTP 服务器
			port: 587, // SMTP 端口
			secure: false, // 如果端口为 465 则为 true，其他端口一般为 false
			auth: {
				user: process.env.EMAIL, // 你的邮箱账户
				pass: `${process.env.EPASS1} ${process.env.EPASS2} ${process.env.EPASS3} ${process.env.EPASS4}`, // 你的邮箱密码
			},
		});

		const mailOptions = {
			from: "ygo.cardtime@gmail.com",
			to: "f102041332@gmail.com,alex8603062000@gmail.com",
			subject: `爬蟲完成確認信件(${now})`,
			html,
			attachments: [
				{
					filename: filename,
					path: filePath,
				},
			],
		};

		transporter.sendMail(mailOptions, async function (error, info) {
			if (error) {
				console.log("Error sending email: " + error);
			} else {
				sendLineNotification(`${now} - 卡價爬蟲完畢!`);
			}
		});
	};

	const drive = async () => {
		// google drive
		const CLIENT_ID = process.env.CLIENT_ID;
		const CLIENT_SECRET = process.env.CLIENT_SECRET;
		const REDIRECT_URI = process.env.REDIRECT_URI;
		const REFRESH_TOKEN = process.env.REFRESH_TOKEN;
		const oauth2Client = new google.auth.OAuth2(
			CLIENT_ID,
			CLIENT_SECRET,
			REDIRECT_URI
		);
		oauth2Client.setCredentials({ refresh_token: REFRESH_TOKEN });

		const drive = google.drive({
			version: "v3",
			auth: oauth2Client,
		});

		const uploadFile = async () => {
			try {
				const res = await drive.files.create({
					requestBody: {
						name: filename,
						mimeType: "application/json",
						parents: ["1Ci_nD7E258zv0Cjd8M90I44HEoOFWJcl"],
					},
					media: {
						mimeType: "application/json",
						body: fs.createReadStream(filePath),
					},
				});
				console.log(res.data);
			} catch (error) {
				errorMsg = `${error}`;
			}
		};

		await uploadFile();
	};

	sendMail();
};

async function scheduleReptilePrice() {
	console.log(
		figlet.textSync("YGO Reptile!", {
			font: "Ghost",
			horizontalLayout: "fill",
			verticalLayout: "default",
			width: 140,
			whitespaceBreak: true,
		})
	);
	schedule.scheduleJob("scheduleReptilePrice", "01 00 00 * * *", () => {
		getRutenInfo();
	});
}

scheduleReptilePrice();
