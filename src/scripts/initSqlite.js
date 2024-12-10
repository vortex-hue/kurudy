// src/scripts/initSqlite.js
const sqlite = require("../config/sqliteDatabase");

async function initializeSqlite() {
  const tables = [
    `CREATE TABLE IF NOT EXISTS listings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      location TEXT,
      category TEXT,
      price DECIMAL(10,2) NOT NULL,
      image_urls TEXT,
      vendor_name TEXT NOT NULL,
      vendor_email TEXT NOT NULL,
      vendor_phone TEXT,
      vendor_service_offered TEXT,
      vendor_rating DECIMAL(10,2) NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
  ];

  for (const table of tables) {
    await sqlite.runQuery(table);
  }
}

module.exports = initializeSqlite;
