const { db, queries } = require("../config/database");
const { uploadToS3 } = require("../services/s3Service");

exports.create = async (req, res) => {
  try {
    const { title, price, vendor_name, vendor_email } = req.body;

    if (!title || !price || !vendor_name || !vendor_email) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    let image_urls = [];
    if (req.files?.length) {
      image_urls = await Promise.all(req.files.map((file) => uploadToS3(file)));
    }

    const result = await db.query(queries.createListing, [
      title,
      req.body.description || "",
      req.body.location || "",
      req.body.category || "",
      price,
      image_urls.join(","),
      vendor_name,
      vendor_email,
      req.body.vendor_phone || "",
      req.body.vendor_service_offered || "",
      req.body.vendor_rating || null,
    ]);

    const listing = result[0];

    if (listing.image_urls) {
      listing.image_urls = listing.image_urls.split(",").filter(Boolean);
    }

    res.status(201).json(listing);
  } catch (error) {
    console.error("Create error:", error);
    res.status(500).json({ error: error.message });
  }
};

exports.getAll = async (req, res) => {
  try {
    const listings = await db.query(queries.getAllListings);
    listings.forEach((listing) => {
      if (listing.image_urls) {
        listing.image_urls = listing.image_urls.split(",").filter(Boolean);
      }
    });
    res.json(listings);
  } catch (error) {
    console.error("GetAll error:", error);
    res.status(500).json({ error: error.message });
  }
};

exports.getOne = async (req, res) => {
  try {
    const result = await db.query(queries.getListing, [req.params.id]);
    const listing = result[0];

    if (!listing) {
      return res.status(404).json({ error: "Listing not found" });
    }

    if (listing.image_urls) {
      listing.image_urls = listing.image_urls.split(",").filter(Boolean);
    }
    res.json(listing);
  } catch (error) {
    console.error("GetOne error:", error);
    res.status(500).json({ error: error.message });
  }
};

exports.update = async (req, res) => {
  try {
    const result = await db.query(queries.getListing, [req.params.id]);
    const listing = result[0];

    if (!listing) {
      return res.status(404).json({ error: "Listing not found" });
    }

    const image_urls = listing.image_urls
      ? listing.image_urls.split(",").filter(Boolean)
      : [];

    if (req.files?.length) {
      const newUrls = await Promise.all(
        req.files.map((file) => uploadToS3(file))
      );
      image_urls.push(...newUrls);
    }

    const updateResult = await db.query(queries.updateListing, [
      req.body.title || listing.title,
      req.body.description || listing.description,
      req.body.location || listing.location,
      req.body.category || listing.category,
      req.body.price || listing.price,
      image_urls.join(","),
      req.body.vendor_name || listing.vendor_name,
      req.body.vendor_email || listing.vendor_email,
      req.body.vendor_phone || listing.vendor_phone,
      req.body.vendor_service_offered || listing.vendor_service_offered,
      req.body.vendor_rating || listing.vendor_rating,
      req.params.id,
    ]);

    const updated = updateResult[0];

    if (updated.image_urls) {
      updated.image_urls = updated.image_urls.split(",").filter(Boolean);
    }
    res.json(updated);
  } catch (error) {
    console.error("Update error:", error);
    res.status(500).json({ error: error.message });
  }
};

exports.delete = async (req, res) => {
  try {
    const result = await db.query(queries.deleteListing, [req.params.id]);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Listing not found" });
    }

    res.json({ message: "Listing deleted successfully" });
  } catch (error) {
    console.error("Delete error:", error);
    res.status(500).json({ error: error.message });
  }
};

exports.search = async (req, res) => {
  try {
    const {
      q, // search query for title and description
      location, // exact location match
      category, // exact category match
      minPrice, // minimum price
      maxPrice, // maximum price
      minRating, // minimum vendor rating
      sortBy, // sorting option
      page = 1, // current page
      limit = 10, // items per page
    } = req.query;

    // Calculate offset for pagination
    const offset = (parseInt(page) - 1) * parseInt(limit);

    // Format search query for LIKE operation
    const searchQuery = q ? `%${q}%` : null;

    // Get total count for pagination
    const countResult = await db.query(queries.countSearchResults, [
      searchQuery,
      location || null,
      category || null,
      minPrice ? parseFloat(minPrice) : null,
      maxPrice ? parseFloat(maxPrice) : null,
      minRating ? parseFloat(minRating) : null,
    ]);

    const total = countResult[0].total;

    // Get search results
    const listings = await db.query(queries.searchListings, [
      searchQuery,
      location || null,
      category || null,
      minPrice ? parseFloat(minPrice) : null,
      maxPrice ? parseFloat(maxPrice) : null,
      minRating ? parseFloat(minRating) : null,
      sortBy || "date_desc",
      parseInt(limit),
      offset,
    ]);

    // Process image_urls for each listing
    listings.forEach((listing) => {
      if (listing.image_urls) {
        listing.image_urls = listing.image_urls.split(",").filter(Boolean);
      }
    });

    // Get unique categories and locations for filters
    const aggregations = {
      categories: [
        ...new Set(listings.map((item) => item.category).filter(Boolean)),
      ],
      locations: [
        ...new Set(listings.map((item) => item.location).filter(Boolean)),
      ],
      price_range: {
        min: Math.min(...listings.map((item) => item.price)),
        max: Math.max(...listings.map((item) => item.price)),
      },
    };

    res.json({
      listings,
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      pages: Math.ceil(total / parseInt(limit)),
      aggregations,
    });
  } catch (error) {
    console.error("Search error:", error);
    res.status(500).json({ error: error.message });
  }
};
