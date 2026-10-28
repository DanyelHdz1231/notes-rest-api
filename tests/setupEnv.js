const path = require("path");
const dotenv = require("dotenv");

dotenv.config({
  path: path.resolve(__dirname, "../.env.test"),
  override: true,
  quiet: true,
});

if (process.env.NODE_ENV !== "test" || process.env.DB_NAME !== "notes_test") {
  throw new Error(
    "Configuración de testing inválida: base de datos no autorizada",
  );
}
