const searchService = require("../services/searchService");
const { db, queries } = require("../config/database");
const { uploadToS3 } = require("../services/s3Service");

// Update the search method in your controller
exports.search = async (req, res) => {
  try {
    const {
      q: query,
      location,
      category,
      minPrice,
      maxPrice,
      minRating,
      sortBy,
      page,
      limit,
    } = req.query;

    // Fallback to database search if OpenSearch fails
    try {
      const results = await searchService.searchListings({
        query,
        location,
        category,
        minPrice: minPrice ? parseFloat(minPrice) : undefined,
        maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
        minRating: minRating ? parseFloat(minRating) : undefined,
        sortBy,
        page: parseInt(page) || 1,
        limit: parseInt(limit) || 10,
      });
      return res.json(results);
    } catch (searchError) {
      console.error("OpenSearch error, falling back to database:", searchError);

      // Basic database search fallback
      const listings = await db.query(queries.getAllListings);
      return res.json({
        listings: listings.filter((listing) => {
          if (
            query &&
            !listing.title.toLowerCase().includes(query.toLowerCase())
          )
            return false;
          if (location && listing.location !== location) return false;
          if (category && listing.category !== category) return false;
          if (minPrice && listing.price < minPrice) return false;
          if (maxPrice && listing.price > maxPrice) return false;
          if (minRating && listing.vendor_rating < minRating) return false;
          return true;
        }),
        total: listings.length,
        page: 1,
        pages: 1,
      });
    }
  } catch (error) {
    console.error("Search error:", error);
    res.status(500).json({ error: error.message });
  }
};

exports.create = async (req, res) => {
  try {
    const { title, price, vendor_name, vendor_email } = req.body;

    // Validate required fields
    if (!title || !price || !vendor_name || !vendor_email) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Handle image uploads
    let image_urls = [];
    if (req.files?.length) {
      image_urls = await Promise.all(req.files.map((file) => uploadToS3(file)));
    }

    // Create listing in database
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

    // Index in OpenSearch if available
    try {
      await searchService.indexListing(listing);
    } catch (searchError) {
      console.error("OpenSearch indexing failed:", searchError);
      // Continue without failing the request if OpenSearch indexing fails
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
    // Get existing listing
    const result = await db.query(queries.getListing, [req.params.id]);
    const listing = result[0];

    if (!listing) {
      return res.status(404).json({ error: "Listing not found" });
    }

    // Handle image urls
    const image_urls = listing.image_urls
      ? listing.image_urls.split(",").filter(Boolean)
      : [];

    if (req.files?.length) {
      const newUrls = await Promise.all(
        req.files.map((file) => uploadToS3(file))
      );
      image_urls.push(...newUrls);
    }

    // Update in database
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

    // Update in OpenSearch
    try {
      await searchService.updateListing({
        ...updated,
        id: req.params.id,
      });
    } catch (searchError) {
      console.error("OpenSearch update failed:", searchError);
      // Continue without failing if OpenSearch update fails
    }

    res.json(updated);
  } catch (error) {
    console.error("Update error:", error);
    res.status(500).json({ error: error.message });
  }
};

exports.delete = async (req, res) => {
  try {
    // Delete from database
    const result = await db.query(queries.deleteListing, [req.params.id]);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Listing not found" });
    }

    // Delete from OpenSearch
    try {
      await searchService.deleteListing(req.params.id);
    } catch (searchError) {
      console.error("OpenSearch deletion failed:", searchError);
      // Continue without failing if OpenSearch deletion fails
    }

    res.json({ message: "Listing deleted successfully" });
  } catch (error) {
    console.error("Delete error:", error);
    res.status(500).json({ error: error.message });
  }
};
