const jwt = require('jsonwebtoken');

/**
 * Middleware: Controleer of de gebruiker een geldig JWT-token heeft.
 * Beschermt routes tegen ongeautoriseerde toegang.
 */
function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Toegang geweigerd. Geen token opgegeven.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Sessie verlopen. Log opnieuw in.' });
    }
    return res.status(401).json({ error: 'Ongeldig token.' });
  }
}

/**
 * Middleware: Controleer of de gebruiker een admin-rol heeft.
 * Moet na authenticate middleware worden gebruikt.
 */
function authorizeAdmin(req, res, next) {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Onvoldoende rechten.' });
  }
  next();
}

module.exports = { authenticate, authorizeAdmin };
