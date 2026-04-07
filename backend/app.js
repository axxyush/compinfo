const express = require("express");
const cors = require("cors");
const multer = require("multer");
const assetRoutes = require("./route/assetRoutes");
const importRoutes = require("./route/importRoutes");
const exportRoutes = require("./route/exportRoutes");
const activityRoutes = require("./route/activityRoutes");
const statsRoutes = require("./route/statsRoutes");
const { maxUploadMb } = require("./middleware/upload");

const app = express();

app.use(
  cors({
    origin: process.env.CLIENT_URL,
  }),
);
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

app.use("/api/assets", assetRoutes);
app.use("/api/import", importRoutes);
app.use("/api/export", exportRoutes);
app.use("/api/activity", activityRoutes);
app.use("/api/stats", statsRoutes);

app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(413).json({
        message: `File too large. Maximum upload size is ${maxUploadMb}MB. Increase MAX_UPLOAD_MB in backend/.env if needed.`,
      });
    }
  }
  if (err && err.message === "Only .xlsx, .xls, and .csv files are allowed") {
    return res.status(400).json({ message: err.message });
  }
  next(err);
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: err.message || "Server error" });
});

module.exports = app;
