const Asset = require("../model/Asset");
const ActivityLog = require("../model/ActivityLog");
const { buildAssetFilterFromInput } = require("./queryHelpers");

async function getAssets(req, res) {
  try {
    const filter = buildAssetFilterFromInput(req.query);
    const assets = await Asset.find(filter).sort({ updatedAt: -1 });
    return res.json(assets);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}

async function getAssetBySerial(req, res) {
  try {
    const asset = await Asset.findOne({ serialNumber: req.params.serialNumber });
    if (!asset) return res.status(404).json({ message: "Asset not found" });
    return res.json(asset);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}

async function createAsset(req, res) {
  try {
    const payload = req.body || {};
    const asset = await Asset.create({
      serialNumber: payload.serialNumber,
      currentName: payload.currentName || "N/A",
      manufacturer: payload.manufacturer,
      model: payload.model,
      description: payload.description,
      status: payload.status,
      purchaseDate: payload.purchaseDate,
      notes: payload.notes || "",
      renameHistory: [],
    });

    await ActivityLog.create({
      serialNumber: asset.serialNumber,
      machineName: asset.currentName,
      action: "Added",
      details: "New asset added",
    });

    return res.status(201).json(asset);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
}

async function updateAsset(req, res) {
  try {
    const allowed = [
      "currentName",
      "manufacturer",
      "model",
      "description",
      "status",
      "purchaseDate",
      "notes",
    ];
    const updates = {};
    allowed.forEach((key) => {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    });

    const asset = await Asset.findOneAndUpdate(
      { serialNumber: req.params.serialNumber },
      { $set: updates },
      { new: true }
    );

    if (!asset) return res.status(404).json({ message: "Asset not found" });

    await ActivityLog.create({
      serialNumber: asset.serialNumber,
      machineName: asset.currentName,
      action: "Edited",
      details: "Asset details updated",
    });

    return res.json(asset);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
}

async function deleteAsset(req, res) {
  try {
    const deleted = await Asset.findOneAndDelete({
      serialNumber: req.params.serialNumber,
    });
    if (!deleted) return res.status(404).json({ message: "Asset not found" });
    return res.json({ message: "Asset deleted" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}

async function renameAsset(req, res) {
  try {
    const { renamedFrom, renamedTo, date } = req.body || {};
    if (!renamedTo) {
      return res.status(400).json({ message: "renamedTo is required" });
    }

    const asset = await Asset.findOneAndUpdate(
      { serialNumber: req.params.serialNumber },
      {
        $push: {
          renameHistory: {
            renamedFrom: renamedFrom || "N/A",
            renamedTo,
            date: date ? new Date(date) : new Date(),
          },
        },
        $set: { currentName: renamedTo },
      },
      { new: true }
    );

    if (!asset) return res.status(404).json({ message: "Asset not found" });

    await ActivityLog.create({
      serialNumber: asset.serialNumber,
      machineName: asset.currentName,
      action: "Renamed",
      details: `${renamedFrom || "N/A"} → ${renamedTo}`,
    });

    return res.json(asset);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
}

async function updateAssetStatus(req, res) {
  try {
    const { status } = req.body || {};
    if (!status) return res.status(400).json({ message: "status is required" });

    const existing = await Asset.findOne({ serialNumber: req.params.serialNumber });
    if (!existing) return res.status(404).json({ message: "Asset not found" });
    const oldStatus = existing.status;
    existing.status = status;
    await existing.save();

    await ActivityLog.create({
      serialNumber: existing.serialNumber,
      machineName: existing.currentName,
      action: "Status Changed",
      details: `${oldStatus} → ${status}`,
    });

    return res.json(existing);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
}

async function bulkUpdateStatus(req, res) {
  try {
    const { serialNumbers, status } = req.body || {};
    if (!Array.isArray(serialNumbers) || serialNumbers.length === 0 || !status) {
      return res
        .status(400)
        .json({ message: "serialNumbers[] and status are required" });
    }

    const assets = await Asset.find({ serialNumber: { $in: serialNumbers } });
    let updated = 0;

    for (const asset of assets) {
      const oldStatus = asset.status;
      asset.status = status;
      await asset.save();
      updated += 1;

      await ActivityLog.create({
        serialNumber: asset.serialNumber,
        machineName: asset.currentName,
        action: "Status Changed",
        details: `${oldStatus} → ${status}`,
      });
    }

    return res.json({ updated });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}

module.exports = {
  getAssets,
  getAssetBySerial,
  createAsset,
  updateAsset,
  deleteAsset,
  renameAsset,
  updateAssetStatus,
  bulkUpdateStatus,
};
