// src/db.js
import Dexie from "dexie";

// Create a Dexie database called "MySpriteDB":
const db = new Dexie("MySpriteDB");
// We'll have one store called "images" with a unique ID:
db.version(1).stores({
  images: "++id,name" 
  //  ++id => auto-increment key
  //  name => optional field to store an image name
});

export default db;
