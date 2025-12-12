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

  // 
