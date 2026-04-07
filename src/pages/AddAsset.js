import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { createAsset } from "../api";
import { useToast } from "../components/Toast";
import { apiErrorMessage } from "../utils/helpers";

export default function AddAsset() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    serialNumber: "",
    currentName: "",
    manufacturer: "Dell",
    model: "",
    type: "Computer",
    status: "Active",
    purchaseDate: "",
    notes: "",
  });

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!form.serialNumber.trim()) {
      showToast("Serial number is required.", "error");
      return;
    }
    setSubmitting(true);
    try {
      await createAsset({
        serialNumber: form.serialNumber.trim(),
        currentName: form.currentName || "N/A",
        manufacturer: form.manufacturer,
        model: form.model,
        description: form.type,
        status: form.status,
        purchaseDate: form.purchaseDate || undefined,
        notes: form.notes || "",
      });
      showToast("Asset added successfully.", "success");
      navigate("/assets");
    } catch (err) {
      showToast(apiErrorMessage(err), "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container py-4" style={{ maxWidth: 640 }}>
      <nav aria-label="breadcrumb">
        <ol className="breadcrumb">
          <li className="breadcrumb-item">
            <Link to="/assets">Assets</Link>
          </li>
          <li className="breadcrumb-item active" aria-current="page">
            New
          </li>
        </ol>
      </nav>

      <h1 className="h3 mb-4">Add New Asset</h1>

      <div className="card asset-card">
        <div className="card-body">
          <form onSubmit={onSubmit}>
            <div className="mb-3">
              <label className="form-label">
                Serial Number <span className="text-danger">*</span>
              </label>
              <input
                name="serialNumber"
                className="form-control"
                value={form.serialNumber}
                onChange={onChange}
                required
              />
            </div>
            <div className="mb-3">
              <label className="form-label">Current Name</label>
              <input
                name="currentName"
                className="form-control"
                value={form.currentName}
                onChange={onChange}
              />
            </div>
            <div className="mb-3">
              <label className="form-label">Manufacturer</label>
              <select
                name="manufacturer"
                className="form-select"
                value={form.manufacturer}
                onChange={onChange}
              >
                <option>Dell</option>
                <option>HP</option>
                <option>Lenovo</option>
                <option>Other</option>
              </select>
            </div>
            <div className="mb-3">
              <label className="form-label">Model</label>
              <input
                name="model"
                className="form-control"
                value={form.model}
                onChange={onChange}
              />
            </div>
            <div className="mb-3">
              <label className="form-label">Type</label>
              <select name="type" className="form-select" value={form.type} onChange={onChange}>
                <option>Computer</option>
                <option>Laptop</option>
                <option>Monitor</option>
                <option>Other</option>
              </select>
            </div>
            <div className="mb-3">
              <label className="form-label">Status</label>
              <select
                name="status"
                className="form-select"
                value={form.status}
                onChange={onChange}
              >
                <option>Active</option>
                <option>Ready to Deploy</option>
                <option>Disposed</option>
              </select>
            </div>
            <div className="mb-3">
              <label className="form-label">Purchase Date</label>
              <input
                name="purchaseDate"
                type="date"
                className="form-control"
                value={form.purchaseDate}
                onChange={onChange}
              />
            </div>
            <div className="mb-4">
              <label className="form-label">Notes</label>
              <textarea
                name="notes"
                className="form-control"
                rows={4}
                value={form.notes}
                onChange={onChange}
              />
            </div>
            <div className="d-flex gap-2">
              <Link to="/assets" className="btn btn-secondary">
                Cancel
              </Link>
              <button type="submit" className="btn btn-primary" disabled={submitting}>
                {submitting ? "Saving…" : "Add Asset"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
