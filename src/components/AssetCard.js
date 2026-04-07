import React from "react";
import { Link } from "react-router-dom";
import StatusBadge from "./StatusBadge";
import {
  displayName,
  formatPurchaseDate,
  formatAgeFromPurchaseDate,
} from "../utils/helpers";

export default function AssetCard({ asset, className = "" }) {
  return (
    <div className={`card asset-card h-100 ${className}`}>
      <div className="card-body d-flex flex-column">
        <div className="d-flex justify-content-between align-items-start mb-2">
          <Link
            to={`/assets/${encodeURIComponent(asset.serialNumber)}`}
            className="fw-bold text-decoration-none compinfo-link"
          >
            {asset.serialNumber}
          </Link>
          <StatusBadge status={asset.status} />
        </div>
        <div className="small text-muted mb-1">Name</div>
        <div className="fw-medium mb-2">{displayName(asset.currentName)}</div>
        <div className="small text-muted mb-0 mt-auto">
          {asset.manufacturer} {asset.model} ·{" "}
          {formatAgeFromPurchaseDate(asset.purchaseDate)} · Purchased{" "}
          {formatPurchaseDate(asset.purchaseDate)}
        </div>
      </div>
    </div>
  );
}
