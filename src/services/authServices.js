const pool = require("../config/db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

exports.register = async ({ name, email, password }) => {
  const saltRounds = 12;

  const [rows] = await pool.query(`SELECT id FROM users WHERE email = ?`, [
    email,
  ]);

  if (rows.length > 0) {
    const error = new Error("El email ya existe");
    error.status = 409;
    throw error;
  }

  const passwordHash = await bcrypt.hash(password, saltRounds);

  const [result] = await pool.query(
    `INSERT INTO users (name, email, password)
     VALUES (?, ?, ?)`,
    [name, email, passwordHash],
  );

  return {
    id: result.insertId,
    name,
    email,
  };
};

exports.login = async ({ email, password }) => {
  const [rows] = await pool.query(
    `SELECT id, password FROM users WHERE email = ?`,
    [email],
  );

  if (rows.length === 0) {
    const error = new Error("Credenciales inválidas");
    error.status = 401;
    throw error;
  }

  const user = rows[0];
  const isMatch = await bcrypt.compare(password, user.password);

  if (!isMatch) {
    const error = new Error("Credenciales inválidas");
    error.status = 401;
    throw error;
  }

  const payload = { id: user.id };
  const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "15m" });

  return {
    token,
  };
};

exports.getProfile = async (userId) => {
  const [rows] = await pool.query(
    `SELECT id, name, email FROM users WHERE id = ?`,
    [userId],
  );

  if (rows.length === 0) {
    const error = new Error("Usuario no encontrado");
    error.status = 404;
    throw error;
  }

  return rows[0];
};
