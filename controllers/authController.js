import User from "../models/User.js";
import cloudinary from "../config/cloudinary.js";
import jwt from "jsonwebtoken";
import sendEmail from "../utils/sendEmail.js";

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: "30d",
  });
};

// @desc    Register new user
// @route   POST /api/auth/signup
// @access  Public
export const signup = async (req, res) => {
  try {
    const { fullname, email, password, gender } = req.body;

    // Check if user exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: "User already exists" });
    }

    let imageUrl = "no-photo.jpg";

    // Handle Image Upload if file exists
    if (req.file) {
      try {
        // Upload to Cloudinary using upload_stream (needed for memory storage)
        const uploadResult = await new Promise((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            { folder: "hackathon_users" },
            (error, result) => {
              if (error) reject(error);
              else resolve(result);
            },
          );
          uploadStream.end(req.file.buffer);
        });

        imageUrl = uploadResult.secure_url;
      } catch (uploadError) {
        return res
          .status(500)
          .json({ message: "Image upload failed", error: uploadError.message });
      }
    }

    // Create user
    const user = await User.create({
      fullname,
      email,
      password,
      gender,
      image: imageUrl,
    });

    if (user) {
      res.status(201).json({
        _id: user.id,
        fullname: user.fullname,
        email: user.email,
        gender: user.gender,
        image: user.image,
        token: generateToken(user._id),
      });

      // Send welcome email
      try {
        const message = `Welcome to Hackathone 2026, ${user.fullname}!\n\nThank you for registering. We are excited to have you on board!`;
        const htmlMessage = `
          <h2>Welcome to Hackathone 2026, ${user.fullname}!</h2>
          <p>Thank you for registering. We are excited to have you on board!</p>
          <br/>
          <p>Best Regards,</p>
          <p>The Hackathone 2026 Team</p>
        `;

        await sendEmail({
          email: user.email,
          subject: "Welcome to Hackathone 2026!",
          message: message,
          html: htmlMessage,
        });
      } catch (emailError) {
        console.error("Email could not be sent", emailError);
        // We don't want to fail the signup if the email fails, so we just log it
      }
    } else {
      res.status(400).json({ message: "Invalid user data" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Authenticate a user
// @route   POST /api/auth/login
// @access  Public
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check for user email
    const user = await User.findOne({ email }).select("+password");

    if (user && (await user.matchPassword(password))) {
      res.json({
        _id: user.id,
        fullname: user.fullname,
        email: user.email,
        gender: user.gender,
        image: user.image,
        token: generateToken(user._id),
      });
    } else {
      res.status(401).json({ message: "Invalid email or password" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getMe = async (req, res) => {
  res.json(req.user);
};
