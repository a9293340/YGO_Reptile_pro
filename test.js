import MongooseCRUD from "./api/MongoDb/Api.js";
import { reptilePrice } from "./api/reptilePrice.js";
import { google } from "googleapis";
import path from "path";
import fs from "fs";
import dotenv from "dotenv";
dotenv.config();

const main = async () => {
	let cardInfo = await MongooseCRUD("R", "cards", {
		id: new RegExp(`.*${"TW01-"}.*$`),
	});

	for (let i = 0; i < cardInfo.length; i++) {
		await MongooseCRUD(
			"Uo",
			"cards",
			{ id: cardInfo[i].id },
			{ price_info: [] }
		);
		// const list = cardInfo[i].price_info.filter(
		// 	(el) => el.price_avg > 9999 || el.price_lowest > 9999
		// );
		console.log(cardInfo[i].id);
	}
};

const googleL = async () => {
	// google drive
	const CLIENT_ID = process.env.CLIENT_ID;
	const CLIENT_SECRET = process.env.CLIENT_SECRET;
	const REDIRECT_URI = process.env.REDIRECT_URI;
	const REFRESH_TOKEN = process.env.REFRESH_TOKEN;
	console.log("Client ID:", CLIENT_ID);
	console.log("Client Secret:", CLIENT_SECRET);
	console.log("Redirect URI:", REDIRECT_URI);
	console.log("Refresh Token:", REFRESH_TOKEN);
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
					name: "test.json",
					mimeType: "application/json",
					parents: ["1Ci_nD7E258zv0Cjd8M90I44HEoOFWJcl"],
				},
				media: {
					mimeType: "application/json",
					body: fs.createReadStream("./package.json"),
				},
			});
			console.log(res.data);
		} catch (error) {
			console.log(error);
		}
	};

	uploadFile();
};

googleL();
