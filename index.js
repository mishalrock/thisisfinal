require('dotenv').config();
const express = require('express');
const cron = require('node-cron');
const path = require('path');
const fs = require('fs');
const { uploadVideo } = require('./src/youtube');
const { processQueue } = require('./src/queue');

const PORT = process.env.PORT || 3000;
const app = express();
app.use(express.json());

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok', uptime: process.uptime() }));

// Webhook trigger: POST /upload with { filePath, title, description, tags }
app.post('/upload', async (req, res) => {
  const { filePath, title, description, tags } = req.body || {};
  if (!filePath || !title) {
    return res.status(400).json({ error: 'filePath and title required' });
  }
  try {
    const result = await uploadVideo({ filePath, title, description, tags });
    res.json({ success: true, videoId: result.id, url: `https://youtube.com/watch?v=${result.id}` });
  } catch (err) {
    console.error('Upload failed:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// Queue processing endpoint
app.post('/process-queue', async (req, res) => {
  try {
    const results = await processQueue();
    res.json({ processed: results.length, results });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Scheduled: process upload queue every 5 minutes
cron.schedule('*/5 * * * *', async () => {
  console.log('[cron] processing upload queue');
  try {
    const results = await processQueue();
    console.log(`[cron] processed ${results.length} videos`);
  } catch (err) {
    console.error('[cron] error:', err.message);
  }
});

app.listen(PORT, () => {
  console.log(`YouTube auto-upload agent running on port ${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', () => { console.log('SIGTERM received, shutting down'); process.exit(0); });
process.on('SIGINT', () => { console.log('SIGINT received, shutting down'); process.exit(0); });
