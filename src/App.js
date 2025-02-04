import React, { useState, useEffect } from "react";
import Navbar from "./components/Navbar";
import Sidebar from "./components/Sidebar";

// Tab components
import CharactersTab from "./components/Tabs/CharactersTab";
import SkillsTab from "./components/Tabs/SkillsTab";
import ConfigTab from "./components/Tabs/ConfigTab";
import SpriteAnimationsTab from "./components/Tabs/SpriteAnimationsTab";

import { GameConfigExtended } from "./models/gameModels";

function App() {
  const [gameConfig, setGameConfig] = useState(new GameConfigExtended());
  const [currentTab, setCurrentTab] = useState("characters");

  // On mount, load from localStorage
  useEffect(() => {
    const data = localStorage.getItem("advancedGameConfig");
    if (data) {
      try {
        const parsed = JSON.parse(data);
        const cfg = new GameConfigExtended();
        cfg.import(parsed);
        setGameConfig(cfg);
      } catch (error) {
        console.error("Error loading from localStorage", error);
      }
    }
  }, []);

  // Whenever gameConfig changes, save to localStorage
  useEffect(() => {
    // Because gameConfig is a real instance of GameConfigExtended,
    // it still has the .export() method:
    const data = gameConfig.export();
    localStorage.setItem("advancedGameConfig", JSON.stringify(data));
  }, [gameConfig]);

  // Handlers for Import/Export
  function handleImportConfig() {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (ev) => {
          try {
            const data = JSON.parse(ev.target.result);
            const newConfig = new GameConfigExtended();
            newConfig.import(data);
            setGameConfig(newConfig);
            alert("Imported successfully!");
          } catch (err) {
            console.error(err);
            alert("Error importing config");
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  }

  function handleExportConfig() {
    const data = gameConfig.export();
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json"
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "advanced-game-config.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    alert("Exported successfully!");
  }

  // Called by tabs when they create/delete objects, etc.
  function handleCollectionUpdate() {
    // Instead of { ...gameConfig }, which destroys the prototype,
    // we re-instantiate a new GameConfigExtended to preserve methods:
    const newConfig = new GameConfigExtended();
    newConfig.import(gameConfig.export());  // copy data from current to new
    setGameConfig(newConfig);
    // This ensures 'newConfig' is still a real instance with .export() & .import()
  }

  // Switch tab content
  function renderTab() {
    switch (currentTab) {
      case "characters":
        return (
          <CharactersTab
            charactersCollection={gameConfig.charactersCollection}
            activityLog={gameConfig.activityLog}
            onUpdate={handleCollectionUpdate}
          />
        );
      case "skills":
        return (
          <SkillsTab
            skillsCollection={gameConfig.skillsCollection}
            charactersCollection={gameConfig.charactersCollection}
            activityLog={gameConfig.activityLog}
            onUpdate={handleCollectionUpdate}
          />
        );
      case "spriteAnimations":
        return (
          <SpriteAnimationsTab
            spriteAnimationsCollection={gameConfig.spriteAnimationsCollection}
            activityLog={gameConfig.activityLog}
            onCollectionUpdate={handleCollectionUpdate}
          />
        );
      case "config":
        return (
          <ConfigTab
            settings={gameConfig.settings}
            activityLog={gameConfig.activityLog}
            onUpdate={handleCollectionUpdate}
          />
        );
      default:
        return <div>Unknown tab: {currentTab}</div>;
    }
  }

  return (
    <div>
      <Navbar onImport={handleImportConfig} onExport={handleExportConfig} />
      <div className="container-fluid">
        <div className="row">
          <Sidebar currentTab={currentTab} onChangeTab={setCurrentTab} />
          <main className="col-md-10 ms-sm-auto col-lg-10 px-md-4 content-area">
            {renderTab()}
          </main>
        </div>
      </div>
    </div>
  );
}

export default App;
