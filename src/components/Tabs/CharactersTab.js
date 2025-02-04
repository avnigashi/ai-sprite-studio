import React, { useState } from "react";
import { Character } from "../../models/gameModels";

export default function CharactersTab({
  charactersCollection,
  activityLog,
  onUpdate
}) {
  const [showModal, setShowModal] = useState(false);
  const [charName, setCharName] = useState("");
  const [attributes, setAttributes] = useState([]);

  const chars = charactersCollection.characters;

  function handleNewCharacter() {
    setCharName("");
    setAttributes([]);
    setShowModal(true);
  }

  function handleSaveCharacter() {
    if (!charName.trim()) {
      alert("Name required!");
      return;
    }
    const newC = new Character(charName.trim(), attributes);
    charactersCollection.addCharacter(newC);
    activityLog.log(`Created character: ${charName}`);
    setShowModal(false);
    onUpdate();
  }

  function handleDelete(id) {
    const c = charactersCollection.getCharacterById(id);
    if (!c) return;
    if (window.confirm(`Delete ${c.name}?`)) {
      charactersCollection.deleteCharacter(id);
      activityLog.log(`Deleted character: ${c.name}`);
      onUpdate();
    }
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Characters</h2>
        <button className="btn btn-primary" onClick={handleNewCharacter}>
          + New Character
        </button>
      </div>

      <div className="row g-4">
        {chars.map((char) => (
          <div className="col-md-3" key={char.id}>
            <div className="card h-100">
              <div className="card-body">
                <h5>{char.name}</h5>
                <ul>
                  {char.attributes.map((attr, i) => (
                    <li key={i}>
                      {attr.name}: {attr.value}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="card-footer d-flex justify-content-end">
                <button
                  className="btn btn-danger btn-sm"
                  onClick={() => handleDelete(char.id)}
                >
                  <i className="fas fa-trash"></i> Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Simple modal */}
      {showModal && (
        <div className="modal show" style={{ display: "block" }}>
          <div className="modal-dialog">
            <div className="modal-content bg-dark text-white">
              <div className="modal-header">
                <h5 className="modal-title">New Character</h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setShowModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                <label>Name:</label>
                <input
                  type="text"
                  className="form-control mb-2"
                  value={charName}
                  onChange={(e) => setCharName(e.target.value)}
                />
                <label>Attributes (JSON):</label>
                <textarea
                  className="form-control"
                  value={JSON.stringify(attributes)}
                  onChange={(e) => {
                    try {
                      setAttributes(JSON.parse(e.target.value));
                    } catch {}
                  }}
                ></textarea>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button className="btn btn-primary" onClick={handleSaveCharacter}>
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
