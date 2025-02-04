import React from "react";

export default function Sidebar({ currentTab, onChangeTab }) {
  return (
    <nav className="col-md-2 d-none d-md-block sidebar bg-dark">
      <div className="position-sticky pt-3">
        <ul className="nav flex-column">
          <li className="nav-item">
            <button
              className={`nav-link w-100 text-start ${
                currentTab === "characters" ? "active" : ""
              }`}
              onClick={() => onChangeTab("characters")}
            >
              <i className="fas fa-users me-2"></i> Characters
            </button>
          </li>
          <li className="nav-item">
            <button
              className={`nav-link w-100 text-start ${
                currentTab === "skills" ? "active" : ""
              }`}
              onClick={() => onChangeTab("skills")}
            >
              <i className="fas fa-magic me-2"></i> Skills
            </button>
          </li>
          <li className="nav-item">
            <button
              className={`nav-link w-100 text-start ${
                currentTab === "spriteAnimations" ? "active" : ""
              }`}
              onClick={() => onChangeTab("spriteAnimations")}
            >
              <i className="fas fa-image me-2"></i> Sprite Animations
            </button>
          </li>
          <li className="nav-item">
            <button
              className={`nav-link w-100 text-start ${
                currentTab === "config" ? "active" : ""
              }`}
              onClick={() => onChangeTab("config")}
            >
              <i className="fas fa-cog me-2"></i> Settings
            </button>
          </li>
        </ul>
      </div>
    </nav>
  );
}
