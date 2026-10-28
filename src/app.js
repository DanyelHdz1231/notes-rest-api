require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { errorHandler } = require("./middlewares/errorMiddleware");

const app = express();

app.use(cors());
app.use(express.json());

const authRoutes = require("./routes/authRoutes");
const notesRoutes = require("./routes/notesRoutes");
app.use("/api/auth", authRoutes);
app.use("/api/notes", notesRoutes);
app.get("/api/health", (req, res) => {
  // Tu implementación
  res.status(200).json({
    status: "ok",
    message: "API funcionando correctamente",
  });
});

app.use(errorHandler);

module.exports = app;
