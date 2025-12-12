const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const app = express();
app.use(bodyParser.json());
app.use(cors());

// 資料庫
const db = new sqlite3.Database('./members.db', (err) => {
  if (err) console.error(err);
  else console.log('✅ 資料庫已連接');
});

// 建立表格
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS members (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      phone TEXT UNIQUE NOT NULL,
      email TEXT,
      level TEXT DEFAULT '一般會員',
      points INTEGER DEFAULT 0
    )
  `);
});

// 健康檢查
app.get('/health', (req, res) => {
  res.json({ status: '✅ API 運行中' });
});

// Webhook
app.post('/webhook', (req, res) => {
  const events = req.body.events;
  
  if (!events) {
    return res.status(400).json({ message: 'No events' });
  }

  events.forEach(event => {
    if (event.type === 'message' && event.message.type === 'text') {
      const replyToken = event.replyToken;
      // 簡單測試：收到任何訊息就回覆
      sendReply(replyToken, '✅ 我收到你的訊息了！');
    }
  });

  res.json({ ok: true });
});

// 回覆函數
function sendReply(replyToken, text) {
  const token = process.env.LINE_ACCESS_TOKEN;
  
  axios.post('https://api.line.biz/v2/bot/message/reply',
    {
      replyToken: replyToken,
      messages: [{ type: 'text', text: text }]
    },
    {
      headers: { 'Authorization': `Bearer ${token}` }
    }
  ).then(() => {
    console.log('✅ 訊息已回覆');
  }).catch(err => {
    console.error('❌ 回覆失敗:', err.message);
  });
}

// 啟動
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ 伺服器運行在 ${PORT}`);
});
