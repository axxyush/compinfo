const express = require("express");
const { uploadMiddleware } = require("../middleware/upload");
const {
  previewImport,
  confirmImport,
} = require("../controller/importController");

const router = express.Router();

router.post("/preview", uploadMiddleware, previewImport);
router.post("/confirm", confirmImport);

module.exports = router;
