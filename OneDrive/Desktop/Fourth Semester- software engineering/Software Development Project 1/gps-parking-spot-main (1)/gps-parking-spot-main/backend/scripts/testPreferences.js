const mongoose = require("mongoose");
const connectDB = require("../config/db");
const Preferences = require("../models/Preferences");
const dotenv = require("dotenv");

dotenv.config();

const testPreferences = async () => {
  try {
    console.log("Connecting to database...");
    await connectDB();
    console.log("Database connected!");

    // Test 1: Create a preferences document
    const testUserId = "test_user_" + Date.now();
    console.log("\nTest 1: Creating preferences for userId:", testUserId);
    
    const preferences = await Preferences.create({
      userId: testUserId,
      maxPrice: 50,
      onlyAvailable: true,
      freeOnly: false,
      parkingType: ["regular", "EV"],
    });

    console.log("Created successfully:", preferences);

    // Test 2: Find the preferences
    console.log("\nTest 2: Finding preferences...");
    const found = await Preferences.findOne({ userId: testUserId });
    console.log("Found:", found);

    // Test 3: Update preferences
    console.log("\nTest 3: Updating preferences...");
    const updated = await Preferences.findOneAndUpdate(
      { userId: testUserId },
      { $set: { maxPrice: 75, freeOnly: true } },
      { returnDocument: 'after' }
    );
    console.log("Updated:", updated);

    // Test 4: Delete preferences
    console.log("\nTest 4: Deleting preferences...");
    const deleted = await Preferences.findOneAndDelete({ userId: testUserId });
    console.log("Deleted:", deleted);

    console.log("\nAll tests passed!");
    process.exit(0);
  } catch (error) {
    console.error("Test error:", error);
    process.exit(1);
  }
};

testPreferences();
