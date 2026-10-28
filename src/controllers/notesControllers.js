const notesService = require("../services/notesServices");

exports.createNote = async (req, res, next) => {
  try {
    const { title } = req.body;
    let { content } = req.body;
    if (typeof title !== "string" || title.trim().length === 0) {
      const error = new Error("Format de título inválido");
      error.status = 400;
      return next(error);
    }

    const normalizedTitle = title.trim();
    if (normalizedTitle.length > 255) {
      const error = new Error(
        "El título de la nota no puede superar los 255 caracteres",
      );
      error.status = 400;
      return next(error);
    }
    if (typeof content !== "string" && content !== undefined) {
      const error = new Error("Formato de contenido inválido");
      error.status = 400;
      return next(error);
    }
    if (content === undefined || content.trim().length === 0) {
      content = null;
    }
    const userId = req.userId;
    const newNote = await notesService.createNote({
      userId,
      title: normalizedTitle,
      content,
    });
    res.status(201).json(newNote);
  } catch (error) {
    next(error);
  }
};

exports.getAllNotes = async (req, res, next) => {
  try {
    const userId = req.userId;
    const notes = await notesService.getAllNotes({ userId });
    res.status(200).json(notes);
  } catch (error) {
    next(error);
  }
};

exports.getNoteById = async (req, res, next) => {
  try {
    const userId = req.userId;
    const noteId = req.params.id;

    const idRegex = /^\d+$/;

    const formatoValido = idRegex.test(noteId);

    const numberId = Number(noteId);

    if (!formatoValido || !Number.isSafeInteger(numberId) || numberId <= 0) {
      const error = new Error("Id invalido");
      error.status = 400;
      return next(error);
    }

    const note = await notesService.getNoteById({ noteId: numberId, userId });
    if (!note) {
      const error = new Error("Nota no encontrada");
      error.status = 404;
      return next(error);
    }

    res.status(200).json(note);
  } catch (error) {
    next(error);
  }
};

exports.updateNoteById = async (req, res, next) => {
  try {
    const userId = req.userId;
    const noteId = req.params.id;
    const body = req.body;
    const updates = {};
    const allowedFields = ["title", "content", "archived"];

    for (const key of Object.keys(body)) {
      if (!allowedFields.includes(key)) {
        const error = new Error(`Campo no permitido: ${key}`);
        error.status = 400;
        return next(error);
      }
    }

    const idRegex = /^\d+$/;

    const formatoValido = idRegex.test(noteId);

    const numberId = Number(noteId);

    if (!formatoValido || !Number.isSafeInteger(numberId) || numberId <= 0) {
      const error = new Error("Id invalido");
      error.status = 400;
      return next(error);
    }

    const hasArchived = Object.hasOwn(body, "archived");
    const hasTitle = Object.hasOwn(body, "title");
    const hasContent = Object.hasOwn(body, "content");
    if (Object.hasOwn(body, "user_id")) {
      const error = new Error("Formtao invalido");
      error.status = 400;
      return next(error);
    }

    if (!hasArchived && !hasContent && !hasTitle) {
      const error = new Error("Al menos un campo debe ser actualizado");
      error.status = 400;
      return next(error);
    }

    if (hasTitle) {
      const title = body.title;
      if (typeof title !== "string" || title.trim().length === 0) {
        const error = new Error("Format de título inválido");
        error.status = 400;
        return next(error);
      }

      const normalizedTitle = title.trim();
      if (normalizedTitle.length > 255) {
        const error = new Error(
          "El título de la nota no puede superar los 255 caracteres",
        );
        error.status = 400;
        return next(error);
      }
      updates.title = normalizedTitle;
    }

    if (hasContent) {
      let content = body.content;
      if (typeof content !== "string" && content !== null) {
        const error = new Error("Formato de contenido inválido");
        error.status = 400;
        return next(error);
      }
      if (typeof content === "string" && content.trim().length === 0) {
        content = null;
      }
      updates.content = content;
    }

    if (hasArchived) {
      const archived = body.archived;
      if (typeof archived !== "boolean") {
        const error = new Error("Formato de archivado inválido");
        error.status = 400;
        return next(error);
      }
      updates.archived = archived;
    }

    const note = await notesService.updateNoteById({
      noteId: numberId,
      userId,
      updates,
    });
    if (!note) {
      const error = new Error("Nota no encontrada");
      error.status = 404;
      return next(error);
    }

    res.status(200).json(note);
  } catch (error) {
    next(error);
  }
};

exports.deleteNoteById = async (req, res, next) => {
  try {
    const userId = req.userId;
    const noteId = req.params.id;

    const idRegex = /^\d+$/;

    const formatoValido = idRegex.test(noteId);

    const numberId = Number(noteId);

    if (!formatoValido || !Number.isSafeInteger(numberId) || numberId <= 0) {
      const error = new Error("Id invalido");
      error.status = 400;
      return next(error);
    }

    await notesService.deleteNoteById({ noteId: numberId, userId });

    res.status(204).send();
  } catch (error) {
    next(error);
  }
};
