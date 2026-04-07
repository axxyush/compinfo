import React, { useMemo, useState } from "react";
import { exportBySerials } from "../api";
import {
  calculateAgeYears,
  COLUMN_OPTIONS,
  defaultColumnSelection,
  displayName,
  downloadExcel,
  formatPurchaseDate,
  formatAgeFromPurchaseDate,
  rowsForExport,
  apiErrorMessage,
} from "../utils/helpers";

function parseSerials(text) {
  return text
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function columnsForApi(selected) {
  const cols = new Set();
  if (selected.serialNumber) {
    cols.add("Serial Number");
    cols.add("serialNumber");
  }
  if (selected.currentName) {
    cols.add("Current Name");
    cols.add("currentName");
  }
  if (selected.manufacturer) {
    cols.add("Manufacturer");
    cols.add("manufacturer");
  }
  if (selected.model) {
    cols.add("Model");
    cols.add("model");
  }
  if (selected.status) {
    cols.add("Status");
    cols.add("status");
  }
  if (selected.purchaseDate) {
    cols.add("Purchase Date");
    cols.add("purchaseDate");
  }
  if (selected.age) {
    cols.add("Age");
    cols.add("age");
    cols.add("purchaseDate");
  }
  if (selected.type) {
    cols.add("Type");
    cols.add("type");
    cols.add("description");
  }
  if (selected.notes) {
    cols.add("Notes");
    cols.add("notes");
  }
  if (selected.lastRename) {
    cols.add("Rename History (last rename only)");
    cols.add("lastRename");
    cols.add("renameHistory");
  }
  return [...cols];
}

export default function Generator() {
  const [paste, setPaste] = useState("");
  const [selected, setSelected] = useState(() => defaultColumnSelection());
  const [lookedUp, setLookedUp] = useState(false);
  const [matched, setMatched] = useState([]);
  const [unmatched, setUnmatched] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const serials = useMemo(() => parseSerials(paste), [paste]);

  const onToggle = (key) => {
    setSelected((s) => ({ ...s, [key]: !s[key] }));
  };

  const onLookup = async () => {
    setError(null);
    setLoading(true);
    setLookedUp(false);
    try {
      const cols = columnsForApi(selected);
      const res = await exportBySerials({
        serialNumbers: serials,
        columns: cols,
      });
      const found = (res.data.found || []).map((r) => ({
        ...r,
        type: r.type ?? r.Type ?? r.description ?? r.Description ?? "",
        notes: r.notes ?? r.Notes ?? "",
        lastRename:
          r.lastRename ??
          r["Rename History (last rename only)"] ??
          r.renameHistory ??
          "",
      }));
      setMatched(found);
      setUnmatched(res.data.notFound || []);
      setLookedUp(true);
    } catch (e) {
      setError(apiErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  const previewRows = useMemo(() => {
    return rowsForExport(matched, selected, (a) => calculateAgeYears(a.purchaseDate));
  }, [matched, selected]);

  const onDownload = () => {
    if (previewRows.length === 0) return;
    downloadExcel(
      previewRows,
      `compinfo-generator-${new Date().toISOString().slice(0, 10)}.xlsx`
    );
  };

  const fakeFileUpload = () => {
    setPaste("379MTH3\nHP9K2LM\nNOTREAL123\nDL7090BB");
  };

  const tableHeaders = COLUMN_OPTIONS.filter((c) => selected[c.key]);

  return (
    <div className="container-fluid py-4">
      <h1 className="h3 mb-4">Spreadsheet Generator</h1>

      {error && <div className="alert alert-danger">{error}</div>}

      <div className="row g-4 align-items-start">
        <div className="col-12 col-lg-6">
          <div className="card asset-card h-100">
            <div className="card-header bg-transparent border-0 pt-3 pb-0">
              <h2 className="h6 mb-0">Input</h2>
            </div>
            <div className="card-body">
              <label className="form-label small text-muted">
                Paste serial numbers (one per line)
              </label>
              <textarea
                className="form-control font-monospace mb-2"
                rows={10}
                value={paste}
                onChange={(e) => {
                  setPaste(e.target.value);
                  setLookedUp(false);
                }}
                placeholder="379MTH3&#10;HP9K2LM"
              />
              <p className="small text-muted mb-2">
                {serials.length} serial number{serials.length === 1 ? "" : "s"} entered
              </p>
              <div className="d-flex flex-wrap gap-2 mb-2">
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={onLookup}
                  disabled={loading || serials.length === 0}
                >
                  {loading ? "Loading…" : "Look Up →"}
                </button>
                <button
                  type="button"
                  className="btn btn-outline-secondary btn-sm"
                  onClick={fakeFileUpload}
                >
                  Simulate .txt upload
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="col-12 col-lg-6">
          <div className="card asset-card h-100">
            <div className="card-header bg-transparent border-0 pt-3 pb-0">
              <h2 className="h6 mb-0">Configure output</h2>
            </div>
            <div className="card-body">
              <p className="small text-muted mb-2">Select columns to include in export:</p>
              <div className="row g-2">
                {COLUMN_OPTIONS.map((c) => (
                  <div key={c.key} className="col-12 col-sm-6">
                    <div className="form-check">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id={`gen-${c.key}`}
                        checked={!!selected[c.key]}
                        onChange={() => onToggle(c.key)}
                      />
                      <label className="form-check-label small" htmlFor={`gen-${c.key}`}>
                        {c.label}
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="card asset-card mt-4">
        <div className="card-header bg-transparent border-0 pt-3 pb-0 d-flex flex-wrap justify-content-between align-items-center gap-2">
          <h2 className="h6 mb-0">Results preview</h2>
          <button
            type="button"
            className="btn btn-sm btn-primary"
            onClick={onDownload}
            disabled={!lookedUp || matched.length === 0}
          >
            Download Excel
          </button>
        </div>
        <div className="card-body">
          {loading ? (
            <div className="text-center py-3">
              <div className="spinner-border text-compinfo-primary" role="status">
                <span className="visually-hidden">Loading…</span>
              </div>
            </div>
          ) : !lookedUp ? (
            <p className="text-muted small mb-0">Run Look Up to preview matched rows.</p>
          ) : (
            <>
              <div className="table-responsive mb-3">
                <table className="table table-sm table-bordered mb-0">
                  <thead>
                    <tr>
                      {tableHeaders.map((c) => (
                        <th key={c.key}>{c.label}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {matched.map((a) => (
                      <tr key={a.serialNumber}>
                        {tableHeaders.map((c) => (
                          <td key={c.key}>{renderCell(c.key, a)}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {unmatched.length > 0 && (
                <p className="text-danger small mb-0">
                  <strong>Not found:</strong> {unmatched.join(", ")}
                </p>
              )}
            </>
          )}
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
      if (a.lastRename) return a.lastRename;
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
