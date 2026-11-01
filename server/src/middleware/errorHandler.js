export function errorHandler(err, req, res, next) { // eslint-disable-line no-unused-vars
  // Prevent logging secrets or private data
  console.error('[ServerError]', err.message);

  const status = err.status || 500;
  const code = err.code || 'INTERNAL_ERROR';
  const message = status === 500
    ? 'An unexpected error occurred while processing your request.'
    : err.message;

  return res.status(status).json({
    error: {
      code,
      message,
      ...(err.details ? { details: err.details } : {}),
    },
  });
}

export function notFoundHandler(req, res) {
  return res.status(404).json({
    error: {
      code: 'ROUTE_NOT_FOUND',
      message: `Endpoint ${req.method} ${req.originalUrl} not found.`,
    },
  });
}

