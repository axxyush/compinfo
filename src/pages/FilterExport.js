import React, { useEffect, useState } from "react";
import { getAssets, exportFilter } from "../api";
import {
  assetWasEverNamed,
  calculateAgeYears,
  COLUMN_OPTIONS,
  defaultColumnSelection,
  displayName,
  downloadExcel,
  formatPurchaseDate,
  formatAgeFromPurchaseDate,
  getUniqueModels,
  matchesAgeFilter,
  rowsForExport,
  apiErrorMessage,
} from "../utils/helpers";

const AGE_FILTERS = ["All", "1-2 years", "3-4 years", "4+ years"];

function buildBackendFilters({
  search,
  status,
  manufacturer,
  type,
  model,
  ageFilter,
}) {
  const f = {};
  if (search.trim()) f.search = search.trim();
  if (status !== "All") f.status = status;
  if (manufacturer !== "All") f.manufacturer = manufacturer;
  if (type !== "All") f.description = type;
  if (model !== "All") f.model = model;
  if (ageFilter === "1-2 years") {
    f.ageMin = 1;
    f.ageMax = 2;
  } else if (ageFilter === "3-4 years") {
    f.ageMin = 3;
    f.ageMax = 4;
  } else if (ageFilter === "4+ years") {
    f.ageMin = 4;
  }
  return f;
}

function normalizeRow(r) {
  return {
    ...r,
    type: r.description ?? r.type,
  };
}

function passesClientFilters(asset, filters) {
  const {
    purchaseFrom,
    purchaseTo,
    ageOlderThan,
    nameContains,
    wasEverNamed,
    ageFilter,
  } = filters;

  const pd = asset.purchaseDate
    ? new Date(asset.purchaseDate).toISOString().slice(0, 10)
    : "";
  if (purchaseFrom && pd && pd < purchaseFrom) return false;
  if (purchaseTo && pd && pd > purchaseTo) return false;

  if (!asset.purchaseDate) {
    if (ageFilter !== "All") return false;
    if (ageOlderThan !== "" && Number.isFinite(Number(ageOlderThan))) return false;
  }

  const years = calculateAgeYears(asset.purchaseDate);
  if (!matchesAgeFilter(years, ageFilter)) return false;

  if (ageOlderThan !== "" && Number.isFinite(Number(ageOlderThan))) {
    if (years <= Number(ageOlderThan)) return false;
  }

  if (nameContains.trim()) {
    const n = (asset.currentName || "").toLowerCase();
    if (!n.includes(nameContains.trim().toLowerCase())) return false;
  }

  if (wasEverNamed.trim()) {
    if (!assetWasEverNamed(asset, wasEverNamed.trim())) return false;
  }

  return true;
}

function columnsForApi(selected) {
  const keys = Object.keys(selected).filter((k) => selected[k]);
  const api = keys.map((k) => (k === "type" ? "description" : k));
  if (selected.age || selected.lastRename) {
    if (!api.includes("purchaseDate")) api.push("purchaseDate");
    if (selected.lastRename && !api.includes("renameHistory")) api.push("renameHistory");
  }
  return [...new Set(api)];
}

export default function FilterExport() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("All");
  const [manufacturer, setManufacturer] = useState("All");
  const [type, setType] = useState("All");
  const [model, setModel] = useState("All");
  const [ageFilter, setAgeFilter] = useState("All");
  const [purchaseFrom, setPurchaseFrom] = useState("");
  const [purchaseTo, setPurchaseTo] = useState("");
  const [ageOlderThan, setAgeOlderThan] = useState("");
  const [nameContains, setNameContains] = useState("");
  const [wasEverNamed, setWasEverNamed] = useState("");
  const [selected, setSelected] = useState(() => defaultColumnSelection());

  const [results, setResults] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [modelOptionsAll, setModelOptionsAll] = useState([]);

  useEffect(() => {
    getAssets()
      .then((res) => setModelOptionsAll(getUniqueModels(res.data)))
      .catch(() => {});
  }, []);

  const onToggle = (key) => {
    setSelected((s) => ({ ...s, [key]: !s[key] }));
  };

  const applyFilters = async () => {
    setLoading(true);
    setError(null);
    try {
      const backendFilters = buildBackendFilters({
        search,
        status,
        manufacturer,
        type,
        model,
        ageFilter,
      });
      const { data } = await exportFilter({
        filters: backendFilters,
        columns: [
          "serialNumber",
          "currentName",
          "manufacturer",
          "model",
          "status",
          "purchaseDate",
          "description",
          "notes",
          "renameHistory",
        ],
      });
      const raw = data.results || [];
      const normalized = raw.map(normalizeRow);
      const clientCtx = {
        purchaseFrom,
        purchaseTo,
        ageOlderThan,
        nameContains,
        wasEverNamed,
        ageFilter,
      };
      const filtered = normalized.filter((a) => passesClientFilters(a, clientCtx));
      setResults(filtered);
      setTotal(filtered.length);
    } catch (e) {
      setError(apiErrorMessage(e));
      setResults([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  const onDownload = async () => {
    setError(null);
    setLoading(true);
    try {
      const backendFilters = buildBackendFilters({
        search,
        status,
        manufacturer,
        type,
        model,
        ageFilter,
      });
      const columns = columnsForApi(selected);
      const { data } = await exportFilter({ filters: backendFilters, columns });
      let raw = (data.results || []).map(normalizeRow);
      const clientCtx = {
        purchaseFrom,
        purchaseTo,
        ageOlderThan,
        nameContains,
        wasEverNamed,
        ageFilter,
      };
      raw = raw.filter((a) => passesClientFilters(a, clientCtx));
      const rows = rowsForExport(
        raw,
        selected,
        (a) => calculateAgeYears(a.purchaseDate)
      );
      downloadExcel(
        rows,
        `compinfo-filter-export-${new Date().toISOString().slice(0, 10)}.xlsx`
      );
    } catch (e) {
      setError(apiErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  const tableHeaders = COLUMN_OPTIONS.filter((c) => selected[c.key]);

  return (
    <div className="container-fluid py-4">
      <h1 className="h3 mb-4">Filter &amp; Export</h1>
      <p className="text-muted small mb-3">
        Query your inventory with rich filters, pick columns, then download to Excel.
      </p>

      {error && <div className="alert alert-danger">{error}</div>}

      <div className="row g-4">
        <div className="col-12 col-xl-4">
          <div className="card asset-card">
            <div className="card-header bg-transparent border-0 pt-3 pb-0">
              <h2 className="h6 mb-0">Filters</h2>
            </div>
            <div className="card-body">
              <div className="mb-3">
                <label className="form-label small text-muted">Search</label>
                <input
                  className="form-control form-control-sm"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Serial, model, history…"
                />
              </div>
              <div className="row g-2 mb-2">
                <div className="col-12">
                  <label className="form-label small text-muted">Status</label>
                  <select
                    className="form-select form-select-sm"
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                  >
                    <option>All</option>
                    <option>Active</option>
                    <option>Ready to Deploy</option>
                    <option>Disposed</option>
                  </select>
                </div>
                <div className="col-12">
                  <label className="form-label small text-muted">Manufacturer</label>
                  <select
                    className="form-select form-select-sm"
                    value={manufacturer}
                    onChange={(e) => setManufacturer(e.target.value)}
                  >
                    <option>All</option>
                    <option>Dell</option>
                    <option>HP</option>
                    <option>Lenovo</option>
                    <option>Microsoft</option>
                    <option>Apple</option>
                  </select>
                </div>
                <div className="col-12">
                  <label className="form-label small text-muted">Type</label>
                  <select
                    className="form-select form-select-sm"
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                  >
                    <option>All</option>
                    <option>Computer</option>
                    <option>Laptop</option>
                    <option>Monitor</option>
                    <option>Other</option>
                  </select>
                </div>
                <div className="col-12">
                  <label className="form-label small text-muted">Model</label>
                  <select
                    className="form-select form-select-sm"
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                  >
                    <option>All</option>
                    {modelOptionsAll.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-12">
                  <label className="form-label small text-muted">Age bucket</label>
                  <select
                    className="form-select form-select-sm"
                    value={ageFilter}
                    onChange={(e) => setAgeFilter(e.target.value)}
                  >
                    {AGE_FILTERS.map((a) => (
                      <option key={a} value={a}>
                        {a}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <hr />

              <div className="mb-2">
                <label className="form-label small text-muted">Purchase date from</label>
                <input
                  type="date"
                  className="form-control form-control-sm"
                  value={purchaseFrom}
                  onChange={(e) => setPurchaseFrom(e.target.value)}
                />
              </div>
              <div className="mb-2">
                <label className="form-label small text-muted">Purchase date to</label>
                <input
                  type="date"
                  className="form-control form-control-sm"
                  value={purchaseTo}
                  onChange={(e) => setPurchaseTo(e.target.value)}
                />
              </div>
              <div className="mb-2">
                <label className="form-label small text-muted">Age older than (years)</label>
                <input
                  type="number"
                  min={0}
                  className="form-control form-control-sm"
                  placeholder="e.g. 4"
                  value={ageOlderThan}
                  onChange={(e) => setAgeOlderThan(e.target.value)}
                />
              </div>
              <div className="mb-2">
                <label className="form-label small text-muted">Name contains</label>
                <input
                  className="form-control form-control-sm"
                  value={nameContains}
                  onChange={(e) => setNameContains(e.target.value)}
                  placeholder="Current name"
                />
              </div>
              <div className="mb-3">
                <label className="form-label small text-muted">Was ever named</label>
                <input
                  className="form-control form-control-sm"
                  value={wasEverNamed}
                  onChange={(e) => setWasEverNamed(e.target.value)}
                  placeholder="Any historical name"
                />
              </div>

              <button
                type="button"
                className="btn btn-primary btn-sm w-100"
                onClick={applyFilters}
                disabled={loading}
              >
                {loading ? "Applying…" : "Apply filters"}
              </button>
            </div>
          </div>

          <div className="card asset-card mt-3">
            <div className="card-header bg-transparent border-0 pt-3 pb-0">
              <h2 className="h6 mb-0">Columns in export</h2>
            </div>
            <div className="card-body">
              <div className="row g-2">
                {COLUMN_OPTIONS.map((c) => (
                  <div key={c.key} className="col-12">
                    <div className="form-check">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id={`fe-${c.key}`}
                        checked={!!selected[c.key]}
                        onChange={() => onToggle(c.key)}
                      />
                      <label className="form-check-label small" htmlFor={`fe-${c.key}`}>
                        {c.label}
                      </label>
                    </div>
                  </div>
                ))}
              </div>
              <button
                type="button"
                className="btn btn-primary btn-sm mt-3 w-100"
                onClick={onDownload}
                disabled={loading}
              >
                Download Excel
              </button>
            </div>
          </div>
        </div>

        <div className="col-12 col-xl-8">
          <p className="text-muted small mb-2">
            <strong>{total}</strong> assets match your filters
          </p>
          {loading && (
            <div className="text-center py-3">
              <div className="spinner-border text-compinfo-primary" role="status">
                <span className="visually-hidden">Loading…</span>
              </div>
            </div>
          )}
          <div className="table-responsive card asset-card">
            <table className="table table-sm table-hover align-middle mb-0">
              <thead className="table-light">
                <tr>
                  {tableHeaders.length === 0 ? (
                    <th>Select at least one column</th>
                  ) : (
                    tableHeaders.map((c) => <th key={c.key}>{c.label}</th>)
                  )}
                </tr>
              </thead>
              <tbody>
                {tableHeaders.length === 0 ? (
                  <tr>
                    <td className="text-muted">Select at least one column to preview data.</td>
                  </tr>
                ) : (
                  results.map((a) => (
                    <tr key={a.serialNumber}>
                      {tableHeaders.map((c) => (
                        <td key={c.key}>{renderCell(c.key, a)}</td>
                      ))}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

function renderCell(key, a) {
  const typeVal = a.description ?? a.type;
  switch (key) {
    case "serialNumber":
      return a.serialNumber;
    case "currentName":
      return displayName(a.currentName);
    case "manufacturer":
      return a.manufacturer;
    case "model":
      return a.model;
    case "status":
      return a.status;
    case "purchaseDate":
      return formatPurchaseDate(a.purchaseDate);
    case "age":
      return formatAgeFromPurchaseDate(a.purchaseDate);
    case "type":
      return typeVal || "";
    case "notes":
      return a.notes || "";
    case "lastRename": {
      const rh = a.renameHistory || [];
      if (rh.length === 0) return "";
      const last = [...rh].sort((x, y) => new Date(x.date) - new Date(y.date))[rh.length - 1];
      const from = last.renamedFrom ?? last.from;
      const to = last.renamedTo ?? last.to;
      return `${from} → ${to}`;
    }
    default:
      return "";
  }
}
