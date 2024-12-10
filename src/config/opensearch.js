// src/config/opensearch.js
const { Client } = require("@opensearch-project/opensearch");
const aws4 = require("aws4");
require("dotenv").config();

const createAwsConnector = (credentials) => {
  return {
    fetch: async (request) => {
      const signedRequest = aws4.sign(
        {
          method: request.method,
          path: request.path,
          host: new URL(request.url).host,
          body: request.body,
          headers: request.headers,
          service: "es",
        },
        credentials
      );

      const response = await fetch(request.url, {
        method: signedRequest.method,
        headers: signedRequest.headers,
        body: request.body,
      });

      return response;
    },
  };
};

const client = new Client({
  node: process.env.OPENSEARCH_ENDPOINT,
  connector: createAwsConnector({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION,
  }),
});

const LISTINGS_INDEX = "listings";

const initializeOpenSearch = async () => {
  try {
    const { body: indexExists } = await client.indices.exists({
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
      console.log("OpenSearch index created successfully");
    }
  } catch (error) {
    console.error("OpenSearch initialization error:", error);
    // Don't throw error to allow app to continue without search
    console.log("Continuing without OpenSearch functionality");
  }
};

module.exports = { client, LISTINGS_INDEX, initializeOpenSearch };
