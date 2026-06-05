const { ForbiddenError } = require('../utils/apiErrors');

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new ForbiddenError('User context missing. Make sure route is protected first.'));
    }

    if (!roles.includes(req.user.role)) {
      return next(
        new ForbiddenError(
          `User role '${req.user.role}' is not authorized to access this resource`
        )
      );
    }

    next();
  };
};

module.exports = { authorize };
