const express = require("express");
const router = express.Router();
const {
  getAllParkingSpots,
  createParkingSpot,
  searchParkingSpots,
  getParkingSpotsWithLiveAvailability,
  reserveParkingSpot,
  payReservation,
} = require("../controllers/parkingController");

router.get("/search", searchParkingSpots);   // ✅ THIS IS IMPORTANT
router.get("/live", getParkingSpotsWithLiveAvailability);
router.post("/:spotId/reserve", reserveParkingSpot);
router.post("/reservations/:reservationId/pay", payReservation);
router.get("/", getAllParkingSpots);
router.post("/", createParkingSpot);

module.exports = router;