const express = require("express");
const {
  getAssets,
  getAssetBySerial,
  createAsset,
  updateAsset,
  deleteAsset,
  renameAsset,
  updateAssetStatus,
  bulkUpdateStatus,
} = require("../controller/assetController");

const router = express.Router();

router.get("/", getAssets);
router.post("/bulk-status", bulkUpdateStatus);
router.get("/:serialNumber", getAssetBySerial);
router.post("/", createAsset);
router.put("/:serialNumber", updateAsset);
router.delete("/:serialNumber", deleteAsset);
router.post("/:serialNumber/rename", renameAsset);
router.patch("/:serialNumber/status", updateAssetStatus);

module.exports = router;
