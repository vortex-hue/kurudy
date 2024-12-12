// src/routes/socialAuthRoutes.js
const express = require("express");
const router = express.Router();
const passport = require("passport");
const { generateToken } = require("../config/auth");

/**
 * @swagger
 * /v1/auth/google:
 *   get:
 *     tags:
 *       - Social Authentication
 *     summary: Initiate Google OAuth flow
 *     responses:
 *       302:
 *         description: Redirects to Google login
 */
router.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
  })
);

/**
 * @swagger
 * /v1/auth/google/callback:
 *   get:
 *     tags:
 *       - Social Authentication
 *     summary: Handle Google OAuth callback
 *     responses:
 *       200:
 *         description: Authentication successful
 *       401:
 *         description: Authentication failed
 */
router.get(
  "/google/callback",
  passport.authenticate("google", { session: false }),
  (req, res) => {
    const token = generateToken(req.user.id, req.user.user_type);
    // Redirect to frontend with token
    res.redirect(`${process.env.FRONTEND_URL}/auth/callback?token=${token}`);
  }
);

/**
 * @swagger
 * /v1/auth/facebook:
 *   get:
 *     tags:
 *       - Social Authentication
 *     summary: Initiate Facebook OAuth flow
 *     responses:
 *       302:
 *         description: Redirects to Facebook login
 */
router.get(
  "/facebook",
  passport.authenticate("facebook", {
    scope: ["email"],
  })
);

/**
 * @swagger
 * /v1/auth/facebook/callback:
 *   get:
 *     tags:
 *       - Social Authentication
 *     summary: Handle Facebook OAuth callback
 *     responses:
 *       200:
 *         description: Authentication successful
 *       401:
 *         description: Authentication failed
 */
router.get(
  "/facebook/callback",
  passport.authenticate("facebook", { session: false }),
  (req, res) => {
    const token = generateToken(req.user.id, req.user.user_type);
    res.redirect(`${process.env.FRONTEND_URL}/auth/callback?token=${token}`);
  }
);

/**
 * @swagger
 * /v1/auth/apple:
 *   get:
 *     tags:
 *       - Social Authentication
 *     summary: Initiate Apple Sign-in flow
 *     responses:
 *       302:
 *         description: Redirects to Apple login
 */
router.get(
  "/apple",
  passport.authenticate("apple", {
    scope: ["email", "name"],
  })
);

/**
 * @swagger
 * /v1/auth/apple/callback:
 *   post:
 *     tags:
 *       - Social Authentication
 *     summary: Handle Apple Sign-in callback
 *     responses:
 *       200:
 *         description: Authentication successful
 *       401:
 *         description: Authentication failed
 */
router.post(
  "/apple/callback",
  passport.authenticate("apple", { session: false }),
  (req, res) => {
    const token = generateToken(req.user.id, req.user.user_type);
    res.redirect(`${process.env.FRONTEND_URL}/auth/callback?token=${token}`);
  }
);

module.exports = router;
