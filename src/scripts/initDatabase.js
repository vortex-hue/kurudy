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
    owner_id INTEGER NOT NULL REFERENCES users(id),
    approved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(100) UNIQUE NOT NULL,
    phone_number VARCHAR(20) UNIQUE NOT NULL,
    password_hash VARCHAR(255),
    user_type VARCHAR(20) NOT NULL CHECK (user_type IN ('vendor', 'admin', 'customer')),
    referral_code VARCHAR(10) UNIQUE NOT NULL,
    referred_by VARCHAR(10) REFERENCES users(referral_code),
    auth_provider VARCHAR(20) DEFAULT 'email',
    auth_provider_id VARCHAR(255),
    is_verified BOOLEAN DEFAULT FALSE,
    reset_token VARCHAR(255),
    reset_token_expires TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS referrals (
    id SERIAL PRIMARY KEY,
    referrer_id INTEGER REFERENCES users(id),
    referred_id INTEGER REFERENCES users(id),
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
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
