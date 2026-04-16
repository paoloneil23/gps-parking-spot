const mongoose = require("mongoose");

const parkingSpotSchema = new mongoose.Schema(
  {
    spotCode: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    lotName: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ["disability", "regular", "EV", "visitor"],
      required: true,
    },
    isAvailable: {
      type: Boolean,
      default: true,
    },
    pricePerHour: {
      type: Number,
      required: true,
    },
    isPaid: {
      type: Boolean,
      default: true,
    },
    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: {
        type: [Number],
        required: true,
      },
    },
    lastUpdated: {
      type: Date,
      default: Date.now,
    },
    description: {
      type: String,
      default: "",
    },
    totalSpaces: {
      type: Number,
      default: 1,
    },
  },
  {
    timestamps: true,
    collection: "Parking Spots",
  }
);
parkingSpotSchema.index({ location: "2dsphere" });
module.exports = mongoose.model("ParkingSpot", parkingSpotSchema);