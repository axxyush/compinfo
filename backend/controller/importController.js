const XLSX = require("xlsx");
const Asset = require("../model/Asset");
const ActivityLog = require("../model/ActivityLog");

function normalizeHeader(value = "") {
  return String(value).trim().toLowerCase().replace(/\s+/g, "");
}

function getField(row, keys) {
  const entries = Object.entries(row || {});
  for (const [k, v] of entries) {
    if (keys.includes(normalizeHeader(k))) return v;
  }
  return undefined;
}

function parseExcelDate(value) {
  if (!value) return null;

  // Already a JS Date object (SheetJS sometimes returns these)
  if (value instanceof Date) return value;

  // Numeric — Excel serial number
  if (typeof value === "number") {
    // SheetJS utility to convert Excel serial to JS Date
    const date = XLSX.SSF.parse_date_code(value);
    if (date) {
      return new Date(date.y, date.m - 1, date.d);
    }
  }

  // String — try parsing directly
  if (typeof value === "string") {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }

  return null;
}

function isNA(value) {
  if (value === undefined || value === null) return true;
  const text = String(value).trim();
  return text === "" || text.toUpperCase() === "N/A";
}

function buildAssetFromRows(rows) {
  const firstNonNA = (extractor) => {
    for (const row of rows) {
      const value = extractor(row);
      if (!isNA(value)) return String(value).trim();
    }
    return undefined;
  };

  const serialNumber = firstNonNA((r) => getField(r, ["serialnumber"]));

  const currentName = firstNonNA((r) => getField(r, ["currentname"]));

  const manufacturer = firstNonNA((r) => getField(r, ["manufacture"]));
  const model = firstNonNA((r) => getField(r, ["model"]));
  const rawType = firstNonNA((r) => getField(r, ["type"]));
  let description = "Other";
  if (rawType === "Computer") description = "Computer";
  else if (rawType === "Laptop") description = "Laptop";

  const statusRows = rows
    .map((r) => ({
      status: getField(r, ["status"]),
      date: parseExcelDate(getField(r, ["date"])),
    }))
    .filter((x) => !isNA(x.status))
    .map((x) => ({ ...x, status: String(x.status).trim() }));

  let status = "Active";
  if (statusRows.some((s) => s.status === "Disposed")) {
    status = "Disposed";
  } else if (statusRows.some((s) => s.status === "Redeploy")) {
    status = "Ready to Deploy";
  } else {
    const dated = statusRows
      .filter((s) => s.date)
      .sort((a, b) => a.date - b.date);
    const mostRecent = dated.length ? dated[dated.length - 1] : null;
    if (mostRecent && mostRecent.status === "Renamed") {
      status = "Active";
    } else {
      status = "Active";
    }
  }

  // Spreadsheet Date is an event date (rename/disposal), not purchase date.
  const purchaseDate = null;

  const renameHistory = rows
    .map((r) => {
      const renamedFrom = getField(r, ["renamedfrom"]);
      const renamedTo = getField(r, ["renamedto"]);
      const date = parseExcelDate(getField(r, ["date"]));
      if (isNA(renamedFrom) || isNA(renamedTo)) return null;
      return {
        renamedFrom: String(renamedFrom).trim(),
        renamedTo: String(renamedTo).trim(),
        date: date || new Date(),
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.date - b.date);

  return {
    serialNumber,
    currentName: currentName || "N/A",
    manufacturer: manufacturer || "",
    model: model || "",
    description,
    status,
    purchaseDate,
    notes: "",
    renameHistory,
  };
}

async function previewImport(req, res) {
  try {
    if (!req.file) return res.status(400).json({ message: "file is required" });

    const wb = XLSX.read(req.file.buffer, { type: "buffer", cellDates: true });
    const ws = wb.Sheets[wb.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(ws, { defval: "" });
    const previewRows = rows.slice(0, 5).map((row) => ({
      serialNumber: getField(row, ["serialnumber"]) || "",
      currentName: getField(row, ["currentname"]) || "",
      renamedFrom: getField(row, ["renamedfrom"]) || "",
      renamedTo: getField(row, ["renamedto"]) || "",
      date: parseExcelDate(getField(row, ["date"])) || "",
      status: getField(row, ["status"]) || "",
      manufacturer: getField(row, ["manufacture"]) || "",
      model: getField(row, ["model"]) || "",
      type: getField(row, ["type"]) || "",
    }));
    const totalRows = rows.length;

    const grouped = new Map();
    rows.forEach((row) => {
      const serial = getField(row, ["serialnumber"]) || "";
      const serialNumber = String(serial).trim();
      if (!serialNumber) return;
      if (!grouped.has(serialNumber)) grouped.set(serialNumber, []);
      grouped.get(serialNumber).push(row);
    });

    const newAssets = [];
    const conflicts = [];

    for (const [, serialRows] of grouped.entries()) {
      const builtAsset = buildAssetFromRows(serialRows);
      if (!builtAsset.serialNumber) continue;
      const existing = await Asset.findOne({
        serialNumber: builtAsset.serialNumber,
      }).lean();
      if (!existing) {
        newAssets.push(builtAsset);
      } else {
        conflicts.push({
          serialNumber: builtAsset.serialNumber,
          existingData: existing,
          newData: builtAsset,
        });
      }
    }

    return res.json({ newAssets, conflicts, totalRows, previewRows });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}

async function confirmImport(req, res) {
  try {
    const { newAssets = [], conflicts = [] } = req.body || {};
    let imported = 0;
    let skipped = 0;

    if (Array.isArray(newAssets) && newAssets.length > 0) {
      const inserted = await Asset.insertMany(newAssets, { ordered: false });
      imported += inserted.length;

      for (const asset of inserted) {
        await ActivityLog.create({
          serialNumber: asset.serialNumber,
          machineName: asset.currentName,
          action: "Imported",
          details: "Imported from spreadsheet",
        });
      }
    }

    for (const item of conflicts) {
      if (item.resolution === "overwrite" && item.newData) {
        const updated = await Asset.findOneAndUpdate(
          { serialNumber: item.serialNumber },
          { $set: item.newData },
          { new: true }
        );
        if (updated) {
          imported += 1;
          await ActivityLog.create({
            serialNumber: updated.serialNumber,
            machineName: updated.currentName,
            action: "Imported",
            details: "Imported conflict resolved by overwrite",
          });
        }
      } else {
        skipped += 1;
      }
    }

    return res.json({ imported, skipped });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}

module.exports = {
  previewImport,
  confirmImport,
};
