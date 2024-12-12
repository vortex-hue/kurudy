const express = require("express");
const cors = require("cors");
const multer = require("multer");
const swaggerUi = require("swagger-ui-express");
const serverless = require("serverless-http");
const swaggerJsdoc = require("swagger-jsdoc");
require("dotenv").config();

const initializeDatabase = require("./src/scripts/initDatabase");
// const { initializeOpenSearch } = require("./src/config/opensearch");

// Initialize database tables
initializeDatabase().catch(console.error);

// After your other initialization code
// initializeOpenSearch().catch(console.error);

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

// Swagger configuration
const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Kurudy Serverless RESTAPI",
      version: "1.0.0",
      description: "API for managing property listings and authentication",
    },
    servers: [
      {
        url: "http://localhost:3000",
        description: "Development server",
      },
    ],
    components: {
      schemas: {
        Listing: {
          type: "object",
          required: ["title", "price", "vendor_name", "vendor_email"],
          properties: {
            id: { type: "integer" },
            title: { type: "string" },
            description: { type: "string" },
            location: { type: "string" },
            category: { type: "string" },
            price: { type: "number" },
            image_urls: {
              type: "array",
              items: { type: "string" },
            },
            vendor_name: { type: "string" },
            vendor_email: { type: "string" },
            vendor_phone: { type: "string" },
            vendor_service_offered: { type: "string" },
            vendor_rating: { type: "number" },
            created_at: { type: "string" },
            updated_at: { type: "string" },
          },
        },
        User: {
          type: "object",
          required: [
            "email",
            "username",
            "phone_number",
            "password",
            "user_type",
          ],
          properties: {
            id: { type: "integer" },
            email: { type: "string", format: "email" },
            username: { type: "string" },
            phone_number: { type: "string" },
            user_type: {
              type: "string",
              enum: ["vendor", "admin", "customer"],
            },
            referral_code: { type: "string" },
            auth_provider: { type: "string" },
            is_verified: { type: "boolean" },
            created_at: { type: "string" },
            updated_at: { type: "string" },
          },
        },
      },
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ["./src/routes/*.js"], // Path to the API routes
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

// Enable CORS for all routes
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());
app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Routes
const listingRoutes = require("./src/routes/listingRoutes");
const authRoutes = require("./src/routes/authRoutes");
const passport = require("./src/config/passport");
const socialAuthRoutes = require("./src/routes/socialAuthRoutes");

// Add passport middleware
app.use(passport.initialize());

// Add social auth routes
app.use("/v1/auth", socialAuthRoutes);

app.use("/v1/listings", upload.array("images", 10), listingRoutes);
app.use("/v1/auth", authRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

//Serverless Feature for lambda
// module.exports.handler = serverless(app);

// const handler = serverless(app);

// module.exports.handler = async (event, context) => {
//   try {
//     return await handler(event, context);
//   } catch (error) {
//     console.error("Error details:", error);
//     return {
//       statusCode: 500,
//       body: JSON.stringify({ message: error.message }),
//     };
//   }
// };
