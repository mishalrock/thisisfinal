const { google } = require('googleapis');
const fs = require('fs');

function getAuth() {
  const oauth2Client = new google.auth.OAuth2(
    process.env.YOUTUBE_CLIENT_ID,
    process.env.YOUTUBE_CLIENT_SECRET,
    'http://localhost'
  );
  oauth2Client.setCredentials({ refresh_token: process.env.YOUTUBE_REFRESH_TOKEN });
  return oauth2Client;
}

async function uploadVideo({ filePath, title, description = '', tags = [] }) {
  const auth = getAuth();
  const youtube = google.youtube({ version: 'v3', auth });
  const res = await youtube.videos.insert({
    part: ['snippet', 'status'],
    requestBody: {
      snippet: { title, description, tags, categoryId: '22' },
      status: { privacyStatus: 'private' }
    },
    media: { body: fs.createReadStream(filePath) }
  });
  console.log('Uploaded:', res.data.id);
  return res.data;
}

module.exports = { uploadVideo, getAuth };
