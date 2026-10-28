const authService = require("../services/authServices");

exports.register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    if (typeof name !== "string" || name.trim().length < 2) {
      const error = new Error("El nombre debe contener al menos 2 caracteres");
      error.status = 400;
      return next(error);
    }

    if (typeof email !== "string") {
      const error = new Error("Email inválido");
      error.status = 400;
      return next(error);
    }

    const normalizedEmail = email.trim().toLowerCase();
    const normalizedName = name.trim();

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(normalizedEmail)) {
      const error = new Error("Formato de email inválido");
      error.status = 400;
      return next(error);
    }

    if (typeof password !== "string" || password.length < 8) {
      const error = new Error("La contraseña debe tener al menos 8 caracteres");
      error.status = 400;
      return next(error);
    }

    const user = await authService.register({
      name: normalizedName,
      email: normalizedEmail,
      password,
    });

    return res.status(201).json(user);
  } catch (error) {
    next(error);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (typeof email !== "string") {
      const error = new Error("Email inválido");
      error.status = 400;
      return next(error);
    }

    if (typeof password !== "string" || password.length < 8) {
      const error = new Error("La contraseña debe tener al menos 8 caracteres");
      error.status = 400;
      return next(error);
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email.trim().toLowerCase())) {
      const error = new Error("Formato de email inválido");
      error.status = 400;
      return next(error);
    }

    const normalizedEmail = email.trim().toLowerCase();
    const normalizedPassword = password;

    const result = await authService.login({
      email: normalizedEmail,
      password: normalizedPassword,
    });

    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

exports.getProfile = async (req, res, next) => {
  try {
    const userId = req.userId;
    if (!userId) {
      const error = new Error("Usuario no autenticado");
      error.status = 401;
      return next(error);
    }

    if (isNaN(userId) || userId <= 0) {
      const error = new Error("ID de usuario inválido");
      error.status = 400;
      return next(error);
    }

    const user = await authService.getProfile(userId);
    return res.status(200).json(user);
  } catch (error) {
    next(error);
  }
};
