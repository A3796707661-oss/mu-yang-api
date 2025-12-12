const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(bodyParser.json());
app.use(cors());

// ===== 資料庫初始化 =====
const db = new sqlite3.Database('./members.db', (err) => {
  if (err) console.error(err);
  else console.log('✅ SQLite 資料庫已連接');
});

// 建立表格
db.serialize(() => {
  // 會員表
  db.run(`
    CREATE TABLE IF NOT EXISTS members (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      phone TEXT UNIQUE NOT NULL,
      email TEXT,
      birthday_month INTEGER,
      birthday_day INTEGER,
      level TEXT DEFAULT '一般會員',
      total_spending REAL DEFAULT 0,
      points INTEGER DEFAULT 0,
      vouchers REAL DEFAULT 0,
      notes TEXT,
      join_date TEXT DEFAULT CURRENT_DATE
    )
  `);

  // 購買紀錄表
  db.run(`
    CREATE TABLE IF NOT EXISTS purchases (
      id INTEGER PRIMARY KEY,
      member_phone TEXT NOT NULL,
      amount REAL NOT NULL,
      items_count INTEGER,
      purchase_date TEXT DEFAULT CURRENT_DATE,
      FOREIGN KEY (member_phone) REFERENCES members(phone)
    )
  `);

  // 點數兌換紀錄表
  db.run(`
    CREATE TABLE IF NOT EXISTS redemptions (
      id INTEGER PRIMARY KEY,
      member_phone TEXT NOT NULL,
      redemption_code TEXT UNIQUE,
      amount REAL DEFAULT 100,
      status TEXT DEFAULT '未使用',
      redemption_date TEXT DEFAULT CURRENT_DATE,
      FOREIGN KEY (member_phone) REFERENCES members(phone)
    )
  `);
});

// ===== 健康檢查端點 =====
app.get('/health', (req, res) => {
  res.json({ status: '✅ API 運行中' });
});

// ===== LINE Webhook 端點 =====
app.post('/webhook', (req, res) => {
  const events = req.body.events;
  
  if (!events) {
    return res.status(400).json({ message: 'No events found' });
  }

  events.forEach(event => {
    if (event.type === 'message' && event.message.type === 'text') {
      const userMessage = event.message.text;
      const userId = event.source.userId;
      const replyToken = event.replyToken;
      
      handleUserMessage(userMessage, userId, replyToken);
    }
  });

  res.json({ message: 'OK' });
});

// ===== 處理訊息邏輯 =====
function handleUserMessage(message, userId, replyToken) {
  const liffUrl = process.env.LIFF_URL || 'https://example.com';
  
  if (message.includes('查詢會員') || message.includes('查詢')) {
    sendMessage(replyToken, '請輸入你的電話號碼查詢會員資訊');
  } else if (message.includes('新增購買') || message.includes('購買')) {
    sendMessage(replyToken, '請輸入購買金額');
  } else if (message.includes('點數') || message.includes('積分')) {
    sendMessage(replyToken, '請輸入你的電話號碼查詢點數');
  } else {
    sendMessage(replyToken, '請選擇操作: 查詢會員 / 新增購買 / 點數兌換');
  }
}

// ===== LINE 回覆訊息 =====
function sendMessage(replyToken, text) {
  const lineAccessToken = process.env.LINE_ACCESS_TOKEN;
  const axios = require('axios');
  
  axios.post('https://api.line.biz/v2/bot/message/reply', 
    {
      replyToken: replyToken,
      messages: [{ type: 'text', text: text }]
    },
    {
      headers: { 'Authorization': `Bearer ${lineAccessToken}` }
    }
  ).catch(err => console.error('Line API error:', err));
}

// ===== 啟動伺服器 =====
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ 伺服器運行在 http://localhost:${PORT}`);
});
