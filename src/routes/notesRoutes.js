const express = require("express");
const router = express.Router();

const notesController = require("../controllers/notesControllers");
const { authenticateToken } = require("../middlewares/authMiddleware");

router.post("/create", authenticateToken, notesController.createNote);
router.get("/", authenticateToken, notesController.getAllNotes);
router.get("/:id", authenticateToken, notesController.getNoteById);
router.patch("/:id", authenticateToken, notesController.updateNoteById);
router.delete("/:id", authenticateToken, notesController.deleteNoteById);

module.exports = router;
