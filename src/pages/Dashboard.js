import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { getStats } from "../api";
import StatusBadge from "../components/StatusBadge";
import {
  calculateAgeYears,
  displayName,
  formatDate,
  formatPurchaseDate,
  apiErrorMessage,
} from "../utils/helpers";

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await getStats();
        if (!cancelled) setData(res.data);
      } catch (e) {
        if (!cancelled) setError(apiErrorMessage(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const statusChartData = useMemo(() => {
    if (!data) return [];
    return [
      { name: "Active", count: data.active },
      { name: "Ready to Deploy", count: data.readyToDeploy },
      { name: "Disposed", count: data.disposed },
    ];
  }, [data]);

  const typeCounts = useMemo(() => {
    const bd = data?.byDescription || {};
    return {
      computer: bd.Computer || 0,
      laptop: bd.Laptop || 0,
      monitor: bd.Monitor || 0,
    };
  }, [data]);

  if (loading) {
    return (
      <div className="container-fluid py-5 text-center">
        <div className="spinner-border text-compinfo-primary" role="status">
          <span className="visually-hidden">Loading…</span>
        </div>
        <p className="text-muted mt-2 mb-0">Loading dashboard…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container-fluid py-4">
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      </div>
    );
  }

  const recentlyUpdated = data.recentlyUpdated || [];
  const ageAlerts = data.ageAlerts || [];
  const changedThisMonth = data.changedThisMonth || [];

  return (
    <div className="container-fluid py-4">
      <h1 className="h3 mb-4">Dashboard</h1>

      <div className="row g-3 mb-4">
        <div className="col-12 col-sm-6 col-xl">
          <div className="card asset-card h-100">
            <div className="card-body">
              <div className="text-muted small">Total Assets</div>
              <div className="display-6 fw-semibold text-compinfo-primary">
                {data.total}
              </div>
            </div>
          </div>
        </div>
        <div className="col-12 col-sm-6 col-xl">
          <div className="card asset-card h-100">
            <div className="card-body">
              <div className="text-muted small">Active</div>
              <div className="display-6 fw-semibold text-success">
                {data.active}
              </div>
            </div>
          </div>
        </div>
        <div className="col-12 col-sm-6 col-xl">
          <div className="card asset-card h-100">
            <div className="card-body">
              <div className="text-muted small">Ready to Deploy</div>
              <div className="display-6 fw-semibold text-primary">
                {data.readyToDeploy}
              </div>
            </div>
          </div>
        </div>
        <div className="col-12 col-sm-6 col-xl">
          <div className="card asset-card h-100">
            <div className="card-body">
              <div className="text-muted small">Disposed</div>
              <div className="display-6 fw-semibold text-secondary">
                {data.disposed}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="row g-4">
        <div className="col-12 col-lg-7">
          <div className="card asset-card">
            <div className="card-header bg-transparent border-0 pt-3 pb-0">
              <h2 className="h5 mb-0">Recently Updated</h2>
            </div>
            <div className="card-body">
              <div className="table-responsive">
                <table className="table table-sm align-middle mb-0">
                  <thead>
                    <tr>
                      <th>Serial</th>
                      <th>Current Name</th>
                      <th>Status</th>
                      <th>Model</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentlyUpdated.map((a) => (
                      <tr key={a.serialNumber}>
                        <td>
                          <Link
                            to={`/assets/${encodeURIComponent(a.serialNumber)}`}
                            className="compinfo-link"
                          >
                            {a.serialNumber}
                          </Link>
                        </td>
                        <td>{displayName(a.currentName)}</td>
                        <td>
                          <StatusBadge status={a.status} />
                        </td>
                        <td>{a.model}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        <div className="col-12 col-lg-5">
          <div className="card asset-card mb-4">
            <div className="card-header bg-transparent border-0 pt-3 pb-0">
              <h2 className="h5 mb-0">Device types</h2>
            </div>
            <div className="card-body">
              <div className="d-flex flex-wrap gap-2 mb-3">
                <span className="badge rounded-pill compinfo-pill">
                  {typeCounts.computer} Computers
                </span>
                <span className="badge rounded-pill compinfo-pill">
                  {typeCounts.laptop} Laptops
                </span>
                <span className="badge rounded-pill compinfo-pill">
                  {typeCounts.monitor} Monitors
                </span>
              </div>
              <div style={{ width: "100%", height: 220 }}>
                <ResponsiveContainer>
                  <BarChart
                    data={statusChartData}
                    margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
                  >
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 11 }}
                      interval={0}
                      angle={-15}
                      textAnchor="end"
                      height={60}
                    />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#C45C10" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <p className="small text-muted mb-0">
                Assets by status (snapshot)
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="row g-4 mt-1">
        <div className="col-12 col-lg-6">
          <div className="card asset-card border-warning-subtle">
            <div className="card-header bg-transparent border-0 pt-3 pb-0 d-flex align-items-center gap-2">
              <span className="age-alert-icon" aria-hidden>
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M12 2L1 21h22L12 2z"
                    fill="#F5A623"
                    stroke="#C45C10"
                    strokeWidth="1.2"
                  />
                  <path
                    d="M12 8v5"
                    stroke="#1A1A1A"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                  <circle cx="12" cy="16.5" r="1" fill="#1A1A1A" />
                </svg>
              </span>
              <h2 className="h5 mb-0">Age Alerts</h2>
            </div>
            <div className="card-body">
              <p className="small text-muted">
                Machines older than four years (by purchase date).
              </p>
              {ageAlerts.length === 0 ? (
                <p className="text-muted mb-0">No age alerts right now.</p>
              ) : (
                <div className="row g-2">
                  {ageAlerts.map((a) => (
                    <div key={a.serialNumber} className="col-12">
                      <div className="border rounded-3 p-3 bg-warning bg-opacity-10">
                        <div className="d-flex justify-content-between flex-wrap gap-2">
                          <div>
                            <Link
                              to={`/assets/${encodeURIComponent(a.serialNumber)}`}
                              className="fw-semibold compinfo-link"
                            >
                              {a.serialNumber}
                            </Link>
                            <div className="small text-muted">
                              {displayName(a.currentName)} · {a.manufacturer}{" "}
                              {a.model}
                            </div>
                          </div>
                          <div className="text-end small">
                            <div>
                              Age: {calculateAgeYears(a.purchaseDate)} yrs ·
                              Purchased {formatPurchaseDate(a.purchaseDate)}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="col-12 col-lg-6">
          <div className="card asset-card">
            <div className="card-header bg-transparent border-0 pt-3 pb-0">
              <h2 className="h5 mb-0">What changed this month</h2>
            </div>
            <div className="card-body">
              {changedThisMonth.length === 0 ? (
                <p className="text-muted mb-0">
                  No updates recorded this month.
                </p>
              ) : (
                <ul className="list-group list-group-flush">
                  {changedThisMonth.map((a) => (
                    <li
                      key={a.serialNumber}
                      className="list-group-item px-0 bg-transparent border-light"
                    >
                      <Link
                        to={`/assets/${encodeURIComponent(a.serialNumber)}`}
                        className="compinfo-link fw-medium"
                      >
                        {a.serialNumber}
                      </Link>
                      <span className="text-muted"> — </span>
                      {displayName(a.currentName)}
                      <span className="text-muted small ms-2">
                        (updated{" "}
                        {formatDate(
                          a.updatedAt
                            ? new Date(a.updatedAt).toISOString().slice(0, 10)
                            : "",
                        )}
                        )
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
