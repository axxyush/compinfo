const ActivityLog = require("../model/ActivityLog");

async function getActivityLogs(req, res) {
  try {
    const { action, serial, from, to } = req.query;
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.max(1, Number(req.query.limit) || 20);

    const filter = {};
    if (action) filter.action = action;
    if (serial) filter.serialNumber = { $regex: serial, $options: "i" };
    if (from || to) {
      filter.date = {};
      if (from) filter.date.$gte = new Date(from);
      if (to) filter.date.$lte = new Date(to);
    }

    const total = await ActivityLog.countDocuments(filter);
    const logs = await ActivityLog.find(filter)
      .sort({ date: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    return res.json({
      logs,
      total,
      page,
      totalPages: Math.ceil(total / limit) || 1,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}

module.exports = { getActivityLogs };
