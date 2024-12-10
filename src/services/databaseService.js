const pg = require("../config/database");
const sqlite = require("../config/sqliteDatabase");

class DatabaseService {
  async query(queryObject, params = []) {
    try {
      // Try PostgreSQL first
      const result = await pg.query(queryObject.pg, params);
      return result.rows;
    } catch (pgError) {
      console.error("PostgreSQL Error:", pgError);

      try {
        // Fallback to SQLite
        console.log("Falling back to SQLite...");
        if (queryObject.type === "SELECT") {
          return await sqlite.getAll(queryObject.sqlite, params);
        } else {
          return await sqlite.runQuery(queryObject.sqlite, params);
        }
      } catch (sqliteError) {
        console.error("SQLite Error:", sqliteError);
        throw new Error("Database operation failed");
      }
    }
  }
}

// Query templates
const queries = {
  createListing: {
    type: "INSERT",
    pg: "INSERT INTO listings (title, description, price, vendor_id, image_urls) VALUES ($1, $2, $3, $4, $5) RETURNING *",
    sqlite:
      "INSERT INTO listings (title, description, price, vendor_id, image_urls) VALUES (?, ?, ?, ?, ?)",
  },
  getListing: {
    type: "SELECT",
    pg: "SELECT * FROM listings WHERE id = $1",
    sqlite: "SELECT * FROM listings WHERE id = ?",
  },
  // Add more queries as needed
};

module.exports = { DatabaseService, queries };
