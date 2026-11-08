import fs from "fs";
import path from "path";
import { config } from "./config.js";

const empty = () => ({ users: [], products: [], requests: [] });

function ensureFile() {
  const file = path.resolve(config.dataFile);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  if (!fs.existsSync(file)) {
    fs.writeFileSync(file, JSON.stringify(empty(), null, 2));
  }
  return file;
}

export function readStore() {
  const file = ensureFile();
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

export function writeStore(data) {
  const file = ensureFile();
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

export function nextId(items) {
  return items.reduce((max, item) => Math.max(max, item.id || 0), 0) + 1;
}
