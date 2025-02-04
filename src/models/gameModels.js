// src/models/gameModels.js

export class Skill {
  constructor(name, type, damage, manaCost, cooldown, characterClass, sprite = null) {
    this.id = Date.now() + Math.random();
    this.name = name;
    this.type = type;
    this.damage = damage;
    this.manaCost = manaCost;
    this.cooldown = cooldown;
    this.characterClass = characterClass;
    this.sprite = sprite; // { sheet, animations, meta }
  }
}

export class SkillsCollection {
  #skills;
  constructor() {
    this.#skills = [];
  }
  addSkill(skill) {
    this.#skills.push(skill);
  }
  updateSkill(id, updatedSkill) {
    const index = this.#skills.findIndex(s => s.id === id);
    if (index !== -1) {
      this.#skills[index] = { ...this.#skills[index], ...updatedSkill };
      return true;
    }
    return false;
  }
  deleteSkill(id) {
    const index = this.#skills.findIndex(s => s.id === id);
    if (index !== -1) {
      this.#skills.splice(index, 1);
      return true;
    }
    return false;
  }
  getSkillById(id) {
    return this.#skills.find(s => s.id === id);
  }
  get skills() {
    return this.#skills;
  }
  export() {
    return this.#skills;
  }
  import(skills) {
    this.#skills = skills.map(
      s =>
        new Skill(
          s.name,
          s.type,
          s.damage,
          s.manaCost,
          s.cooldown,
          s.characterClass,
          s.sprite
        )
    );
  }
}

export class Character {
  constructor(name, attributes = []) {
    this.id = Date.now() + Math.random();
    this.name = name;
    this.attributes = attributes;
  }
}

export class CharactersCollection {
  #characters;
  constructor() {
    this.#characters = [];
  }
  addCharacter(character) {
    this.#characters.push(character);
  }
  updateCharacter(id, updatedCharacter) {
    const index = this.#characters.findIndex(c => c.id === id);
    if (index !== -1) {
      this.#characters[index] = { ...this.#characters[index], ...updatedCharacter };
      return true;
    }
    return false;
  }
  deleteCharacter(id) {
    const index = this.#characters.findIndex(c => c.id === id);
    if (index !== -1) {
      this.#characters.splice(index, 1);
      return true;
    }
    return false;
  }
  getCharacterById(id) {
    return this.#characters.find(c => c.id === id);
  }
  get characters() {
    return this.#characters;
  }
  export() {
    return this.#characters;
  }
  import(chars) {
    this.#characters = chars.map(ch => new Character(ch.name, ch.attributes));
  }
}

export class Settings {
  constructor() {
    this.gameName = "My Awesome Game";
    this.maxPlayers = 100;
    this.maintenanceMode = false;
  }
}

export class ActivityLog {
  #activities;
  constructor() {
    this.#activities = [];
  }
  log(message) {
    const timestamp = new Date().toLocaleString();
    this.#activities.unshift({ message, timestamp });
    if (this.#activities.length > 100) {
      this.#activities.pop();
    }
  }
  getActivities() {
    return this.#activities;
  }
  export() {
    return this.#activities;
  }
  import(arr) {
    this.#activities = arr;
  }
}

export class SpriteAnimation {
  constructor(name, sheet, animations, meta = {}) {
    this.id = Date.now() + Math.random();
    this.name = name;
    this.sheet = sheet;
    this.animations = animations; // { animName: [ { x, y, w, h }, ... ], ... }
    this.meta = meta;
  }
}

export class SpriteAnimationsCollection {
  #sprites;
  constructor() {
    this.#sprites = [];
  }
  addSprite(sprite) {
    this.#sprites.push(sprite);
  }
  updateSprite(id, updated) {
    const idx = this.#sprites.findIndex(s => s.id === id);
    if (idx !== -1) {
      this.#sprites[idx] = { ...this.#sprites[idx], ...updated };
      return true;
    }
    return false;
  }
  deleteSprite(id) {
    const idx = this.#sprites.findIndex(s => s.id === id);
    if (idx !== -1) {
      this.#sprites.splice(idx, 1);
      return true;
    }
    return false;
  }
  getSpriteById(id) {
    return this.#sprites.find(s => s.id === id);
  }
  get sprites() {
    return this.#sprites;
  }
  export() {
    return this.#sprites;
  }
  import(arr) {
    this.#sprites = arr.map(s => new SpriteAnimation(s.name, s.sheet, s.animations, s.meta));
  }
}

export class GameConfig {
  constructor() {
    this.skillsCollection = new SkillsCollection();
    this.charactersCollection = new CharactersCollection();
    this.settings = new Settings();
    this.activityLog = new ActivityLog();
  }
  export() {
    return {
      skills: this.skillsCollection.export(),
      characters: this.charactersCollection.export(),
      settings: this.settings,
      activityLog: this.activityLog.export(),
      spriteAnimations: []
    };
  }
  import(data) {
    if (data.skills) this.skillsCollection.import(data.skills);
    if (data.characters) this.charactersCollection.import(data.characters);
    if (data.settings) {
      this.settings.gameName = data.settings.gameName || this.settings.gameName;
      this.settings.maxPlayers = data.settings.maxPlayers || this.settings.maxPlayers;
      this.settings.maintenanceMode = data.settings.maintenanceMode || false;
    }
    if (data.activityLog) this.activityLog.import(data.activityLog);
  }
}

export class GameConfigExtended extends GameConfig {
  #spriteAnimationsCollection;
  constructor() {
    super();
    this.#spriteAnimationsCollection = new SpriteAnimationsCollection();
  }
  get spriteAnimationsCollection() {
    return this.#spriteAnimationsCollection;
  }
  export() {
    const base = super.export();
    base.spriteAnimations = this.#spriteAnimationsCollection.export();
    return base;
  }
  import(data) {
    super.import(data);
    if (data.spriteAnimations) {
      this.#spriteAnimationsCollection.import(data.spriteAnimations);
    }
  }
}
