const Asset = require("../model/Asset");
const { MS_PER_YEAR } = require("./queryHelpers");

async function getStats(req, res) {
  try {
    const total = await Asset.countDocuments();
    const active = await Asset.countDocuments({ status: "Active" });
    const readyToDeploy = await Asset.countDocuments({ status: "Ready to Deploy" });
    const disposed = await Asset.countDocuments({ status: "Disposed" });
    const inRepair = await Asset.countDocuments({ status: "In Repair" });

    const byManufacturerAgg = await Asset.aggregate([
      { $group: { _id: "$manufacturer", count: { $sum: 1 } } },
    ]);
    const byDescriptionAgg = await Asset.aggregate([
      { $group: { _id: "$description", count: { $sum: 1 } } },
    ]);

    const byManufacturer = {};
    byManufacturerAgg.forEach((x) => {
      byManufacturer[x._id || "Unknown"] = x.count;
    });

    const byDescription = {};
    byDescriptionAgg.forEach((x) => {
      byDescription[x._id || "Unknown"] = x.count;
    });

    const recentlyUpdated = await Asset.find(
      {},
      {
        serialNumber: 1,
        currentName: 1,
        status: 1,
        model: 1,
        updatedAt: 1,
      }
    )
      .sort({ updatedAt: -1 })
      .limit(5)
      .lean();

    const threshold = new Date(Date.now() - 4 * MS_PER_YEAR);
    const ageAlerts = await Asset.find(
      {
        purchaseDate: { $ne: null, $lte: threshold },
        status: { $ne: "Disposed" },
      },
      { serialNumber: 1, currentName: 1, model: 1, purchaseDate: 1 }
    ).lean();

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const changedThisMonth = await Asset.find(
      { updatedAt: { $gte: monthStart, $lt: nextMonthStart } },
      { serialNumber: 1, currentName: 1, status: 1, updatedAt: 1 }
    )
      .sort({ updatedAt: -1 })
      .lean();

    return res.json({
      total,
      active,
      readyToDeploy,
      disposed,
      inRepair,
      byManufacturer,
      byDescription,
      recentlyUpdated,
      ageAlerts,
      changedThisMonth,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}

module.exports = { getStats };
