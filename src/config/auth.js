require("dotenv").config();
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = "24h";

const generateToken = (userId, userType) => {
  return jwt.sign({ userId, userType }, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });
};

const generateReferralCode = async () => {
  const code = crypto.randomBytes(5).toString("hex").toUpperCase();
  return code.substring(0, 8);
};

const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
};

const comparePasswords = async (password, hashedPassword) => {
  return bcrypt.compare(password, hashedPassword);
};

module.exports = {
  generateToken,
  generateReferralCode,
  hashPassword,
  comparePasswords,
  JWT_SECRET,
};
