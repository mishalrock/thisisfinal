const fs = require('fs');
const path = require('path');
const { uploadVideo } = require('./youtube');

const QUEUE_FILE = path.join(process.cwd(), 'queue.json');

function loadQueue() {
  if (!fs.existsSync(QUEUE_FILE)) return [];
  return JSON.parse(fs.readFileSync(QUEUE_FILE, 'utf8'));
}

function saveQueue(q) {
  fs.writeFileSync(QUEUE_FILE, JSON.stringify(q, null, 2));
}

async function processQueue() {
  const queue = loadQueue();
  const pending = queue.filter(i => i.status === 'pending');
  const results = [];
  for (const item of pending) {
    try {
      const r = await uploadVideo(item);
      item.status = 'done';
      item.videoId = r.id;
      results.push({ ...item, success: true });
    } catch (err) {
      item.status = 'failed';
      item.error = err.message;
      results.push({ ...item, success: false, error: err.message });
    }
  }
  saveQueue(queue);
  return results;
}

function enqueue(item) {
  const queue = loadQueue();
  queue.push({ status: 'pending', createdAt: new Date().toISOString(), ...item });
  saveQueue(queue);
  return queue.length;
}

module.exports = { processQueue, enqueue, loadQueue };
