const jwt = require('jsonwebtoken');

const requireAuth = (req, res, next) => {
  const { token } = req.cookies;
  if (!token) return res.status(401).json({ error: 'Not authenticated' });

  jwt.verify(token, process.env.JWT_SECRET, {}, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    req.user = user;
    next();
  });
};

const requireAdmin = (req, res, next) => {
  if (req.user?.role === 'admin') {
    return next();
  }
  return res.status(403).json({ error: 'Admin access only' });
};

module.exports = { requireAuth, requireAdmin };