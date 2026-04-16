const dotenv = require("dotenv");
const mongoose = require("mongoose");
const ParkingSpot = require("../models/ParkingSpot");
const configureDns = require("../utils/configureDns");

dotenv.config();
configureDns();

const CELEBRATION_CODES = [
  "MCS-EAST-REG",
  "MCS-EAST-DIS",
  "MCS-WEST-REG",
  "MCS-WEST-VIS",
  "MCS-CITYHALL-GARAGE",
  "MCS-CITYHALL-EV",
  "MCS-LAC-UG",
  "MCS-LAC-DIS",
];

const tickMs = Number(process.env.CELEBRATION_REALTIME_TICK_MS) || 15000;

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const stepOccupancy = (occupied, total) => {
  const maxStep = Math.max(1, Math.floor(total * 0.05));
  const delta = Math.floor(Math.random() * (maxStep * 2 + 1)) - maxStep;
  return clamp(occupied + delta, 0, total);
};

async function updateCelebrationSquareSpots() {
  const spots = await ParkingSpot.find({ spotCode: { $in: CELEBRATION_CODES } });

  if (spots.length === 0) {
    console.log("No Celebration Square spots found. Run npm run seed:parking first.");
    return;
  }

  for (const spot of spots) {
    const totalSpaces = Number(spot.totalSpaces) > 0 ? Number(spot.totalSpaces) : 1;
    const currentOccupied = clamp(Number(spot.occupiedSpots) || 0, 0, totalSpaces);
    const nextOccupied = stepOccupancy(currentOccupied, totalSpaces);

    spot.occupiedSpots = nextOccupied;
    spot.isAvailable = nextOccupied < totalSpaces;
    spot.lastUpdated = new Date();

    await spot.save();

    const available = Math.max(totalSpaces - nextOccupied, 0);
    console.log(`${spot.spotCode}: occupied ${nextOccupied}/${totalSpaces}, available ${available}`);
  }

  console.log(`Updated Celebration Square occupancy at ${new Date().toLocaleTimeString()}`);
}

async function start() {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error("MONGO_URI is missing in backend/.env");
    }

    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");
    console.log(`Running Celebration Square live simulation every ${tickMs}ms`);

    await updateCelebrationSquareSpots();
    const timer = setInterval(updateCelebrationSquareSpots, tickMs);

    const shutdown = async () => {
      clearInterval(timer);
      await mongoose.disconnect();
      console.log("Disconnected from MongoDB");
      process.exit(0);
    };

    process.on("SIGINT", shutdown);
    process.on("SIGTERM", shutdown);
  } catch (error) {
    console.error("Simulation failed:", error.message);
    process.exit(1);
  }
}

start();
