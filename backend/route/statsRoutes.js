const express = require("express");
const { getStats } = require("../controller/statsController");

const router = express.Router();

router.get("/", getStats);

module.exports = router;
