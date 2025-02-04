import React from "react";

export default function Navbar({ onImport, onExport }) {
  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-dark">
      <div className="container-fluid">
        <a className="navbar-brand" href="#">
          Advanced Game Administration
        </a>
        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarButtons"
          aria-controls="navbarButtons"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon" />
        </button>
        <div className="collapse navbar-collapse" id="navbarButtons">
          <div className="ms-auto">
            <button className="btn btn-primary me-2" onClick={onImport}>
              <i className="fas fa-upload"></i> Import
            </button>
            <button className="btn btn-primary" onClick={onExport}>
              <i className="fas fa-download"></i> Export
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
