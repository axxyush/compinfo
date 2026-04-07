const Asset = require("../model/Asset");
const { buildAssetFilterFromInput, pickColumns } = require("./queryHelpers");

const YEAR_MS = 1000 * 60 * 60 * 24 * 365.25;

function normalizeRequestedColumns(columns = []) {
  const map = {
    serialnumber: "serialNumber",
    "serial number": "serialNumber",
    currentname: "currentName",
    "current name": "currentName",
    manufacturer: "manufacturer",
    model: "model",
    status: "status",
    purchasedate: "purchaseDate",
    "purchase date": "purchaseDate",
    age: "age",
    description: "type",
    type: "type",
    notes: "notes",
    renamehistory: "lastRename",
    "rename history (last rename only)": "lastRename",
    lastrename: "lastRename",
  };
  return columns
    .map((c) => String(c || "").trim().toLowerCase())
    .map((c) => map[c] || c)
    .filter(Boolean);
}

function formatLastRename(renameHistory) {
  if (!Array.isArray(renameHistory) || renameHistory.length === 0) {
    return "No renames";
  }
  const last = [...renameHistory].sort((a, b) => new Date(a.date) - new Date(b.date)).pop();
  const from = last.renamedFrom || last.from || "N/A";
  const to = last.renamedTo || last.to || "N/A";
  const d = last.date ? new Date(last.date) : null;
  const dateText =
    d && !Number.isNaN(d.getTime())
      ? d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
      : "Unknown date";
  return `${from} → ${to} (${dateText})`;
}

function toAgeText(purchaseDate) {
  if (!purchaseDate) return "Unknown";
  const p = new Date(purchaseDate).getTime();
  if (Number.isNaN(p)) return "Unknown";
  return String(Math.floor((Date.now() - p) / YEAR_MS));
}

function projectDoc(doc, normalizedCols) {
  const out = {};
  normalizedCols.forEach((col) => {
    switch (col) {
      case "serialNumber":
      case "currentName":
      case "manufacturer":
      case "model":
      case "status":
      case "notes":
      case "purchaseDate":
        out[col] = doc[col];
        break;
      case "type":
        out.type = doc.description || "";
        break;
      case "lastRename":
        out.lastRename = formatLastRename(doc.renameHistory);
        break;
      case "age":
        out.age = toAgeText(doc.purchaseDate);
        break;
      default:
        break;
    }
  });
  return out;
}

async function exportBySerials(req, res) {
  try {
    const { serialNumbers = [], columns = [] } = req.body || {};
    if (!Array.isArray(serialNumbers)) {
      return res.status(400).json({ message: "serialNumbers must be an array" });
    }

    const docs = await Asset.find({
      serialNumber: { $in: serialNumbers },
    }).lean();

    const normalizedCols = normalizeRequestedColumns(columns);
    const found = docs.map((doc) =>
      normalizedCols.length ? projectDoc(doc, normalizedCols) : doc
    );
    const foundSet = new Set(docs.map((d) => d.serialNumber));
    const notFound = serialNumbers.filter((sn) => !foundSet.has(sn));

    return res.json({ found, notFound });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}

async function exportByFilter(req, res) {
  try {
    const { filters = {}, columns = [] } = req.body || {};
    const filter = buildAssetFilterFromInput(filters);
    const docs = await Asset.find(filter).sort({ updatedAt: -1 }).lean();
    const results = docs.map((doc) => pickColumns(doc, columns));
    return res.json({ results, total: results.length });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}

module.exports = {
  exportBySerials,
  exportByFilter,
};
