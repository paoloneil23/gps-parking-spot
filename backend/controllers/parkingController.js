const ParkingSpot = require("../models/ParkingSpot");
const Reservation = require("../models/Reservation");

const getUserIdFromRequest = (req) => {
  const userId = req.body?.userId || req.query?.userId;
  return typeof userId === "string" ? userId.trim() : "";
};

// GET all parking spots
const getAllParkingSpots = async (req, res) => {
  try {
    const spots = await ParkingSpot.find();
    res.status(200).json(spots);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST create a parking spot
const createParkingSpot = async (req, res) => {
  try {
    const spot = await ParkingSpot.create(req.body);
    res.status(201).json(spot);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET search parking spots
// GET search parking spots
const searchParkingSpots = async (req, res) => {
  try {
    const { location, maxPrice, freeOnly, lng, lat, distance = 2000 } = req.query;

    let query = {};

    // 🔍 Text search
    if (location) {
      query.$or = [
        { lotName: { $regex: location, $options: "i" } },
        { spotCode: { $regex: location, $options: "i" } },
      ];
    }

    // 💰 Price filter
    if (maxPrice) {
      query.pricePerHour = { $lte: Number(maxPrice) };
    }

    // 🆓 Free parking filter (either explicitly marked free or price is zero)
    const freeOnlyEnabled = ["1", "true", "yes", "on"].includes(
      String(freeOnly || "").toLowerCase()
    );

    if (freeOnlyEnabled) {
      query.$and = query.$and || [];
      query.$and.push({
        $or: [{ isPaid: false }, { pricePerHour: { $lte: 0 } }],
      });
    }

    // 📍 NEW: Location-based search
    if (lng && lat) {
      query.location = {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [parseFloat(lng), parseFloat(lat)],
          },
          $maxDistance: Number(distance),
        },
      };
    }

    const spots = await ParkingSpot.find(query);

    res.status(200).json(spots);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
// here 
// GET parking spots with live reservation counts
const getParkingSpotsWithLiveAvailability = async (req, res) => {
  try {
    const now = new Date();

    const [spots, activeReservations] = await Promise.all([
      ParkingSpot.find().lean(),
      Reservation.aggregate([
        {
          $match: {
            status: "active",
            startTime: { $lte: now },
            endTime: { $gte: now },
          },
        },
        {
          $group: {
            _id: "$parkingSpotId",
            reservedSpots: { $sum: 1 },
          },
        },
      ]),
    ]);

    const reservationMap = new Map(
      activeReservations.map((item) => [String(item._id), item.reservedSpots])
    );

    const enrichedSpots = spots.map((spot) => {
      const totalSpaces = Number(spot.totalSpaces) > 0 ? Number(spot.totalSpaces) : 1;
      const reservedSpots = Math.min(
        reservationMap.get(String(spot._id)) || 0,
        totalSpaces
      );
      const availableSpots = Math.max(totalSpaces - reservedSpots, 0);
      const baseAvailableFlag =
        typeof spot.available === "boolean"
          ? spot.available
          : typeof spot.isAvailable === "boolean"
            ? spot.isAvailable
            : true;

      const parkingLotName = spot.locationName || spot.lotName || "Parking Lot";
      const address = spot.address || "";

      let latitude = spot.latitude;
      let longitude = spot.longitude;

      if (
        (!Number.isFinite(latitude) || !Number.isFinite(longitude)) &&
        spot.location &&
        Array.isArray(spot.location.coordinates) &&
        spot.location.coordinates.length >= 2
      ) {
        longitude = Number(spot.location.coordinates[0]);
        latitude = Number(spot.location.coordinates[1]);
      }

      return {
        ...spot,
        locationName: parkingLotName,
        address,
        latitude,
        longitude,
        totalSpaces,
        reservedSpots,
        availableSpots,
        available: baseAvailableFlag && availableSpots > 0,
      };
    });

    res.status(200).json(enrichedSpots);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST reserve one parking spot for a user
const reserveParkingSpot = async (req, res) => {
  try {
    const { spotId } = req.params;
    const userId = getUserIdFromRequest(req);
    const durationHours = Math.max(Number(req.body?.durationHours) || 1, 1);

    if (!userId) {
      return res.status(400).json({ message: "userId is required" });
    }

    const spot = await ParkingSpot.findById(spotId).lean();

    if (!spot) {
      return res.status(404).json({ message: "Parking spot not found" });
    }

    const totalSpaces = Number(spot.totalSpaces) > 0 ? Number(spot.totalSpaces) : 1;
    const now = new Date();

    const [reservedCount, existingUserReservation] = await Promise.all([
      Reservation.countDocuments({
        parkingSpotId: spot._id,
        status: "active",
        startTime: { $lte: now },
        endTime: { $gte: now },
      }),
      Reservation.findOne({
        parkingSpotId: spot._id,
        userId,
        status: "active",
        endTime: { $gte: now },
      }).lean(),
    ]);

    if (existingUserReservation) {
      return res.status(409).json({
        message: "You already have an active reservation for this spot",
        reservation: existingUserReservation,
      });
    }

    if (reservedCount >= totalSpaces || spot.isAvailable === false) {
      return res.status(409).json({ message: "This parking spot is currently full" });
    }

    const endTime = new Date(now.getTime() + durationHours * 60 * 60 * 1000);
    const amountDue = spot.isPaid === false ? 0 : (Number(spot.pricePerHour) || 0) * durationHours;

    const reservation = await Reservation.create({
      userId,
      parkingSpotId: spot._id,
      startTime: now,
      endTime,
      status: "active",
      paymentStatus: amountDue > 0 ? "pending" : "paid",
      amountDue,
      paidAt: amountDue > 0 ? null : now,
    });

    return res.status(201).json({
      message: amountDue > 0 ? "Spot reserved. Please complete payment." : "Spot reserved successfully.",
      reservation,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// POST pay a reservation
const payReservation = async (req, res) => {
  try {
    const { reservationId } = req.params;
    const userId = getUserIdFromRequest(req);
    const paymentMethod = (req.body?.paymentMethod || "card").toString();

    if (!userId) {
      return res.status(400).json({ message: "userId is required" });
    }

    const reservation = await Reservation.findById(reservationId);

    if (!reservation) {
      return res.status(404).json({ message: "Reservation not found" });
    }

    if (String(reservation.userId) !== userId) {
      return res.status(403).json({ message: "You can only pay your own reservation" });
    }

    if (reservation.status !== "active") {
      return res.status(400).json({ message: "Only active reservations can be paid" });
    }

    if (reservation.paymentStatus === "paid") {
      return res.status(200).json({
        message: "Reservation is already paid",
        reservation,
      });
    }

    reservation.paymentStatus = "paid";
    reservation.paidAt = new Date();
    reservation.paymentMethod = paymentMethod;
    await reservation.save();

    return res.status(200).json({
      message: "Payment successful",
      reservation,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// EXPORT ALL FUNCTIONS
module.exports = {
  getAllParkingSpots,
  createParkingSpot,
  searchParkingSpots,
  getParkingSpotsWithLiveAvailability,
  reserveParkingSpot,
  payReservation,
};