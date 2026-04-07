const express = require("express");
const {
  exportBySerials,
  exportByFilter,
} = require("../controller/exportController");

const router = express.Router();

router.post("/by-serials", exportBySerials);
router.post("/filter", exportByFilter);

module.exports = router;
