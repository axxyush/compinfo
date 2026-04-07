import axios from "axios";

const api = axios.create({ baseURL: "/api" });

export const getStats = () => api.get("/stats");
export const getAssets = (params) => api.get("/assets", { params });
export const getAsset = (serial) => api.get(`/assets/${encodeURIComponent(serial)}`);
export const createAsset = (data) => api.post("/assets", data);
export const updateAsset = (serial, data) =>
  api.put(`/assets/${encodeURIComponent(serial)}`, data);
export const deleteAsset = (serial) =>
  api.delete(`/assets/${encodeURIComponent(serial)}`);
export const renameAsset = (serial, data) =>
  api.post(`/assets/${encodeURIComponent(serial)}/rename`, data);
export const updateStatus = (serial, status) =>
  api.patch(`/assets/${encodeURIComponent(serial)}/status`, { status });
export const bulkStatus = (data) => api.post("/assets/bulk-status", data);
export const importPreview = (formData) =>
  api.post("/import/preview", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
export const importConfirm = (data) => api.post("/import/confirm", data);
export const exportBySerials = (data) => api.post("/export/by-serials", data);
export const exportFilter = (data) => api.post("/export/filter", data);
export const getActivity = (params) => api.get("/activity", { params });
