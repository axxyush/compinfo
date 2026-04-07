const mongoose = require("mongoose");

const AssetSchema = new mongoose.Schema(
  {
    serialNumber: { type: String, required: true, unique: true, trim: true },
    currentName: { type: String, default: "N/A", trim: true },
    manufacturer: { type: String, trim: true },
    model: { type: String, trim: true },
    description: {
      type: String,
      enum: ["Computer", "Laptop", "Monitor", "Other"],
      default: "Computer",
    },
    status: {
      type: String,
      enum: ["Active", "Ready to Deploy", "Disposed", "In Repair", "Redeploy"],
      default: "Active",
    },
    purchaseDate: { type: Date },
    notes: { type: String, default: "" },
    renameHistory: [
      {
        renamedFrom: { type: String },
        renamedTo: { type: String },
        date: { type: Date },
        _id: false,
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Asset", AssetSchema);
