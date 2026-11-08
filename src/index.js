import cors from "cors";
import express from "express";
import { login, register, requireAuth, requireRole } from "./auth.js";
import { config } from "./config.js";
import {
  createProduct,
  getProduct,
  listProducts,
  myProducts,
  updateProduct,
} from "./products.js";
import {
  createRequest,
  listMyRequests,
  updateRequestStatus,
} from "./requests.js";

const app = express();

app.use(
  cors({
    origin(origin, cb) {
      if (!origin || config.corsOrigins.includes(origin)) return cb(null, true);
      return cb(new Error(`CORS bloqueado para origen: ${origin}`));
    },
  })
);
app.use(express.json({ limit: "1mb" }));

app.get("/health", (_req, res) => res.json({ ok: true, service: "agrimarket-backend" }));

app.post("/api/auth/register", register);
app.post("/api/auth/login", login);

app.get("/api/products", listProducts);
app.get("/api/products/:id", getProduct);
app.post("/api/products", requireAuth, requireRole("producer"), createProduct);
app.put("/api/products/:id", requireAuth, requireRole("producer"), updateProduct);
app.get("/api/me/products", requireAuth, requireRole("producer"), myProducts);

app.post("/api/requests", requireAuth, requireRole("consumer"), createRequest);
app.get("/api/me/requests", requireAuth, listMyRequests);
app.patch("/api/requests/:id/status", requireAuth, updateRequestStatus);

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: "Error interno" });
});

app.listen(config.port, () => {
  console.log(`AgriMarket API en http://localhost:${config.port}`);
});
