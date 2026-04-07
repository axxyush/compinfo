import React from "react";
import { getStatusBadgeClass } from "../utils/helpers";

export default function StatusBadge({ status, className = "" }) {
  return (
    <span className={`badge ${getStatusBadgeClass(status)} ${className}`.trim()}>
      {status}
    </span>
  );
}
