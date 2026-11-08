import { nextId, readStore, writeStore } from "./store.js";

export function listProducts(req, res) {
  const { category, zone, q } = req.query;
  let items = readStore().products;

  if (category) {
    const c = String(category).toLowerCase();
    items = items.filter((p) => p.category.toLowerCase() === c);
  }
  if (zone) {
    const z = String(zone).toLowerCase();
    items = items.filter((p) => p.zone.toLowerCase().includes(z));
  }
  if (q) {
    const text = String(q).toLowerCase();
    items = items.filter(
      (p) =>
        p.name.toLowerCase().includes(text) ||
        p.description.toLowerCase().includes(text)
    );
  }

  res.json(items);
}

export function getProduct(req, res) {
  const product = readStore().products.find((p) => p.id === Number(req.params.id));
  if (!product) return res.status(404).json({ error: "Producto no encontrado" });
  res.json(product);
}

export function createProduct(req, res) {
  const { name, category, price, unit, availability, zone, imageUrl, description } =
    req.body || {};

  if (!name || !category || price == null || !unit || !zone) {
    return res.status(400).json({
      error: "name, category, price, unit y zone son obligatorios",
    });
  }

  const db = readStore();
  const product = {
    id: nextId(db.products),
    producerId: req.user.id,
    producerName: req.user.name,
    name: String(name).trim(),
    category: String(category).trim(),
    price: Number(price),
    unit: String(unit).trim(),
    availability: availability == null ? true : Boolean(availability),
    zone: String(zone).trim(),
    imageUrl: imageUrl ? String(imageUrl).trim() : "",
    description: description ? String(description).trim() : "",
    createdAt: new Date().toISOString(),
  };

  db.products.push(product);
  writeStore(db);
  res.status(201).json(product);
}

export function updateProduct(req, res) {
  const db = readStore();
  const index = db.products.findIndex((p) => p.id === Number(req.params.id));
  if (index < 0) return res.status(404).json({ error: "Producto no encontrado" });

  const current = db.products[index];
  if (current.producerId !== req.user.id) {
    return res.status(403).json({ error: "Solo el productor dueño puede editar" });
  }

  const fields = [
    "name",
    "category",
    "price",
    "unit",
    "availability",
    "zone",
    "imageUrl",
    "description",
  ];
  for (const key of fields) {
    if (req.body?.[key] !== undefined) {
      current[key] =
        key === "price"
          ? Number(req.body[key])
          : key === "availability"
            ? Boolean(req.body[key])
            : String(req.body[key]).trim();
    }
  }

  db.products[index] = current;
  writeStore(db);
  res.json(current);
}

export function myProducts(req, res) {
  const items = readStore().products.filter((p) => p.producerId === req.user.id);
  res.json(items);
}
