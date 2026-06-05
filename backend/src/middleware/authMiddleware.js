const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { UnauthorizedError } = require('../utils/apiErrors');

const protect = async (req, res, next) => {
  let token;

  // Check Authorization header for Bearer token
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return next(new UnauthorizedError('Not authorized, no token provided'));
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);

    // Fetch user and exclude password
    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return next(new UnauthorizedError('The user belonging to this token no longer exists'));
    }

    // Attach user to request
    req.user = user;
    next();
  } catch (error) {
    return next(new UnauthorizedError('Not authorized, token failed'));
  }
};

module.exports = { protect };
