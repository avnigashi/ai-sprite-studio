import React, { useState } from "react";
import { Skill } from "../../models/gameModels";

export default function SkillsTab({
  skillsCollection,
  charactersCollection,
  activityLog,
  onUpdate
}) {
  const [showModal, setShowModal] = useState(false);
  const [skillName, setSkillName] = useState("");
  const [type, setType] = useState("active");
  const [damage, setDamage] = useState(0);
  const [manaCost, setManaCost] = useState(0);
  const [cooldown, setCooldown] = useState(0);
  const [charClass, setCharClass] = useState("");

  const skills = skillsCollection.skills;
  const chars = charactersCollection.characters;

  function handleNewSkill() {
    setSkillName("");
    setType("active");
    setDamage(0);
    setManaCost(0);
    setCooldown(0);
    setCharClass("");
    setShowModal(true);
  }

  function handleSaveSkill() {
    if (!skillName.trim() || !charClass) {
      alert("Skill name and associated character class required!");
      return;
    }
    const sk = new Skill(
      skillName.trim(),
      type,
      damage,
      manaCost,
      cooldown,
      charClass
    );
    skillsCollection.addSkill(sk);
    activityLog.log(`Created skill: ${skillName}`);
    setShowModal(false);
    onUpdate();
  }

  function handleDelete(id) {
    const s = skillsCollection.getSkillById(id);
    if (!s) return;
    if (window.confirm(`Delete skill: ${s.name}?`)) {
      skillsCollection.deleteSkill(id);
      activityLog.log(`Deleted skill: ${s.name}`);
      onUpdate();
    }
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Skills</h2>
        <button className="btn btn-primary" onClick={handleNewSkill}>
          + New Skill
        </button>
      </div>

      <div className="row g-4">
        {skills.map((sk) => (
          <div className="col-md-3" key={sk.id}>
            <div className="card h-100">
              <div className="card-body">
                <h5>{sk.name}</h5>
                <p>Type: {sk.type}</p>
                <p>Damage: {sk.damage}</p>
                <p>Mana: {sk.manaCost}</p>
                <p>Cooldown: {sk.cooldown}s</p>
                <p>Class: {sk.characterClass}</p>
              </div>
              <div className="card-footer d-flex justify-content-end">
                <button
                  className="btn btn-danger btn-sm"
                  onClick={() => handleDelete(sk.id)}
                >
                  <i className="fas fa-trash"></i> Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="modal show" style={{ display: "block" }}>
          <div className="modal-dialog">
            <div className="modal-content bg-dark text-white">
              <div className="modal-header">
                <h5 className="modal-title">New Skill</h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setShowModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                <label>Skill Name:</label>
                <input
                  type="text"
                  className="form-control mb-2"
                  value={skillName}
                  onChange={(e) => setSkillName(e.target.value)}
                />
                <label>Type:</label>
                <select
                  className="form-select mb-2"
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                >
                  <option value="active">Active</option>
                  <option value="passive">Passive</option>
                </select>
                <label>Damage:</label>
                <input
                  type="number"
                  className="form-control mb-2"
                  value={damage}
                  onChange={(e) => setDamage(parseInt(e.target.value) || 0)}
                />
                <label>Mana Cost:</label>
                <input
                  type="number"
                  className="form-control mb-2"
                  value={manaCost}
                  onChange={(e) => setManaCost(parseInt(e.target.value) || 0)}
                />
                <label>Cooldown (s):</label>
                <input
                  type="number"
                  className="form-control mb-2"
                  value={cooldown}
                  onChange={(e) => setCooldown(parseInt(e.target.value) || 0)}
                />
                <label>Associated Class:</label>
                <select
                  className="form-select"
                  value={charClass}
                  onChange={(e) => setCharClass(e.target.value)}
                >
                  <option value="">[Select class]</option>
                  {chars.map((ch) => (
                    <option key={ch.id} value={ch.name}>
                      {ch.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button className="btn btn-primary" onClick={handleSaveSkill}>
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
