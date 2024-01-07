import { google } from 'googleapis';
import fs from 'fs';
import dotenv from 'dotenv';
dotenv.config();

const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const REDIRECT_URI = process.env.REDIRECT_URI;
const REFRESH_TOKEN = process.env.REFRESH_TOKEN;

const oauth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);

oauth2Client.setCredentials({ refresh_token: REFRESH_TOKEN });

const drive = google.drive({
  version: 'v3',
  auth: oauth2Client,
});

const uploadFile = async () => {
  try {
    const res = await drive.files.create({
      requestBody: {
        name: 'test.json',
        mimeType: 'application/json',
        parents: ['1Ci_nD7E258zv0Cjd8M90I44HEoOFWJcl'],
      },
      media: {
        mimeType: 'application/json',
        body: fs.createReadStream('./package.json'),
      },
    });

    console.log(res.data);
  } catch (error) {
    console.log(error.message);
  }
};

uploadFile();
