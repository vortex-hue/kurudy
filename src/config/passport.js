const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const FacebookStrategy = require("passport-facebook").Strategy;
const AppleStrategy = require("passport-apple");
const { db, queries } = require("./database");
const { generateReferralCode } = require("./auth");

// Google Strategy
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "/v1/auth/google/callback",
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // Check if user exists
        const users = await db.query(queries.findUserByProvider, [
          "google",
          profile.id,
        ]);

        if (users.length > 0) {
          return done(null, users[0]);
        }

        // Create new user
        const referralCode = await generateReferralCode();
        const newUser = await db.query(queries.createSocialUser, [
          profile.emails[0].value,
          profile.displayName,
          "", // phone_number will be updated later
          "customer", // default user type
          referralCode,
          "google",
          profile.id,
          true, // is_verified
        ]);

        return done(null, newUser[0]);
      } catch (error) {
        return done(error, null);
      }
    }
  )
);

// Facebook Strategy
passport.use(
  new FacebookStrategy(
    {
      clientID: process.env.FACEBOOK_APP_ID,
      clientSecret: process.env.FACEBOOK_APP_SECRET,
      callbackURL: "/v1/auth/facebook/callback",
      profileFields: ["id", "emails", "name"],
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // Check if user exists
        const users = await db.query(queries.findUserByProvider, [
          "facebook",
          profile.id,
        ]);

        if (users.length > 0) {
          return done(null, users[0]);
        }

        // Create new user
        const referralCode = await generateReferralCode();
        const newUser = await db.query(queries.createSocialUser, [
          profile.emails[0].value,
          `${profile.name.givenName} ${profile.name.familyName}`,
          "", // phone_number will be updated later
          "customer", // default user type
          referralCode,
          "facebook",
          profile.id,
          true, // is_verified
        ]);

        return done(null, newUser[0]);
      } catch (error) {
        return done(error, null);
      }
    }
  )
);

// Apple Strategy
passport.use(
  new AppleStrategy(
    {
      clientID: process.env.APPLE_CLIENT_ID,
      teamID: process.env.APPLE_TEAM_ID,
      keyID: process.env.APPLE_KEY_ID,
      privateKeyLocation: process.env.APPLE_PRIVATE_KEY_PATH,
      callbackURL: "/v1/auth/apple/callback",
      passReqToCallback: true,
    },
    async (req, accessToken, refreshToken, idToken, profile, done) => {
      try {
        // Apple doesn't provide email on subsequent logins
        const email = idToken.email || req.body.email;

        // Check if user exists
        const users = await db.query(queries.findUserByProvider, [
          "apple",
          idToken.sub,
        ]);

        if (users.length > 0) {
          return done(null, users[0]);
        }

        // Create new user
        const referralCode = await generateReferralCode();
        const newUser = await db.query(queries.createSocialUser, [
          email,
          idToken.name || email.split("@")[0], // Use email prefix if name not provided
          "", // phone_number will be updated later
          "customer", // default user type
          referralCode,
          "apple",
          idToken.sub,
          true, // is_verified
        ]);

        return done(null, newUser[0]);
      } catch (error) {
        return done(error, null);
      }
    }
  )
);

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const users = await db.query(queries.findUserById, [id]);
    done(null, users[0]);
  } catch (error) {
    done(error, null);
  }
});

module.exports = passport;
