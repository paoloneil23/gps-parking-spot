const express = require("express");
const { getPreferencesByUser, savePreferencesByUser, deletePreferencesByUser } = require("../controllers/preferencesController");

const router = express.Router();

router.get("/:userId", getPreferencesByUser);
router.put("/:userId", savePreferencesByUser);
router.delete("/:userId", deletePreferencesByUser);

module.exports = router;
