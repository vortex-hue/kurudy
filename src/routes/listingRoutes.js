// src/routes/listingRoutes.js
const express = require("express");
const router = express.Router();
const controller = require("../controllers/listingController");

/**
 * @swagger
 * /v1/listings/search:
 *   get:
 *     tags:
 *       - Listings
 *     summary: Search and filter listings
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         description: Search query for title and description
 *       - in: query
 *         name: location
 *         schema:
 *           type: string
 *         description: Filter by exact location
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by exact category
 *       - in: query
 *         name: minPrice
 *         schema:
 *           type: number
 *         description: Minimum price filter
 *       - in: query
 *         name: maxPrice
 *         schema:
 *           type: number
 *         description: Maximum price filter
 *       - in: query
 *         name: minRating
 *         schema:
 *           type: number
 *         description: Minimum vendor rating filter
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [price_asc, price_desc, rating_desc, date_desc]
 *         description: Sort results by specified criteria
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *           default: 10
 *         description: Items per page
 *     responses:
 *       200:
 *         description: Search results
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 listings:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Listing'
 *                 total:
 *                   type: integer
 *                 page:
 *                   type: integer
 *                 limit:
 *                   type: integer
 *                 pages:
 *                   type: integer
 *                 aggregations:
 *                   type: object
 */
router.get("/search", controller.search);

/**
 * @swagger
 * /v1/listings:
 *   post:
 *     tags:
 *       - Listings
 *     summary: Create a new listing
 *     consumes:
 *       - multipart/form-data
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - price
 *               - vendor_name
 *               - vendor_email
 *             properties:
 *               title:
 *                 type: string
 *                 example: "Beach House"
 *               description:
 *                 type: string
 *                 example: "Beautiful beachfront property"
 *               location:
 *                 type: string
 *                 example: "Miami Beach"
 *               category:
 *                 type: string
 *                 example: "Real Estate"
 *               price:
 *                 type: number
 *                 example: 1500.00
 *               vendor_name:
 *                 type: string
 *                 example: "John Smith"
 *               vendor_email:
 *                 type: string
 *                 example: "john@example.com"
 *               vendor_phone:
 *                 type: string
 *                 example: "1234567890"
 *               vendor_rating:
 *                 type: decimal
 *                 example: 4.5
 *               vendor_service_offered:
 *                 type: string
 *                 example: "Property Rental"
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       201:
 *         description: Listing created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Listing'
 */
router.post("/", controller.create);

/**
 * @swagger
 * /v1/listings:
 *   get:
 *     tags:
 *       - Listings
 *     summary: Get all listings
 *     responses:
 *       200:
 *         description: Array of listings
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Listing'
 */
router.get("/", controller.getAll);

/**
 * @swagger
 * /v1/listings/{id}:
 *   get:
 *     tags:
 *       - Listings
 *     summary: Get a listing by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Listing details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Listing'
 */
router.get("/:id", controller.getOne);

/**
 * @swagger
 * /v1/listings/{id}:
 *   put:
 *     tags:
 *       - Listings
 *     summary: Update a listing
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *
 *             properties:
 *               title:
 *                 type: string
 *                 example: "Beach House"
 *               description:
 *                 type: string
 *                 example: "Beautiful beachfront property"
 *               location:
 *                 type: string
 *                 example: "Miami Beach"
 *               category:
 *                 type: string
 *                 example: "Real Estate"
 *               price:
 *                 type: number
 *                 example: 1500.00
 *               vendor_name:
 *                 type: string
 *                 example: "John Smith"
 *               vendor_rating:
 *                 type: number
 *                 example: 5
 *               vendor_email:
 *                 type: string
 *                 example: "john@example.com"
 *               vendor_phone:
 *                 type: string
 *                 example: "1234567890"
 *               vendor_service_offered:
 *                 type: string
 *                 example: "Property Rental"
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       200:
 *         description: Updated listing
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Listing'
 */
router.put("/:id", controller.update);

/**
 * @swagger
 * /v1/listings/{id}:
 *   delete:
 *     tags:
 *       - Listings
 *     summary: Delete a listing
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Listing deleted successfully
 */
router.delete("/:id", controller.delete);

// src/routes/listingRoutes.js
// Add this to your existing routes

module.exports = router;
