const UserModel = require("../Models/User");
const ErrorHandler = require("../Utils/ErrorHandler");
const sendToken = require("../Utils/JwtToken");
const sendtoEmail = require("../Utils/SendToMail");
const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const TokenModel = require("../Models/Token");
const NotificationModel = require("../Models/Notification");
const cloudinary = require('cloudinary').v2;

const registerUser = async (req, res, next) => {
  try {
    const existingEmailUser = await UserModel.findOne({
      email: req.body.email,
    });
    const existingPhoneUser = await UserModel.findOne({
      mobilenumber: req.body.mobilenumber,
    });

    if (existingEmailUser && existingPhoneUser) {
      return next(
        new ErrorHandler("Email and mobile number already exist!", 400)
      );
    }

    if (existingEmailUser) {
      return next(new ErrorHandler("Email address already exist!", 400));
    }

    if (existingPhoneUser) {
      return next(new ErrorHandler("Mobile number already taken!", 400));
    }

    const { firstname, lastname, mobilenumber, email, password } = req.body;

    const user = await UserModel.create({
      firstname,
      lastname,
      mobilenumber,
      email,
      password,
    });

    const token = await new TokenModel({
      verifyUser: user._id,
      token: crypto.randomBytes(32).toString("hex"),
      verificationTokenExpire: new Date(Date.now() + 2 * 60 * 1000),
    }).save();

    const emailVerification = `${process.env.FRONTEND_URL}/verify/email/${token.token}/${user._id}`;
    const emailContent = ` <div style="font-family: Arial, sans-serif; background-color: #f9f9f9; padding: 15px; justify-content: center; align-items: center; height: 40vh;">
        <div style="background-color: #ffffff; padding: 20px; border-radius: 5px; box-shadow: 0 0 10px rgba(0, 0, 0, 0.1); text-align: center;">
            <h1 style="font-size: 24px; color: #333;">Email Verification Request</h1>
            <p style="font-size: 16px; color: #555;">Hello ${user.firstname},</p>
            <p style="font-size: 16px; color: #555;">Thank you for signing up with teamPOOR - Motorcycle Parts & Services. To complete your registration, please verify your email address by clicking the button below:</p>
            <p style="text-align: center;">
                <a href="${emailVerification}" style="display: inline-block; background-color: #007bff; color: #fff; padding: 10px 20px; text-decoration: none; border-radius: 10px; font-size: 16px;" target="_blank">Verify Email</a>
            </p>
            <p style="font-size: 16px; color: #555;">If you did not request this, you can safely ignore this email.</p>
            <p style="font-size: 16px; color: #555;">Please note: Your security is important to us. We will never ask you to share your password or other sensitive information via email.</p>
            <p style="font-size: 16px; color: #555;">Best regards,<br>Silog Express - Manager</p>
        </div>
    </div>`;

    await sendtoEmail(
      user.email,
      "SilogExpress - Verify Email",
      emailContent,
      true
    );

    res.status(200).json({
      success: true,
      message: `Email sent to: ${user.email}. wait at least 3-5 minutes`,
    });
  } catch (error) {
    console.error(error); // Log the error for debugging
    res.status(500).json({
      success: false,
      message: "User registration failed",
      error: error.message,
    });
  }
};

const verifyUserEmail = async (req, res, next) => {
  try {
    const user = await UserModel.findById(req.params.id);
    if (!user) return res.status(400).json({ message: "Invalid Link" });

    let token = await TokenModel.findOne({ verifyUser: user._id });
    if (token) {
      if (token.verificationTokenExpire < Date.now()) {
        return res.status(400).json({ message: "Token expired" });
      }
      token.token = req.params.token;
      await token.save();
    } else {
      token = new TokenModel({
        verifyUser: user._id,
        token: req.params.token,
      });
      await token.save();
    }

    await UserModel.updateOne(
      { _id: req.params.id },
      { $set: { verified: true } }
    );

    res.status(200).json({ message: "Email verified successfully" });
  } catch (error) {
    console.error(error); // Log the error for debugging
    return next(new ErrorHandler("Internal server error", 500));
  }
};

const loginUser = async (req, res, next) => {
  const { email, password } = req.body;
  console.log("Login request body:", req.body);


  try {
    if (!email || !password) {
      return next(new ErrorHandler("Please enter email & password", 400));
    }

    const user = await UserModel.findOne({ email }).select("+password");

    if (!user) {
      console.log("User with this email does not exist.");
      return next(new ErrorHandler("User with this email does not exist", 400));
    }

    const isPasswordMatched = await bcrypt.compare(password, user.password);
    if (!isPasswordMatched) {
      console.log("Password comparison failed.");
      return next(new ErrorHandler("Incorrect password", 401));
    }

    if (!isPasswordMatched) {
      return next(new ErrorHandler("Incorrect password", 401));
    }

    console.log("Is user verified:", user.verified);
    if (!user.verified) {
      let token = await TokenModel.findOne({ verifyUser: user._id });
      if (!token || token.verificationTokenExpire < Date.now()) {
        token = await TokenModel.findOneAndUpdate(
          {
            verifyUser: user._id,
          },
          {
            token: crypto.randomBytes(32).toString("hex"),
            verificationTokenExpire: new Date(Date.now() + 2 * 60 * 1000),
          },
          { new: true, upsert: true }
        );
        const emailVerification = `${process.env.FRONTEND_URL}/verify/email/${token.token}/${user._id}`;

        `
        <div style="font-family: Arial, sans-serif; background-color: #f9f9f9; padding: 15px; justify-content: center; align-items: center; height: 40vh;">
        <div style="background-color: #ffffff; padding: 20px; border-radius: 5px; box-shadow: 0 0 10px rgba(0, 0, 0, 0.1); text-align: center;">
        <h1 style="font-size: 24px; color: #333;">Email Verification Request</h1>
        <p style="font-size: 16px; color: #555;">Hello ${user.firstname},</p>
        <p style="font-size: 16px; color: #555;">Thank you for signing up with teamPOOR - Motorcycle Parts & Services. To complete your registration, please verify your email address by clicking the button below:</p>
        <p style="text-align: center;">
            <a href="${emailVerification}" style="display: inline-block; background-color: #007bff; color: #fff; padding: 10px 20px; text-decoration: none; border-radius: 10px; font-size: 16px;" target="_blank">Verify Email</a>
        </p>
        <p style="font-size: 16px; color: #555;">If you did not request this, you can safely ignore this email.</p>
        <p style="font-size: 16px; color: #555;">Please note: Your security is important to us. We will never ask you to share your password or other sensitive information via email.</p>
        <p style="font-size: 16px; color: #555;">Best regards,<br>Silog Express - Manager</p>
        </div>
        </div>
    `; // Your email content

        await sendtoEmail(
          user.email,
          "SilogExpress - Verify Email",
          emailContent,
          true
        );
        res.status(403).json({
          success: false,
          message: "Token expired! A new one has been sent to your email.",
        });
      } else {
        return next(
          new ErrorHandler(
            "Please check your email for the verification link.",
            403
          )
        );
      }
    } else {
      sendToken(user, 200, res);
    }
  } catch (error) {
    console.log(error);
    return next(new ErrorHandler("Internal server error!", 500));
  }
};

const logoutUser = async (req, res, next) => {
  try {
    res.cookie("token", null, {
      expires: new Date(Date.now()),
      httpOnly: true,
    });

    res.status(200).json({ success: true, message: "Logged out successfully" });
  } catch (error) {
    console.log(error);
    return next(new ErrorHandler("Internal server error!", 500));
    
  }
};

const notificationAll = async (req, res, next) => {
  try {
    const user = await UserModel.findById(req.user.id);
    if (!user) {
      return next(new ErrorHandler("User not found", 404));
    }

    const unreadNotifications = await NotificationModel.find({
      user,
      isRead: false,
    }).sort({ createdAt: -1 });

    res.json({ unreadNotifications });
  } catch (error) {
    console.error(error); // Log the error for debugging
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

const getUserProfile = async (req, res, next) => {
  try {
    console.log("Fetching user profile for user ID:", req.user.id);
    
    const user = await UserModel.findById(req.user.id);

    if (!user) {
      return next(new ErrorHandler("User not found", 404));
    }

    res.status(200).json({ success: true, user });
  } catch (error) {
    next(error);
  }
};


const updateProfile = async (req, res, next) => {
  const { firstname, lastname, mobilenumber, avatar } = req.body;

  const newUserData = {
    firstname,
    lastname,
    mobilenumber,
  };

  try {
    const phoneExists = await UserModel.findOne({ mobilenumber, _id: { $ne: req.user.id } });
    if (phoneExists) {
      return res.status(400).json({
        success: false,
        message: "Mobile number already exists",
      });
    }

    if (req.body.avatar) { // Adjusted check for avatar
      const user = await UserModel.findById(req.user.id);

      // Check if the user has an existing avatar
      if (user.avatar && user.avatar.public_id) {
        const image_id = user.avatar.public_id;

        // Destroy the previous avatar
        await cloudinary.uploader.destroy(image_id); // Fixed reference to cloudinary
      }

      // Upload the new avatar
      const uploadResult = await cloudinary.uploader.upload(
        req.body.avatar,
        {
          folder: "avatars",
          width: 150,
          crop: "scale",
        }
      );

      newUserData.avatar = {
        public_id: uploadResult.public_id,
        url: uploadResult.secure_url,
      };
    }

    const user = await UserModel.findByIdAndUpdate(req.user.id, newUserData, {
      new: true,
      runValidators: true,
    });

    if (!user) {
      return next(new ErrorHandler("User not found", 404));
    }

    res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    return next(new ErrorHandler(error.message, 500));
  }
};


module.exports = {
  registerUser,
  verifyUserEmail,
  notificationAll,
  loginUser,
  logoutUser,
  getUserProfile,
  updateProfile,

};
