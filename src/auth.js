import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { config } from "./config.js";
import { nextId, readStore, writeStore } from "./store.js";

const ROLES = new Set(["producer", "consumer"]);

export function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: "Token requerido" });

  try {
    req.user = jwt.verify(token, config.jwtSecret);
    next();
  } catch {
    return res.status(401).json({ error: "Token inválido" });
  }
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: "No autorizado para este rol" });
    }
    next();
  };
}

export function register(req, res) {
  const { name, email, password, role } = req.body || {};
  if (!name || !email || !password || !role) {
    return res.status(400).json({ error: "name, email, password y role son obligatorios" });
  }
  if (!ROLES.has(role)) {
    return res.status(400).json({ error: "role debe ser producer o consumer" });
  }

  const db = readStore();
  if (db.users.some((u) => u.email.toLowerCase() === email.toLowerCase())) {
    return res.status(409).json({ error: "El email ya está registrado" });
  }

  const user = {
    id: nextId(db.users),
    name: String(name).trim(),
    email: String(email).trim().toLowerCase(),
    passwordHash: bcrypt.hashSync(String(password), 10),
    role,
  };
  db.users.push(user);
  writeStore(db);

  return res.status(201).json({ token: signToken(user), user: publicUser(user) });
}

export function login(req, res) {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ error: "email y password son obligatorios" });
  }

  const db = readStore();
  const user = db.users.find((u) => u.email === String(email).trim().toLowerCase());
  if (!user || !bcrypt.compareSync(String(password), user.passwordHash)) {
    return res.status(401).json({ error: "Credenciales inválidas" });
  }

  return res.json({ token: signToken(user), user: publicUser(user) });
}

function signToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role, name: user.name },
    config.jwtSecret,
    { expiresIn: "7d" }
  );
}

function publicUser(user) {
  return { id: user.id, name: user.name, email: user.email, role: user.role };
}
