const mongoose = require("mongoose");
const User = require("../models/User");
require("dotenv").config();

const migrateUserRoles = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✓ Connected to MongoDB");

    // Update all users without a role to have role: "user"
    const result = await User.updateMany(
      { role: { $exists: false } },
      { $set: { role: "user" } }
    );

    console.log(`✓ Migration complete!`);
    console.log(`  - Matched: ${result.matchedCount} users without role field`);
    console.log(`  - Modified: ${result.modifiedCount} users`);

    // Verify: show count of users by role
    const userCount = await User.countDocuments({ role: "user" });
    const adminCount = await User.countDocuments({ role: "admin" });
    console.log(`\nAfter migration:`);
    console.log(`  - Regular users: ${userCount}`);
    console.log(`  - Admin users: ${adminCount}`);

    await mongoose.disconnect();
    console.log("✓ Disconnected from MongoDB");
    process.exit(0);
  } catch (error) {
    console.error("❌ Migration failed:", error.message);
    await mongoose.disconnect();
    process.exit(1);
  }
};

migrateUserRoles();
