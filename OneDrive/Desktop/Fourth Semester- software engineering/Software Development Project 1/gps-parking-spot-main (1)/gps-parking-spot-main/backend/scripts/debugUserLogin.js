const mongoose = require("mongoose");
const User = require("../models/User");
require("dotenv").config();

const debugUserLogin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✓ Connected to MongoDB\n");

    const email = "suhpa.oudeh@hotmail.com";
    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      console.log(`❌ User not found for email: ${email}`);
      await mongoose.disconnect();
      process.exit(1);
    }

    console.log("User found in database:");
    console.log("─".repeat(80));
    console.log(`Email: ${user.email}`);
    console.log(`Full Name: ${user.fullName}`);
    console.log(`Role (raw): ${user.role}`);
    console.log(`Role (typeof): ${typeof user.role}`);
    console.log(`Role (JSON): ${JSON.stringify(user)}`);
    console.log("───────────────────────────────────────────────────────────────────────────── ");

    // Test role normalization
    const normalizeRole = (value) => {
      const role = (value || "user").toString().toLowerCase();
      return role === "admin" ? "admin" : "user";
    };

    const normalizedRole = normalizeRole(user.role);
    console.log(`\nAfter normalization:`);
    console.log(`  - Normalized role: "${normalizedRole}"`);
    console.log(`  - Is admin check: ${normalizedRole === "admin"}`);

    // Show what would be sent to frontend
    const responseUser = {
      id: user._id,
      fullName: user.fullName,
      email: user.email,
      role: normalizedRole,
    };
    
    console.log(`\nWhat login response would contain:`);
    console.log(JSON.stringify(responseUser, null, 2));

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error.message);
    await mongoose.disconnect();
    process.exit(1);
  }
};

debugUserLogin();
