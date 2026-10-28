const pool = require("../config/db");

exports.createNote = async ({ userId, title, content }) => {
  const [rows] = await pool.execute(
    "INSERT INTO notes (user_id, title, content) VALUES (?, ?, ?)",
    [userId, title, content],
  );

  const noteCreated = await pool.execute("SELECT * FROM notes WHERE id = ?", [
    rows.insertId,
  ]);
  return noteCreated[0][0];
};

exports.getAllNotes = async ({ userId }) => {
  const [rows] = await pool.execute(
    "SELECT * FROM notes WHERE user_id = ? ORDER BY created_at DESC",
    [userId],
  );
  return rows;
};

exports.getNoteById = async ({ userId, noteId }) => {
  const [rows] = await pool.execute(
    "SELECT * FROM notes WHERE id = ? AND user_id = ?",
    [noteId, userId],
  );

  return rows[0];
};

exports.updateNoteById = async ({ userId, noteId, updates }) => {
  const allowedFields = ["title", "content", "archived"];

  for (const key of Object.keys(updates)) {
    if (!allowedFields.includes(key)) {
      const error = new Error(`Campo no permitido: ${key}`);
      error.status = 400;
      throw error;
    }
  }

  if (Object.keys(updates).length === 0) {
    const error = new Error("No se proporcionaron campos para actualizar");
    error.status = 400;
    throw error;
  }
  const fields = Object.keys(updates);
  const values = Object.values(updates);

  const setClause = fields.map((field) => `${field} = ?`).join(", ");

  const sql = `
    UPDATE notes
    SET ${setClause}
    WHERE id = ? AND user_id = ?
  `;

  const params = [...values, noteId, userId];

  await pool.execute(sql, params);

  const noteUpdated = await this.getNoteById({ userId, noteId });

  return noteUpdated;
};

exports.deleteNoteById = async ({ noteId, userId }) => {
  const [rows] = await pool.execute(
    "DELETE FROM notes WHERE id = ? AND user_id = ?",
    [noteId, userId],
  );

  if (rows.affectedRows === 0) {
    const error = new Error("Nota no encontrada");
    error.status = 404;
    throw error;
  }
};
