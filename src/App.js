import "./App.css";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import Navbar from "./components/Navbar";
import { ToastProvider } from "./components/Toast";
import Dashboard from "./pages/Dashboard";
import AllAssets from "./pages/AllAssets";
import AssetDetail from "./pages/AssetDetail";
import AddAsset from "./pages/AddAsset";
import Import from "./pages/Import";
import Generator from "./pages/Generator";
import FilterExport from "./pages/FilterExport";
import ActivityLog from "./pages/ActivityLog";

function App() {
  return (
    <ToastProvider>
      <BrowserRouter>
        <Navbar />
        <main className="compinfo-main">
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/assets" element={<AllAssets />} />
            <Route path="/assets/new" element={<AddAsset />} />
            <Route path="/assets/:serialNumber" element={<AssetDetail />} />
            <Route path="/import" element={<Import />} />
            <Route path="/generate" element={<Generator />} />
            <Route path="/filter" element={<FilterExport />} />
            <Route path="/activity" element={<ActivityLog />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </main>
      </BrowserRouter>
    </ToastProvider>
  );
}

export default App;
