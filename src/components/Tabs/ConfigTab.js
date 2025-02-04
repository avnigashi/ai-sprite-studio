import React, { useState } from "react";

export default function ConfigTab({ settings, activityLog, onUpdate }) {
  const [gameName, setGameName] = useState(settings.gameName);
  const [maxPlayers, setMaxPlayers] = useState(settings.maxPlayers);
  const [maintenanceMode, setMaintenanceMode] = useState(settings.maintenanceMode);

  function handleSave() {
    if (!gameName.trim()) {
      alert("Game name required!");
      return;
    }
    settings.gameName = gameName;
    settings.maxPlayers = parseInt(maxPlayers) || 0;
    settings.maintenanceMode = maintenanceMode;
    activityLog.log("Settings updated.");
    onUpdate();
    alert("Settings saved!");
  }

  return (
    <div>
      <h2>Config / Settings</h2>
      <div className="card p-3 bg-dark">
        <div className="mb-3">
          <label className="form-label">Game Name</label>
          <input
            type="text"
            className="form-control"
            value={gameName}
            onChange={(e) => setGameName(e.target.value)}
          />
        </div>
        <div className="mb-3">
          <label className="form-label">Max Players</label>
          <input
            type="number"
            className="form-control"
            value={maxPlayers}
            onChange={(e) => setMaxPlayers(e.target.value)}
          />
        </div>
        <div className="mb-3">
          <label className="form-label">Maintenance Mode</label>
          <select
            className="form-select"
            value={maintenanceMode ? "true" : "false"}
            onChange={(e) => setMaintenanceMode(e.target.value === "true")}
          >
            <option value="false">Off</option>
            <option value="true">On</option>
          </select>
        </div>
        <button className="btn btn-primary" onClick={handleSave}>
          Save Settings
        </button>
      </div>
    </div>
  );
}
