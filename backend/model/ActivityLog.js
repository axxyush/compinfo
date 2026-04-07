const mongoose = require("mongoose");

const ActivityLogSchema = new mongoose.Schema(
  {
    serialNumber: { type: String, required: true },
    machineName: { type: String },
    action: {
      type: String,
      enum: ["Added", "Renamed", "Status Changed", "Imported", "Edited"],
    },
    details: { type: String },
    date: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = mongoose.model("ActivityLog", ActivityLogSchema);
