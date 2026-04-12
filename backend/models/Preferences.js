const mongoose = require("mongoose");

const preferencesSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      index: true,
      trim: true,
    },
    maxPrice: {
      type: Number,
      default: null,
    },
    onlyAvailable: {
      type: Boolean,
      default: false,
    },
    freeOnly: {
      type: Boolean,
      default: false,
    },
    parkingType: {
      type: [String],
      default: [],
    },
    preferenceHistory: {
      type: [
        {
          maxPrice: {
            type: Number,
            default: null,
          },
          onlyAvailable: {
            type: Boolean,
            default: false,
          },
          freeOnly: {
            type: Boolean,
            default: false,
          },
          parkingType: {
            type: [String],
            default: [],
          },
          savedAt: {
            type: Date,
            default: Date.now,
          },
        },
      ],
      default: [],
    },
  },
  {
    timestamps: true,
    collection: "Preferences",
  }
);

module.exports = mongoose.model("Preferences", preferencesSchema);
