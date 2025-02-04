import React, { useState, useEffect, useRef, useCallback } from "react";
import db from "../../db"; // <-- import Dexie DB instance
import { SpriteAnimation } from "../../models/gameModels";

/**
 * ProgressBar Component
 * Displays a progress bar with a percentage and message.
 */
function ProgressBar({ percent, message }) {
  return (
      <div style={styles.progressContainer}>
        <div style={{ ...styles.progressBar, width: `${percent}%` }}></div>
        <div style={styles.progressText}>{message} ({percent}%)</div>
      </div>
  );
}

const styles = {
  progressContainer: {
    width: "100%",
    height: "24px",
    backgroundColor: "#f3f4f6",
    borderRadius: "12px",
    overflow: "hidden",
    marginTop: "8px",
    position: "relative"
  },
  progressBar: {
    height: "100%",
    backgroundColor: "#2563eb",
    transition: "width 0.5s ease"
  },
  progressText: {
    position: "absolute",
    top: "0",
    left: "50%",
    transform: "translateX(-50%)",
    fontSize: "14px",
    color: "#1f2937",
    lineHeight: "24px"
  }
};

/**
 * Ollama API Integration (optional)
 */
const OllamaAPI = {
  async loadModels() {
    try {
      const response = await fetch("http://localhost:11434/api/tags");
      const data = await response.json();
      const models = data.models || [];
      // Filter models that have family "mllama" or contain "clip" or "mllama" in families.
      const filteredModels = models.filter((model) => {
        const details = model.details || {};
        const family = details.family || "";
        const families = details.families || [];
        // Convert to lower case for case-insensitive matching.
        const familyLower = family.toLowerCase();
        const familiesLower = families.map((f) => f.toLowerCase());
        return (
            familyLower === "mllama" ||
            familiesLower.some((f) => f.includes("mllama") || f.includes("clip"))
        );
      });
      return filteredModels;
    } catch (error) {
      console.error("Failed to load Ollama models:", error);
      return [];
    }
  },

  /**
   * Classify a sprite animation sequence using a detailed prompt.
   */
  async classifyAnimation(spriteCount, model) {
    const prompt = `Task: Analyze a sprite animation sequence and provide detailed classification with frame metadata.

Input: A sequence of ${spriteCount} sprites representing a single character animation.

Required JSON Response Format:
{
    "id": string,              // Unique animation ID (e.g., "walk_right_01")
    "name": string,            // Display name (e.g., "Walk Right")
    "classification": string,  // Primary animation type
    "confidence": number,      // Confidence score 0-1
    "category": string,        // Movement, Combat, or State
    "frameRate": number,       // Suggested FPS
    "loop": boolean,           // Should animation loop?
    "frames": [                // Array of frame metadata
        {
            "id": string,      // Unique frame ID (e.g., "walk_right_01_f1")
            "name": string,    // Frame name (e.g., "Right Foot Forward")
            "index": number,   // Frame position in sequence
            "duration": number,// Frame duration multiplier (1.0 = normal)
            "tags": string[],  // Frame-specific tags (e.g., ["keyframe", "footstep"])
            "triggerEvents": string[] // Events to trigger (e.g., ["playSound", "spawnParticle"])
        }
    ],
    "transition": {            // Suggested transitions
        "next": string[],      // Possible next animations
        "cancel": string[]     // Animations that can interrupt
    }
}

Animation Types:
- idle: Standing still (2-4 frames)
  - Frame names: "Breathe In", "Breathe Out", etc.
  - Tags: ["pose", "idle"]
- walk: Basic movement (4-6 frames)
  - Frame names: "Left Foot", "Right Foot", etc.
  - Tags: ["movement", "footstep"]
- run: Fast movement (6-8 frames)
  - Frame names: "Push Off", "Mid Stride", "Land", etc.
  - Tags: ["movement", "footstep", "fast"]
- jump: Vertical movement (3-6 frames)
  - Frame names: "Crouch", "Launch", "Peak", "Land", etc.
  - Tags: ["aerial", "movement"]
- attack: Combat motion (4-8 frames)
  - Frame names: "Wind Up", "Strike", "Follow Through", etc.
  - Tags: ["combat", "strike"]
- dash: Quick movement (3-5 frames)
  - Frame names: "Start Dash", "Blur", "End Dash", etc.
  - Tags: ["movement", "fast"]
- crouch: Lowered stance (2-4 frames)
  - Frame names: "Begin Crouch", "Hold", "Rise", etc.
  - Tags: ["pose", "low"]
- hurt: Damage reaction (2-4 frames)
  - Frame names: "Impact", "Recoil", "Recovery", etc.
  - Tags: ["hit", "vulnerable"]
- death: Defeat sequence (4-8 frames)
  - Frame names: "Hit", "Fall", "Final", etc.
  - Tags: ["defeat", "final"]

Instructions:
1. Analyze the sequence length
2. Generate appropriate frame names and IDs
3. Return complete JSON with all frame metadata
4. Use consistent naming patterns
5. Include relevant tags and events
6. Return valid JSON only

Classify this animation sequence:`;

    try {
      const response = await fetch("http://localhost:11434/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: model,
          prompt: prompt,
          stream: false,
          format: "json"
        }),
      });
      const result = await response.json();
      return result.response.trim().toLowerCase();
    } catch (error) {
      console.error("Classification error:", error);
      return "unknown";
    }
  },
};

/**
 * Utility to format animation names.
 */
function getAnimationDisplayName(key) {
  try {
    const parsed = JSON.parse(key);
    if (parsed && parsed.name) {
      return parsed.name;
    }
  } catch (e) {
    // key is not a JSON string; use it directly.
  }
  return key;
}

/**
 * Main React component for sprite extraction & animations.
 */
export default function SpriteAnimationsTab({
                                              spriteAnimationsCollection = {},
                                              activityLog,
                                              onCollectionUpdate,
                                            }) {
  // Existing animations (from collection)
  const existingSprites = spriteAnimationsCollection.sprites || [];

  // Spritesheet and detection states
  const [spriteSheetImage, setSpriteSheetImage] = useState(null);
  const [imageId, setImageId] = useState(null);
  const [detectedSprites, setDetectedSprites] = useState([]);
  const [detectedGroups, setDetectedGroups] = useState([]);
  const [pendingAnimations, setPendingAnimations] = useState({});
  const [showDetectedContainer, setShowDetectedContainer] = useState(false);

  // Extraction settings
  const [extractionMethod, setExtractionMethod] = useState("avni");
  const [backgroundColor, setBackgroundColor] = useState([255, 255, 255]);
  const [tolerance, setTolerance] = useState(30);
  const [minWidth, setMinWidth] = useState(20);
  const [minHeight, setMinHeight] = useState(20);

  // Grouping options: "None", "row", "column", "ollama"
  const [groupBy, setGroupBy] = useState("None");

  // Ollama model selection (only used if groupBy === "ollama")
  const [ollamaModels, setOllamaModels] = useState([]);
  const [selectedOllamaModel, setSelectedOllamaModel] = useState("");
  const [loadingModels, setLoadingModels] = useState(false);

  // UI progress state
  const [progressMsg, setProgressMsg] = useState("");
  const [progressPercent, setProgressPercent] = useState(0);

  // Animation preview state (for ollama grouping or previewing pending animations)
  const [previewFrames, setPreviewFrames] = useState([]);
  const previewCanvasRef = useRef(null);
  const previewAnimationRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [fps, setFps] = useState(12);
  const previewFrameIndex = useRef(0);

  // For existing animation previews
  const intervalsRef = useRef({});

  // ================== EFFECTS ==================
  useEffect(() => {
    async function loadModels() {
      if (groupBy === "ollama") {
        setLoadingModels(true);
        const models = await OllamaAPI.loadModels();
        setOllamaModels(models);
        if (models.length > 0) {
          setSelectedOllamaModel(models[0].name);
        }
        setLoadingModels(false);
      }
    }
    loadModels();
  }, [groupBy]);

  const animatePreview = useCallback(() => {
    if (!isPlaying || previewFrames.length === 0 || !previewCanvasRef.current) return;
    const canvas = previewCanvasRef.current;
    const ctx = canvas.getContext("2d");
    // Ensure the index is valid
    const currentIndex = previewFrameIndex.current % previewFrames.length;
    const currentSprite = previewFrames[currentIndex];

    if (!currentSprite) return; // extra safety check

    const img = new Image();
    img.onload = () => {
      // Use currentSprite.w and currentSprite.h
      canvas.width = currentSprite.w;
      canvas.height = currentSprite.h;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(
          img,
          currentSprite.x,
          currentSprite.y,
          currentSprite.w,
          currentSprite.h,
          0,
          0,
          currentSprite.w,
          currentSprite.h
      );
      previewFrameIndex.current = currentIndex + 1;
      previewAnimationRef.current = setTimeout(animatePreview, 1000 / fps);
    };
    if (spriteSheetImage) {
      img.src = spriteSheetImage.src;
    }
  }, [isPlaying, previewFrames, fps, spriteSheetImage]);

  useEffect(() => {
    if (isPlaying) {
      animatePreview();
    } else if (previewAnimationRef.current) {
      clearTimeout(previewAnimationRef.current);
    }
    return () => {
      if (previewAnimationRef.current) clearTimeout(previewAnimationRef.current);
    };
  }, [isPlaying, animatePreview]);

  // ================== UTILS ==================
  function rgbToHex([r, g, b]) {
    const toHex = (c) => c.toString(16).padStart(2, "0");
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  }

  function hexToRgb(hex) {
    const clean = hex.replace("#", "");
    if (clean.length !== 6) return null;
    const r = parseInt(clean.substring(0, 2), 16);
    const g = parseInt(clean.substring(2, 4), 16);
    const b = parseInt(clean.substring(4, 6), 16);
    return [r, g, b];
  }

  // ================== UPLOAD & BACKGROUND DETECTION ==================
  async function handleSpriteSheetUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const arrBuf = await file.arrayBuffer();
      const blob = new Blob([arrBuf], { type: file.type });
      const newId = await db.images.add({
        name: file.name,
        data: blob,
      });
      console.log("Stored image in IDB with id:", newId);
      setImageId(newId);
      const reader = new FileReader();
      reader.onload = (ev) => {
        const img = new Image();
        img.onload = () => {
          console.log("Spritesheet loaded:", img.width, "x", img.height);
          setSpriteSheetImage(img);
          autoDetectBackgroundColor(img);
          alert(`Spritesheet "${file.name}" uploaded & stored (id=${newId})!`);
        };
        img.src = ev.target.result;
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error("Error storing image in IDB", err);
      alert("Failed to store image in IndexedDB.");
    }
  }

  function autoDetectBackgroundColor(image) {
    const tempCanvas = document.createElement("canvas");
    const ctx = tempCanvas.getContext("2d");
    tempCanvas.width = image.width;
    tempCanvas.height = image.height;
    ctx.drawImage(image, 0, 0);
    const samplePoints = [
      [0, 0],
      [image.width - 1, 0],
      [0, image.height - 1],
      [image.width - 1, image.height - 1],
      [Math.floor(image.width / 2), 0],
      [Math.floor(image.width / 2), image.height - 1],
      [0, Math.floor(image.height / 2)],
      [image.width - 1, Math.floor(image.height / 2)],
    ];
    const colorMap = new Map();
    samplePoints.forEach(([x, y]) => {
      const pixel = ctx.getImageData(x, y, 1, 1).data;
      const color = `${pixel[0]},${pixel[1]},${pixel[2]}`;
      colorMap.set(color, (colorMap.get(color) || 0) + 1);
    });
    const mostCommon = Array.from(colorMap.entries()).sort((a, b) => b[1] - a[1])[0][0];
    const bgArr = mostCommon.split(",").map(Number);
    console.log("Auto-detected BG color:", bgArr);
    setBackgroundColor(bgArr);
  }

  function handleBgColorChange(e) {
    const hex = e.target.value;
    const rgb = hexToRgb(hex);
    if (rgb) {
      console.log("Background color changed:", rgb);
      setBackgroundColor(rgb);
    }
  }

  // ================== EXTRACTION LOGIC ==================
  function isBgPixel(data, idx, bgColor, tol) {
    const r = Math.abs(data[idx] - bgColor[0]);
    const g = Math.abs(data[idx + 1] - bgColor[1]);
    const b = Math.abs(data[idx + 2] - bgColor[2]);
    return r <= tol && g <= tol && b <= tol;
  }

  function avniExtraction(imageData) {
    const spriteList = [];
    const rowBounds = findSpriteRows(imageData, backgroundColor, tolerance, minHeight);
    rowBounds.forEach((row, rowIndex) => {
      const rowSprites = findSpritesInRow(imageData, row, backgroundColor, tolerance, minWidth);
      rowSprites.forEach((sp) => (sp.row = rowIndex));
      spriteList.push(...rowSprites);
    });
    console.log(`Avni found ${spriteList.length} sprites`);
    return spriteList;
  }

  function findSpriteRows(imageData, bgColor, tol, minH) {
    const { width, height, data } = imageData;
    const rows = [];
    let inRow = false;
    let startY = 0;
    for (let y = 0; y < height; y++) {
      let rowHasContent = false;
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4;
        if (!isBgPixel(data, idx, bgColor, tol)) {
          rowHasContent = true;
          break;
        }
      }
      if (rowHasContent && !inRow) {
        inRow = true;
        startY = y;
      } else if (!rowHasContent && inRow) {
        inRow = false;
        if (y - startY >= minH) {
          rows.push({ startY, endY: y - 1 });
        }
      }
    }
    if (inRow && height - startY >= minH) {
      rows.push({ startY, endY: height - 1 });
    }
    return rows;
  }

  function findSpritesInRow(imageData, row, bgColor, tol, minW) {
    const { width, data } = imageData;
    const rowSprites = [];
    let inSprite = false;
    let startX = 0;
    for (let x = 0; x < width; x++) {
      let hasContent = false;
      for (let y = row.startY; y <= row.endY; y++) {
        const idx = (y * width + x) * 4;
        if (!isBgPixel(data, idx, bgColor, tol)) {
          hasContent = true;
          break;
        }
      }
      if (hasContent && !inSprite) {
        inSprite = true;
        startX = x;
      } else if (!hasContent && inSprite) {
        inSprite = false;
        const w = x - startX;
        const h = row.endY - row.startY + 1;
        if (w >= minW) {
          rowSprites.push({ x: startX, y: row.startY, width: w, height: h, w, h });
        }
      }
    }
    if (inSprite) {
      const w = width - startX;
      const h = row.endY - row.startY + 1;
      if (w >= minW) {
        rowSprites.push({ x: startX, y: row.startY, width: w, height: h, w, h });
      }
    }
    return rowSprites;
  }

  async function groupSprites(sprites, method) {
    let groups = [];
    if (method === "None") {
      groups = [{ key: "all", sprites }];
    } else if (method === "row") {
      const groupsMap = new Map();
      sprites.forEach((s) => {
        const key = s.row || 0;
        if (!groupsMap.has(key)) groupsMap.set(key, []);
        groupsMap.get(key).push(s);
      });
      groups = Array.from(groupsMap.entries()).map(([key, groupSprites]) => ({
        key,
        sprites: groupSprites,
      }));
    } else if (method === "column") {
      const groupsMap = new Map();
      sprites.forEach((s) => {
        const key = Math.floor(s.x / (s.width || 1));
        if (!groupsMap.has(key)) groupsMap.set(key, []);
        groupsMap.get(key).push(s);
      });
      groups = Array.from(groupsMap.entries()).map(([key, groupSprites]) => ({
        key,
        sprites: groupSprites,
      }));
    } else if (method === "ollama") {
      const groupsMap = new Map();
      sprites.forEach((s) => {
        const key = s.row || 0;
        if (!groupsMap.has(key)) groupsMap.set(key, []);
        groupsMap.get(key).push(s);
      });
      groups = await Promise.all(
          Array.from(groupsMap.entries()).map(async ([key, groupSprites]) => {
            let label = "unknown";
            if (selectedOllamaModel) {
              label = await OllamaAPI.classifyAnimation(groupSprites.length, selectedOllamaModel);
            }
            return { key, label, sprites: groupSprites };
          })
      );
    }
    return groups;
  }

  async function handleDetection() {
    if (!spriteSheetImage) {
      alert("Please upload a spritesheet first!");
      return;
    }
    setProgressMsg("Initializing extraction...");
    setProgressPercent(0);
    setDetectedSprites([]);
    setDetectedGroups([]);
    setShowDetectedContainer(true);
    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = spriteSheetImage.width;
    tempCanvas.height = spriteSheetImage.height;
    const ctx = tempCanvas.getContext("2d");
    ctx.drawImage(spriteSheetImage, 0, 0);
    const imageData = ctx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
    const sprites = avniExtraction(imageData);
    setDetectedSprites(sprites);
    setProgressPercent(40);
    setProgressMsg("Grouping sprites...");
    const groups = await groupSprites(sprites, groupBy);
    setDetectedGroups(groups);
    setProgressPercent(80);
    setProgressMsg("Extraction complete!");
    if (groupBy === "ollama") {
      const autoAnimations = { ...pendingAnimations };
      groups.forEach((grp) => {
        const animName = grp.label || "unknown";
        autoAnimations[animName] = grp.sprites.map((s) => ({
          x: s.x,
          y: s.y,
          w: s.width,
          h: s.height,
        }));
      });
      setPendingAnimations(autoAnimations);
      if (groups.length > 0) {
        setPreviewFrames(groups[0].sprites);
      }
    }
    setProgressPercent(100);
  }

  function buildSpritePreview(spr) {
    if (!spriteSheetImage) return "";
    const c = document.createElement("canvas");
    c.width = spr.width;
    c.height = spr.height;
    const cx = c.getContext("2d");
    cx.drawImage(
        spriteSheetImage,
        spr.x,
        spr.y,
        spr.width,
        spr.height,
        0,
        0,
        spr.width,
        spr.height
    );
    return c.toDataURL();
  }

  function addSelectedToAnimation(animationName) {
    if (!animationName) {
      alert("Please enter an animation name!");
      return;
    }
    const checkboxes = document.querySelectorAll(
        ".sprite-grid .sprite-card input[type='checkbox']:checked"
    );
    if (!checkboxes.length) {
      alert("No sprites selected!");
      return;
    }
    const frames = [];
    checkboxes.forEach((cb) => {
      const idx = parseInt(cb.dataset.spriteIndex);
      const sprite = detectedSprites[idx];
      // Note: saving frames with x, y, w, h
      frames.push({
        x: sprite.x,
        y: sprite.y,
        w: sprite.width,
        h: sprite.height,
      });
    });
    const newPending = { ...pendingAnimations };
    newPending[animationName] = (newPending[animationName] || []).concat(frames);
    setPendingAnimations(newPending);
    checkboxes.forEach((cb) => (cb.checked = false));
    alert(`Added ${frames.length} frames to animation "${animationName}"`);
  }

  function removePendingAnimation(name) {
    const newPending = { ...pendingAnimations };
    delete newPending[name];
    setPendingAnimations(newPending);
  }

  function saveAllAnimations() {
    if (!Object.keys(pendingAnimations).length) {
      alert("No animations to save!");
      return;
    }
    if (!imageId) {
      alert("No IndexedDB image stored yet. Please upload a spritesheet first!");
      return;
    }
    const configName = prompt("Enter name for this sprite animation set:", "NewSpriteSet");
    if (!configName) {
      alert("Name is required!");
      return;
    }
    const newSprite = new SpriteAnimation(
        configName,
        String(imageId),
        pendingAnimations,
        {
          app: "Advanced Sprite Grid Extractor",
          version: "1.0",
          size: spriteSheetImage
              ? { w: spriteSheetImage.width, h: spriteSheetImage.height }
              : { w: 0, h: 0 },
          scale: "1",
          type: "sprite",
        }
    );
    spriteAnimationsCollection.addSprite(newSprite);
    activityLog?.log(
        `Created sprite animation: ${configName} with ${Object.keys(pendingAnimations).length} sequences`
    );
    setPendingAnimations({});
    setShowDetectedContainer(false);
    setDetectedSprites([]);
    onCollectionUpdate();
    alert("All animations saved successfully!");
  }

  async function handleDeleteSpriteAnimation(id) {
    const spr = spriteAnimationsCollection.getSpriteById?.(id);
    if (!spr) return;
    if (window.confirm(`Are you sure to delete "${spr.name}"?`)) {
      spriteAnimationsCollection.deleteSprite?.(id);
      activityLog?.log(`Deleted sprite animation: ${spr.name}`);
      onCollectionUpdate();
    }
  }

  async function playSpriteAnimation(id, animName) {
    const spr = spriteAnimationsCollection.getSpriteById?.(id);
    if (!spr) {
      alert("Sprite not found!");
      return;
    }
    const frames = spr.animations[animName];
    if (!frames || !frames.length) {
      alert("No frames in that animation!");
      return;
    }
    const canvas = document.getElementById(`previewCanvas-${spr.id || id}`);
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const numericId = parseInt(spr.sheet, 10);
    if (isNaN(numericId)) {
      alert("No valid numeric ID found in sprite.sheet!");
      return;
    }
    const record = await db.images.get(numericId);
    if (!record || !record.data) {
      alert("Cannot find image data in IndexedDB!");
      return;
    }
    const objURL = URL.createObjectURL(record.data);
    const image = new Image();
    image.src = objURL;
    if (intervalsRef.current[id]) {
      clearInterval(intervalsRef.current[id]);
    }
    image.onload = () => {
      let currentFrame = 0;
      const localFps = 5;
      const interval = 1000 / localFps;
      intervalsRef.current[id] = setInterval(() => {
        const f = frames[currentFrame];
        canvas.width = f.w;
        canvas.height = f.h;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(image, f.x, f.y, f.w, f.h, 0, 0, f.w, f.h);
        currentFrame = (currentFrame + 1) % frames.length;
      }, interval);
    };
  }

  function stopSpriteAnimation(id) {
    if (intervalsRef.current[id]) {
      clearInterval(intervalsRef.current[id]);
      intervalsRef.current[id] = null;
      const canvas = document.getElementById(`previewCanvas-${id}`);
      if (canvas) {
        const ctx = canvas.getContext("2d");
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }
  }

  // ================== RENDER ==================
  return (
      <div>
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h2>Sprite Animations (IndexedDB)</h2>
          <button
              className="btn btn-secondary"
              onClick={() => alert("Use detection or a form to create new animations!")}
          >
            <i className="fas fa-plus"></i> New Sprite Animation
          </button>
        </div>
        {/* Spritesheet Upload & Settings */}
        <div className="card mb-4">
          <div className="card-body">
            <h5 className="card-title">Spritesheet Management</h5>
            <div className="mb-3">
              <label className="form-label">Upload Spritesheet (stored in IDB)</label>
              <input type="file" accept="image/*" className="form-control" onChange={handleSpriteSheetUpload} />
            </div>
            <div className="row g-2">
              <div className="col-md-3">
                <label className="form-label">Extraction Method</label>
                <select className="form-select" value={extractionMethod} onChange={(e) => setExtractionMethod(e.target.value)}>
                  <option value="avni">Avni Extractor</option>
                  <option value="newExtract">Tile-based Extractor</option>
                  <option value="patternExtract">Pattern-based Extractor</option>
                </select>
              </div>
              <div className="col-md-3">
                <label className="form-label">Tolerance ({tolerance})</label>
                <input type="range" min="0" max="255" value={tolerance} onChange={(e) => setTolerance(parseInt(e.target.value) || 0)} className="form-range" />
              </div>
              <div className="col-md-3">
                <label className="form-label">Min Width</label>
                <input type="number" className="form-control" value={minWidth} onChange={(e) => setMinWidth(parseInt(e.target.value) || 1)} />
              </div>
              <div className="col-md-3">
                <label className="form-label">Min Height</label>
                <input type="number" className="form-control" value={minHeight} onChange={(e) => setMinHeight(parseInt(e.target.value) || 1)} />
              </div>
            </div>
            <div className="mt-3 d-flex align-items-center gap-3">
              <div>
                <label className="form-label">Background Color</label>
                <input type="color" value={rgbToHex(backgroundColor)} onChange={handleBgColorChange} className="form-control form-control-color" />
              </div>
              <div>
                <label className="form-label">Group by</label>
                <select className="form-select" value={groupBy} onChange={(e) => setGroupBy(e.target.value)}>
                  <option value="None">None</option>
                  <option value="row">Row</option>
                  <option value="column">Column</option>
                  <option value="ollama">Ollama</option>
                </select>
              </div>
              {groupBy === "ollama" && (
                  <div>
                    <label className="form-label">Ollama Model</label>
                    {loadingModels ? (
                        <div>Loading models...</div>
                    ) : (
                        <select className="form-select" value={selectedOllamaModel} onChange={(e) => setSelectedOllamaModel(e.target.value)}>
                          {ollamaModels.map((model) => (
                              <option key={model.name} value={model.name}>
                                {model.name}
                              </option>
                          ))}
                        </select>
                    )}
                  </div>
              )}
            </div>
            <button className="btn btn-secondary mt-3" onClick={handleDetection}>
              <i className="fas fa-magic"></i> Detect Sprites
            </button>
            {progressMsg && <ProgressBar percent={progressPercent} message={progressMsg} />}
          </div>
        </div>
        {/* Animation Preview */}
        {(groupBy === "ollama" || previewFrames.length > 0) && (
            <div className="card mb-4">
              <div className="card-body">
                <h5 className="card-title">Animation Preview</h5>
                <canvas ref={previewCanvasRef} style={{ display: "block", margin: "0 auto" }}></canvas>
                <div className="d-flex justify-content-center align-items-center gap-3 mt-2">
                  <button className="btn btn-primary" onClick={() => setIsPlaying((prev) => !prev)}>
                    {isPlaying ? "Pause" : "Play"}
                  </button>
                  <div className="d-flex align-items-center gap-2">
                    <label htmlFor="fpsSlider">Speed:</label>
                    <input id="fpsSlider" type="range" min="1" max="60" value={fps} onChange={(e) => setFps(parseInt(e.target.value))} />
                    <span>{fps} FPS</span>
                  </div>
                </div>
              </div>
            </div>
        )}
        {/* Pending Animations with Preview and Play Button */}
        {showDetectedContainer && (
            <div className="card mb-4">
              <button
                  type="button"
                  className="btn btn-primary"
                  style={{ position: "absolute", top: 10, right: 10 }}
                  onClick={saveAllAnimations}
              >
                Save All Animations
              </button>
              <div className="card-body">
                <h5 className="card-title">Detected Sprites & Groups</h5>
                <div className="mb-3">
                  <h6>Pending Animations:</h6>
                  <ul className="list-group">
                    {Object.entries(pendingAnimations).map(([name, frames]) => (
                        <li className="list-group-item d-flex justify-content-between align-items-center" key={name}>
                          <span>{getAnimationDisplayName(name)}</span>
                          <span className="badge bg-primary">{frames.length} frames</span>
                          <div>
                            <button
                                className="btn btn-sm btn-primary me-2"
                                onClick={() => {
                                  setPreviewFrames(frames);
                                  setIsPlaying(true);
                                }}
                            >
                              Preview
                            </button>
                            <button className="btn btn-sm btn-danger" onClick={() => removePendingAnimation(name)}>
                              <i className="fas fa-trash"></i>
                            </button>
                          </div>
                        </li>
                    ))}
                  </ul>
                </div>
                <div className="input-group mb-3">
                  <input type="text" className="form-control" id="newAnimationName" placeholder="e.g. idle, run..." />
                  <button
                      className="btn btn-success"
                      onClick={() => {
                        const nameInput = document.getElementById("newAnimationName");
                        addSelectedToAnimation(nameInput.value.trim());
                        nameInput.value = "";
                      }}
                  >
                    Add to Animation
                  </button>
                </div>
                <div className="sprite-grid">
                  {(() => {
                    const spritesByRow = detectedSprites.reduce((acc, sp, i) => {
                      const row = sp.row || 0;
                      if (!acc[row]) acc[row] = [];
                      acc[row].push({ ...sp, originalIndex: i });
                      return acc;
                    }, {});
                    return Object.entries(spritesByRow).map(([rowNum, rowSprites]) => (
                        <div key={rowNum} className="mb-4">
                          <h6 className="border-bottom pb-2">
                            Row {parseInt(rowNum) + 1}{" "}
                            {groupBy === "ollama" &&
                            detectedGroups.find((grp) => grp.key === parseInt(rowNum))
                                ? `- ${detectedGroups.find((grp) => grp.key === parseInt(rowNum)).label}`
                                : ""}
                          </h6>
                          <div className="d-flex flex-wrap gap-3">
                            {rowSprites.map((spr) => {
                              const dataURL = buildSpritePreview(spr);
                              return (
                                  <div className="sprite-item" key={spr.originalIndex}>
                                    <div className="card sprite-card" style={{ width: "120px" }}>
                                      <img src={dataURL} alt={`Sprite ${spr.originalIndex + 1}`} style={{ width: "100%", display: "block" }} />
                                      <div className="card-body text-center p-2">
                                        <div className="form-check">
                                          <input className="form-check-input" type="checkbox" data-sprite-index={spr.originalIndex} id={`spriteCheck${spr.originalIndex}`} />
                                          <label className="form-check-label" htmlFor={`spriteCheck${spr.originalIndex}`}>
                                            Select
                                          </label>
                                        </div>
                                        <small className="text-muted d-block">{spr.width}×{spr.height}</small>
                                      </div>
                                    </div>
                                  </div>
                              );
                            })}
                          </div>
                        </div>
                    ));
                  })()}
                </div>
              </div>
            </div>
        )}
        {/* Existing Sprite Animations */}
        <div className="row g-4">
          {existingSprites.map((sprite) => (
              <div className="col-md-2" key={sprite.id}>
                <div className="card h-100">
                  <div className="card-body">
                    <h5 className="card-title">{sprite.name}</h5>
                    <div className="mb-3">
                      <canvas id={`previewCanvas-${sprite.id}`} width="200" height="200"></canvas>
                    </div>
                    <strong>Animations:</strong>
                    <ul className="list-group list-group-flush">
                      {Object.keys(sprite.animations).map((anim) => (
                          <li className="list-group-item bg-dark text-white d-flex justify-content-between align-items-center" key={anim}>
                            <span>{getAnimationDisplayName(anim)}</span>
                            <div>
                              <button className="btn btn-sm btn-primary me-2" onClick={() => playSpriteAnimation(sprite.id, anim)}>
                                <i className="fas fa-play"></i> Play
                              </button>
                              <button className="btn btn-sm btn-warning" onClick={() => stopSpriteAnimation(sprite.id)}>
                                <i className="fas fa-stop"></i> Stop
                              </button>
                            </div>
                          </li>
                      ))}
                    </ul>
                  </div>
                  <div className="card-footer d-flex justify-content-end gap-2">
                    <button className="btn btn-danger btn-sm" onClick={() => handleDeleteSpriteAnimation(sprite.id)}>
                      <i className="fas fa-trash"></i> Delete
                    </button>
                  </div>
                </div>
              </div>
          ))}
        </div>
      </div>
  );
}
