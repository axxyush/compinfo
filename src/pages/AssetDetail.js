import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getAsset, updateAsset, renameAsset } from "../api";
import StatusBadge from "../components/StatusBadge";
import Timeline from "../components/Timeline";
import { useToast } from "../components/Toast";
import {
  buildTimelineEvents,
  calculateAgeYears,
  daysSinceLastActivity,
  displayName,
  formatPurchaseDate,
  formatAgeFromPurchaseDate,
  apiErrorMessage,
} from "../utils/helpers";

function hideBsModal(id) {
  const el = document.getElementById(id);
  if (el && window.bootstrap?.Modal) {
    const inst = window.bootstrap.Modal.getInstance(el);
    inst?.hide();
  }
}

export default function AssetDetail() {
  const { serialNumber: rawSerial } = useParams();
  const serialNumber = rawSerial ? decodeURIComponent(rawSerial) : "";
  const { showToast } = useToast();

  const [asset, setAsset] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notFound, setNotFound] = useState(false);

  const [editForm, setEditForm] = useState({
    currentName: "",
    manufacturer: "",
    model: "",
    description: "Computer",
    status: "Active",
    purchaseDate: "",
    notes: "",
  });
  const [renameTo, setRenameTo] = useState("");
  const [renameDate, setRenameDate] = useState(() =>
    new Date().toISOString().slice(0, 10)
  );

  const loadAsset = useCallback(async () => {
    if (!serialNumber) return;
    setLoading(true);
    setError(null);
    setNotFound(false);
    try {
      const res = await getAsset(serialNumber);
      setAsset(res.data);
    } catch (e) {
      if (e.response?.status === 404) {
        setNotFound(true);
        setAsset(null);
      } else {
        setError(apiErrorMessage(e));
      }
    } finally {
      setLoading(false);
    }
  }, [serialNumber]);

  useEffect(() => {
    loadAsset();
  }, [loadAsset]);

  const timelineEvents = useMemo(() => {
    if (!asset) return [];
    return buildTimelineEvents(asset);
  }, [asset]);

  const openEditModal = () => {
    if (!asset) return;
    setEditForm({
      currentName: asset.currentName || "",
      manufacturer: asset.manufacturer || "",
      model: asset.model || "",
      description: asset.description ?? "Computer",
      status: asset.status || "Active",
      purchaseDate: asset.purchaseDate
        ? new Date(asset.purchaseDate).toISOString().slice(0, 10)
        : "",
      notes: asset.notes || "",
    });
  };

  const openRenameModal = () => {
    setRenameTo("");
    setRenameDate(new Date().toISOString().slice(0, 10));
  };

  const onSaveEdit = async () => {
    if (!asset) return;
    try {
      await updateAsset(serialNumber, {
        currentName: editForm.currentName || "N/A",
        manufacturer: editForm.manufacturer || "",
        model: editForm.model || "",
        description: editForm.description || "Other",
        status: editForm.status,
        purchaseDate: editForm.purchaseDate || null,
        notes: editForm.notes || "",
      });
      hideBsModal("editAssetModal");
      showToast("Changes saved.", "success");
      await loadAsset();
    } catch (e) {
      showToast(apiErrorMessage(e), "error");
    }
  };

  const onSaveRename = async () => {
    if (!asset || !renameTo.trim()) {
      showToast("Enter a new name.", "error");
      return;
    }
    try {
      await renameAsset(serialNumber, {
        renamedFrom: asset.currentName || "N/A",
        renamedTo: renameTo.trim(),
        date: renameDate,
      });
      hideBsModal("renameModal");
      showToast("Rename logged.", "success");
      await loadAsset();
    } catch (e) {
      showToast(apiErrorMessage(e), "error");
    }
  };

  if (loading) {
    return (
      <div className="container py-5 text-center">
        <div className="spinner-border text-compinfo-primary" role="status">
          <span className="visually-hidden">Loading…</span>
        </div>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="container py-5">
        <p className="text-muted">Asset not found.</p>
        <Link to="/assets">Back to assets</Link>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container py-4">
        <div className="alert alert-danger">{error}</div>
        <Link to="/assets">Back to assets</Link>
      </div>
    );
  }

  if (!asset) {
    return null;
  }

  const ageYears = asset.purchaseDate ? calculateAgeYears(asset.purchaseDate) : null;
  const daysSince = daysSinceLastActivity(asset.updatedAt);
  const totalRenames = asset.renameHistory?.length || 0;
  const lastActivityLabel =
    daysSince == null ? "—" : `${daysSince} day${daysSince === 1 ? "" : "s"}`;
  const typeLabel = asset.description ?? asset.type ?? "—";

  return (
    <div className="container-fluid py-4">
      <nav aria-label="breadcrumb">
        <ol className="breadcrumb">
          <li className="breadcrumb-item">
            <Link to="/assets">Assets</Link>
          </li>
          <li className="breadcrumb-item active" aria-current="page">
            {asset.serialNumber}
          </li>
        </ol>
      </nav>

      <div className="card asset-card mb-4">
        <div className="card-body">
          <div className="d-flex flex-wrap justify-content-between align-items-start gap-3">
            <div>
              <div className="text-muted small">Serial Number</div>
              <h1 className="h2 mb-2 font-monospace">{asset.serialNumber}</h1>
              <div className="d-flex flex-wrap align-items-center gap-2 mb-2">
                <span className="text-muted small">Current name:</span>
                <span className="fw-medium">{displayName(asset.currentName)}</span>
                <StatusBadge status={asset.status} />
              </div>
              <p className="mb-1">
                <strong>{asset.manufacturer}</strong> {asset.model}
              </p>
              <p className="mb-1 small text-muted">Type: {typeLabel}</p>
              <p className="mb-1">
                Purchase date: {formatPurchaseDate(asset.purchaseDate)} · Age:{" "}
                {formatAgeFromPurchaseDate(asset.purchaseDate)}
              </p>
              <div className="mt-3">
                <div className="small text-muted mb-1">Notes</div>
                <p className="mb-0">{asset.notes || "—"}</p>
              </div>
            </div>
            <div className="d-flex flex-wrap gap-2">
              <button
                type="button"
                className="btn btn-primary btn-sm"
                data-bs-toggle="modal"
                data-bs-target="#editAssetModal"
                onClick={openEditModal}
              >
                Edit
              </button>
              <button
                type="button"
                className="btn btn-outline-primary btn-sm"
                data-bs-toggle="modal"
                data-bs-target="#renameModal"
                onClick={openRenameModal}
              >
                Log Rename
              </button>
              <a
                href={`https://lanswp-cast.acsu.buffalo.edu/quicksearch.aspx?q=${encodeURIComponent(asset.serialNumber)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-outline-secondary btn-sm"
              >
                View in Lansweeper ↗
              </a>
            </div>
          </div>
        </div>
      </div>

      <div className="row g-4 mb-4">
        <div className="col-12 col-lg-7">
          <div className="card asset-card">
            <div className="card-header bg-transparent border-0 pt-3 pb-0">
              <h2 className="h5 mb-0">Rename / status history</h2>
            </div>
            <div className="card-body">
              <Timeline events={timelineEvents} />
            </div>
          </div>
        </div>
        <div className="col-12 col-lg-5">
          <div className="row g-3">
            <div className="col-12 col-sm-6">
              <div className="card asset-card h-100">
                <div className="card-body">
                  <div className="small text-muted">Days since last activity</div>
                  <div className="fs-4 fw-semibold">{lastActivityLabel}</div>
                </div>
              </div>
            </div>
            <div className="col-12 col-sm-6">
              <div className="card asset-card h-100">
                <div className="card-body">
                  <div className="small text-muted">Total renames</div>
                  <div className="fs-4 fw-semibold">{totalRenames}</div>
                </div>
              </div>
            </div>
            <div className="col-12 col-sm-6">
              <div className="card asset-card h-100">
                <div className="card-body">
                  <div className="small text-muted">Current status</div>
                  <div className="mt-1">
                    <StatusBadge status={asset.status} />
                  </div>
                </div>
              </div>
            </div>
            <div className="col-12 col-sm-6">
              <div className="card asset-card h-100">
                <div className="card-body">
                  <div className="small text-muted">Age (years)</div>
                  <div className="fs-4 fw-semibold">
                    {ageYears == null ? "Unknown" : ageYears}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div
        className="modal fade"
        id="editAssetModal"
        tabIndex="-1"
        aria-labelledby="editAssetModalLabel"
        aria-hidden="true"
      >
        <div className="modal-dialog">
          <div className="modal-content">
            <div className="modal-header">
              <h2 className="modal-title h5" id="editAssetModalLabel">
                Edit asset
              </h2>
              <button
                type="button"
                className="btn-close"
                data-bs-dismiss="modal"
                aria-label="Close"
              />
            </div>
            <div className="modal-body">
              <div className="mb-3">
                <label className="form-label">Current Name</label>
                <input
                  className="form-control"
                  value={editForm.currentName}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, currentName: e.target.value }))
                  }
                />
              </div>
              <div className="mb-3">
                <label className="form-label">Manufacturer</label>
                <input
                  className="form-control"
                  value={editForm.manufacturer}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, manufacturer: e.target.value }))
                  }
                />
              </div>
              <div className="mb-3">
                <label className="form-label">Model</label>
                <input
                  className="form-control"
                  value={editForm.model}
                  onChange={(e) => setEditForm((f) => ({ ...f, model: e.target.value }))}
                />
              </div>
              <div className="mb-3">
                <label className="form-label">Type</label>
                <select
                  className="form-select"
                  value={editForm.description}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, description: e.target.value }))
                  }
                >
                  <option>Computer</option>
                  <option>Laptop</option>
                  <option>Other</option>
                </select>
              </div>
              <div className="mb-3">
                <label className="form-label">Status</label>
                <select
                  className="form-select"
                  value={editForm.status}
                  onChange={(e) => setEditForm((f) => ({ ...f, status: e.target.value }))}
                >
                  <option>Active</option>
                  <option>Ready to Deploy</option>
                  <option>Disposed</option>
                </select>
              </div>
              <div className="mb-3">
                <label className="form-label">Purchase Date</label>
                <input
                  type="date"
                  className="form-control"
                  value={editForm.purchaseDate}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, purchaseDate: e.target.value }))
                  }
                />
              </div>
              <div className="mb-0">
                <label className="form-label">Notes</label>
                <textarea
                  className="form-control"
                  rows={4}
                  value={editForm.notes}
                  onChange={(e) => setEditForm((f) => ({ ...f, notes: e.target.value }))}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">
                Cancel
              </button>
              <button type="button" className="btn btn-primary" onClick={onSaveEdit}>
                Save
              </button>
            </div>
          </div>
        </div>
      </div>

      <div
        className="modal fade"
        id="renameModal"
        tabIndex="-1"
        aria-labelledby="renameModalLabel"
        aria-hidden="true"
      >
        <div className="modal-dialog">
          <div className="modal-content">
            <div className="modal-header">
              <h2 className="modal-title h5" id="renameModalLabel">
                Log rename
              </h2>
              <button
                type="button"
                className="btn-close"
                data-bs-dismiss="modal"
                aria-label="Close"
              />
            </div>
            <div className="modal-body">
              <div className="mb-3">
                <label className="form-label">Renamed from</label>
                <input
                  className="form-control"
                  value={displayName(asset.currentName)}
                  disabled
                  readOnly
                />
              </div>
              <div className="mb-3">
                <label className="form-label">Renamed to</label>
                <input
                  className="form-control"
                  value={renameTo}
                  onChange={(e) => setRenameTo(e.target.value)}
                  placeholder="New computer name"
                />
              </div>
              <div className="mb-0">
                <label className="form-label">Date</label>
                <input
                  type="date"
                  className="form-control"
                  value={renameDate}
                  onChange={(e) => setRenameDate(e.target.value)}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">
                Cancel
              </button>
              <button type="button" className="btn btn-primary" onClick={onSaveRename}>
                Log Rename
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
