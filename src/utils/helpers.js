import * as XLSX from "xlsx";

/**
 * @typedef {Object} RenameEvent
 * @property {string} from
 * @property {string} to
 * @property {string} date
 */

/**
 * @typedef {Object} StatusEvent
 * @property {string} date
 * @property {string} status
 */

/**
 * @typedef {Object} Asset
 * @property {string} serialNumber
 * @property {string|null} currentName
 * @property {string} status
 * @property {string} manufacturer
 * @property {string} model
 * @property {string} type
 * @property {string} purchaseDate
 * @property {string} notes
 * @property {string} lastModified
 * @property {RenameEvent[]} renameHistory
 * @property {StatusEvent[]} statusHistory
 */

const MS_PER_DAY = 86400000;

export function formatDate(isoOrYmd) {
  if (!isoOrYmd) return "—";
  const d = new Date(isoOrYmd);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatPurchaseDate(purchaseDate) {
  if (!purchaseDate) return "Unknown";
  return formatDate(purchaseDate);
}

export function formatDateTime(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

/** Full calendar years since purchase date (floor). */
export function calculateAgeYears(purchaseDate) {
  if (!purchaseDate) return 0;
  const p =
    purchaseDate instanceof Date
      ? purchaseDate
      : new Date(
          typeof purchaseDate === "string"
            ? purchaseDate.split("T")[0]
            : purchaseDate
        );
  if (Number.isNaN(p.getTime())) return 0;
  const now = new Date();
  let years = now.getFullYear() - p.getFullYear();
  const m = now.getMonth() - p.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < p.getDate())) {
    years -= 1;
  }
  return Math.max(0, years);
}

export function formatAgeLabel(years) {
  if (years === 1) return "1 year";
  return `${years} years`;
}

export function formatAgeFromPurchaseDate(purchaseDate) {
  if (!purchaseDate) return "Unknown";
  return formatAgeLabel(calculateAgeYears(purchaseDate));
}

/** Days since last meaningful activity (uses lastModified). */
export function daysSinceLastActivity(lastModifiedIso) {
  if (!lastModifiedIso) return null;
  const t = new Date(lastModifiedIso).getTime();
  if (Number.isNaN(t)) return null;
  return Math.floor((Date.now() - t) / MS_PER_DAY);
}

/** Last rename date, or null. */
export function getLastRenameDate(asset) {
  const rh = asset.renameHistory || [];
  if (rh.length === 0) return null;
  const sorted = [...rh].sort((a, b) => new Date(a.date) - new Date(b.date));
  const last = sorted[sorted.length - 1];
  return last.date;
}

export function getStatusBadgeClass(status) {
  switch (status) {
    case "Active":
      return "bg-success";
    case "Ready to Deploy":
      return "bg-primary";
    case "Disposed":
      return "bg-secondary";
    case "In Repair":
      return "bg-warning text-dark";
    case "Redeploy":
      return "bg-info text-dark";
    default:
      return "bg-secondary";
  }
}

export function getActivityBadgeClass(action) {
  switch (action) {
    case "Added":
      return "bg-success";
    case "Renamed":
      return "bg-primary";
    case "Status Changed":
      return "bg-warning text-dark";
    case "Imported":
      return "badge-imported";
    case "Edited":
      return "bg-secondary";
    default:
      return "bg-secondary";
  }
}

export function matchesAgeFilter(years, filter) {
  if (!filter || filter === "All") return true;
  if (filter === "1-2 years") return years >= 1 && years <= 2;
  if (filter === "3-4 years") return years >= 3 && years <= 4;
  if (filter === "4+ years") return years >= 4;
  return true;
}

/** Alert: older than 4 full years (>= 5 years since purchase per integer age), matching "4+ years" risk. */
export function isOlderThanFourYears(purchaseDate) {
  return calculateAgeYears(purchaseDate) > 4;
}

export function displayName(name) {
  if (name == null || name === "") return "N/A";
  return name;
}

/**
 * Build unified timeline events for an asset (renames + status changes).
 * @param {Asset} asset
 */
export function buildTimelineEvents(asset) {
  const events = [];

  (asset.renameHistory || []).forEach((r) => {
    const from = r.renamedFrom ?? r.from;
    const to = r.renamedTo ?? r.to;
    events.push({
      kind: "rename",
      date: r.date,
      from,
      to,
    });
  });

  const sh = [...(asset.statusHistory || [])].sort(
    (a, b) => new Date(a.date) - new Date(b.date)
  );
  sh.forEach((entry, i) => {
    if (i === 0) {
      events.push({
        kind: "status",
        date: entry.date,
        fromStatus: null,
        toStatus: entry.status,
      });
    } else {
      const prev = sh[i - 1].status;
      if (prev !== entry.status) {
        events.push({
          kind: "status",
          date: entry.date,
          fromStatus: prev,
          toStatus: entry.status,
        });
      }
    }
  });

  events.sort((a, b) => new Date(a.date) - new Date(b.date));
  return events;
}

/** Search text across asset fields and rename history. */
export function assetMatchesSearch(asset, q) {
  if (!q || !q.trim()) return true;
  const needle = q.trim().toLowerCase();
  const parts = [
    asset.serialNumber,
    asset.currentName || "",
    asset.model,
    asset.manufacturer,
    asset.notes || "",
  ];
  (asset.renameHistory || []).forEach((r) => {
    parts.push(r.renamedFrom ?? r.from, r.renamedTo ?? r.to);
  });
  return parts.some((p) => p.toLowerCase().includes(needle));
}

/** "Was ever named" — includes current and all historical names. */
export function assetWasEverNamed(asset, q) {
  if (!q || !q.trim()) return true;
  const needle = q.trim().toLowerCase();
  const names = new Set();
  if (asset.currentName) names.add(asset.currentName);
  (asset.renameHistory || []).forEach((r) => {
    names.add(r.renamedFrom ?? r.from);
    names.add(r.renamedTo ?? r.to);
  });
  return [...names].some((n) => n.toLowerCase().includes(needle));
}

export function getUniqueModels(assets) {
  const set = new Set(assets.map((a) => a.model).filter(Boolean));
  return [...set].sort();
}

const EXPORT_COLUMN_KEYS = {
  serialNumber: "Serial Number",
  currentName: "Current Name",
  manufacturer: "Manufacturer",
  model: "Model",
  status: "Status",
  purchaseDate: "Purchase Date",
  age: "Age",
  type: "Type",
  notes: "Notes",
  lastRename: "Rename History (last rename only)",
};

/**
 * @param {Asset[]} assets
 * @param {Record<string, boolean>} selected
 * @param {(a: Asset) => number} ageFn
 */
export function rowsForExport(assets, selected, ageFn) {
  return assets.map((a) => {
    const row = {};
    const age = ageFn(a);
    if (selected.serialNumber) row[EXPORT_COLUMN_KEYS.serialNumber] = a.serialNumber;
    if (selected.currentName)
      row[EXPORT_COLUMN_KEYS.currentName] = displayName(a.currentName);
    if (selected.manufacturer) row[EXPORT_COLUMN_KEYS.manufacturer] = a.manufacturer;
    if (selected.model) row[EXPORT_COLUMN_KEYS.model] = a.model;
    if (selected.status) row[EXPORT_COLUMN_KEYS.status] = a.status;
    if (selected.purchaseDate)
      row[EXPORT_COLUMN_KEYS.purchaseDate] = a.purchaseDate || "Unknown";
    if (selected.age)
      row[EXPORT_COLUMN_KEYS.age] = a.purchaseDate
        ? formatAgeLabel(age)
        : "Unknown";
    if (selected.type)
      row[EXPORT_COLUMN_KEYS.type] = a.description ?? a.type ?? "";
    if (selected.notes) row[EXPORT_COLUMN_KEYS.notes] = a.notes || "";
    if (selected.lastRename) {
      const rh = a.renameHistory || [];
      if (rh.length === 0) row[EXPORT_COLUMN_KEYS.lastRename] = "";
      else {
        const last = [...rh].sort(
          (x, y) => new Date(x.date) - new Date(y.date)
        )[rh.length - 1];
        const from = last.renamedFrom ?? last.from;
        const to = last.renamedTo ?? last.to;
        row[EXPORT_COLUMN_KEYS.lastRename] = `${from} → ${to} (${last.date})`;
      }
    }
    return row;
  });
}

/**
 * @param {Record<string, string|number>[]} rows
 * @param {string} filename
 */
/** Checklist keys shared by Generator and Filter & Export pages. */
export const COLUMN_OPTIONS = [
  { key: "serialNumber", label: "Serial Number", defaultOn: true },
  { key: "currentName", label: "Current Name", defaultOn: true },
  { key: "manufacturer", label: "Manufacturer", defaultOn: true },
  { key: "model", label: "Model", defaultOn: true },
  { key: "status", label: "Status", defaultOn: true },
  { key: "purchaseDate", label: "Purchase Date", defaultOn: true },
  { key: "age", label: "Age", defaultOn: true },
  { key: "lastRename", label: "Rename History (last rename only)", defaultOn: false },
  { key: "notes", label: "Notes", defaultOn: false },
  { key: "type", label: "Type", defaultOn: false },
];

export function defaultColumnSelection() {
  const o = {};
  COLUMN_OPTIONS.forEach((c) => {
    o[c.key] = c.defaultOn;
  });
  return o;
}

export function apiErrorMessage(err) {
  const msg = err?.response?.data?.message;
  return typeof msg === "string" && msg.trim() ? msg : err?.message || "Request failed";
}

export function downloadExcel(rows, filename) {
  if (rows.length === 0) {
    const ws = XLSX.utils.json_to_sheet([{ Message: "No rows to export" }]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Export");
    XLSX.writeFile(wb, filename);
    return;
  }
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Assets");
  XLSX.writeFile(wb, filename);
}

/** All Assets table export — fixed columns matching UI. */
export function exportAssetsTable(assets, filename) {
  const rows = assets.map((a) => ({
    "Serial Number": a.serialNumber,
    "Current Name": displayName(a.currentName),
    Manufacturer: a.manufacturer,
    Model: a.model,
    Status: a.status,
    "Purchase Date": a.purchaseDate || "Unknown",
    Age: a.purchaseDate ? formatAgeLabel(calculateAgeYears(a.purchaseDate)) : "Unknown",
  }));
  downloadExcel(rows, filename);
}
