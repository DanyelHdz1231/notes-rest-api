const jwt = require("jsonwebtoken");

exports.authenticateToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const secretKey = process.env.JWT_SECRET;

  if (!authHeader || authHeader.split(" ")[0] !== "Bearer") {
    const error = new Error("Token no proporcionado");
    error.status = 401;
    return next(error);
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, secretKey);
    req.userId = decoded.id;
    next();
  } catch (error) {
    const err = new Error("Token inválido");
    err.status = 401;
    return next(err);
  }
};
