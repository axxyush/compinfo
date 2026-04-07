import React, { useEffect, useRef, useState } from "react";
import { importPreview, importConfirm } from "../api";
import { apiErrorMessage } from "../utils/helpers";

const FIELD_OPTIONS = [
  "Serial Number",
  "Current Name",
  "Renamed From",
  "Renamed To",
  "Manufacturer",
  "Model",
  "Status",
  "Date",
  "Type (Description)",
  "Skip column",
];

const defaultMapping = {
  serialNumber: "Serial Number",
  currentName: "Current Name",
  renamedFrom: "Renamed From",
  renamedTo: "Renamed To",
  manufacturer: "Manufacturer",
  model: "Model",
  status: "Status",
  date: "Date",
  type: "Type (Description)",
};

function formatPreviewCell(v) {
  if (v == null) return "";
  if (typeof v === "string") return v;
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  return String(v);
}

export default function Import() {
  const fileInputRef = useRef(null);
  const [step, setStep] = useState(1);
  const [fileReady, setFileReady] = useState(false);
  const [mapping, setMapping] = useState(defaultMapping);
  const [preview, setPreview] = useState(null);
  const [conflictChoice, setConflictChoice] = useState({});
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [done, setDone] = useState(false);
  const [resultMsg, setResultMsg] = useState("");
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!preview?.conflicts?.length) return;
    const init = {};
    preview.conflicts.forEach((c) => {
      init[c.serialNumber] = "keep";
    });
    setConflictChoice(init);
  }, [preview]);

  const onMappingChange = (key, value) => {
    setMapping((m) => ({ ...m, [key]: value }));
  };

  const uploadFile = async (file) => {
    if (!file) return;
    setError(null);
    setLoadingPreview(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await importPreview(fd);
      setPreview(res.data);
      setFileReady(true);
    } catch (e) {
      setError(apiErrorMessage(e));
      setFileReady(false);
      setPreview(null);
    } finally {
      setLoadingPreview(false);
    }
  };

  const newCount = preview?.newAssets?.length ?? 0;
  const conflictCount = preview?.conflicts?.length ?? 0;
  const previewRows = preview?.previewRows || [];

  const runImport = async () => {
    if (!preview) return;
    setImporting(true);
    setProgress(0);
    setDone(false);
    setResultMsg("");
    const timer = window.setInterval(() => {
      setProgress((p) => (p >= 90 ? 90 : p + 10));
    }, 120);
    try {
      const conflicts = (preview.conflicts || []).map((c) => ({
        serialNumber: c.serialNumber,
        resolution: conflictChoice[c.serialNumber] === "overwrite" ? "overwrite" : "keep",
        newData: c.newData,
      }));
      const res = await importConfirm({
        newAssets: preview.newAssets || [],
        conflicts,
      });
      setProgress(100);
      setDone(true);
      setResultMsg(
        `Import complete: ${res.data.imported} imported, ${res.data.skipped} skipped.`
      );
    } catch (e) {
      setError(apiErrorMessage(e));
    } finally {
      window.clearInterval(timer);
      setImporting(false);
    }
  };

  return (
    <div className="container py-4">
      <h1 className="h3 mb-4">Import from Excel</h1>

      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}

      {step === 1 && (
        <div className="card asset-card">
          <div className="card-body">
            <h2 className="h5">Step 1 — Upload</h2>
            <p className="text-muted small">
              Accepted formats: <code>.xlsx</code>, <code>.xls</code>, <code>.csv</code>
            </p>

            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              className="d-none"
              onChange={(e) => uploadFile(e.target.files?.[0])}
            />

            {!fileReady ? (
              <div
                className="border border-2 border-dashed rounded-3 p-5 text-center compinfo-dropzone mb-3"
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === "Enter" && fileInputRef.current?.click()}
                onClick={() => fileInputRef.current?.click()}
              >
                {loadingPreview ? (
                  <div className="spinner-border text-compinfo-primary" role="status">
                    <span className="visually-hidden">Loading…</span>
                  </div>
                ) : (
                  <>
                    <div className="mb-2 text-muted">
                      <svg width="40" height="40" fill="currentColor" viewBox="0 0 16 16" aria-hidden>
                        <path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5z" />
                        <path d="M7.646 1.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1-.708.708L8.5 2.707V11.5a.5.5 0 0 1-1 0V2.707L5.354 4.854a.5.5 0 1 1-.708-.708l3-3z" />
                      </svg>
                    </div>
                    <p className="mb-1">Drag and drop a file here</p>
                    <button
                      type="button"
                      className="btn btn-link p-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        fileInputRef.current?.click();
                      }}
                    >
                      or click to browse
                    </button>
                  </>
                )}
              </div>
            ) : (
              <>
                <div className="alert alert-success small">
                  File parsed. {preview?.totalRows ?? 0} row(s) read. New assets: {newCount},
                  conflicts: {conflictCount}.
                </div>
                <div className="table-responsive mb-3">
                  <table className="table table-sm table-bordered">
                    <thead>
                      <tr>
                        <th>S/N</th>
                        <th>Current Name</th>
                        <th>Renamed From</th>
                        <th>Renamed To</th>
                        <th>Mfg</th>
                        <th>Model</th>
                        <th>Status</th>
                        <th>Date</th>
                        <th>Type</th>
                      </tr>
                    </thead>
                    <tbody>
                      {previewRows.map((row) => (
                        <tr key={`${row.serialNumber}-${row.currentName}-${row.renamedTo}`}>
                          <td>{formatPreviewCell(row.serialNumber)}</td>
                          <td>{formatPreviewCell(row.currentName)}</td>
                          <td>{formatPreviewCell(row.renamedFrom)}</td>
                          <td>{formatPreviewCell(row.renamedTo)}</td>
                          <td>{formatPreviewCell(row.manufacturer)}</td>
                          <td>{formatPreviewCell(row.model)}</td>
                          <td>{formatPreviewCell(row.status)}</td>
                          <td>{formatPreviewCell(row.date)}</td>
                          <td>{formatPreviewCell(row.type)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <p className="small text-muted mb-0">Showing first 5 grouped assets.</p>
                </div>

                <h3 className="h6">Column mapping (reference)</h3>
                <p className="small text-muted">
                  The server detects columns automatically. Use this as a guide for your spreadsheet
                  headers.
                </p>
                <div className="row g-2 mb-4">
                  {Object.entries({
                    serialNumber: "S/N",
                    currentName: "Current Name",
                    renamedFrom: "Renamed From",
                    renamedTo: "Renamed To",
                    manufacturer: "Mfg",
                    model: "Model",
                    status: "Status",
                    date: "Date",
                    type: "Type",
                  }).map(([key, label]) => (
                    <div key={key} className="col-12 col-md-6">
                      <div className="d-flex align-items-center gap-2 flex-wrap">
                        <span className="small text-muted" style={{ minWidth: 72 }}>
                          {label}
                        </span>
                        <span aria-hidden>→</span>
                        <select
                          className="form-select form-select-sm flex-grow-1"
                          value={mapping[key]}
                          onChange={(e) => onMappingChange(key, e.target.value)}
                        >
                          {FIELD_OPTIONS.map((o) => (
                            <option key={o} value={o}>
                              {o}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  ))}
                </div>

                <button type="button" className="btn btn-primary" onClick={() => setStep(2)}>
                  Next: Review →
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {step === 2 && preview && (
        <div className="card asset-card">
          <div className="card-body">
            <h2 className="h5">Step 2 — Review &amp; Import</h2>
            <ul className="mb-3">
              <li>
                <span className="text-success fw-medium">✅ {newCount} new assets</span> will be
                added
              </li>
              <li>
                <span className="text-warning fw-medium">⚠️ {conflictCount} conflicts</span>{" "}
                found (serial already exists):
              </li>
            </ul>

            {conflictCount > 0 && (
              <div className="table-responsive mb-4">
                <table className="table table-sm align-middle">
                  <thead>
                    <tr>
                      <th>Serial</th>
                      <th>Resolution</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(preview.conflicts || []).map((c) => (
                      <tr key={c.serialNumber}>
                        <td className="font-monospace">{c.serialNumber}</td>
                        <td>
                          <div className="btn-group btn-group-sm" role="group">
                            <input
                              type="radio"
                              className="btn-check"
                              name={`res-${c.serialNumber}`}
                              id={`keep-${c.serialNumber}`}
                              checked={conflictChoice[c.serialNumber] === "keep"}
                              onChange={() =>
                                setConflictChoice((ch) => ({
                                  ...ch,
                                  [c.serialNumber]: "keep",
                                }))
                              }
                            />
                            <label
                              className="btn btn-outline-secondary"
                              htmlFor={`keep-${c.serialNumber}`}
                            >
                              Keep Existing
                            </label>
                            <input
                              type="radio"
                              className="btn-check"
                              name={`res-${c.serialNumber}`}
                              id={`ow-${c.serialNumber}`}
                              checked={conflictChoice[c.serialNumber] === "overwrite"}
                              onChange={() =>
                                setConflictChoice((ch) => ({
                                  ...ch,
                                  [c.serialNumber]: "overwrite",
                                }))
                              }
                            />
                            <label
                              className="btn btn-outline-primary"
                              htmlFor={`ow-${c.serialNumber}`}
                            >
                              Use New
                            </label>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {importing && (
              <div className="mb-3">
                <div className="progress" style={{ height: 8 }}>
                  <div
                    className="progress-bar bg-primary"
                    role="progressbar"
                    style={{ width: `${progress}%` }}
                  >
                    {progress}%
                  </div>
                </div>
              </div>
            )}

            {done && resultMsg && <div className="alert alert-success">{resultMsg}</div>}

            <div className="d-flex gap-2 flex-wrap">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  setStep(1);
                  setDone(false);
                }}
                disabled={importing}
              >
                ← Back
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={runImport}
                disabled={importing || done}
              >
                Import {newCount + conflictCount} Assets
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
