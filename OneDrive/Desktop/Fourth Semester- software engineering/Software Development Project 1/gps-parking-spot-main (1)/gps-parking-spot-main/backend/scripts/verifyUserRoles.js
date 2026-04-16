const mongoose = require("mongoose");
const User = require("../models/User");
require("dotenv").config();

const verifyUserRoles = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✓ Connected to MongoDB\n");

    // Get all users and show their details
    const users = await User.find({});
    
    console.log(`Total users in database: ${users.length}\n`);
    
    if (users.length === 0) {
      console.log("No users found in database");
    } else {
      console.log("User Details:");
      console.log("─".repeat(80));
      users.forEach((user, index) => {
        console.log(`${index + 1}. Name: ${user.fullName}`);
        console.log(`   Email: ${user.email}`);
        console.log(`   Role: ${user.role || "❌ MISSING"}`);
        console.log(`   Created: ${user.createdAt}`);
        console.log("─".repeat(80));
      });
    }

    await mongoose.disconnect();
    console.log("\n✓ Disconnected from MongoDB");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error.message);
    await mongoose.disconnect();
    process.exit(1);
  }
};

verifyUserRoles();
