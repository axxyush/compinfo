import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getActivity } from "../api";
import { formatDateTime, getActivityBadgeClass, apiErrorMessage } from "../utils/helpers";

const PAGE_SIZE = 20;
const ACTION_OPTIONS = ["All", "Added", "Renamed", "Status Changed", "Imported", "Edited"];

export default function ActivityLog() {
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [action, setAction] = useState("All");
  const [serialQ, setSerialQ] = useState("");
  const [page, setPage] = useState(1);

  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const params = { page, limit: PAGE_SIZE };
        if (action !== "All") params.action = action;
        if (serialQ.trim()) params.serial = serialQ.trim();
        if (dateFrom) params.from = dateFrom;
        if (dateTo) params.to = dateTo;
        const res = await getActivity(params);
        if (cancelled) return;
        setLogs(res.data.logs || []);
        setTotal(res.data.total ?? 0);
        setTotalPages(res.data.totalPages ?? 1);
      } catch (e) {
        if (!cancelled) setError(apiErrorMessage(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [dateFrom, dateTo, action, serialQ, page]);

  const currentPage = Math.min(page, totalPages);

  return (
    <div className="container-fluid py-4">
      <h1 className="h3 mb-4">Activity Log</h1>

      {error && <div className="alert alert-danger">{error}</div>}

      <div className="card asset-card mb-4">
        <div className="card-body">
          <div className="row g-3 align-items-end">
            <div className="col-12 col-md-3">
              <label className="form-label small text-muted">Date from</label>
              <input
                type="date"
                className="form-control form-control-sm"
                value={dateFrom}
                onChange={(e) => {
                  setDateFrom(e.target.value);
                  setPage(1);
                }}
              />
            </div>
            <div className="col-12 col-md-3">
              <label className="form-label small text-muted">Date to</label>
              <input
                type="date"
                className="form-control form-control-sm"
                value={dateTo}
                onChange={(e) => {
                  setDateTo(e.target.value);
                  setPage(1);
                }}
              />
            </div>
            <div className="col-12 col-md-3">
              <label className="form-label small text-muted">Action</label>
              <select
                className="form-select form-select-sm"
                value={action}
                onChange={(e) => {
                  setAction(e.target.value);
                  setPage(1);
                }}
              >
                {ACTION_OPTIONS.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-12 col-md-3">
              <label className="form-label small text-muted">Serial search</label>
              <input
                className="form-control form-control-sm font-monospace"
                value={serialQ}
                onChange={(e) => {
                  setSerialQ(e.target.value);
                  setPage(1);
                }}
                placeholder="379MTH3"
              />
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
          <div className="table-responsive card asset-card">
            <table className="table table-sm table-hover align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th>Date</th>
                  <th>Serial Number</th>
                  <th>Machine Name</th>
                  <th>Action</th>
                  <th>Details</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((row) => (
                  <tr key={row._id || `${row.serialNumber}-${row.date}`}>
                    <td className="text-nowrap">{formatDateTime(row.date)}</td>
                    <td>
                      <Link
                        className="font-monospace compinfo-link"
                        to={`/assets/${encodeURIComponent(row.serialNumber)}`}
                      >
                        {row.serialNumber}
                      </Link>
                    </td>
                    <td>{row.machineName}</td>
                    <td>
                      <span className={`badge ${getActivityBadgeClass(row.action)}`}>
                        {row.action}
                      </span>
                    </td>
                    <td className="small">{row.details}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="d-flex justify-content-between align-items-center mt-3 flex-wrap gap-2">
            <p className="small text-muted mb-0">
              Page {currentPage} of {totalPages} · {total} entries
            </p>
            <div className="btn-group">
              <button
                type="button"
                className="btn btn-outline-secondary btn-sm"
                disabled={currentPage <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </button>
              <button
                type="button"
                className="btn btn-outline-secondary btn-sm"
                disabled={currentPage >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                Next
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
