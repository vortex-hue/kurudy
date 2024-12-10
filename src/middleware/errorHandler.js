const errorHandler = (err, req, res, next) => {
  console.error(err.stack);

  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        error: "File too large. Maximum size is 5MB.",
      });
    }
    if (err.code === "LIMIT_FILE_COUNT") {
      return res.status(400).json({
        error: "Too many files. Maximum is 5 files per upload.",
      });
    }
    return res.status(400).json({
      error: "File upload error: " + err.message,
    });
  }

  if (err.name === "ValidationError") {
    return res.status(400).json({
      error: err.message,
    });
  }

  // Default error
  res.status(500).json({
    error: "Internal Server Error",
  });
};

module.exports = errorHandler;
