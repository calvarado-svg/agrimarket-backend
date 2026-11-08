import { nextId, readStore, writeStore } from "./store.js";

const STATUSES = new Set([
  "pending",
  "pending_delivery",
  "shipped",
  "delivered",
  "rejected",
  "accepted", // compat: se normaliza a pending_delivery
]);

function normalizeStatus(status) {
  return status === "accepted" ? "pending_delivery" : status;
}

export function createRequest(req, res) {
  const { productId, quantity, message, contact } = req.body || {};
  if (!productId || !quantity || !contact) {
    return res.status(400).json({ error: "productId, quantity y contact son obligatorios" });
  }

  const db = readStore();
  const product = db.products.find((p) => p.id === Number(productId));
  if (!product) return res.status(404).json({ error: "Producto no encontrado" });
  if (!product.availability) {
    return res.status(400).json({ error: "Producto no disponible" });
  }

  const item = {
    id: nextId(db.requests),
    productId: product.id,
    productName: product.name,
    producerId: product.producerId,
    producerName: product.producerName,
    consumerId: req.user.id,
    consumerName: req.user.name,
    quantity: Number(quantity),
    message: message ? String(message).trim() : "",
    contact: String(contact).trim(),
    status: "pending",
    createdAt: new Date().toISOString(),
  };

  db.requests.push(item);
  writeStore(db);
  res.status(201).json(item);
}

export function listMyRequests(req, res) {
  const db = readStore();
  const items =
    req.user.role === "producer"
      ? db.requests.filter((r) => r.producerId === req.user.id)
      : db.requests.filter((r) => r.consumerId === req.user.id);
  res.json(
    items.map((r) => ({
      ...r,
      status: normalizeStatus(r.status),
    }))
  );
}

export function updateRequestStatus(req, res) {
  let { status } = req.body || {};
  status = normalizeStatus(status);

  if (!["pending_delivery", "shipped", "delivered", "rejected"].includes(status)) {
    return res.status(400).json({
      error: "status debe ser pending_delivery, shipped, delivered o rejected",
    });
  }

  const db = readStore();
  const index = db.requests.findIndex((r) => r.id === Number(req.params.id));
  if (index < 0) return res.status(404).json({ error: "Solicitud no encontrada" });

  const item = db.requests[index];
  const current = normalizeStatus(item.status);
  const userId = req.user.id;

  const allowed =
    (status === "pending_delivery" &&
      current === "pending" &&
      item.producerId === userId) ||
    (status === "rejected" && current === "pending" && item.producerId === userId) ||
    (status === "shipped" &&
      current === "pending_delivery" &&
      item.producerId === userId) ||
    (status === "delivered" &&
      ["pending_delivery", "shipped"].includes(current) &&
      item.consumerId === userId);

  if (!allowed) {
    return res.status(403).json({
      error: "Transición de estado no permitida para este usuario o estado actual",
    });
  }

  item.status = status;
  item.updatedAt = new Date().toISOString();
  db.requests[index] = item;
  writeStore(db);
  res.json({ ...item, status: normalizeStatus(item.status) });
}
