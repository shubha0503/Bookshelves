/**
 * Global Error Handler Middleware
 */
function errorHandler(err, req, res, next) {
  console.error('Unhandled Server Error:', err);

  // Handle JSON parse errors
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({
      success: false,
      error: 'Invalid JSON payload received.'
    });
  }

  // Handle MySQL errors safely
  if (err.code === 'ER_DUP_ENTRY') {
    return res.status(409).json({
      success: false,
      error: 'A record with that unique key already exists.'
    });
  }

  const statusCode = err.statusCode || 500;
  const message = process.env.NODE_ENV === 'production' 
    ? 'An internal server error occurred.' 
    : err.message || 'Internal server error.';

  res.status(statusCode).json({
    success: false,
    error: message
  });
}

/**
 * 404 Route Handler
 */
function notFoundHandler(req, res) {
  res.status(404).json({
    success: false,
    error: `API route not found: ${req.method} ${req.originalUrl}`
  });
}

module.exports = {
  errorHandler,
  notFoundHandler
};
