const Preferences = require("../models/Preferences");

const getUserIdFromRequest = (req) => {
  const userId = req.body?.userId || req.query?.userId || req.params?.userId;
  return typeof userId === "string" ? userId.trim() : "";
};

const normalizeParkingTypes = (value) => {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }

  if (typeof value === "string" && value.trim()) {
    return [value.trim()];
  }

  return [];
};

const normalizePreferencesPayload = (body = {}) => ({
  userId: String(body.userId || "").trim(),
  maxPrice:
    body.maxPrice === "" || body.maxPrice === null || body.maxPrice === undefined
      ? null
      : Number.isFinite(Number(body.maxPrice))
        ? Number(body.maxPrice)
        : null,
  onlyAvailable: Boolean(body.onlyAvailable),
  freeOnly: Boolean(body.freeOnly),
  parkingType: normalizeParkingTypes(body.parkingType),
});

const normalizeHistoryEntry = (entry = {}) => ({
  maxPrice:
    entry.maxPrice === "" || entry.maxPrice === null || entry.maxPrice === undefined
      ? null
      : Number.isFinite(Number(entry.maxPrice))
        ? Number(entry.maxPrice)
        : null,
  onlyAvailable: Boolean(entry.onlyAvailable),
  freeOnly: Boolean(entry.freeOnly),
  parkingType: normalizeParkingTypes(entry.parkingType),
  savedAt: entry.savedAt ? new Date(entry.savedAt) : new Date(),
});

const buildPreferencesList = (doc) => {
  if (!doc) {
    return [];
  }

  const history = Array.isArray(doc.preferenceHistory)
    ? doc.preferenceHistory.map((entry) => normalizeHistoryEntry(entry)).reverse()
    : [];

  if (history.length > 0) {
    return history;
  }

  return [
    normalizeHistoryEntry({
      maxPrice: doc.maxPrice,
      onlyAvailable: doc.onlyAvailable,
      freeOnly: doc.freeOnly,
      parkingType: doc.parkingType,
      savedAt: doc.updatedAt || doc.createdAt,
    }),
  ];
};

const getPreferencesByUser = async (req, res) => {
  try {
    const userId = getUserIdFromRequest(req);

    if (!userId) {
      return res.status(400).json({ message: "userId is required" });
    }

    console.log("[Preferences] Loading for userId:", userId);

    const preferencesDoc = await Preferences.findOne({ userId }).lean();
    const preferencesList = buildPreferencesList(preferencesDoc);
    const latestPreference = preferencesList[0] || null;
    console.log("[Preferences] Found count:", preferencesList.length);

    return res.status(200).json({
      preferences: latestPreference,
      preferencesList,
    });
  } catch (error) {
    console.error("[Preferences] Load error:", error);
    return res.status(500).json({ message: error.message });
  }
};

const savePreferencesByUser = async (req, res) => {
  try {
    const userId = getUserIdFromRequest(req);

    if (!userId) {
      return res.status(400).json({ message: "userId is required" });
    }

    const normalized = normalizePreferencesPayload({ ...req.body, userId });
    const historyEntry = normalizeHistoryEntry(normalized);

    console.log("[Preferences] Saving for userId:", userId);
    console.log("[Preferences] Request body:", req.body);
    console.log("[Preferences] Normalized:", normalized);

    let saved;
    try {
      saved = await Preferences.findOneAndUpdate(
        { userId },
        {
          $set: {
            userId,
            maxPrice: normalized.maxPrice,
            onlyAvailable: normalized.onlyAvailable,
            freeOnly: normalized.freeOnly,
            parkingType: normalized.parkingType,
          },
          $push: {
            preferenceHistory: historyEntry,
          },
        },
        { upsert: true, returnDocument: "after" }
      ).lean();
    } catch (dbError) {
      console.error("[Preferences] Database error details:", dbError.message, dbError.code);
      throw dbError;
    }

    const preferencesList = buildPreferencesList(saved);
    const latestPreference = preferencesList[0] || null;
    console.log("[Preferences] Saved document history count:", preferencesList.length);

    if (!saved) {
      return res.status(500).json({ message: "Failed to save preferences - document returned null" });
    }

    return res.status(200).json({
      message: "Preferences saved successfully",
      preferences: latestPreference,
      preferencesList,
    });
  } catch (error) {
    console.error("[Preferences] Save error:", error);
    return res.status(500).json({ message: error.message || "Internal server error saving preferences" });
  }
};

const deletePreferencesByUser = async (req, res) => {
  try {
    const userId = getUserIdFromRequest(req);

    if (!userId) {
      return res.status(400).json({ message: "userId is required" });
    }

    const deleted = await Preferences.deleteMany({ userId });

    if (!deleted || deleted.deletedCount === 0) {
      return res.status(404).json({ message: "No saved preferences found" });
    }

    return res.status(200).json({
      message: "Preferences removed successfully",
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getPreferencesByUser,
  savePreferencesByUser,
  deletePreferencesByUser,
};
