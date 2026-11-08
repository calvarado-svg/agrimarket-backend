import dotenv from "dotenv";

dotenv.config();

function required(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Falta la variable de entorno ${name}`);
  return value;
}

export const config = {
  port: Number(process.env.AGRIMARKET_PORT || 4000),
  jwtSecret: required("AGRIMARKET_JWT_SECRET"),
  corsOrigins: required("AGRIMARKET_CORS_ORIGIN")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean),
  dataFile: required("AGRIMARKET_DATA_FILE"),
};
