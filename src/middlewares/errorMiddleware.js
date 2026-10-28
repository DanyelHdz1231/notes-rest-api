exports.errorHandler = (err, req, res, next) => {
  const validStatus =
    Number.isInteger(err.status) && err.status >= 400 && err.status <= 599;

  const status = validStatus ? err.status : 500;

  const message = status === 500 ? "Error interno del servidor" : err.message;

  return res.status(status).json({ message });
};
