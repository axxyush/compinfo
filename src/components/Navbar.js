import React, { useRef } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";

const linkClass = ({ isActive }) =>
  `nav-link ${isActive ? "active compinfo-nav-active" : ""}`;

function Navbar() {
  const searchRef = useRef(null);
  const navigate = useNavigate();

  const onSearchSubmit = (e) => {
    e.preventDefault();
    const q = searchRef.current?.value?.trim() || "";
    navigate(q ? `/assets?search=${encodeURIComponent(q)}` : "/assets");
  };

  const focusSearch = () => {
    searchRef.current?.focus();
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-dark compinfo-navbar">
      <div className="container-fluid">
        <Link className="navbar-brand compinfo-brand fw-semibold" to="/dashboard">
          CompInfo
        </Link>
        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#compinfoNav"
          aria-controls="compinfoNav"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon" />
        </button>
        <div className="collapse navbar-collapse" id="compinfoNav">
          <ul className="navbar-nav me-auto mb-2 mb-lg-0">
            <li className="nav-item">
              <NavLink className={linkClass} to="/dashboard" end>
                Dashboard
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink className={linkClass} to="/assets">
                Assets
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink className={linkClass} to="/import">
                Import
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink className={linkClass} to="/generate">
                Generate
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink className={linkClass} to="/filter">
                Filter
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink className={linkClass} to="/activity">
                Activity Log
              </NavLink>
            </li>
          </ul>
          <form className="d-flex align-items-center gap-2" role="search" onSubmit={onSearchSubmit}>
            <button
              type="button"
              className="btn btn-link text-light p-1 border-0"
              aria-label="Focus search"
              title="Search assets"
              onClick={focusSearch}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                fill="currentColor"
                className="bi bi-search"
                viewBox="0 0 16 16"
                aria-hidden
              >
                <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0z" />
              </svg>
            </button>
            <input
              ref={searchRef}
              className="form-control form-control-sm compinfo-search"
              type="search"
              placeholder="Search assets…"
              aria-label="Search assets"
            />
          </form>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
