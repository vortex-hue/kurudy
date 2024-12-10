// src/config/elasticsearch.js
const { Client } = require("@elastic/elasticsearch");
require("dotenv").config();

const client = new Client({
  cloud: {
    id: process.env.ELASTIC_CLOUD_ID,
  },
  auth: {
    apiKey: process.env.ELASTIC_API_KEY,
  },
});

// Index name for listings
const LISTINGS_INDEX = "listings";

// Initialize Elasticsearch index
async function initializeElasticsearch() {
  try {
    const indexExists = await client.indices.exists({
      index: LISTINGS_INDEX,
    });

    if (!indexExists) {
      await client.indices.create({
        index: LISTINGS_INDEX,
        body: {
          mappings: {
            properties: {
              title: { type: "text" },
              description: { type: "text" },
              location: { type: "keyword" },
              category: { type: "keyword" },
              price: { type: "float" },
              vendor_name: { type: "keyword" },
              vendor_email: { type: "keyword" },
              vendor_service_offered: { type: "keyword" },
              vendor_rating: { type: "float" },
              created_at: { type: "date" },
            },
          },
        },
      });
    }
  } catch (error) {
    console.error("Elasticsearch initialization error:", error);
    throw error;
  }
}

module.exports = { client, LISTINGS_INDEX, initializeElasticsearch };
