const { Pool } = require("pg");
require("dotenv").config();

class DatabaseConnection {
  constructor() {
    this.postgres = new Pool({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      port: process.env.DB_PORT,
      ssl: {
        rejectUnauthorized: false,
      },
    });
  }

  async initializeConnection() {
    try {
      await this.postgres.query("SELECT NOW()");
      console.log("Connected to PostgreSQL successfully");
    } catch (error) {
      console.error("PostgreSQL connection error:", error);
      throw error;
    }
  }

  async query(sqlQueries, params = []) {
    if (!this.postgres) {
      await this.initializeConnection();
    }
    const result = await this.postgres.query(sqlQueries.pgSQL, params);
    return result.rows;
  }

  async close() {
    await this.postgres.end();
  }
}

const db = new DatabaseConnection();

const queries = {
  createListing: {
    pgSQL: `
      INSERT INTO listings (
        title, description, location, category, price,
        image_urls, vendor_name, vendor_email, vendor_phone,
        vendor_service_offered, vendor_rating, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      RETURNING *
    `,
  },
  getAllListings: {
    pgSQL: "SELECT * FROM listings ORDER BY created_at DESC",
  },
  getListing: {
    pgSQL: "SELECT * FROM listings WHERE id = $1",
  },
  updateListing: {
    pgSQL: `
      UPDATE listings SET
        title = $1, description = $2, location = $3,
        category = $4, price = $5, image_urls = $6,
        vendor_name = $7, vendor_email = $8, vendor_phone = $9,
        vendor_service_offered = $10, vendor_rating = $11,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $12
      RETURNING *
    `,
  },
  deleteListing: {
    pgSQL: "DELETE FROM listings WHERE id = $1",
  },
  searchListings: {
    pgSQL: `
      SELECT * FROM listings 
      WHERE 
        ($1::text IS NULL OR LOWER(title) LIKE LOWER($1) OR LOWER(description) LIKE LOWER($1))
        AND ($2::text IS NULL OR LOWER(location) = LOWER($2))
        AND ($3::text IS NULL OR LOWER(category) = LOWER($3))
        AND ($4::decimal IS NULL OR price >= $4)
        AND ($5::decimal IS NULL OR price <= $5)
        AND ($6::decimal IS NULL OR vendor_rating >= $6)
      ORDER BY 
        CASE WHEN $7 = 'price_asc' THEN price END ASC,
        CASE WHEN $7 = 'price_desc' THEN price END DESC,
        CASE WHEN $7 = 'rating_desc' THEN vendor_rating END DESC,
        CASE WHEN $7 = 'date_desc' THEN created_at END DESC,
        created_at DESC
      LIMIT $8 OFFSET $9
    `,
  },
  countSearchResults: {
    pgSQL: `
      SELECT COUNT(*) as total FROM listings 
      WHERE 
        ($1::text IS NULL OR LOWER(title) LIKE LOWER($1) OR LOWER(description) LIKE LOWER($1))
        AND ($2::text IS NULL OR LOWER(location) = LOWER($2))
        AND ($3::text IS NULL OR LOWER(category) = LOWER($3))
        AND ($4::decimal IS NULL OR price >= $4)
        AND ($5::decimal IS NULL OR price <= $5)
        AND ($6::decimal IS NULL OR vendor_rating >= $6)
    `,
  },
  // Authentication queries
  findUserByProvider: {
    pgSQL:
      "SELECT * FROM users WHERE auth_provider = $1 AND auth_provider_id = $2",
  },
  createSocialUser: {
    pgSQL: `
      INSERT INTO users (
        email, username, phone_number, user_type, referral_code,
        auth_provider, auth_provider_id, is_verified
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `,
  },
  findUserById: {
    pgSQL: "SELECT * FROM users WHERE id = $1",
  },
  findUserByEmail: {
    pgSQL: "SELECT * FROM users WHERE email = $1",
  },
  createUser: {
    pgSQL: `
      INSERT INTO users (
        email, username, phone_number, password_hash, 
        user_type, referral_code, referred_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `,
  },
  updateResetToken: {
    pgSQL: `
      UPDATE users 
      SET reset_token = $1, reset_token_expires = $2 
      WHERE id = $3
      RETURNING *
    `,
  },
  findUserByResetToken: {
    pgSQL: `
      SELECT * FROM users 
      WHERE reset_token = $1 
      AND reset_token_expires > $2
    `,
  },
  updatePassword: {
    pgSQL: `
      UPDATE users 
      SET password_hash = $1, reset_token = $2, reset_token_expires = $3 
      WHERE id = $4
      RETURNING *
    `,
  },
  createReferral: {
    pgSQL: `
      INSERT INTO referrals (referrer_id, referred_id) 
      VALUES ($1, $2)
      RETURNING *
    `,
  },
};

module.exports = { db, queries };
