/**
 * Authentication Middleware for Margins
 * Ensures the request is authenticated via session and attaches user id.
 */
function requireAuth(req, res, next) {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required. Please log in.'
    });
  }
  next();
}

module.exports = {
  requireAuth
};
