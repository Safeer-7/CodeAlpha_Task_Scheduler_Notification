const mongoose = require("mongoose");
const userModel = require("../models/userdata");
const verifymodel = require("../models/verifyuser");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const otpgenerator = require("otp-generator");
const { promisify } = require("util");
const sendotpmail = require("../utils/sendOtpEmail");

const { secretKey } = require("../config/keys");

const createUser = async (req, res) => {
  const { name, email, password } = req.body;

  try {
    const availuser = await userModel.findOne({ email: email });

    if (availuser) {
      return res.status(409).json({ message: "User already exists." });
    } else {
      const hashedPassword = await bcrypt.hash(password, 10);
      const otpval = otpgenerator.generate(6, {
        upperCaseAlphabets: false,
        specialChars: false,
      });

      const user = await verifymodel.create({
        username: name,
        email,
        password: hashedPassword,
        otp: otpval,
      });
      sendotpmail(email, otpval, name);

      res.status(200).json(user);
    }
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
};

const loginactivity = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await userModel.findOne({ email: email });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { username: user.username, userId: user._id, useremail: user.email },
      secretKey,
      { expiresIn: "7h" }
    );

    return res.cookie("token", token).json({ token, status: true, user });
  } catch (error) {
    console.error("An error occurred:", error);
    return res.status(500).json({ message: "An error occurred" });
  }
};

const validateotp = async (req, res) => {
  const otpval = req.body.otp;
  const email = req.body.email;

  try {
    const validuser = await verifymodel.findOne({ email: email });

    if (validuser && validuser.otp === otpval) {
      const newUser = {
        username: validuser.username,
        email: validuser.email,
        password: validuser.password,
        verified: true,
      };

      const user = await userModel.create(newUser);

      await verifymodel.findOneAndDelete({ email: validuser.email });

      if (user) {
        return res
          .status(200)
          .json({ message: "Otp verified and user created", user });
      } else {
        return res
          .status(401)
          .json({ message: "Error creating user and verifying OTP" });
      }
    } else {
      return res.status(401).json({ message: "Invalid Otp" });
    }
  } catch (e) {
    console.error("An error occurred:", e);
    return res.status(500).json({ message: "An error occurred" });
  }
};

const getProfile = async (req, res) => {
  const { token } = req.cookies;
  console.log(token);
  if (token) {
    try {
      const verifyAsync = promisify(jwt.verify);
      const user = await verifyAsync(token, secretKey);
      res.json(user);
    } catch (error) {
      res.status(500).json({ message: "An error occurred" });
    }
  } else {
    res.json(null);
  }
};

module.exports = {
  createUser,
  loginactivity,
  getProfile,
  validateotp,
};
