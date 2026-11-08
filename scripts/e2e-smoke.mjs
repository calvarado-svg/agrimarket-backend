const API = process.env.AGRIMARKET_API_URL || "http://localhost:4000";
const stamp = Date.now();
const producerEmail = `producer_${stamp}@test.local`;
const consumerEmail = `consumer_${stamp}@test.local`;

async function req(path, { method = "GET", body, token } = {}) {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, data };
}

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

const results = [];

try {
  const health = await req("/health");
  assert(health.ok, `health falló: ${health.status}`);
  results.push("health OK");

  const regP = await req("/api/auth/register", {
    method: "POST",
    body: {
      name: "Productor Test",
      email: producerEmail,
      password: "test1234",
      role: "producer",
    },
  });
  assert(regP.ok, `register producer: ${JSON.stringify(regP.data)}`);
  results.push("register producer OK");

  const regC = await req("/api/auth/register", {
    method: "POST",
    body: {
      name: "Consumidor Test",
      email: consumerEmail,
      password: "test1234",
      role: "consumer",
    },
  });
  assert(regC.ok, `register consumer: ${JSON.stringify(regC.data)}`);
  results.push("register consumer OK");

  const loginP = await req("/api/auth/login", {
    method: "POST",
    body: { email: producerEmail, password: "test1234" },
  });
  assert(loginP.ok && loginP.data.token, `login producer: ${JSON.stringify(loginP.data)}`);
  results.push("login producer OK");

  const product = await req("/api/products", {
    method: "POST",
    token: loginP.data.token,
    body: {
      name: "Papa criolla",
      category: "Tubérculos",
      price: 4200,
      unit: "kg",
      zone: "Zipaquirá",
      description: "Prueba e2e",
    },
  });
  assert(product.ok, `create product: ${JSON.stringify(product.data)}`);
  results.push("create product OK");

  const listed = await req("/api/products?zone=Zipa");
  assert(listed.ok && listed.data.some((p) => p.id === product.data.id), "list/filter product");
  results.push("list/filter product OK");

  const loginC = await req("/api/auth/login", {
    method: "POST",
    body: { email: consumerEmail, password: "test1234" },
  });
  assert(loginC.ok && loginC.data.token, `login consumer: ${JSON.stringify(loginC.data)}`);

  const request = await req("/api/requests", {
    method: "POST",
    token: loginC.data.token,
    body: {
      productId: product.data.id,
      quantity: 2,
      contact: "3000000000",
      message: "Prueba e2e",
    },
  });
  assert(request.ok, `create request: ${JSON.stringify(request.data)}`);
  results.push("create request OK");

  const accept = await req(`/api/requests/${request.data.id}/status`, {
    method: "PATCH",
    token: loginP.data.token,
    body: { status: "accepted" },
  });
  assert(accept.ok && accept.data.status === "accepted", `accept: ${JSON.stringify(accept.data)}`);
  results.push("accept request OK");

  const forbidden = await req("/api/products", {
    method: "POST",
    token: loginC.data.token,
    body: {
      name: "No debe",
      category: "X",
      price: 1,
      unit: "kg",
      zone: "Y",
    },
  });
  assert(forbidden.status === 403, `consumer create product should 403, got ${forbidden.status}`);
  results.push("role guard OK");

  console.log("E2E PASS");
  for (const line of results) console.log(" -", line);
  process.exit(0);
} catch (err) {
  console.error("E2E FAIL:", err.message || err);
  process.exit(1);
}
