const { db } = require("../config/database");

const initSQL = `
  CREATE TABLE IF NOT EXISTS listings (
    id SERIAL PRIMARY KEY,
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
    vendor_rating DECIMAL(10,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )
`;

async function initializeDatabase() {
  try {
    await db.query({ pgSQL: initSQL });
    console.log("Database initialized successfully");
  } catch (error) {
    console.error("Error initializing database:", error);
    throw error;
  }
}

module.exports = initializeDatabase;
