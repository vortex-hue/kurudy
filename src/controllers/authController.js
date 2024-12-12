const { db, queries } = require("../config/database");
const crypto = require("crypto");

const {
  generateToken,
  generateReferralCode,
  hashPassword,
  comparePasswords,
} = require("../config/auth");
const { sendResetPasswordEmail } = require("../services/emailService");

exports.signup = async (req, res) => {
  try {
    const {
      email,
      username,
      phone_number,
      password,
      referral_code,
      user_type,
    } = req.body;

    // Validate user type
    if (!["vendor", "customer"].includes(user_type)) {
      return res.status(400).json({ error: "Invalid user type" });
    }

    // Check if user exists
    const existingUser = await db.query(queries.findUserByEmail, [email]);
    if (existingUser.length > 0) {
      return res.status(400).json({ error: "Email already registered" });
    }

    // Generate unique referral code
    const newReferralCode = await generateReferralCode();

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user
    const result = await db.query(queries.createUser, [
      email,
      username,
      phone_number,
      hashedPassword,
      user_type,
      newReferralCode,
      referral_code || null, // referred_by
    ]);

    const user = result[0];

    // If user was referred, create referral record
    if (referral_code) {
      await db.query(queries.createReferral, [referral_code, user.id]);
    }

    // Generate JWT
    const token = generateToken(user.id, user.user_type);

    res.status(201).json({
      token,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        user_type: user.user_type,
        referral_code: user.referral_code,
      },
    });
  } catch (error) {
    console.error("Signup error:", error);
    res.status(500).json({ error: error.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const users = await db.query(queries.findUserByEmail, [email]);
    const user = users[0];

    if (!user || !(await comparePasswords(password, user.password_hash))) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Generate JWT
    const token = generateToken(user.id, user.user_type);

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        user_type: user.user_type,
        referral_code: user.referral_code,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: error.message });
  }
};

exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    // Find user
    const users = await db.query(queries.findUserByEmail, [email]);
    const user = users[0];

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour

    // Save reset token
    await db.query(queries.updateResetToken, [
      resetToken,
      resetTokenExpiry,
      user.id,
    ]);

    // Send reset email
    await sendResetPasswordEmail(email, resetToken);

    res.json({ message: "Password reset instructions sent to email" });
  } catch (error) {
    console.error("Forgot password error:", error);
    res.status(500).json({ error: error.message });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;

    // Find user with valid reset token
    const users = await db.query(queries.findUserByResetToken, [
      token,
      new Date(),
    ]);
    const user = users[0];

    if (!user) {
      return res.status(400).json({ error: "Invalid or expired reset token" });
    }

    // Update password
    const hashedPassword = await hashPassword(password);
    await db.query(queries.updatePassword, [
      hashedPassword,
      null, // reset_token
      null, // reset_token_expires
      user.id,
    ]);

    res.json({ message: "Password reset successful" });
  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({ error: error.message });
  }
};
