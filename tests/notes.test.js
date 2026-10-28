const request = require("supertest");
const app = require("../src/app");
const jwt = require("jsonwebtoken");
const pool = require("../src/config/db");
const crypto = require("node:crypto");
let token;
let testUserId;
const testUserIds = [];

let tokenB;

beforeAll(async () => {
  const emailSentA = "test-a" + crypto.randomUUID() + "@example.com";
  const passwordSentA = "password123";

  const emailSentB = "test-b" + crypto.randomUUID() + "@example.com";
  const passwordSentB = "password123";

  const userResponseA = await request(app).post("/api/auth/register").send({
    name: "testuser a",
    email: emailSentA,
    password: passwordSentA,
  });

  expect(userResponseA.status).toBe(201);

  testUserIds.push(userResponseA.body.id);
  testUserId = userResponseA.body.id;

  const tokenResponseA = await request(app).post("/api/auth/login").send({
    email: emailSentA,
    password: passwordSentA,
  });

  expect(tokenResponseA.status).toBe(200);

  token = tokenResponseA.body.token;

  const userResponseB = await request(app).post("/api/auth/register").send({
    name: "testuser b",
    email: emailSentB,
    password: passwordSentB,
  });

  expect(userResponseB.status).toBe(201);

  testUserIds.push(userResponseB.body.id);

  const tokenResponseB = await request(app).post("/api/auth/login").send({
    email: emailSentB,
    password: passwordSentB,
  });

  expect(tokenResponseB.status).toBe(200);

  tokenB = tokenResponseB.body.token;
});

const expiredToken = jwt.sign({ userId: 3 }, process.env.JWT_SECRET, {
  expiresIn: -10,
});

describe("GET /api/notes", () => {
  test("debe responder 401 si no se proporciona un token de autenticación", async () => {
    const response = await request(app).get("/api/notes");

    expect(response.status).toBe(401);
  });
  test("debe rechazar un JWT inválido", async () => {
    const response = await request(app)
      .get("/api/notes")
      .set("Authorization", "Bearer invalid-jwt");

    expect(response.status).toBe(401);
  });
  test("debe rechazar un JWT expirado", async () => {
    const response = await request(app)
      .get("/api/notes")
      .set("Authorization", `Bearer ${expiredToken}`);

    expect(response.status).toBe(401);
  });
  test("debe utilizar la base de datos de pruebas", () => {
    expect(process.env.NODE_ENV).toBe("test");
    expect(process.env.DB_NAME).toBe("notes_test");
  });
  test("debe conectarse a la base de datos de testing", async () => {
    const [rows] = await pool.execute("SELECT DATABASE() AS database_name");

    expect(rows[0].database_name).toBe("notes_test");
  });
  test("debe crear una nota autenticada", async () => {
    const response = await request(app)
      .post("/api/notes/create")
      .set("Authorization", `Bearer ${token}`)
      .send({
        title: "Nota creada desde Jest",
        content: "Primera prueba de integración",
      });

    const [rows] = await pool.execute(
      "SELECT * FROM notes WHERE id = ? AND user_id = ?",
      [response.body.id, testUserId],
    );

    expect(response.status).toBe(201);
    expect(response.body.title).toBe("Nota creada desde Jest");
    expect(response.body.user_id).toBe(testUserId);
    expect(Number.isSafeInteger(response.body.id)).toBe(true);
    expect(rows.length).toBe(1);
    expect(rows[0].title).toBe("Nota creada desde Jest");
  });
  test("debe rechazar una nota con titulo vacio", async () => {
    const [rowsBefore] = await pool.execute(
      "SELECT COUNT(*) AS total FROM notes WHERE user_id = ?;",
      [testUserId],
    );

    const response = await request(app)
      .post("/api/notes/create")
      .set("Authorization", `Bearer ${token}`)
      .send({
        title: "",
        content: "Primera prueba de integración",
      });

    const [rowsAfter] = await pool.execute(
      "SELECT COUNT(*) AS total FROM notes WHERE user_id = ?;",
      [testUserId],
    );

    expect(response.status).toBe(400);
    expect(rowsBefore[0].total).toBe(rowsAfter[0].total);
  });

  test("un usuario no debe acceder a notas de otro usuario", async () => {
    const createResponse = await request(app)
      .post("/api/notes/create")
      .set("Authorization", `Bearer ${token}`)
      .send({
        title: "Nota privada del usuario A",
        content: "Solo el usuario A puede consultarla",
      });

    expect(createResponse.status).toBe(201);

    const noteId = createResponse.body.id;

    // 1. Consultar esta nota con tokenB.
    const getResponseB = await request(app)
      .get(`/api/notes/${noteId}`)
      .set("Authorization", `Bearer ${tokenB}`);
    // 2. Verificar que devuelve 404.
    expect(getResponseB.status).toBe(404);
    // 3. Consultarla nuevamente con token.
    const getResponse = await request(app)
      .get(`/api/notes/${noteId}`)
      .set("Authorization", `Bearer ${token}`);
    // 4. Verificar que devuelve 200.
    expect(getResponse.status).toBe(200);

    expect(getResponse.body.id).toBe(noteId);
    expect(getResponse.body.user_id).toBe(testUserId);
    expect(getResponse.body.title).toBe("Nota privada del usuario A");
  });

  test("otro usuario no puede modificar la nota de otro usuario", async () => {
    const createResponse = await request(app)
      .post("/api/notes/create")
      .set("Authorization", `Bearer ${token}`)
      .send({
        title: "Nota privada del usuario A",
        content: "Solo el usuario A puede consultarla",
      });

    expect(createResponse.status).toBe(201);

    const noteId = createResponse.body.id;

    const noteUpdated = await request(app)
      .patch(`/api/notes/${noteId}`)
      .set("Authorization", `Bearer ${tokenB}`)
      .send({
        title: "Título modificado ilegalmente",
      });

    expect(noteUpdated.status).toBe(404);

    const [mysqlRespond] = await pool.execute(
      "SELECT title, user_id FROM notes WHERE id = ?",
      [noteId],
    );

    expect(mysqlRespond).toHaveLength(1);
    expect(mysqlRespond[0].title).toBe("Nota privada del usuario A");
    expect(mysqlRespond[0].user_id).toBe(testUserId);
  });

  test("un usuario no puede eliminar la nota de otro usario", async () => {
    const createResponse = await request(app)
      .post("/api/notes/create")
      .set("Authorization", `Bearer ${token}`)
      .send({
        title: "Nota privada del usuario A",
        content: "Solo el usuario A puede consultarla",
      });

    expect(createResponse.status).toBe(201);

    const noteId = createResponse.body.id;

    const deletedNote = await request(app)
      .delete("/api/notes/" + noteId)
      .set("Authorization", `Bearer ${tokenB}`);

    expect(deletedNote.status).toBe(404);

    const [mysqlRespond] = await pool.execute(
      "SELECT user_id FROM notes WHERE id = ?",
      [noteId],
    );

    expect(mysqlRespond).toHaveLength(1);
    expect(mysqlRespond[0].user_id).toBe(testUserId);
  });
});

afterAll(async () => {
  try {
    // Verificar que estamos en notes_test
    if (
      process.env.NODE_ENV !== "test" ||
      process.env.DB_NAME !== "notes_test"
    ) {
      throw new Error(
        "No se puede eliminar usuarios en un entorno que no sea de pruebas",
      );
    }
    // Eliminar usuarios creados por las pruebas
    // solamente si hay IDs registrados
    if (testUserIds.length > 0) {
      const placeholders = testUserIds.map(() => "?").join(", ");

      const sql = `DELETE FROM users WHERE id IN (${placeholders})`;

      await pool.execute(sql, testUserIds);
    }
  } finally {
    await pool.end();
  }
});
