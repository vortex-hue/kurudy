const { client, LISTINGS_INDEX } = require("../config/opensearch");

class SearchService {
  async indexListing(listing) {
    try {
      await client.index({
        index: LISTINGS_INDEX,
        id: listing.id.toString(),
        body: {
          ...listing,
          created_at: new Date(listing.created_at),
        },
      });
    } catch (error) {
      console.error("Error indexing listing:", error);
      throw error;
    }
  }

  async searchListings({
    query,
    location,
    category,
    minPrice,
    maxPrice,
    minRating,
    sortBy,
    page = 1,
    limit = 10,
  }) {
    try {
      const must = [];
      const filter = [];

      // Full-text search
      if (query) {
        must.push({
          multi_match: {
            query,
            fields: ["title^2", "description"], // Title has higher weight
            fuzziness: "AUTO",
          },
        });
      }

      // Filters
      if (location) {
        filter.push({ term: { location } });
      }
      if (category) {
        filter.push({ term: { category } });
      }
      if (minPrice || maxPrice) {
        filter.push({
          range: {
            price: {
              ...(minPrice && { gte: minPrice }),
              ...(maxPrice && { lte: maxPrice }),
            },
          },
        });
      }
      if (minRating) {
        filter.push({
          range: {
            vendor_rating: { gte: minRating },
          },
        });
      }

      // Sort configuration
      const sort = [];
      if (sortBy) {
        switch (sortBy) {
          case "price_asc":
            sort.push({ price: "asc" });
            break;
          case "price_desc":
            sort.push({ price: "desc" });
            break;
          case "rating_desc":
            sort.push({ vendor_rating: "desc" });
            break;
          case "date_desc":
            sort.push({ created_at: "desc" });
            break;
          default:
            sort.push({ _score: "desc" });
        }
      }

      const result = await client.search({
        index: LISTINGS_INDEX,
        body: {
          query: {
            bool: {
              must,
              filter,
            },
          },
          sort,
          from: (page - 1) * limit,
          size: limit,
          aggs: {
            categories: {
              terms: { field: "category" },
            },
            locations: {
              terms: { field: "location" },
            },
            price_stats: {
              stats: { field: "price" },
            },
          },
        },
      });

      return {
        listings: result.body.hits.hits.map((hit) => ({
          ...hit._source,
          _score: hit._score,
        })),
        total: result.body.hits.total.value,
        aggregations: result.body.aggregations,
        page,
        pages: Math.ceil(result.body.hits.total.value / limit),
      };
    } catch (error) {
      console.error("Error searching listings:", error);
      throw error;
    }
  }
}

module.exports = new SearchService();
