const UserModel = require("../Models/User");
const jwt = require("jsonwebtoken");
const ErrorHandler = require("../Utils/ErrorHandler");


exports.isAuthenticatedUser = async (req, res, next) => {
    const { token } = req.cookies;

    if (!token) {
        return next(new ErrorHandler('Login first to access this resource.', 401));
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = await UserModel.findById(decoded.id);
        if (!req.user) {
            return next(new ErrorHandler('User not found. Please login again.', 401));
        }
        next();
    } catch (err) {
        console.log(err);
        return next(new ErrorHandler('Invalid token. Please login again.', 401));
    }
};

exports.authorizeRoles = (...roles) => {
  console.log(roles);
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new ErrorHandler(
          `Role (${req.user.role}) is not allowed to acccess this resource`,
          403
        )
      );
    }
    next();
  };
};