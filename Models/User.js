const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const userSchema = new mongoose.Schema(
  {
    firstname: {
      type: String,
      required: [true, "Please enter your firstname"],
      minlength: [3, "firstname must be at least 3 characters long."],
      maxLength: [30, "Your firstname cannot exceed 30 characters"],
    },
    lastname: {
      type: String,
      required: [true, "Please enter your lastname"],
      minlength: [3, "lastname must be at least 3 characters long."],
      maxLength: [30, "Your lastname cannot exceed 30 characters"],
    },
    email: {
      type: String,
      required: [true, "Please enter your email"],
      unique: true,
      validate: [validator.isEmail, "Please enter a valid email address"],
    },
    password: {
      type: String,
      required: [true, "Please enter your password"],
      minlength: [6, "Your password must be at least 6 characters long"],
      select: false,
    },
    gender: {
      type: String,
      enum: ["male", "female", "non-binary", "other"],
    },
    mobilenumber: {
      type: String,
      required: [true, "Please enter your mobile number"],
      unique: true,
      validate: {
        validator: function (value) {
          return /^\+63\d{10}$/.test(value); // Validates Philippine mobile numbers
        },
        message: "Please enter a valid Philippine mobile number (e.g., +639123456789)",
      },
    },
    avatar: {
      public_id: {
        type: String,
        default: "default_avatar",
      },
      url: {
        type: String,
        default: "https://example.com/default-avatar.png",
      },
    },
    role: {
      type: String,
      default: "user",
    },
    verified: {
      type: Boolean,
      default: false,
    },
    resetPasswordToken: String,
    resetPasswordExpire: Date,
    lastLogin: {
      type: Date,
    },
    deleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

userSchema.methods.getJwtToken = function () {
  return jwt.sign({ id: this._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_TIME,
  });
};

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    next();
  }
  this.password = await bcrypt.hash(this.password, 10);
});

userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

userSchema.methods.getResetPasswordToken = function () {
  const resetToken = crypto.randomBytes(20).toString("hex");

  this.resetPasswordToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");
  this.resetPasswordExpire = Date.now() + 30 * 60 * 1000;

  return resetToken;
};

module.exports = mongoose.model("User", userSchema);
