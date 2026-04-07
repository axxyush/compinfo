const express = require("express");
const { getActivityLogs } = require("../controller/activityController");

const router = express.Router();

router.get("/", getActivityLogs);

module.exports = router;
