import React, { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { getAssets } from "../api";
import StatusBadge from "../components/StatusBadge";
import {
  calculateAgeYears,
  displayName,
  formatPurchaseDate,
  getUniqueModels,
  apiErrorMessage,
  COLUMN_OPTIONS,
  defaultColumnSelection,
  rowsForExport,
  downloadExcel,
} from "../utils/helpers";

const AGE_FILTERS = ["All", "1-2 years", "3-4 years", "4+ years"];

function buildQueryParams({ search, status, manufacturer, type, model, ageFilter }) {
  const p = {};
  if (search && search.trim()) p.search = search.trim();
  if (status && status !== "All") p.status = status;
  if (manufacturer && manufacturer !== "All") p.manufacturer = manufacturer;
  if (type && type !== "All") p.description = type;
  if (model && model !== "All") p.model = model;
  if (ageFilter === "1-2 years") {
    p.ageMin = 1;
    p.ageMax = 2;
  } else if (ageFilter === "3-4 years") {
    p.ageMin = 3;
    p.ageMax = 4;
  } else if (ageFilter === "4+ years") {
    p.ageMin = 4;
  }
  return p;
}

export default function AllAssets() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialSearch = searchParams.get("search") || "";

  const [searchInput, setSearchInput] = useState(initialSearch);
  const [debouncedSearch, setDebouncedSearch] = useState(initialSearch);
  const [status, setStatus] = useState("All");
  const [manufacturer, setManufacturer] = useState("All");
  const [type, setType] = useState("All");
  const [model, setModel] = useState("All");
  const [ageFilter, setAgeFilter] = useState("All");

  const [assets, setAssets] = useState([]);
  const [totalInDb, setTotalInDb] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState(null);
  const [exportError, setExportError] = useState(null);
  const [selectedCols, setSelectedCols] = useState(() => defaultColumnSelection());
  const [modelOptionsAll, setModelOptionsAll] = useState([]);

  useEffect(() => {
    getAssets()
      .then((res) => {
        setModelOptionsAll(getUniqueModels(res.data));
        setTotalInDb(res.data.length);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const q = searchParams.get("search") || "";
    setSearchInput(q);
    setDebouncedSearch(q);
  }, [searchParams]);

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedSearch(searchInput), 400);
    return () => window.clearTimeout(t);
  }, [searchInput]);

  const queryParams = useMemo(
    () =>
      buildQueryParams({
        search: debouncedSearch,
        status,
        manufacturer,
        type,
        model,
        ageFilter,
      }),
    [debouncedSearch, status, manufacturer, type, model, ageFilter]
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await getAssets(queryParams);
        if (cancelled) return;
        setAssets(res.data);
      } catch (e) {
        if (!cancelled) setError(apiErrorMessage(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [queryParams]);

  const onExport = async () => {
    setExportError(null);
    setExporting(true);
    try {
      const rows = rowsForExport(
        assets.map((r) => ({ ...r, type: r.description ?? r.type })),
        selectedCols,
        (a) => calculateAgeYears(a.purchaseDate)
      );
      downloadExcel(
        rows,
        `compinfo-assets-${new Date().toISOString().slice(0, 10)}.xlsx`
      );
    } catch (e) {
      setExportError(apiErrorMessage(e));
    } finally {
      setExporting(false);
    }
  };

  const toggleCol = (key) => {
    setSelectedCols((s) => ({ ...s, [key]: !s[key] }));
  };

  return (
    <div className="container-fluid py-4">
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-start gap-3 mb-4">
        <h1 className="h3 mb-0">All Assets</h1>
        <div className="d-flex flex-wrap gap-2">
          <Link to="/assets/new" className="btn btn-primary btn-sm">
            Add New Asset
          </Link>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}
      {exportError && (
        <div className="alert alert-danger" role="alert">
          {exportError}
        </div>
      )}

      <div className="card asset-card mb-4">
        <div className="card-body">
          <div className="row g-3 align-items-end">
            <div className="col-12 col-lg-4">
              <label className="form-label small text-muted mb-1">Search</label>
              <input
                className="form-control"
                placeholder="Serial, name, model, history…"
                value={searchInput}
                onChange={(e) => {
                  const v = e.target.value;
                  setSearchInput(v);
                  setSearchParams(v ? { search: v } : {});
                }}
              />
            </div>
            <div className="col-6 col-md-4 col-lg-2">
              <label className="form-label small text-muted mb-1">Status</label>
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
            <div className="col-6 col-md-4 col-lg-2">
              <label className="form-label small text-muted mb-1">Manufacturer</label>
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
            <div className="col-6 col-md-4 col-lg-2">
              <label className="form-label small text-muted mb-1">Type</label>
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
            <div className="col-6 col-md-4 col-lg-2">
              <label className="form-label small text-muted mb-1">Model</label>
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
            <div className="col-6 col-md-4 col-lg-2">
              <label className="form-label small text-muted mb-1">Age</label>
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
          <div className="mt-3 pt-3 border-top">
            <div className="small text-muted mb-2">Export columns</div>
            <div className="row g-2">
              {COLUMN_OPTIONS.map((c) => (
                <div key={c.key} className="col-6 col-md-4 col-lg-3">
                  <div className="form-check form-check-inline">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id={`all-${c.key}`}
                      checked={!!selectedCols[c.key]}
                      onChange={() => toggleCol(c.key)}
                    />
                    <label className="form-check-label small" htmlFor={`all-${c.key}`}>
                      {c.label}
                    </label>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-3">
              <button
                type="button"
                className="btn btn-outline-secondary btn-sm"
                onClick={onExport}
                disabled={exporting || loading}
              >
                {exporting ? "Exporting…" : "Download Excel"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-4">
          <div className="spinner-border text-compinfo-primary" role="status">
            <span className="visually-hidden">Loading…</span>
          </div>
        </div>
      ) : (
        <>
          <p className="text-muted small mb-2">
            Showing {assets.length}
            {totalInDb != null ? ` of ${totalInDb} assets` : " assets"}
          </p>

          <div className="table-responsive card asset-card">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th>Serial Number</th>
                  <th>Current Name</th>
                  <th>Manufacturer</th>
                  <th>Model</th>
                  <th>Status</th>
                  <th>Purchase Date</th>
                  <th>Age</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {assets.map((a) => {
                  const years = calculateAgeYears(a.purchaseDate);
                  return (
                    <tr key={a.serialNumber}>
                      <td className="font-monospace">{a.serialNumber}</td>
                      <td>{displayName(a.currentName)}</td>
                      <td>{a.manufacturer}</td>
                      <td>{a.model}</td>
                      <td>
                        <StatusBadge status={a.status} />
                      </td>
                      <td>{formatPurchaseDate(a.purchaseDate)}</td>
                      <td>{a.purchaseDate ? years : "Unknown"}</td>
                      <td>
                        <Link
                          className="btn btn-sm btn-outline-primary"
                          to={`/assets/${encodeURIComponent(a.serialNumber)}`}
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
