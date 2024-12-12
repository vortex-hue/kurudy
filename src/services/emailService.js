// src/services/emailService.js
const sendResetPasswordEmail = async (email, resetToken) => {
  try {
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

    // Log the email content to console
    console.log("\n=== Password Reset Email ===");
    console.log("To:", email);
    console.log("Subject: Password Reset Request");
    console.log("\nBody:");
    console.log("Reset Your Password");
    console.log(
      "You requested a password reset. Use the link below to reset your password:"
    );
    console.log(`Reset URL: ${resetUrl}`);
    console.log("This link will expire in 1 hour.");
    console.log("If you did not request this, please ignore this email.");
    console.log("===========================\n");

    // In development, we'll just resolve immediately
    return Promise.resolve();
  } catch (error) {
    console.error("Email logging error:", error);
    throw new Error("Failed to log reset email");
  }
};

module.exports = {
  sendResetPasswordEmail,
};
