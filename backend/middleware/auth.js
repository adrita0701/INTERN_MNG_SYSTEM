const jwt = require('jsonwebtoken');

const auth = (roleRequired) => {
  return (req, res, next) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'No token, authorization denied' });
      }

      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'datayug_internship_management_system_secure_key_2026');

      req.user = decoded;

      if (roleRequired && req.user.role !== roleRequired) {
        return res.status(403).json({ message: 'Access denied: insufficient permissions' });
      }

      next();
    } catch (error) {
      res.status(401).json({ message: 'Token is not valid' });
    }
  };
};

module.exports = auth;
