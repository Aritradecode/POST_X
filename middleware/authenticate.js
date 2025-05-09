const jwt = require('jsonwebtoken');

const authenticate = (req, res, next) => {
  // Extract token from cookies
  const token = req.cookies.token;

  if (!token) {
    return res.redirect('/auth/login'); // Redirect to login if no token is found
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId; // Attach userId to request object
    next(); // Continue to the next middleware or route handler
  } catch (err) {
    console.error(err);
    res.status(401).json({ message: 'Invalid or expired token' });
  }
};

module.exports = authenticate;
